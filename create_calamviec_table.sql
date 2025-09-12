-- =============================================
-- Tạo bảng CaLamViec để quản lý ca làm việc
-- =============================================

-- Tạo bảng CaLamViec
CREATE TABLE CaLamViec (
    MaCa NVARCHAR(10) PRIMARY KEY,
    TenCa NVARCHAR(50) NOT NULL,
    ThuBatDau NVARCHAR(20) NOT NULL,
    ThuKetThuc NVARCHAR(20) NOT NULL,
    GioCheckinBatDau TIME NOT NULL,
    GioCheckinKetThuc TIME NOT NULL,
    GioCheckoutBatDau TIME NOT NULL,
    GioCheckoutKetThuc TIME NOT NULL,
    MoTa NVARCHAR(200),
    NgayTao DATETIME DEFAULT GETDATE()
);

-- Thêm dữ liệu ca làm việc
INSERT INTO CaLamViec (MaCa, TenCa, ThuBatDau, ThuKetThuc, GioCheckinBatDau, GioCheckinKetThuc, GioCheckoutBatDau, GioCheckoutKetThuc, MoTa) VALUES 
('HC', N'Hành chính', N'Thứ 2', N'Thứ 6', '06:00:00', '07:30:00', '17:00:00', '18:00:00', N'Ca hành chính từ thứ 2 đến thứ 6'),
('SC', N'Sửa chữa', N'Thứ 2', N'Thứ 6', '06:00:00', '08:00:00', '16:00:00', '18:00:00', N'Ca sửa chữa từ thứ 2 đến thứ 6'),
('VHCN', N'Vận hành ca ngày', N'Thứ 2', N'Chủ nhật', '06:00:00', '07:00:00', '19:00:00', '20:00:00', N'Ca vận hành ngày từ thứ 2 đến chủ nhật'),
('VHCD', N'Vận hành ca đêm', N'Thứ 2', N'Chủ nhật', '18:00:00', '19:00:00', '07:00:00', '08:00:00', N'Ca vận hành đêm từ thứ 2 đến chủ nhật, checkout ngày hôm sau');

-- Kiểm tra dữ liệu
SELECT * FROM CaLamViec ORDER BY MaCa;
