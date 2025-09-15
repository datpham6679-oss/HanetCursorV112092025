# 🏢 HỆ THỐNG CHẤM CÔNG TỰ ĐỘNG - KIẾN TRÚC CHI TIẾT

## 📋 MỤC LỤC
1. [Tổng quan hệ thống](#tổng-quan-hệ-thống)
2. [Kiến trúc tổng thể](#kiến-trúc-tổng-thể)
3. [Luồng dữ liệu](#luồng-dữ-liệu)
4. [Cơ sở dữ liệu](#cơ-sở-dữ-liệu)
5. [Backend API](#backend-api)
6. [Frontend Dashboard](#frontend-dashboard)
7. [Logic tính toán chấm công](#logic-tính-toán-chấm-công)
8. [Các ca làm việc](#các-ca-làm-việc)
9. [API Endpoints](#api-endpoints)
10. [Cài đặt và triển khai](#cài-đặt-và-triển-khai)

---

## 🎯 TỔNG QUAN HỆ THỐNG

Hệ thống chấm công tự động sử dụng camera AI Hanet để:
- **Thu thập dữ liệu**: Check-in/out từ camera
- **Xử lý tự động**: Tính toán thời gian làm việc và trạng thái
- **Hiển thị dashboard**: Giao diện web quản lý và báo cáo
- **Xuất báo cáo**: Excel với nhiều tiêu chí lọc

### 🏗️ Công nghệ sử dụng:
- **Backend**: Node.js + Express.js
- **Database**: SQL Server 2012
- **Frontend**: HTML5 + CSS3 + JavaScript (Vanilla)
- **Camera**: Hanet AI Camera
- **Export**: ExcelJS

---

## 🏛️ KIẾN TRÚC TỔNG THỂ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HANET CAMERA  │───▶│   NODE.JS API   │───▶│  SQL SERVER DB  │
│                 │    │                 │    │                 │
│ • Check-in/out  │    │ • Webhook       │    │ • Raw Data      │
│ • Face ID       │    │ • Processing    │    │ • Processed     │
│ • Timestamp     │    │ • Calculation   │    │ • Reports       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  WEB DASHBOARD  │
                       │                 │
                       │ • Real-time     │
                       │ • Reports       │
                       │ • Management    │
                       │ • Export Excel  │
                       └─────────────────┘
```

---

## 🔄 LUỒNG DỮ LIỆU

### 1. **Thu thập dữ liệu từ Camera**
```
Camera Hanet → Webhook POST → Node.js Server
```

### 2. **Xử lý dữ liệu thô**
```
Raw Data → MERGE SQL → Stored Procedure → Processed Data
```

### 3. **Hiển thị Dashboard**
```
Processed Data → API → Frontend → User Interface
```

### 4. **Xuất báo cáo**
```
Filter Criteria → API Query → Excel Generation → Download
```

---

## 🗄️ CƠ SỞ DỮ LIỆU

### **Bảng chính:**

#### 1. `dulieutho` (Dữ liệu thô)
```sql
- event_id: VARCHAR(50) - ID sự kiện
- employee_code: VARCHAR(50) - Mã nhân viên Hanet
- person_id: VARCHAR(50) - ID người dùng
- employee_name: NVARCHAR(100) - Tên nhân viên
- device_id: VARCHAR(50) - ID thiết bị camera
- device_name: NVARCHAR(100) - Tên thiết bị
- event_type: VARCHAR(10) - Loại sự kiện (in/out)
- ts_vn: DATETIME - Thời gian Việt Nam
- payload_json: NVARCHAR(MAX) - Dữ liệu JSON gốc
- DaXuLy: BIT - Đã xử lý chưa (0/1)
```

#### 2. `ChamCongDaXuLyMoi` (Dữ liệu đã xử lý)
```sql
- ID: INT IDENTITY - Khóa chính
- MaNhanVienNoiBo: VARCHAR(20) - Mã nhân viên nội bộ
- TenNhanVien: NVARCHAR(100) - Tên nhân viên
- NgayChamCong: DATE - Ngày chấm công
- GioVao: DATETIME - Giờ vào sớm nhất
- GioRa: DATETIME - Giờ ra muộn nhất
- ThoiGianLamViec: DECIMAL(10,4) - Thời gian làm việc (giờ)
- TrangThai: NVARCHAR(50) - Trạng thái (Đúng giờ/Đi trễ/Về sớm)
- CaLamViec: VARCHAR(10) - Ca làm việc (HC/SC/VHCN/VHCD/VH)
- DiaDiemVao: NVARCHAR(100) - Địa điểm vào
- DiaDiemRa: NVARCHAR(100) - Địa điểm ra
- NgayTao: DATETIME - Ngày tạo bản ghi
```

#### 3. `NhanVien` (Thông tin nhân viên)
```sql
- MaNhanVienNoiBo: VARCHAR(20) - Mã nhân viên nội bộ
- HoTen: NVARCHAR(100) - Họ tên
- GioiTinh: NVARCHAR(10) - Giới tính
- NgaySinh: DATE - Ngày sinh
- SoDienThoai: VARCHAR(20) - Số điện thoại
- PhongBan: NVARCHAR(100) - Phòng ban
- ChucVu: NVARCHAR(100) - Chức vụ
- CaLamViec: VARCHAR(10) - Ca làm việc mặc định
- MaNhanVienHANET: VARCHAR(50) - Mã nhân viên Hanet
```

#### 4. `CaLamViec` (Định nghĩa ca làm việc)
```sql
- MaCa: VARCHAR(10) - Mã ca
- TenCa: NVARCHAR(100) - Tên ca
- ThuBatDau: INT - Thứ bắt đầu (2-7)
- ThuKetThuc: INT - Thứ kết thúc (2-7)
- GioVaoBatDau: TIME - Giờ vào bắt đầu
- GioVaoKetThuc: TIME - Giờ vào kết thúc
- GioRaBatDau: TIME - Giờ ra bắt đầu
- GioRaKetThuc: TIME - Giờ ra kết thúc
```

---

## ⚙️ BACKEND API

### **Server chính (`server.js`)**
```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(compression());

// Routes
app.use('/api', routes);

// Dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard-simple.html'));
});

// Server start
app.listen(1888, '0.0.0.0', () => {
    console.log('🚀 Server đang lắng nghe tại http://localhost:1888');
});
```

### **Routes chính (`modules/routes.js`)**

#### 1. **Webhook Handler** - `/api/hanet-webhook`
```javascript
router.post('/hanet-webhook', async (req, res) => {
    // 1. Parse dữ liệu từ Hanet
    const payload = parseHanetPayload(req.body);
    
    // 2. MERGE vào bảng dulieutho
    await request.query(`
        MERGE dbo.dulieutho AS tgt
        USING (SELECT @event_id, @employee_code, ...) AS src
        ON tgt.event_id = src.event_id
        WHEN MATCHED THEN UPDATE SET ...
        WHEN NOT MATCHED THEN INSERT ...
    `);
    
    // 3. Chạy stored procedure xử lý
    await spRequest.query(`EXEC sp_XuLyChamCongMoi_Auto`);
    
    res.json({ success: true });
});
```

#### 2. **Attendance Data API** - `/api/attendance-data`
```javascript
router.get('/attendance-data', async (req, res) => {
    const { startDate, endDate, personId, status, department } = req.query;
    
    let query = `
        SELECT
            nv.MaNhanVienNoiBo,
            nv.HoTen,
            c.NgayChamCong,
            c.GioVao,
            c.GioRa,
            c.ThoiGianLamViec,
            c.TrangThai,
            c.CaLamViec
        FROM ChamCongDaXuLyMoi AS c
        JOIN NhanVien AS nv ON c.MaNhanVienNoiBo = nv.MaNhanVienNoiBo
        WHERE 1=1
    `;
    
    // Thêm điều kiện WHERE dựa trên query parameters
    // ...
    
    const result = await request.query(query);
    res.json(result.recordset);
});
```

---

## 🖥️ FRONTEND DASHBOARD

### **Cấu trúc file chính:**
```
public/
├── dashboard-simple.html    # File HTML chính
├── css/
│   └── dashboard.css        # Styles
└── js/
    ├── utils.js            # Utility functions
    ├── data.js             # Data management
    ├── dashboard.js         # Dashboard logic
    └── main.js             # Main application
```

### **Các tab chính:**

#### 1. **Dashboard Tab**
- **KPI Cards**: Đúng giờ, Đi trễ, Về sớm
- **Data Table**: Danh sách chấm công với filter
- **Auto Refresh**: Cập nhật dữ liệu mỗi 30 giây

#### 2. **Reports Tab**
- **Filter Options**: Theo ngày, tháng, phòng ban, nhân viên
- **Export Excel**: Xuất báo cáo với nhiều định dạng
- **Calendar Widget**: Chọn ngày dễ dàng

#### 3. **Employee Detail Tab**
- **Search**: Tìm kiếm nhân viên theo tên/mã
- **Summary Cards**: Thống kê tổng quan
- **Timeline**: Chi tiết check-in/out trong ngày

#### 4. **Employee Management Tab**
- **CRUD Operations**: Thêm, sửa, xóa nhân viên
- **Form Validation**: Kiểm tra dữ liệu đầu vào
- **Notification System**: Thông báo kết quả

#### 5. **Devices Tab**
- **Status Monitoring**: Online/Offline real-time
- **Device Details**: Thông tin chi tiết thiết bị
- **Auto Refresh**: Cập nhật trạng thái mỗi 10 giây

---

## 🧮 LOGIC TÍNH TOÁN CHẤM CÔNG

### **Stored Procedure: `sp_XuLyChamCongMoi_Auto`**

#### **Bước 1: Lấy dữ liệu thô**
```sql
-- Lấy tất cả dữ liệu chưa xử lý trong 3 ngày gần nhất
SELECT * FROM dulieutho 
WHERE DaXuLy = 0 
AND ts_vn >= DATEADD(DAY, -3, GETDATE())
```

#### **Bước 2: Nhóm theo nhân viên và ngày**
```sql
-- Nhóm dữ liệu theo nhân viên và ngày
GROUP BY MaNhanVienNoiBo, CAST(ts_vn AS DATE)
```

#### **Bước 3: Tính giờ vào/ra**
```sql
-- Giờ vào: Sớm nhất trong ngày
GioVao = MIN(CASE WHEN event_type = 'in' THEN ts_vn END)

-- Giờ ra: Muộn nhất trong ngày  
GioRa = MAX(CASE WHEN event_type = 'out' THEN ts_vn END)
```

#### **Bước 4: Tính thời gian làm việc**
```sql
-- Thời gian làm việc = Giờ ra - Giờ vào (đơn vị: giờ)
ThoiGianLamViec = DATEDIFF(MINUTE, GioVao, GioRa) / 60.0
```

#### **Bước 5: Xác định ca làm việc**
```sql
-- Logic xác định ca dựa trên giờ vào
CaLamViec = CASE 
    WHEN CAST(GioVao AS TIME) BETWEEN '06:00:00' AND '07:30:00' THEN 'HC'
    WHEN CAST(GioVao AS TIME) BETWEEN '06:00:00' AND '08:00:00' THEN 'SC'
    WHEN CAST(GioVao AS TIME) BETWEEN '06:00:00' AND '07:00:00' THEN 'VHCN'
    WHEN CAST(GioVao AS TIME) BETWEEN '18:00:00' AND '19:00:00' THEN 'VHCD'
    ELSE 'VH'
END
```

#### **Bước 6: Tính trạng thái**
```sql
-- Lấy thông tin ca làm việc từ bảng CaLamViec
DECLARE @GioVaoBatDau TIME, @GioVaoKetThuc TIME;
DECLARE @GioRaBatDau TIME, @GioRaKetThuc TIME;

SELECT @GioVaoBatDau = GioVaoBatDau, @GioVaoKetThuc = GioVaoKetThuc,
       @GioRaBatDau = GioRaBatDau, @GioRaKetThuc = GioRaKetThuc
FROM CaLamViec WHERE MaCa = @CaLamViec;

-- Tính trạng thái
TrangThai = CASE
    WHEN CAST(GioVao AS TIME) BETWEEN @GioVaoBatDau AND @GioVaoKetThuc 
     AND CAST(GioRa AS TIME) BETWEEN @GioRaBatDau AND @GioRaKetThuc THEN 'Đúng giờ'
    WHEN CAST(GioVao AS TIME) > @GioVaoKetThuc THEN 'Đi trễ'
    WHEN CAST(GioRa AS TIME) < @GioRaBatDau THEN 'Về sớm'
    ELSE 'Không đúng quy định'
END
```

#### **Bước 7: MERGE vào bảng đã xử lý**
```sql
MERGE ChamCongDaXuLyMoi AS tgt
USING (SELECT ...) AS src
ON tgt.MaNhanVienNoiBo = src.MaNhanVienNoiBo 
AND tgt.NgayChamCong = src.NgayChamCong
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED THEN INSERT ...
```

---

## ⏰ CÁC CA LÀM VIỆC

### **1. Hành chính (HC)**
- **Thời gian**: Thứ 2 - Thứ 6
- **Giờ vào**: 6:00 - 7:30 AM
- **Giờ ra**: 17:00 - 18:00 PM
- **Đặc điểm**: Ca hành chính tiêu chuẩn

### **2. Sửa chữa (SC)**
- **Thời gian**: Thứ 2 - Thứ 6  
- **Giờ vào**: 6:00 - 8:00 AM
- **Giờ ra**: 16:00 - 18:00 PM
- **Đặc điểm**: Ca sửa chữa, giờ vào/ra linh hoạt

### **3. Vận hành ca ngày (VHCN)**
- **Thời gian**: Thứ 2 - Chủ nhật
- **Giờ vào**: 6:00 - 7:00 AM
- **Giờ ra**: 19:00 - 20:00 PM
- **Đặc điểm**: Ca ngày, làm cả tuần

### **4. Vận hành ca đêm (VHCD)**
- **Thời gian**: Thứ 2 - Chủ nhật
- **Giờ vào**: 18:00 - 19:00 PM
- **Giờ ra**: 7:00 - 8:00 AM (ngày hôm sau)
- **Đặc điểm**: Ca đêm, checkout sang ngày hôm sau

### **5. Vận hành tự động (VH)**
- **Thời gian**: Tự động phát hiện
- **Logic**: Dựa trên giờ vào thực tế
- **Đặc điểm**: Linh hoạt, tự động xác định ca

---

## 🔌 API ENDPOINTS

### **Webhook & Data Processing**
- `POST /api/hanet-webhook` - Nhận dữ liệu từ camera Hanet
- `GET /api/attendance-data` - Lấy dữ liệu chấm công
- `GET /api/raw-events` - Lấy dữ liệu thô theo nhân viên

### **Employee Management**
- `GET /api/employees` - Danh sách nhân viên
- `POST /api/add-employee` - Thêm nhân viên mới
- `PUT /api/employees/:id` - Cập nhật nhân viên
- `DELETE /api/employees/:id` - Xóa nhân viên

### **Reports & Export**
- `GET /api/export/report` - Xuất báo cáo Excel
- `GET /api/departments` - Danh sách phòng ban

### **Device Management**
- `GET /api/devices` - Danh sách thiết bị
- `GET /api/health` - Kiểm tra sức khỏe hệ thống
- `GET /api/health/db` - Kiểm tra kết nối database

---

## 🚀 CÀI ĐẶT VÀ TRIỂN KHAI

### **1. Yêu cầu hệ thống**
- Node.js 16+
- SQL Server 2012+
- Windows Server/Linux
- Camera Hanet AI

### **2. Cài đặt Backend**
```bash
# Clone repository
git clone https://github.com/datpham6679-oss/HanetCursorV112092025.git

# Cài đặt dependencies
npm install

# Cấu hình database
# Chỉnh sửa file db.js với thông tin SQL Server

# Chạy server
node server.js
```

### **3. Cấu hình Database**
```sql
-- Tạo database
CREATE DATABASE hanet;

-- Chạy các script SQL trong thư mục SQL Server 2012/
-- 1. database_structure.sql
-- 2. sample_data.sql
-- 3. sp_XuLyChamCongMoi_Auto.sql
```

### **4. Cấu hình Camera Hanet**
- Đăng ký tài khoản Hanet
- Cấu hình webhook URL: `http://your-server:1888/api/hanet-webhook`
- Thiết lập face recognition cho nhân viên

### **5. Truy cập Dashboard**
- URL: `http://your-server:1888/dashboard`
- Hoặc: `http://your-server:1888/` (tự động redirect)

---

## 📊 VÍ DỤ TÍNH TOÁN

### **Scenario: Nhân viên Phạm Quốc Đạt**

#### **Dữ liệu thô:**
```
08:15 - Check-in tại Tổ Thông tin_IN
12:00 - Check-out tại Tổ Thông tin_OUT  
13:30 - Check-in tại Tổ Thông tin_IN
17:45 - Check-out tại Tổ Thông tin_OUT
```

#### **Xử lý:**
```
GioVao = 08:15 (sớm nhất)
GioRa = 17:45 (muộn nhất)
ThoiGianLamViec = 9.5 giờ
CaLamViec = 'HC' (dựa trên giờ vào 08:15)
TrangThai = 'Đúng giờ' (08:15 trong khoảng 6:00-7:30, 17:45 trong khoảng 17:00-18:00)
```

#### **Kết quả cuối cùng:**
```
MaNhanVienNoiBo: 300029
TenNhanVien: Phạm Quốc Đạt
NgayChamCong: 2025-09-12
GioVao: 2025-09-12 08:15:00
GioRa: 2025-09-12 17:45:00
ThoiGianLamViec: 9.5
TrangThai: Đúng giờ
CaLamViec: HC
```

---

## 🔧 TROUBLESHOOTING

### **Lỗi thường gặp:**

#### 1. **Kết nối Database**
```
Error: Failed to connect to localhost:1433
Solution: Kiểm tra SQL Server service, firewall, connection string
```

#### 2. **Webhook không nhận được dữ liệu**
```
Error: Webhook timeout
Solution: Kiểm tra network, Hanet configuration, server logs
```

#### 3. **Tính toán sai thời gian**
```
Error: ThoiGianLamViec = 0
Solution: Kiểm tra logic MERGE, stored procedure, timezone
```

#### 4. **Frontend không load dữ liệu**
```
Error: CORS, API timeout
Solution: Kiểm tra CORS settings, API endpoints, network
```

---

## 📈 PERFORMANCE & OPTIMIZATION

### **Database Optimization**
- Index trên các cột thường query: `MaNhanVienNoiBo`, `NgayChamCong`, `ts_vn`
- Partition table theo ngày cho dữ liệu lớn
- NOLOCK hints cho queries không cần consistency

### **API Optimization**
- Connection pooling cho SQL Server
- Caching cho dữ liệu ít thay đổi
- Compression middleware
- Rate limiting cho webhook

### **Frontend Optimization**
- Lazy loading cho bảng dữ liệu lớn
- Debounce cho search inputs
- Service Worker cho offline capability
- Bundle optimization

---

## 🔒 SECURITY

### **API Security**
- Input validation và sanitization
- SQL injection prevention
- Rate limiting
- CORS configuration

### **Data Security**
- Encrypted connection strings
- Database access control
- Audit logging
- Backup strategy

---

## 📝 LOGGING & MONITORING

### **Application Logs**
- Webhook processing logs
- Error logs với stack trace
- Performance metrics
- Database query logs

### **Monitoring**
- Server health checks
- Database connection monitoring
- API response time tracking
- Error rate monitoring

---

## 🚀 FUTURE ENHANCEMENTS

### **Planned Features**
- Real-time notifications
- Mobile app
- Advanced analytics
- Multi-location support
- Integration với HR systems

### **Technical Improvements**
- Microservices architecture
- Redis caching
- Message queue
- Container deployment
- CI/CD pipeline

---

*Tài liệu này được cập nhật thường xuyên. Phiên bản hiện tại: v1.0*
