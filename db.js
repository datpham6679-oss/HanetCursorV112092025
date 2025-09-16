import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình kết nối database
const config = {
    user: 'sa',
    password: 'Admin@123',
    server: 'localhost', // Sử dụng SQL Authentication
    database: 'hanet',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    }
};

// Tạo connection pool
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Kết nối thành công tới SQL Server');
        return pool;
    })
    .catch(error => {
        console.error('❌ Lỗi kết nối tới SQL Server:', error.message);
        // Không throw error để server vẫn có thể chạy
        return null;
    });

// Hàm helper để lấy kết nối database
const getDbConnection = async () => {
    try {
        if (poolPromise && await poolPromise) {
            return await poolPromise;
        }
        
        // Nếu poolPromise không hoạt động, tạo kết nối mới
        const pool = await sql.connect(config);
        return pool;
    } catch (error) {
        console.error('❌ Lỗi lấy kết nối database:', error.message);
        throw error;
    }
};

export { sql, poolPromise, getDbConnection };