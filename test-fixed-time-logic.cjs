const sql = require('mssql');
const fs = require('fs');

async function testFixedTimeLogic() {
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
        
        console.log('🔄 TEST LOGIC TIME ĐÃ SỬA');
        console.log('='.repeat(50));
        
        // Xóa stored procedure cũ
        console.log('🗑️ Xóa stored procedure cũ...');
        try {
            await sql.query('DROP PROCEDURE sp_XuLyChamCongMoi_Corrected');
            console.log('✅ Đã xóa stored procedure cũ');
        } catch (error) {
            console.log('⚠️ Không tìm thấy stored procedure cũ để xóa');
        }
        
        // Tạo stored procedure mới
        console.log('📝 Đang tạo stored procedure mới với logic TIME đã sửa...');
        const sqlContent = fs.readFileSync('SQL Server 2012/sp_XuLyChamCongMoi_Corrected.sql', 'utf8');
        const result = await sql.query(sqlContent);
        console.log('✅ Đã tạo stored procedure mới thành công!');
        
        // Xóa dữ liệu cũ để test
        console.log('\n🗑️ Xóa dữ liệu cũ để test...');
        const deleteResult = await sql.query('DELETE FROM ChamCongDaXuLyMoi');
        console.log(`✅ Đã xóa ${deleteResult.rowsAffected[0]} bản ghi cũ`);
        
        // Chạy stored procedure mới
        console.log('\n🔄 Chạy stored procedure mới...');
        const startTime = new Date();
        const spResult = await sql.query('EXEC sp_XuLyChamCongMoi_Corrected');
        const endTime = new Date();
        const duration = endTime - startTime;
        
        console.log(`✅ Hoàn thành trong ${duration}ms`);
        
        // Kiểm tra kết quả
        console.log('\n📊 KẾT QUẢ SAU KHI CHẠY SP:');
        const resultCheck = await sql.query(`
            SELECT 
                MaNhanVienNoiBo,
                TenNhanVien,
                NgayChamCong,
                CAST(GioVao AS TIME) as GioVaoTime,
                CAST(GioRa AS TIME) as GioRaTime,
                ThoiGianLamViec,
                TrangThai,
                CaLamViec
            FROM ChamCongDaXuLyMoi
            WHERE TenNhanVien LIKE N'%Trần Trọng Tuân%'
            ORDER BY NgayChamCong DESC
        `);
        
        if (resultCheck.recordset.length > 0) {
            resultCheck.recordset.forEach(record => {
                console.log(`   📋 ${record.TenNhanVien} (${record.MaNhanVienNoiBo})`);
                console.log(`     Checkin: ${record.GioVaoTime} → Ca: ${record.CaLamViec}`);
                console.log(`     Checkout: ${record.GioRaTime}`);
                console.log(`     Thời gian: ${record.ThoiGianLamViec}h`);
                console.log(`     Trạng thái: ${record.TrangThai}`);
                
                // Phân tích logic
                if (record.CaLamViec === 'VHCN') {
                    console.log(`     ✅ ĐÚNG: Checkin lúc ${record.GioVaoTime} → Ca ngày VHCN`);
                } else if (record.CaLamViec === 'VHCD') {
                    console.log(`     ✅ ĐÚNG: Checkin lúc ${record.GioVaoTime} → Ca đêm VHCD`);
                } else if (record.CaLamViec === 'VH') {
                    console.log(`     ❌ SAI: Checkin lúc ${record.GioVaoTime} → Vẫn là ca VH (chưa được xác định)`);
                }
                console.log('     ---');
            });
        } else {
            console.log('   ❌ Không tìm thấy nhân viên Trần Trọng Tuân');
        }
        
        // Kiểm tra tất cả ca VH
        console.log('\n🌙 TẤT CẢ CA VH:');
        const allVHResult = await sql.query(`
            SELECT 
                MaNhanVienNoiBo,
                TenNhanVien,
                NgayChamCong,
                CAST(GioVao AS TIME) as GioVaoTime,
                CAST(GioRa AS TIME) as GioRaTime,
                ThoiGianLamViec,
                TrangThai,
                CaLamViec
            FROM ChamCongDaXuLyMoi
            WHERE CaLamViec IN ('VH', 'VHCN', 'VHCD')
            ORDER BY NgayChamCong DESC, GioVaoTime ASC
        `);
        
        if (allVHResult.recordset.length > 0) {
            console.log(`   📊 Tìm thấy ${allVHResult.recordset.length} ca VH:`);
            allVHResult.recordset.forEach(record => {
                console.log(`   - ${record.TenNhanVien} (${record.MaNhanVienNoiBo})`);
                console.log(`     Checkin: ${record.GioVaoTime} → Ca: ${record.CaLamViec}`);
                console.log(`     Checkout: ${record.GioRaTime}`);
                console.log(`     Thời gian: ${record.ThoiGianLamViec}h`);
                console.log(`     Trạng thái: ${record.TrangThai}`);
                console.log('     ---');
            });
        } else {
            console.log('   ✅ Không có ca VH nào');
        }
        
        await sql.close();
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
}

testFixedTimeLogic();
