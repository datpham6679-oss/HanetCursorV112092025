import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình kết nối database
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Admin@123',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'hanet',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Tạo connection pool với error handling tốt hơn
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Kết nối thành công tới SQL Server');
        return pool;
    })
    .catch(error => {
        console.error('❌ Lỗi kết nối tới SQL Server:', error.message);
        throw error;
    });

export { sql, poolPromise };