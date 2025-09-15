import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import hanetRoutes from './modules/routes.js';
import { poolPromise } from './db.js';

// Cấu hình environment variables
dotenv.config();

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
app.use('/', hanetRoutes);

// Khởi động server
app.listen(PORT, '0.0.0.0', async () => {
    try {
        await poolPromise;
        console.log(`🚀 Server đang lắng nghe tại http://localhost:${PORT}`);
        console.log(`🌐 Dashboard UI: http://117.2.136.172:${PORT}/dashboard`);
        console.log(`📩 Đang chờ dữ liệu Hanet tại http://117.2.136.172:${PORT}/hanet-webhook`);
    } catch (error) {
        console.error('❌ Server không thể kết nối tới cơ sở dữ liệu:', error);
        console.log('⚠️ Server vẫn chạy nhưng không thể kết nối database');
    }
});