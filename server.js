import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import hanetRoutes from './modules/routes.js';

// Cấu hình environment variables
dotenv.config();

// Kiểm tra và cảnh báo về cấu hình thiếu
const checkConfig = () => {
    const required = ['HANET_CLIENT_ID', 'HANET_CLIENT_SECRET', 'HANET_ACCESS_TOKEN'];
    const missing = required.filter(key => {
        const value = process.env[key];
        return !value || value.trim() === '' || value === 'your_client_id_here' || value === 'your_client_secret_here' || value === 'your_access_token_here';
    });
    
    if (missing.length > 0) {
        console.warn(`⚠️  Cấu hình Hanet chưa đầy đủ. Thiếu: ${missing.join(', ')}`);
        console.warn(`📝 Vui lòng cập nhật file .env hoặc sử dụng API /hanet-config để cấu hình`);
        console.warn(`🌐 Truy cập https://partner.hanet.ai/ để lấy thông tin cấu hình`);
        return false;
    } else {
        console.log('✅ Cấu hình Hanet đã được thiết lập');
        return true;
    }
};

checkConfig();

const app = express();
const PORT = process.env.PORT || 1888;

// Cấu hình middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.raw({ type: '*/*', limit: '2mb' }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => res.redirect('/dashboard'));
app.get('/dashboard', (req, res) => res.sendFile('dashboard-simple.html', { root: 'public' }));
app.get('/dashboard-new', (req, res) => res.sendFile('dashboard-new.html', { root: 'public' }));
app.use('/', hanetRoutes);

// Khởi động server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server đang lắng nghe tại http://localhost:${PORT}`);
    console.log(`🌐 Dashboard UI: http://117.2.136.172:${PORT}/dashboard`);
    console.log(`📩 Đang chờ dữ liệu Hanet tại http://117.2.136.172:${PORT}/hanet-webhook`);
    console.log(`⚙️  Cấu hình Hanet: http://localhost:${PORT}/hanet-config`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} đã được sử dụng. Vui lòng dừng process khác hoặc thay đổi port.`);
        console.error(`💡 Sử dụng lệnh: netstat -ano | findstr :${PORT} để tìm process đang sử dụng port`);
        console.error(`💡 Sau đó dùng: taskkill /PID <PID> /F để dừng process`);
    } else {
        console.error('❌ Lỗi khởi động server:', err.message);
    }
    process.exit(1);
});