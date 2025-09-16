-- =============================================
-- Stored Procedure: sp_XuLyChamCongMoi_Fixed
-- Mô tả: Xử lý chấm công với logic đúng cho ca SC/HC/VHCN
-- Tác giả: System
-- Ngày tạo: 2025-09-16
-- =============================================

CREATE PROCEDURE sp_XuLyChamCongMoi_Fixed
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Buoc 1: Lay cac su kien cho tat ca nhan vien (bao gom ca DaXuLy=1)
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
        DECLARE @DiaDiemVao NVARCHAR(200) = NULL;
        DECLARE @DiaDiemRa NVARCHAR(200) = NULL;
        
        -- LOGIC ĐÚNG: Tim gio vao CŨ NHẤT trong ngay (giờ vào sớm nhất)
        SELECT TOP 1 
            @GioVao = raw.ts_vn,
            @NgayVao = CAST(raw.ts_vn AS DATE),
            @DiaDiemVao = raw.device_name
        FROM dulieutho raw
        WHERE raw.person_id = @person_id
            AND CAST(raw.ts_vn AS DATE) = @NgayChamCong
            AND raw.device_name LIKE N'%_IN'
        ORDER BY raw.ts_vn ASC;
        
        -- LOGIC MỚI: Tim gio ra MỚI NHẤT trong CÙNG NGÀY (không bao gồm ngày hôm sau)
        -- Chỉ cho phép ca VHCD làm việc qua ngày hôm sau
        IF @CaLamViec = 'VHCD'
        BEGIN
            -- Ca VHCD: có thể làm việc qua ngày hôm sau
            SELECT TOP 1 
                @GioRa = raw.ts_vn,
                @NgayRa = CAST(raw.ts_vn AS DATE),
                @DiaDiemRa = raw.device_name
            FROM dulieutho raw
            WHERE raw.person_id = @person_id
                AND (CAST(raw.ts_vn AS DATE) = @NgayChamCong OR CAST(raw.ts_vn AS DATE) = DATEADD(DAY, 1, @NgayChamCong))
                AND raw.device_name LIKE N'%_OUT'
                AND (@GioVao IS NULL OR raw.ts_vn > @GioVao)
            ORDER BY raw.ts_vn DESC;
        END
        ELSE
        BEGIN
            -- Ca SC/HC/VHCN: chỉ làm việc trong cùng ngày
            SELECT TOP 1 
                @GioRa = raw.ts_vn,
                @NgayRa = CAST(raw.ts_vn AS DATE),
                @DiaDiemRa = raw.device_name
            FROM dulieutho raw
            WHERE raw.person_id = @person_id
                AND CAST(raw.ts_vn AS DATE) = @NgayChamCong
                AND raw.device_name LIKE N'%_OUT'
                AND (@GioVao IS NULL OR raw.ts_vn > @GioVao)
            ORDER BY raw.ts_vn DESC;
        END
        
        -- Chi xu ly neu co ca gio vao va gio ra
        IF @GioVao IS NOT NULL AND @GioRa IS NOT NULL AND @GioRa > @GioVao
        BEGIN
            -- Tinh thoi gian lam viec
            DECLARE @ThoiGianLamViec DECIMAL(10,4) = CAST(DATEDIFF(MINUTE, @GioVao, @GioRa) AS DECIMAL(10,4)) / 60.0;
            
            -- TU DONG XAC DINH CA LAM VIEC DUA TREN THOI GIAN
            DECLARE @CaThucTe NVARCHAR(10) = @CaLamViec;
            DECLARE @TrangThai NVARCHAR(50) = N'Chua co quy dinh';
            DECLARE @HopLe BIT = 0;
            
            -- Logic tu dong xac dinh ca lam viec và validation khung giờ
            DECLARE @GioCheckin TIME = CAST(@GioVao AS TIME);
            DECLARE @GioCheckout TIME = CAST(@GioRa AS TIME);
            
            -- VALIDATION: Kiểm tra khung giờ cho phép
            -- Ca Hành chính: 6h-18h
            IF @GioCheckin >= '06:00:00' AND @GioCheckout <= '18:00:00'
            BEGIN
                -- Xac dinh ca lam viec dua tren gio checkin
                IF @GioCheckin BETWEEN '06:00:00' AND '07:30:00' AND @GioCheckout BETWEEN '17:00:00' AND '18:00:00'
                BEGIN
                    SET @CaThucTe = N'HC'  -- Ca hanh chinh
                    SET @HopLe = 1
                END
                ELSE IF @GioCheckin BETWEEN '06:00:00' AND '08:00:00' AND @GioCheckout BETWEEN '16:00:00' AND '18:00:00'
                BEGIN
                    SET @CaThucTe = N'SC'  -- Ca sua chua
                    SET @HopLe = 1
                END
                ELSE IF @GioCheckin BETWEEN '06:00:00' AND '07:00:00' AND @GioCheckout BETWEEN '19:00:00' AND '20:00:00'
                BEGIN
                    IF @CaLamViec = 'VH'
                        SET @CaThucTe = N'VHCN' -- Ca van hanh ngay
                    ELSE
                        SET @CaThucTe = @CaLamViec
                    SET @HopLe = 1
                END
                ELSE IF @CaLamViec = 'VH'
                BEGIN
                    SET @CaThucTe = N'VH'   -- Ca van hanh linh hoat
                    SET @HopLe = 1
                END
            END
            -- Ca Vận hành đêm: 18h-8h hôm sau
            ELSE IF (@GioCheckin >= '18:00:00' OR @GioCheckout <= '08:00:00')
            BEGIN
                IF @GioCheckin BETWEEN '18:00:00' AND '19:00:00' AND @GioCheckout BETWEEN '07:00:00' AND '08:00:00'
                BEGIN
                    SET @CaThucTe = N'VHCD' -- Ca van hanh dem
                    SET @HopLe = 1
                END
                ELSE IF @CaLamViec = 'VH'
                BEGIN
                    SET @CaThucTe = N'VHCD' -- Ca van hanh dem
                    SET @HopLe = 1
                END
            END
            
            -- Xac dinh trang thai
            IF @HopLe = 1
            BEGIN
                -- Tính toán thời gian làm việc chuẩn
                DECLARE @ThoiGianLamViecChuan DECIMAL(10,4) = 8.0; -- 8 giờ chuẩn
                
                IF @ThoiGianLamViec >= @ThoiGianLamViecChuan - 0.5
                BEGIN
                    SET @TrangThai = N'Dung gio quy dinh'
                END
                ELSE IF @ThoiGianLamViec < @ThoiGianLamViecChuan - 0.5
                BEGIN
                    SET @TrangThai = N'Khong dung gio quy dinh'
                END
            END
            ELSE
            BEGIN
                SET @TrangThai = N'Khong dung gio quy dinh'
            END
            
            -- Insert hoac update vao bang ChamCongDaXuLyMoi
            MERGE ChamCongDaXuLyMoi AS target
            USING (SELECT 
                @MaNhanVienNoiBo AS MaNhanVienNoiBo,
                @NgayChamCong AS NgayChamCong,
                @NgayVao AS NgayVao,
                @GioVao AS GioVao,
                @NgayRa AS NgayRa,
                @GioRa AS GioRa,
                @ThoiGianLamViec AS ThoiGianLamViec,
                @CaThucTe AS CaLamViec,
                @TrangThai AS TrangThai,
                @HoTen AS TenNhanVien,
                @DiaDiemVao AS DiaDiemVao,
                @DiaDiemRa AS DiaDiemRa
            ) AS source
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
    
    PRINT 'Xu ly cham cong voi logic da sua hoan thanh!';
END
