-- =============================================
-- Stored Procedure: sp_XuLyChamCongMoi_Fixed
-- Mô tả: Xử lý chấm công với logic sửa lỗi - chỉ xử lý ca ngày
-- Tác giả: System
-- Ngày tạo: 2025-09-16
-- =============================================

CREATE PROCEDURE sp_XuLyChamCongMoi_Fixed
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Buoc 1: Lay cac su kien cho tat ca nhan vien (bao gom ca DaXuLy=1)
    -- Chỉ lấy những ngày có event mới nhất trong 3 ngày gần đây để tối ưu tốc độ
    SELECT DISTINCT
        raw.person_id,
        CAST(raw.ts_vn AS DATE) AS NgayChamCong,
        nv.CaLamViec,
        nv.MaNhanVienNoiBo,
        nv.HoTen
    INTO #TempAllEvents
    FROM dulieutho AS raw WITH (NOLOCK)
    JOIN NhanVien AS nv WITH (NOLOCK) ON (raw.person_id = nv.MaNhanVienHANET OR raw.employee_code = nv.MaNhanVienNoiBo)
    WHERE raw.person_id IS NOT NULL 
        AND nv.MaNhanVienHANET IS NOT NULL
        AND nv.CaLamViec IS NOT NULL  -- CHỈ XỬ LÝ NHÂN VIÊN CÓ CA LÀM VIỆC
        AND CAST(raw.ts_vn AS DATE) >= DATEADD(DAY, -3, GETDATE())
    GROUP BY raw.person_id, CAST(raw.ts_vn AS DATE), nv.CaLamViec, nv.MaNhanVienNoiBo, nv.HoTen;
    
    -- Khai bao cursor
    DECLARE @person_id NVARCHAR(50);
    DECLARE @NgayChamCong DATE;
    DECLARE @CaLamViec NVARCHAR(10);
    DECLARE @MaNhanVienNoiBo NVARCHAR(50);
    DECLARE @HoTen NVARCHAR(200);
    
    DECLARE cursor_events CURSOR FOR
    SELECT person_id, NgayChamCong, CaLamViec, MaNhanVienNoiBo, HoTen FROM #TempAllEvents;
    
    OPEN cursor_events;
    FETCH NEXT FROM cursor_events INTO @person_id, @NgayChamCong, @CaLamViec, @MaNhanVienNoiBo, @HoTen;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Lay thong tin checkin/checkout cho nhan vien trong ngay
        DECLARE @GioVao DATETIME = NULL;
        DECLARE @GioRa DATETIME = NULL;
        DECLARE @NgayVao DATE = NULL;
        DECLARE @NgayRa DATE = NULL;
        DECLARE @DiaDiemVao NVARCHAR(100) = NULL;
        DECLARE @DiaDiemRa NVARCHAR(100) = NULL;
        
        -- LOGIC MỚI: Chỉ xử lý ca ngày, không xử lý ca đêm
        -- Tìm giờ vào sớm nhất trong ngày (chỉ trong cùng ngày)
        SELECT TOP 1 
            @GioVao = raw.ts_vn,
            @NgayVao = CAST(raw.ts_vn AS DATE),
            @DiaDiemVao = raw.device_name
        FROM dulieutho raw
        WHERE raw.person_id = @person_id
            AND CAST(raw.ts_vn AS DATE) = @NgayChamCong
            AND raw.device_name LIKE N'%_IN'
        ORDER BY raw.ts_vn ASC;
        
        -- Nếu không có giờ vào từ device IN, lấy event vào đầu tiên trong ngày
        IF @GioVao IS NULL
        BEGIN
            SELECT TOP 1 
                @GioVao = raw.ts_vn,
                @NgayVao = CAST(raw.ts_vn AS DATE),
                @DiaDiemVao = raw.device_name
            FROM dulieutho raw
            WHERE raw.person_id = @person_id
                AND CAST(raw.ts_vn AS DATE) = @NgayChamCong
                AND raw.event_type = 'vào'
            ORDER BY raw.ts_vn ASC;
        END
        
        -- LOGIC MỚI: Tìm giờ ra muộn nhất TRONG CÙNG NGÀY (không lấy ngày hôm sau)
        SELECT TOP 1 
            @GioRa = raw.ts_vn,
            @NgayRa = CAST(raw.ts_vn AS DATE),
            @DiaDiemRa = raw.device_name
        FROM dulieutho raw
        WHERE raw.person_id = @person_id
            AND CAST(raw.ts_vn AS DATE) = @NgayChamCong  -- CHỈ TRONG CÙNG NGÀY
            AND raw.device_name LIKE N'%_OUT'
            AND (@GioVao IS NULL OR raw.ts_vn > @GioVao)
        ORDER BY raw.ts_vn DESC;
        
        -- Nếu không có giờ ra từ device OUT, lấy event ra cuối cùng trong ngày
        IF @GioRa IS NULL
        BEGIN
            SELECT TOP 1 
                @GioRa = raw.ts_vn,
                @NgayRa = CAST(raw.ts_vn AS DATE),
                @DiaDiemRa = raw.device_name
            FROM dulieutho raw
            WHERE raw.person_id = @person_id
                AND CAST(raw.ts_vn AS DATE) = @NgayChamCong  -- CHỈ TRONG CÙNG NGÀY
                AND raw.event_type = 'ra'
                AND (@GioVao IS NULL OR raw.ts_vn > @GioVao)
            ORDER BY raw.ts_vn DESC;
        END
        
        -- KIỂM TRA LOGIC HỢP LÝ: Chỉ xử lý nếu có cả giờ vào và giờ ra trong cùng ngày
        IF @GioVao IS NOT NULL AND @GioRa IS NOT NULL AND @GioRa > @GioVao
        BEGIN
            -- KIỂM TRA THỜI GIAN LÀM VIỆC HỢP LÝ (tối đa 12 giờ)
            DECLARE @ThoiGianLamViec DECIMAL(10,4) = CAST(DATEDIFF(MINUTE, @GioVao, @GioRa) AS DECIMAL(10,4)) / 60.0;
            
            -- CHỈ XỬ LÝ NẾU THỜI GIAN LÀM VIỆC HỢP LÝ (1-12 giờ)
            IF @ThoiGianLamViec >= 1.0 AND @ThoiGianLamViec <= 12.0
            BEGIN
                -- Xac dinh ca lam viec thuc te
                DECLARE @CaThucTe NVARCHAR(10) = @CaLamViec;
                
                -- Xac dinh trang thai voi dieu kien nghiem ngat
                DECLARE @TrangThai NVARCHAR(50);
                DECLARE @HopLeCheckin BIT = 0;
                DECLARE @HopLeCheckout BIT = 0;
                
                IF @CaThucTe = N'HC'
                BEGIN
                    -- HC: Checkin 06:00-07:30, Checkout 17:00-18:00
                    SET @HopLeCheckin = CASE WHEN DATENAME(weekday, @NgayChamCong) IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
                                                AND CAST(@GioVao AS TIME) BETWEEN '06:00:00' AND '07:30:00' THEN 1 ELSE 0 END;
                    SET @HopLeCheckout = CASE WHEN DATENAME(weekday, @NgayChamCong) IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
                                                 AND CAST(@GioRa AS TIME) BETWEEN '17:00:00' AND '18:00:00' THEN 1 ELSE 0 END;
                    
                    SET @TrangThai = CASE
                        WHEN @HopLeCheckin = 1 AND @HopLeCheckout = 1 THEN N'Đúng giờ'
                        WHEN @HopLeCheckin = 0 AND @HopLeCheckout = 1 THEN N'Đi trễ'
                        WHEN @HopLeCheckin = 1 AND @HopLeCheckout = 0 THEN N'Về sớm'
                        ELSE N'Không đúng giờ quy định'
                    END
                END
                ELSE IF @CaThucTe = N'SC'
                BEGIN
                    -- SC: Checkin 06:00-08:00, Checkout 16:00-18:00
                    SET @HopLeCheckin = CASE WHEN DATENAME(weekday, @NgayChamCong) IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
                                                AND CAST(@GioVao AS TIME) BETWEEN '06:00:00' AND '08:00:00' THEN 1 ELSE 0 END;
                    SET @HopLeCheckout = CASE WHEN DATENAME(weekday, @NgayChamCong) IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
                                                 AND CAST(@GioRa AS TIME) BETWEEN '16:00:00' AND '18:00:00' THEN 1 ELSE 0 END;
                    
                    SET @TrangThai = CASE
                        WHEN @HopLeCheckin = 1 AND @HopLeCheckout = 1 THEN N'Đúng giờ'
                        WHEN @HopLeCheckin = 0 AND @HopLeCheckout = 1 THEN N'Đi trễ'
                        WHEN @HopLeCheckin = 1 AND @HopLeCheckout = 0 THEN N'Về sớm'
                        ELSE N'Không đúng giờ quy định'
                    END
                END
                ELSE IF @CaThucTe = N'VH'
                BEGIN
                    -- VH: Xử lý ca ngày (06:00-19:00) và ca đêm (18:00-07:00 ngày hôm sau)
                    DECLARE @GioVaoTime TIME = CAST(@GioVao AS TIME);
                    
                    IF @GioVaoTime BETWEEN '06:00:00' AND '07:00:00'
                    BEGIN
                        -- VHCN: Checkin 06:00-07:00, Checkout 19:00-20:00
                        SET @CaThucTe = N'VHCN';
                        SET @HopLeCheckin = CASE WHEN CAST(@GioVao AS TIME) BETWEEN '06:00:00' AND '07:00:00' THEN 1 ELSE 0 END;
                        SET @HopLeCheckout = CASE WHEN CAST(@GioRa AS TIME) BETWEEN '19:00:00' AND '20:00:00' THEN 1 ELSE 0 END;
                        
                        SET @TrangThai = CASE
                            WHEN @HopLeCheckin = 1 AND @HopLeCheckout = 1 THEN N'Đúng giờ'
                            WHEN @HopLeCheckin = 0 AND @HopLeCheckout = 1 THEN N'Đi trễ'
                            WHEN @HopLeCheckin = 1 AND @HopLeCheckout = 0 THEN N'Về sớm'
                            ELSE N'Không đúng giờ quy định'
                        END
                    END
                    ELSE
                    BEGIN
                        SET @TrangThai = N'Không đúng giờ quy định';
                    END
                END
                ELSE
                BEGIN
                    SET @TrangThai = N'Không đúng giờ quy định';
                END
                
                -- MERGE de cap nhat hoac them moi
                MERGE ChamCongDaXuLyMoi AS target
                USING (
                    SELECT 
                        @MaNhanVienNoiBo as MaNhanVienNoiBo,
                        @HoTen as TenNhanVien,
                        @NgayChamCong as NgayChamCong,
                        CAST(@GioVao AS DATE) as NgayVao,
                        @GioVao as GioVao,
                        CAST(@GioRa AS DATE) as NgayRa,
                        @GioRa as GioRa,
                        @ThoiGianLamViec as ThoiGianLamViec,
                        @CaThucTe as CaLamViec,
                        @TrangThai as TrangThai,
                        @DiaDiemVao as DiaDiemVao,
                        @DiaDiemRa as DiaDiemRa
                ) AS source (MaNhanVienNoiBo, TenNhanVien, NgayChamCong, NgayVao, GioVao, NgayRa, GioRa, ThoiGianLamViec, CaLamViec, TrangThai, DiaDiemVao, DiaDiemRa)
                ON target.MaNhanVienNoiBo = source.MaNhanVienNoiBo 
                   AND target.NgayChamCong = source.NgayChamCong
                WHEN MATCHED THEN
                    UPDATE SET
                        TenNhanVien = source.TenNhanVien,
                        NgayVao = source.NgayVao,
                        GioVao = source.GioVao,
                        NgayRa = source.NgayRa,
                        GioRa = source.GioRa,
                        ThoiGianLamViec = source.ThoiGianLamViec,
                        CaLamViec = source.CaLamViec,
                        TrangThai = source.TrangThai,
                        DiaDiemVao = source.DiaDiemVao,
                        DiaDiemRa = source.DiaDiemRa,
                        ThoiGianXuLy = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (MaNhanVienNoiBo, TenNhanVien, NgayChamCong, NgayVao, GioVao, NgayRa, GioRa, ThoiGianLamViec, CaLamViec, TrangThai, DiaDiemVao, DiaDiemRa, ThoiGianXuLy)
                    VALUES (source.MaNhanVienNoiBo, source.TenNhanVien, source.NgayChamCong, source.NgayVao, source.GioVao, source.NgayRa, source.GioRa, source.ThoiGianLamViec, source.CaLamViec, source.TrangThai, source.DiaDiemVao, source.DiaDiemRa, GETDATE());
            END
        END
        
        FETCH NEXT FROM cursor_events INTO @person_id, @NgayChamCong, @CaLamViec, @MaNhanVienNoiBo, @HoTen;
    END
    
    CLOSE cursor_events;
    DEALLOCATE cursor_events;
    
    -- Danh dau tat ca cac su kien da xu ly
    UPDATE dulieutho 
    SET DaXuLy = 1 
    WHERE person_id IN (SELECT person_id FROM #TempAllEvents)
        AND CAST(ts_vn AS DATE) >= DATEADD(DAY, -7, GETDATE());
    
    -- Cleanup
    DROP TABLE #TempAllEvents;
    
    PRINT 'Xu ly cham cong tu dong hoan thanh (Fixed version)!';
END