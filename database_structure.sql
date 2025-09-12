-- =============================================
-- Database Backup Script for Hanet Attendance System
-- Created: 2025-09-13
-- Description: Complete database structure and data backup
-- =============================================

-- Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'hanet')
BEGIN
    CREATE DATABASE hanet;
END
GO

USE hanet;
GO

-- =============================================
-- Table: CaLamViec (Work Shifts)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CaLamViec]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CaLamViec](
        [MaCa] [nvarchar](10) NOT NULL,
        [TenCa] [nvarchar](50) NOT NULL,
        [ThuBatDau] [int] NOT NULL,
        [ThuKetThuc] [int] NOT NULL,
        [GioBatDau] [time](7) NOT NULL,
        [GioKetThuc] [time](7) NOT NULL,
        [MoTa] [nvarchar](200) NULL,
        CONSTRAINT [PK_CaLamViec] PRIMARY KEY CLUSTERED ([MaCa] ASC)
    );
END
GO

-- =============================================
-- Table: NhanVien (Employees)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NhanVien]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[NhanVien](
        [MaNhanVienNoiBo] [nvarchar](50) NOT NULL,
        [MaNhanVienHANET] [nvarchar](50) NULL,
        [HoTen] [nvarchar](200) NOT NULL,
        [CaLamViec] [nvarchar](10) NULL,
        [PhongBan] [nvarchar](100) NULL,
        [ChucVu] [nvarchar](100) NULL,
        [TrangThai] [nvarchar](20) NULL,
        CONSTRAINT [PK_NhanVien] PRIMARY KEY CLUSTERED ([MaNhanVienNoiBo] ASC)
    );
END
GO

-- =============================================
-- Table: dulieutho (Raw Data)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[dulieutho]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[dulieutho](
        [ID] [int] IDENTITY(1,1) NOT NULL,
        [event_id] [nvarchar](100) NOT NULL,
        [employee_code] [nvarchar](50) NULL,
        [person_id] [nvarchar](50) NULL,
        [employee_name] [nvarchar](200) NULL,
        [device_id] [nvarchar](100) NULL,
        [device_name] [nvarchar](200) NULL,
        [event_type] [nvarchar](20) NULL,
        [ts_vn] [datetime2](7) NULL,
        [payload_json] [nvarchar](max) NULL,
        [DaXuLy] [bit] NOT NULL DEFAULT 0,
        CONSTRAINT [PK_dulieutho] PRIMARY KEY CLUSTERED ([ID] ASC)
    );
END
GO

-- =============================================
-- Table: ChamCongDaXuLyMoi (Processed Attendance)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ChamCongDaXuLyMoi]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ChamCongDaXuLyMoi](
        [ID] [int] IDENTITY(1,1) NOT NULL,
        [MaNhanVienNoiBo] [nvarchar](50) NOT NULL,
        [TenNhanVien] [nvarchar](200) NULL,
        [NgayVao] [date] NULL,
        [GioVao] [datetime2](0) NULL,
        [NgayRa] [date] NULL,
        [GioRa] [datetime2](0) NULL,
        [NgayChamCong] [date] NULL,
        [ThoiGianLamViec] [float] NULL,
        [TrangThai] [nvarchar](50) NULL,
        [DiaDiemVao] [nvarchar](200) NULL,
        [DiaDiemRa] [nvarchar](200) NULL,
        [ThoiGianXuLy] [datetime2](7) NULL,
        [CaLamViec] [nvarchar](10) NULL,
        CONSTRAINT [PK_ChamCongDaXuLyMoi] PRIMARY KEY CLUSTERED ([ID] ASC)
    );
END
GO

-- =============================================
-- Indexes for better performance
-- =============================================

-- Index for dulieutho
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[dulieutho]') AND name = N'IX_dulieutho_person_id')
CREATE NONCLUSTERED INDEX [IX_dulieutho_person_id] ON [dbo].[dulieutho] ([person_id] ASC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[dulieutho]') AND name = N'IX_dulieutho_DaXuLy')
CREATE NONCLUSTERED INDEX [IX_dulieutho_DaXuLy] ON [dbo].[dulieutho] ([DaXuLy] ASC);

-- Index for ChamCongDaXuLyMoi
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ChamCongDaXuLyMoi]') AND name = N'IX_ChamCongDaXuLyMoi_MaNhanVienNoiBo')
CREATE NONCLUSTERED INDEX [IX_ChamCongDaXuLyMoi_MaNhanVienNoiBo] ON [dbo].[ChamCongDaXuLyMoi] ([MaNhanVienNoiBo] ASC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ChamCongDaXuLyMoi]') AND name = N'IX_ChamCongDaXuLyMoi_NgayChamCong')
CREATE NONCLUSTERED INDEX [IX_ChamCongDaXuLyMoi_NgayChamCong] ON [dbo].[ChamCongDaXuLyMoi] ([NgayChamCong] ASC);

-- =============================================
-- Foreign Key Constraints
-- =============================================

-- Add foreign key from ChamCongDaXuLyMoi to NhanVien
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_ChamCongDaXuLyMoi_NhanVien]') AND parent_object_id = OBJECT_ID(N'[dbo].[ChamCongDaXuLyMoi]'))
ALTER TABLE [dbo].[ChamCongDaXuLyMoi] WITH CHECK ADD CONSTRAINT [FK_ChamCongDaXuLyMoi_NhanVien] FOREIGN KEY([MaNhanVienNoiBo]) REFERENCES [dbo].[NhanVien] ([MaNhanVienNoiBo]);

-- Add foreign key from ChamCongDaXuLyMoi to CaLamViec
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_ChamCongDaXuLyMoi_CaLamViec]') AND parent_object_id = OBJECT_ID(N'[dbo].[ChamCongDaXuLyMoi]'))
ALTER TABLE [dbo].[ChamCongDaXuLyMoi] WITH CHECK ADD CONSTRAINT [FK_ChamCongDaXuLyMoi_CaLamViec] FOREIGN KEY([CaLamViec]) REFERENCES [dbo].[CaLamViec] ([MaCa]);

-- Add foreign key from NhanVien to CaLamViec
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_NhanVien_CaLamViec]') AND parent_object_id = OBJECT_ID(N'[dbo].[NhanVien]'))
ALTER TABLE [dbo].[NhanVien] WITH CHECK ADD CONSTRAINT [FK_NhanVien_CaLamViec] FOREIGN KEY([CaLamViec]) REFERENCES [dbo].[CaLamViec] ([MaCa]);

PRINT 'Database structure created successfully!';
GO
