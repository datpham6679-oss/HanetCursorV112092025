const sql = require('mssql');

async function checkEmployee() {
    try {
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost',
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        await sql.connect(config);
        
        console.log('🔍 Kiểm tra nhân viên: Trần Đình Anh Tuấn');
        console.log('='.repeat(60));
        
        // 1. Kiểm tra trong bảng NhanVien
        console.log('\n1. Thông tin nhân viên trong bảng NhanVien:');
        const employeeResult = await sql.query(`
            SELECT MaNhanVienNoiBo, HoTen, MaNhanVienHANET, CaLamViec, PhongBan
            FROM NhanVien 
            WHERE HoTen LIKE N'%Trần Đình Anh Tuấn%'
        `);
        
        if (employeeResult.recordset.length > 0) {
            console.log('✅ Tìm thấy nhân viên:');
            employeeResult.recordset.forEach(emp => {
                console.log(`   - Mã nội bộ: ${emp.MaNhanVienNoiBo}`);
                console.log(`   - Họ tên: ${emp.HoTen}`);
                console.log(`   - Mã HANET: ${emp.MaNhanVienHANET}`);
                console.log(`   - Ca làm việc: ${emp.CaLamViec}`);
                console.log(`   - Phòng ban: ${emp.PhongBan}`);
            });
        } else {
            console.log('❌ Không tìm thấy nhân viên trong bảng NhanVien');
        }
        
        // 2. Kiểm tra dữ liệu thô (dulieutho)
        console.log('\n2. Dữ liệu thô từ thiết bị chấm công:');
        const rawDataResult = await sql.query(`
            SELECT TOP 10 
                person_id, employee_name, device_name, event_type, ts_vn, DaXuLy
            FROM dulieutho 
            WHERE employee_name LIKE N'%Trần Đình Anh Tuấn%' 
               OR person_id IN (SELECT MaNhanVienHANET FROM NhanVien WHERE HoTen LIKE N'%Trần Đình Anh Tuấn%')
            ORDER BY ts_vn DESC
        `);
        
        if (rawDataResult.recordset.length > 0) {
            console.log('✅ Tìm thấy dữ liệu thô:');
            rawDataResult.recordset.forEach(record => {
                console.log(`   - Person ID: ${record.person_id}`);
                console.log(`   - Tên: ${record.employee_name}`);
                console.log(`   - Thiết bị: ${record.device_name}`);
                console.log(`   - Loại: ${record.event_type}`);
                console.log(`   - Thời gian: ${record.ts_vn}`);
                console.log(`   - Đã xử lý: ${record.DaXuLy ? 'Có' : 'Chưa'}`);
                console.log('   ---');
            });
        } else {
            console.log('❌ Không tìm thấy dữ liệu thô');
        }
        
        // 3. Kiểm tra dữ liệu đã xử lý
        console.log('\n3. Dữ liệu đã xử lý (ChamCongDaXuLyMoi):');
        const processedResult = await sql.query(`
            SELECT TOP 10 
                MaNhanVienNoiBo, TenNhanVien, NgayChamCong, GioVao, GioRa, 
                ThoiGianLamViec, TrangThai, CaLamViec, ThoiGianXuLy
            FROM ChamCongDaXuLyMoi 
            WHERE TenNhanVien LIKE N'%Trần Đình Anh Tuấn%'
            ORDER BY NgayChamCong DESC, ThoiGianXuLy DESC
        `);
        
        if (processedResult.recordset.length > 0) {
            console.log('✅ Tìm thấy dữ liệu đã xử lý:');
            processedResult.recordset.forEach(record => {
                console.log(`   - Mã NV: ${record.MaNhanVienNoiBo}`);
                console.log(`   - Tên: ${record.TenNhanVien}`);
                console.log(`   - Ngày: ${record.NgayChamCong}`);
                console.log(`   - Giờ vào: ${record.GioVao}`);
                console.log(`   - Giờ ra: ${record.GioRa}`);
                console.log(`   - Thời gian làm việc: ${record.ThoiGianLamViec}h`);
                console.log(`   - Trạng thái: ${record.TrangThai}`);
                console.log(`   - Ca làm việc: ${record.CaLamViec}`);
                console.log(`   - Thời gian xử lý: ${record.ThoiGianXuLy}`);
                console.log('   ---');
            });
        } else {
            console.log('❌ Không tìm thấy dữ liệu đã xử lý');
        }
        
        // 4. Kiểm tra có checkin/checkout nhưng chưa xử lý
        console.log('\n4. Kiểm tra có checkin/checkout nhưng chưa xử lý:');
        const unprocessedResult = await sql.query(`
            SELECT 
                raw.person_id,
                raw.employee_name,
                raw.device_name,
                raw.event_type,
                raw.ts_vn,
                raw.DaXuLy,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM ChamCongDaXuLyMoi ccdxm 
                               WHERE ccdxm.MaNhanVienNoiBo = nv.MaNhanVienNoiBo 
                                 AND ccdxm.NgayChamCong = CAST(raw.ts_vn AS DATE)) 
                    THEN 'Đã xử lý' 
                    ELSE 'Chưa xử lý' 
                END as TrangThaiXuLy
            FROM dulieutho raw
            LEFT JOIN NhanVien nv ON (raw.person_id = nv.MaNhanVienHANET OR raw.employee_code = nv.MaNhanVienNoiBo)
            WHERE (raw.employee_name LIKE N'%Trần Đình Anh Tuấn%' 
                   OR nv.HoTen LIKE N'%Trần Đình Anh Tuấn%')
              AND CAST(raw.ts_vn AS DATE) >= DATEADD(DAY, -7, GETDATE())
            ORDER BY raw.ts_vn DESC
        `);
        
        if (unprocessedResult.recordset.length > 0) {
            console.log('✅ Dữ liệu chi tiết:');
            unprocessedResult.recordset.forEach(record => {
                console.log(`   - Person ID: ${record.person_id}`);
                console.log(`   - Tên: ${record.employee_name}`);
                console.log(`   - Thiết bị: ${record.device_name}`);
                console.log(`   - Loại: ${record.event_type}`);
                console.log(`   - Thời gian: ${record.ts_vn}`);
                console.log(`   - Đã xử lý (raw): ${record.DaXuLy ? 'Có' : 'Chưa'}`);
                console.log(`   - Trạng thái xử lý: ${record.TrangThaiXuLy}`);
                console.log('   ---');
            });
        } else {
            console.log('❌ Không tìm thấy dữ liệu');
        }
        
        await sql.close();
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
}

checkEmployee();
