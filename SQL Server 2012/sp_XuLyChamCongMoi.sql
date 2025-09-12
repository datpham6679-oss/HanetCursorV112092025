-- =============================================
-- Stored Procedure: sp_XuLyChamCongMoi
-- Logic đúng: Giữ nguyên giờ vào cũ nhất, chỉ cập nhật giờ ra mới nhất
-- =============================================

CREATE PROCEDURE sp_XuLyChamCongMoi
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Buoc 1: Lay cac su kien moi (DaXuLy=0) cho tat ca nhan vien dua tren person_id
    SELECT DISTINCT
        raw.person_id,
        CAST(COALESCE(MIN(CASE WHEN raw.device_name LIKE N'%_IN' THEN raw.ts_vn ELSE NULL END), MIN(raw.ts_vn)) AS DATE) AS NgayChamCong,
        nv.CaLamViec,
        nv.MaNhanVienNoiBo,
        nv.HoTen
    INTO #TempNewEvents
    FROM dulieutho AS raw
    JOIN NhanVien AS nv ON raw.person_id = nv.MaNhanVienHANET
    WHERE raw.DaXuLy = 0
        AND raw.person_id IS NOT NULL -- Chi xu ly nhung records co person_id
        AND nv.MaNhanVienHANET IS NOT NULL -- Chi xu ly nhung nhan vien co MaNhanVienHANET
    GROUP BY raw.person_id, nv.CaLamViec, nv.MaNhanVienNoiBo, nv.HoTen
    HAVING COALESCE(MIN(CASE WHEN raw.device_name LIKE N'%_IN' THEN raw.ts_vn ELSE NULL END), MIN(raw.ts_vn)) IS NOT NULL;

    -- Buoc 2: Xu ly tung nhan vien
    DECLARE @person_id VARCHAR(50);
    DECLARE @NgayChamCong DATE;
    DECLARE @CaLamViec NVARCHAR(10);
    DECLARE @MaNhanVienNoiBo VARCHAR(50);
    DECLARE @HoTen NVARCHAR(200);
    
    DECLARE cursor_events CURSOR FOR
    SELECT person_id, NgayChamCong, CaLamViec, MaNhanVienNoiBo, HoTen FROM #TempNewEvents;
    
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
        
        -- LOGIC ĐÚNG: Tim gio vao CŨ NHẤT trong ngay (giờ vào sớm nhất) - KHÔNG BAO GIỜ THAY ĐỔI
        SELECT TOP 1 
            @GioVao = raw.ts_vn,
            @NgayVao = CAST(raw.ts_vn AS DATE),
            @DiaDiemVao = raw.device_name
        FROM dulieutho raw
        WHERE raw.person_id = @person_id
            AND CAST(raw.ts_vn AS DATE) = @NgayChamCong
            AND raw.device_name LIKE N'%_IN'
        ORDER BY raw.ts_vn ASC; -- ASC để lấy giờ cũ nhất (sớm nhất) - KHÔNG BAO GIỜ THAY ĐỔI
        
        -- LOGIC ĐÚNG: Tim gio ra MỚI NHẤT trong ngay hoặc ngày hôm sau (giờ ra muộn nhất) - LUÔN CẬP NHẬT
        -- Đối với ca đêm, checkout có thể là ngày hôm sau
        -- Nhưng phải đảm bảo checkout phải sau giờ vào
        SELECT TOP 1 
            @GioRa = raw.ts_vn,
            @NgayRa = CAST(raw.ts_vn AS DATE),
            @DiaDiemRa = raw.device_name
        FROM dulieutho raw
        WHERE raw.person_id = @person_id
            AND (CAST(raw.ts_vn AS DATE) = @NgayChamCong OR CAST(raw.ts_vn AS DATE) = DATEADD(DAY, 1, @NgayChamCong))
            AND raw.device_name LIKE N'%_OUT'
            AND (@GioVao IS NULL OR raw.ts_vn > @GioVao) -- Đảm bảo checkout phải sau giờ vào
        ORDER BY raw.ts_vn DESC; -- DESC để lấy giờ mới nhất (muộn nhất) - LUÔN CẬP NHẬT
        
        -- Neu khong co gio vao, lay su kien dau tien (giờ cũ nhất) - KHÔNG BAO GIỜ THAY ĐỔI
        IF @GioVao IS NULL
        BEGIN
            SELECT TOP 1 
                @GioVao = raw.ts_vn,
                @NgayVao = CAST(raw.ts_vn AS DATE),
                @DiaDiemVao = raw.device_name
            FROM dulieutho raw
            WHERE raw.person_id = @person_id
                AND CAST(raw.ts_vn AS DATE) = @NgayChamCong
                AND raw.event_type = 'vào'  -- CHỈ LẤY EVENT VÀO
            ORDER BY raw.ts_vn ASC; -- ASC để lấy giờ cũ nhất - KHÔNG BAO GIỜ THAY ĐỔI
        END
        
        -- Neu khong co gio ra, lay su kien cuoi cung (giờ mới nhất) - LUÔN CẬP NHẬT
        -- Đối với ca đêm, có thể là ngày hôm sau
        -- Nhưng phải đảm bảo checkout phải sau giờ vào
        IF @GioRa IS NULL
        BEGIN
            SELECT TOP 1 
                @GioRa = raw.ts_vn,
                @NgayRa = CAST(raw.ts_vn AS DATE),
                @DiaDiemRa = raw.device_name
            FROM dulieutho raw
            WHERE raw.person_id = @person_id
                AND (CAST(raw.ts_vn AS DATE) = @NgayChamCong OR CAST(raw.ts_vn AS DATE) = DATEADD(DAY, 1, @NgayChamCong))
                AND raw.event_type = 'ra'  -- CHỈ LẤY EVENT RA
                AND (@GioVao IS NULL OR raw.ts_vn > @GioVao) -- Đảm bảo checkout phải sau giờ vào
            ORDER BY raw.ts_vn DESC; -- DESC để lấy giờ mới nhất - LUÔN CẬP NHẬT
        END
        
        -- Tinh thoi gian lam viec
        DECLARE @ThoiGianLamViec DECIMAL(10,4) = 0;
        IF @GioVao IS NOT NULL AND @GioRa IS NOT NULL
        BEGIN
            SET @ThoiGianLamViec = CAST(DATEDIFF(MINUTE, @GioVao, @GioRa) AS DECIMAL(10,4)) / 60.0;
        END
        
        -- TU DONG XAC DINH CA LAM VIEC DUA TREN THOI GIAN
        DECLARE @CaThucTe NVARCHAR(10) = @CaLamViec; -- Su dung ca lam viec tu bang NhanVien
        DECLARE @TrangThai NVARCHAR(50) = N'Chua co quy dinh';
        DECLARE @HopLe BIT = 0; -- Flag để kiểm tra tính hợp lệ
        
        -- Logic tu dong xac dinh ca lam viec và validation khung giờ
        IF @GioVao IS NOT NULL AND @GioRa IS NOT NULL
        BEGIN
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
                    -- Neu nhan vien la ca van hanh, xac dinh ca ngay hay ca dem
                    IF @CaLamViec = 'VH'
                        SET @CaThucTe = N'VHCN' -- Ca van hanh ngay
                    ELSE
                        SET @CaThucTe = @CaLamViec
                    SET @HopLe = 1
                END
                ELSE IF @CaLamViec = 'VH'
                BEGIN
                    -- Nhan vien van hanh co the lam ca ngay hoac ca dem
                    SET @CaThucTe = N'VH'   -- Ca van hanh linh hoat
                    SET @HopLe = 1
                END
            END
            -- Ca Vận hành đêm: 18h-8h hôm sau
            ELSE IF (@GioCheckin >= '18:00:00' OR @GioCheckout <= '08:00:00')
            BEGIN
                IF @GioCheckin BETWEEN '18:00:00' AND '19:00:00' AND @GioCheckout BETWEEN '07:00:00' AND '08:00:00'
                BEGIN
                    -- Neu nhan vien la ca van hanh, xac dinh ca ngay hay ca dem
                    IF @CaLamViec = 'VH'
                        SET @CaThucTe = N'VHCD' -- Ca van hanh dem
                    ELSE
                        SET @CaThucTe = @CaLamViec
                    SET @HopLe = 1
                END
                ELSE IF @CaLamViec = 'VH'
                BEGIN
                    -- Nhan vien van hanh co the lam ca ngay hoac ca dem
                    SET @CaThucTe = N'VH'   -- Ca van hanh linh hoat
                    SET @HopLe = 1
                END
                ELSE
                BEGIN
                    SET @CaThucTe = N'VH'   -- Ca van hanh chung (linh hoat)
                    SET @HopLe = 1
                END
            END
            ELSE
            BEGIN
                -- Không trong khung giờ cho phép
                SET @CaThucTe = N'VH'
                SET @HopLe = 0
                SET @TrangThai = N'Khong hop le - ngoai khung gio'
            END
        END
        
        -- Tinh trang thai dua tren ca thuc te và tính hợp lệ
        IF @HopLe = 1
        BEGIN
            IF @CaThucTe = N'HC'
            BEGIN
                SET @TrangThai = CASE
                    WHEN DATENAME(weekday, @NgayChamCong) IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
                         AND @GioCheckin BETWEEN '06:00:00' AND '07:30:00'
                         AND @GioCheckout BETWEEN '17:00:00' AND '18:00:00'
                    THEN N'Dung gio'
                    WHEN DATENAME(weekday, @NgayChamCong) IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
                         AND @GioCheckin > '07:30:00'
                    THEN N'Di tre'
                    WHEN DATENAME(weekday, @NgayChamCong) IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
                         AND @GioCheckout < '17:00:00'
                    THEN N'Ve som'
                    ELSE N'Khong dung gio quy dinh'
                END
            END
            ELSE IF @CaThucTe = N'SC'
            BEGIN
                SET @TrangThai = CASE
                    WHEN DATENAME(weekday, @NgayChamCong) IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
                         AND @GioCheckin BETWEEN '06:00:00' AND '08:00:00'
                         AND @GioCheckout BETWEEN '16:00:00' AND '18:00:00'
                    THEN N'Dung gio'
                    WHEN DATENAME(weekday, @NgayChamCong) IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
                         AND @GioCheckin > '08:00:00'
                    THEN N'Di tre'
                    WHEN DATENAME(weekday, @NgayChamCong) IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
                         AND @GioCheckout < '16:00:00'
                    THEN N'Ve som'
                    ELSE N'Khong dung gio quy dinh'
                END
            END
            ELSE IF @CaThucTe = N'VHCN'
            BEGIN
                SET @TrangThai = CASE
                    WHEN @GioCheckin BETWEEN '06:00:00' AND '07:00:00'
                         AND @GioCheckout BETWEEN '19:00:00' AND '20:00:00'
                    THEN N'Dung gio'
                    WHEN @GioCheckin > '07:00:00'
                    THEN N'Di tre'
                    WHEN @GioCheckout < '19:00:00'
                    THEN N'Ve som'
                    ELSE N'Khong dung gio quy dinh'
                END
            END
            ELSE IF @CaThucTe = N'VHCD'
            BEGIN
                SET @TrangThai = CASE
                    WHEN @GioCheckin BETWEEN '18:00:00' AND '19:00:00'
                         AND @GioCheckout BETWEEN '07:00:00' AND '08:00:00'
                    THEN N'Dung gio'
                    WHEN @GioCheckin > '19:00:00'
                    THEN N'Di tre'
                    WHEN @GioCheckout < '07:00:00'
                    THEN N'Ve som'
                    ELSE N'Khong dung gio quy dinh'
                END
            END
            ELSE IF @CaThucTe = N'VH'
            BEGIN
                -- Ca van hanh linh hoat - chi kiem tra thoi gian lam viec
                IF @ThoiGianLamViec >= 8.0
                    SET @TrangThai = N'Dung gio'
                ELSE IF @ThoiGianLamViec >= 6.0
                    SET @TrangThai = N'Ve som'
                ELSE
                    SET @TrangThai = N'Di tre'
            END
        END
        
        -- Chi insert khi hop le
        IF @HopLe = 1
        BEGIN
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
                    DiaDiemRa = source.DiaDiemRa
            WHEN NOT MATCHED THEN
                INSERT (MaNhanVienNoiBo, TenNhanVien, NgayChamCong, NgayVao, GioVao, NgayRa, GioRa, ThoiGianLamViec, CaLamViec, TrangThai, DiaDiemVao, DiaDiemRa)
                VALUES (source.MaNhanVienNoiBo, source.TenNhanVien, source.NgayChamCong, source.NgayVao, source.GioVao, source.NgayRa, source.GioRa, source.ThoiGianLamViec, source.CaLamViec, source.TrangThai, source.DiaDiemVao, source.DiaDiemRa);
        END
        
        -- Danh dau cac su kien da xu ly
        UPDATE dulieutho
        SET DaXuLy = 1
        WHERE person_id = @person_id
            AND CAST(ts_vn AS DATE) = @NgayChamCong
            AND DaXuLy = 0;
        
        FETCH NEXT FROM cursor_events INTO @person_id, @NgayChamCong, @CaLamViec, @MaNhanVienNoiBo, @HoTen;
    END
    
    CLOSE cursor_events;
    DEALLOCATE cursor_events;
    
    -- Cleanup
    DROP TABLE #TempNewEvents;
    
    PRINT 'Xu ly cham cong hoan thanh!';
END