-- =============================================
-- Stored Procedure: sp_XuLyChamCongMoi_Corrected
-- Mô tả: Xử lý chấm công với logic đã sửa lỗi hoàn toàn
-- Tác giả: System
-- Ngày tạo: 2025-09-16
-- Sửa lỗi: Logic lấy giờ ra từ ngày hôm sau, thời gian làm việc bất thường
-- =============================================

CREATE PROCEDURE sp_XuLyChamCongMoi_Corrected
AS
BEGIN
    SET NOCOUNT ON;
    
    PRINT 'Bắt đầu xử lý chấm công với logic đã sửa lỗi...';
    
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
    
    PRINT 'Đã tạo temp table với ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' nhân viên';
    
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
    
    DECLARE @ProcessedCount INT = 0;
    DECLARE @SkippedCount INT = 0;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Lay thong tin checkin/checkout cho nhan vien trong ngay
        DECLARE @GioVao DATETIME = NULL;
        DECLARE @GioRa DATETIME = NULL;
        DECLARE @NgayVao DATE = NULL;
        DECLARE @NgayRa DATE = NULL;
        DECLARE @DiaDiemVao NVARCHAR(100) = NULL;
        DECLARE @DiaDiemRa NVARCHAR(100) = NULL;
        
        -- LOGIC MỚI: Chỉ lấy giờ vào và giờ ra trong CÙNG NGÀY
        -- Tìm giờ vào sớm nhất trong ngày
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
        
        -- KIỂM TRA LOGIC HỢP LÝ: Chỉ xử lý nếu có cả giờ vào và giờ ra
        IF @GioVao IS NOT NULL AND @GioRa IS NOT NULL AND @GioRa > @GioVao
        BEGIN
            -- Tính thời gian làm việc (không giới hạn)
            DECLARE @ThoiGianLamViec DECIMAL(10,4) = CAST(DATEDIFF(MINUTE, @GioVao, @GioRa) AS DECIMAL(10,4)) / 60.0;
            
            -- Xử lý tất cả trường hợp có giờ vào và giờ ra hợp lý
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
                    DECLARE @GioVaoHour INT = DATEPART(HOUR, @GioVao);
                    DECLARE @GioVaoMinute INT = DATEPART(MINUTE, @GioVao);
                    DECLARE @GioVaoTotalMinutes INT = @GioVaoHour * 60 + @GioVaoMinute;
                    
                    -- Xác định ca dựa trên giờ checkin - SỬ DỤNG DATEPART TRỰC TIẾP TỪ DATETIME
                    IF @GioVaoHour >= 6 AND @GioVaoHour <= 18
                    BEGIN
                        -- VHCN: Ca ngày - Checkin 06:00-18:00, Checkout 19:00-20:00
                        SET @CaThucTe = N'VHCN';
                        SET @HopLeCheckin = CASE WHEN @GioVaoHour >= 6 AND @GioVaoHour <= 18 THEN 1 ELSE 0 END;
                        SET @HopLeCheckout = CASE WHEN CAST(@GioRa AS TIME) >= '19:00:00' AND CAST(@GioRa AS TIME) <= '20:00:00' THEN 1 ELSE 0 END;
                        
                        SET @TrangThai = CASE
                            WHEN @HopLeCheckin = 1 AND @HopLeCheckout = 1 THEN N'Đúng giờ'
                            WHEN @HopLeCheckin = 0 AND @HopLeCheckout = 1 THEN N'Đi trễ'
                            WHEN @HopLeCheckin = 1 AND @HopLeCheckout = 0 THEN N'Về sớm'
                            ELSE N'Không đúng giờ quy định'
                        END
                    END
                    ELSE IF @GioVaoHour >= 18 AND @GioVaoHour <= 23
                    BEGIN
                        -- VHCD: Checkin 18:00-19:00, Checkout 07:00-08:00 (ngày hôm sau)
                        -- Đối với ca đêm, cần xử lý đặc biệt - checkout có thể qua ngày hôm sau
                        SET @CaThucTe = N'VHCD';
                        SET @HopLeCheckin = CASE WHEN CAST(@GioVao AS TIME) BETWEEN '18:00:00' AND '19:00:00' THEN 1 ELSE 0 END;
                        
                        -- Đối với ca VHCD, checkout có thể là ngày hôm sau
                        -- Tìm giờ ra muộn nhất trong ngày hôm sau nếu cần
                        DECLARE @GioRaVHCD DATETIME = @GioRa;
                        DECLARE @NgayRaVHCD DATE = @NgayRa;
                        DECLARE @DiaDiemRaVHCD NVARCHAR(100) = @DiaDiemRa;
                        
                        -- Nếu checkout trong cùng ngày, tìm checkout ngày hôm sau
                        IF CAST(@GioRa AS DATE) = CAST(@GioVao AS DATE)
                        BEGIN
                            SELECT TOP 1 
                                @GioRaVHCD = raw.ts_vn,
                                @NgayRaVHCD = CAST(raw.ts_vn AS DATE),
                                @DiaDiemRaVHCD = raw.device_name
                            FROM dulieutho raw
                            WHERE raw.person_id = @person_id
                                AND CAST(raw.ts_vn AS DATE) = DATEADD(DAY, 1, @NgayChamCong)
                                AND raw.device_name LIKE N'%_OUT'
                                AND raw.ts_vn > @GioVao
                            ORDER BY raw.ts_vn DESC;
                            
                            -- Nếu không có checkout ngày hôm sau, lấy event ra cuối cùng
                            IF @GioRaVHCD IS NULL
                            BEGIN
                                SELECT TOP 1 
                                    @GioRaVHCD = raw.ts_vn,
                                    @NgayRaVHCD = CAST(raw.ts_vn AS DATE),
                                    @DiaDiemRaVHCD = raw.device_name
                                FROM dulieutho raw
                                WHERE raw.person_id = @person_id
                                    AND CAST(raw.ts_vn AS DATE) = DATEADD(DAY, 1, @NgayChamCong)
                                    AND raw.event_type = 'ra'
                                    AND raw.ts_vn > @GioVao
                                ORDER BY raw.ts_vn DESC;
                            END
                        END
                        
                        -- Cập nhật lại thời gian làm việc nếu có checkout ngày hôm sau
                        IF @GioRaVHCD IS NOT NULL AND @GioRaVHCD > @GioVao
                        BEGIN
                            SET @GioRa = @GioRaVHCD;
                            SET @NgayRa = @NgayRaVHCD;
                            SET @DiaDiemRa = @DiaDiemRaVHCD;
                            SET @ThoiGianLamViec = CAST(DATEDIFF(MINUTE, @GioVao, @GioRa) AS DECIMAL(10,4)) / 60.0;
                        END
                        
                        -- Kiểm tra checkout hợp lệ (có thể là ngày hôm sau)
                        IF CAST(@GioRa AS DATE) = DATEADD(DAY, 1, CAST(@GioVao AS DATE))
                        BEGIN
                            SET @HopLeCheckout = CASE WHEN CAST(@GioRa AS TIME) BETWEEN '07:00:00' AND '08:00:00' THEN 1 ELSE 0 END;
                        END
                        ELSE
                        BEGIN
                            SET @HopLeCheckout = 0;
                        END
                        
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
                
                SET @ProcessedCount = @ProcessedCount + 1;
            END
        END
        ELSE
        BEGIN
            SET @SkippedCount = @SkippedCount + 1;
            PRINT 'Bỏ qua ' + @HoTen + ' - Không đủ dữ liệu checkin/checkout hợp lý';
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
    
    PRINT 'Hoàn thành xử lý chấm công!';
    PRINT 'Đã xử lý: ' + CAST(@ProcessedCount AS VARCHAR(10)) + ' nhân viên';
    PRINT 'Đã bỏ qua: ' + CAST(@SkippedCount AS VARCHAR(10)) + ' nhân viên';
END
