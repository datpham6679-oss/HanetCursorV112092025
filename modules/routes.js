import express from 'express';
import qs from 'querystring';
import ExcelJS from 'exceljs';
import moment from 'moment-timezone';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import sql from 'mssql';
import * as helpers from '../helpers.js';

const router = express.Router();

// ========================================
// HANET CONFIGURATION (SERVER-SIDE ONLY)
// ========================================
// Cấu hình Hanet Developer - chỉ quản lý ở server
let HANET_CONFIG = {
    CLIENT_ID: process.env.HANET_CLIENT_ID || '',
    CLIENT_SECRET: process.env.HANET_CLIENT_SECRET || '',
    ACCESS_TOKEN: process.env.HANET_ACCESS_TOKEN || '',
    API_BASE_URL: 'https://partner.hanet.ai',
    WEBHOOK_URL: process.env.WEBHOOK_URL || 'http://117.2.136.172:1888/hanet-webhook',
    IS_CONFIGURED: false
};

// Hàm kiểm tra cấu hình Hanet
const validateHanetConfig = () => {
    const required = ['CLIENT_ID', 'CLIENT_SECRET', 'ACCESS_TOKEN'];
    const missing = required.filter(key => !HANET_CONFIG[key] || HANET_CONFIG[key].trim() === '');
    
    HANET_CONFIG.IS_CONFIGURED = missing.length === 0;
    
    if (missing.length > 0) {
        console.warn(`⚠️  Cấu hình Hanet chưa đầy đủ. Thiếu: ${missing.join(', ')}`);
        return false;
    }
    
    console.log('✅ Cấu hình Hanet đã được thiết lập');
    return true;
};

// Hàm lưu cấu hình vào file .env
const saveConfigToEnv = (config) => {
    try {
        const envPath = path.join(process.cwd(), '.env');
        let envContent = '';
        
        // Đọc file .env hiện tại nếu có
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Cập nhật hoặc thêm cấu hình Hanet
        const envLines = envContent.split('\n');
        const newLines = [];
        let hanetConfigFound = false;
        
        for (const line of envLines) {
            if (line.startsWith('HANET_CLIENT_ID=') || 
                line.startsWith('HANET_CLIENT_SECRET=') || 
                line.startsWith('HANET_ACCESS_TOKEN=') || 
                line.startsWith('WEBHOOK_URL=')) {
                hanetConfigFound = true;
                continue; // Bỏ qua giá trị cũ
            }
            newLines.push(line);
        }
        
        // Thêm cấu hình Hanet mới
        if (!hanetConfigFound) {
            newLines.push('\n# Hanet Configuration');
        }
        newLines.push(`HANET_CLIENT_ID=${config.CLIENT_ID}`);
        newLines.push(`HANET_CLIENT_SECRET=${config.CLIENT_SECRET}`);
        newLines.push(`HANET_ACCESS_TOKEN=${config.ACCESS_TOKEN}`);
        newLines.push(`WEBHOOK_URL=${config.WEBHOOK_URL}`);
        
        fs.writeFileSync(envPath, newLines.join('\n'));
        console.log('✅ Cấu hình Hanet đã được lưu vào file .env');
        return true;
    } catch (error) {
        console.error('❌ Lỗi lưu cấu hình vào .env:', error.message);
        return false;
    }
};

// Kiểm tra cấu hình khi khởi động
validateHanetConfig();

// Hàm gọi Hanet API để lấy device status
const getHanetDeviceStatus = async () => {
    try {
        if (!HANET_CONFIG.ACCESS_TOKEN) {
            throw new Error('Access token chưa được cấu hình');
        }

        const response = await fetch(`${HANET_CONFIG.API_BASE_URL}/device/getList`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${HANET_CONFIG.ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Hanet API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching from Hanet API:', error.message);
        throw error;
    }
};

// ========================================
// HANET CONFIGURATION API ENDPOINTS
// ========================================

// GET /hanet-config - Lấy cấu hình hiện tại
router.get('/hanet-config', (req, res) => {
    try {
        const config = {
            clientId: HANET_CONFIG.CLIENT_ID,
            clientSecret: HANET_CONFIG.CLIENT_SECRET ? '***hidden***' : 'not_set',
            accessToken: HANET_CONFIG.ACCESS_TOKEN ? '***hidden***' : 'not_set',
            apiBaseUrl: HANET_CONFIG.API_BASE_URL,
            webhookUrl: HANET_CONFIG.WEBHOOK_URL,
            isConfigured: HANET_CONFIG.IS_CONFIGURED
        };
        
        res.json({
            success: true,
            message: 'Cấu hình Hanet',
            config: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy cấu hình Hanet',
            error: error.message
        });
    }
});

// POST /hanet-config - Cập nhật cấu hình
router.post('/hanet-config', async (req, res) => {
    try {
        const { clientId, clientSecret, accessToken, webhookUrl } = req.body;
        
        // Validate required fields
        if (!clientId || !clientSecret || !accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Client ID, Client Secret và Access Token là bắt buộc'
            });
        }
        
        // Cập nhật cấu hình
        HANET_CONFIG.CLIENT_ID = clientId;
        HANET_CONFIG.CLIENT_SECRET = clientSecret;
        HANET_CONFIG.ACCESS_TOKEN = accessToken;
        HANET_CONFIG.WEBHOOK_URL = webhookUrl || 'http://117.2.136.172:1888/hanet-webhook';
        
        // Cập nhật environment variables
        process.env.HANET_CLIENT_ID = clientId;
        process.env.HANET_CLIENT_SECRET = clientSecret;
        process.env.HANET_ACCESS_TOKEN = accessToken;
        process.env.WEBHOOK_URL = webhookUrl || 'http://117.2.136.172:1888/hanet-webhook';
        
        // Lưu vào file .env
        const saved = saveConfigToEnv(HANET_CONFIG);
        
        // Kiểm tra lại cấu hình
        validateHanetConfig();
        
        res.json({
            success: true,
            message: 'Cấu hình Hanet đã được cập nhật thành công',
            savedToEnv: saved,
            config: {
                clientId: clientId,
                clientSecret: '***hidden***',
                accessToken: '***hidden***',
                webhookUrl: webhookUrl || 'http://117.2.136.172:1888/hanet-webhook',
                isConfigured: HANET_CONFIG.IS_CONFIGURED
            }
        });
    } catch (error) {
        console.error('Lỗi cập nhật cấu hình Hanet:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật cấu hình Hanet',
            error: error.message
        });
    }
});

// DELETE /hanet-config - Xóa cấu hình
router.delete('/hanet-config', async (req, res) => {
    try {
        // Reset cấu hình về mặc định
        HANET_CONFIG.CLIENT_ID = '';
        HANET_CONFIG.CLIENT_SECRET = '';
        HANET_CONFIG.ACCESS_TOKEN = '';
        HANET_CONFIG.WEBHOOK_URL = 'http://117.2.136.172:1888/hanet-webhook';
        
        // Reset environment variables
        process.env.HANET_CLIENT_ID = '';
        process.env.HANET_CLIENT_SECRET = '';
        process.env.HANET_ACCESS_TOKEN = '';
        process.env.WEBHOOK_URL = 'http://117.2.136.172:1888/hanet-webhook';
        
        // Lưu vào file .env
        const saved = saveConfigToEnv(HANET_CONFIG);
        
        // Kiểm tra lại cấu hình
        validateHanetConfig();
        
        console.log('🗑️ Cấu hình Hanet đã được xóa');
        
        res.json({
            success: true,
            message: 'Cấu hình Hanet đã được xóa thành công',
            savedToEnv: saved
        });
    } catch (error) {
        console.error('Lỗi xóa cấu hình Hanet:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa cấu hình Hanet',
            error: error.message
        });
    }
});

// GET /hanet-test - Test kết nối Hanet API
router.get('/hanet-test', async (req, res) => {
    try {
        if (!HANET_CONFIG.IS_CONFIGURED) {
            return res.status(400).json({
                success: false,
                message: 'Cấu hình Hanet chưa đầy đủ',
                instructions: [
                    '1. Truy cập https://partner.hanet.ai/',
                    '2. Đăng nhập và tạo ứng dụng mới',
                    '3. Lấy Client ID, Client Secret và Access Token',
                    '4. Sử dụng POST /hanet-config để cập nhật cấu hình'
                ]
            });
        }

        // Test API call với Hanet - thử endpoint khác
        const testUrl = `${HANET_CONFIG.API_BASE_URL}/device/getList`;
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${HANET_CONFIG.ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            res.json({
                success: true,
                message: 'Kết nối Hanet API thành công',
                deviceCount: data.data ? data.data.length : 0,
                webhookUrl: HANET_CONFIG.WEBHOOK_URL
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Lỗi kết nối Hanet API',
                status: response.status,
                statusText: response.statusText
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi test kết nối Hanet',
            error: error.message
        });
    }
});

// ========================================
// END HANET CONFIGURATION
// ========================================

// Helper functions
const parsePayload = (req) => {
    let payload = req.body;
    
    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
        try {
            const rawBody = req.body.toString('utf8');
            payload = qs.parse(rawBody);
            if (payload.payload) payload = JSON.parse(payload.payload);
            else if (payload.data) payload = JSON.parse(payload.data);
            else throw new Error('Payload rỗng hoặc không đúng định dạng');
        } catch (error) {
            throw new Error(`Lỗi phân tích payload: ${error.message}`);
        }
    }
    return payload;
};

const logAttendanceEvent = (type, hmsVN, empName, deviceName, deviceId, dmyVN) => {
    // Webhook event processed silently
};

router.post('/hanet-webhook', async (req, res) => {
    // Set timeout cho request này
    req.setTimeout(30000); // 30 giây
    
    try {
        const p = parsePayload(req);
        
        // Fix encoding issues for Vietnamese characters
        const fixEncoding = (str) => {
            if (!str) return str;
            try {
                // Fix common Vietnamese character encoding issues
                return str
                    // Fix specific names
                    .replace(/Phạm QuốĐức Đạt/g, 'Phạm Quốc Đạt')
                    .replace(/Nhan NgọĐức Thêm/g, 'Nhan Ngọc Thêm')
                    .replace(/Trưởng Đứca/g, 'Trưởng Đức')
                    .replace(/Nguyễn Thị BíĐứch Nguyên/g, 'Nguyễn Thị Bích Nguyên')
                    .replace(/Nhân viên phụĐức vụ/g, 'Nhân viên phục vụ')
                    .replace(/Nguyễn ĐứĐức Huệ/g, 'Nguyễn Đức Huệ')
                    .replace(/Nguyễn ĐứĐức Tiến/g, 'Nguyễn Đức Tiến')
                    // Fix common character patterns
                    .replace(/QuốĐức/g, 'Quốc')
                    .replace(/NgọĐức/g, 'Ngọc')
                    .replace(/Đứca/g, 'Đức')
                    .replace(/BíĐứch/g, 'Bích')
                    .replace(/phụĐức/g, 'phục')
                    .replace(/ĐứĐức/g, 'Đức')
                    // Fix more patterns
                    .replace(/QuốcĐức/g, 'Quốc')
                    .replace(/NgọcĐức/g, 'Ngọc')
                    .replace(/ĐứcĐức/g, 'Đức')
                    .replace(/BíchĐứch/g, 'Bích')
                    .replace(/phụcĐức/g, 'phục')
                    .replace(/T\? Th�ng tin/g, 'Tổ Thông tin')
                    .replace(/Ph?m Qu?c Đ?t/g, 'Phạm Quốc Đạt')
                    .replace(/Nguy?n/g, 'Nguyễn')
                    .replace(/Tr?n/g, 'Trần')
                    .replace(/H�/g, 'Hà')
                    .replace(/\bDuc\b/g, 'Đức')
                    .replace(/\bDung\b/g, 'Dũng');
        } catch (e) {
                return str;
            }
        };
        
        // Apply encoding fix to relevant fields
        if (p.personName) {
            const originalName = p.personName;
            p.personName = fixEncoding(p.personName);
            if (originalName !== p.personName) {
                console.log(`🔧 Fixed encoding: "${originalName}" → "${p.personName}"`);
            }
        }
        if (p.personTitle) {
            const originalTitle = p.personTitle;
            p.personTitle = fixEncoding(p.personTitle);
            if (originalTitle !== p.personTitle) {
                console.log(`🔧 Fixed encoding: "${originalTitle}" → "${p.personTitle}"`);
            }
        }
        if (p.deviceName) {
            const originalDevice = p.deviceName;
            p.deviceName = fixEncoding(p.deviceName);
            if (originalDevice !== p.deviceName) {
                console.log(`🔧 Fixed encoding: "${originalDevice}" → "${p.deviceName}"`);
        }
    }

    const vnFull = helpers.normalizeDateString(p.date) || helpers.epochToVNString(p.time);
    const { tsVN, hmsVN, dmyVN } = helpers.buildTimes(vnFull);

    const type = helpers.resolveEventType(p.deviceName);
    const empName = p.personName || '-';
    const deviceName = p.deviceName || '-';
    const deviceId = p.deviceID || '-';
    const eventId = p.id || `${Date.now()}-${Math.random()}`;

    // Log essential webhook info for debugging
    const safeString = (str) => {
        if (!str) return '';
        try {
            // Fix common Vietnamese character encoding issues
            return str
                // Fix specific names
                .replace(/Phạm QuốĐức Đạt/g, 'Phạm Quốc Đạt')
                .replace(/Nhan NgọĐức Thêm/g, 'Nhan Ngọc Thêm')
                .replace(/Trưởng Đứca/g, 'Trưởng Đức')
                .replace(/Nguyễn Thị BíĐứch Nguyên/g, 'Nguyễn Thị Bích Nguyên')
                .replace(/Nhân viên phụĐức vụ/g, 'Nhân viên phục vụ')
                .replace(/Nguyễn ĐứĐức Huệ/g, 'Nguyễn Đức Huệ')
                .replace(/Nguyễn ĐứĐức Tiến/g, 'Nguyễn Đức Tiến')
                // Fix common character patterns
                .replace(/QuốĐức/g, 'Quốc')
                .replace(/NgọĐức/g, 'Ngọc')
                .replace(/Đứca/g, 'Đức')
                .replace(/BíĐứch/g, 'Bích')
                .replace(/phụĐức/g, 'phục')
                .replace(/ĐứĐức/g, 'Đức')
                // Fix more patterns
                .replace(/QuốcĐức/g, 'Quốc')
                .replace(/NgọcĐức/g, 'Ngọc')
                .replace(/ĐứcĐức/g, 'Đức')
                .replace(/BíchĐứch/g, 'Bích')
                .replace(/phụcĐức/g, 'phục');
        } catch (e) {
            return str;
        }
    };
    
    console.log(`📩 Hanet webhook: ${type.toUpperCase()}`);
    console.log(`   Date: ${p.date}`);
    console.log(`   Person: ${safeString(p.personName || '')}`);
    console.log(`   Title: ${safeString(p.personTitle || '')}`);
    console.log(`   AliasID: ${p.aliasID || ''}`);
    console.log(`   DeviceID: ${p.deviceID || ''}`);
    console.log(`   DeviceName: ${safeString(p.deviceName || '')}`);

        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        let pool;
        try {
            pool = await sql.connect(config);
            if (!pool) {
                throw new Error('Database connection failed');
            }
        } catch (error) {
            console.error('❌ Lỗi kết nối database:', error.message);
            return res.status(500).json({ error: 'Lỗi kết nối database: ' + error.message });
        }
        
        const request = pool.request();

        // Thêm parameters với xử lý datetime
        request.input('event_id', sql.NVarChar(100), eventId);
        request.input('employee_code', sql.NVarChar(50), p.aliasID || p.employee_code || null);
        request.input('person_id', sql.NVarChar(50), p.personID || null);
        request.input('employee_name', sql.NVarChar(200), empName);
        request.input('device_id', sql.NVarChar(100), deviceId);
        request.input('device_name', sql.NVarChar(200), deviceName);
        request.input('event_type', sql.NVarChar(20), type);
        
        // Xử lý datetime để tránh lỗi conversion và cộng thêm 7 giờ
        let tsVNValue = null;
        if (tsVN) {
            try {
                // Chuyển đổi từ DD/MM/YYYY HH:mm:ss sang YYYY-MM-DD HH:mm:ss
                const momentObj = moment(tsVN, 'DD/MM/YYYY HH:mm:ss');
                if (momentObj.isValid()) {
                    // Cộng thêm 7 giờ để đúng múi giờ Việt Nam
                    tsVNValue = momentObj.add(7, 'hours').format('YYYY-MM-DD HH:mm:ss');
                }
            } catch (error) {
                console.error('Lỗi chuyển đổi datetime:', error);
            }
        }
        
        request.input('ts_vn', sql.DateTime, tsVNValue);
        request.input('payload_json', sql.NVarChar(sql.MAX), JSON.stringify(p));

        // Cập nhật employee_code từ aliasID nếu có
        if (p.aliasID && p.personID) {
            try {
                const updateRequest = pool.request();
                updateRequest.input('person_id', sql.NVarChar(50), p.personID);
                updateRequest.input('employee_code', sql.NVarChar(50), p.aliasID);
                
                await updateRequest.query(`
                    UPDATE dulieutho 
                    SET employee_code = @employee_code 
                    WHERE person_id = @person_id AND (employee_code IS NULL OR employee_code = '')
                `);
            } catch (error) {
                console.error('Lỗi cập nhật employee_code:', error.message);
            }
        }

        // Thực hiện MERGE và stored procedures với timeout
        // Webhook processing started silently

        await request.query(`
            MERGE dbo.dulieutho AS tgt
            USING (SELECT
                @event_id AS event_id,
                @employee_code AS employee_code,
                @person_id AS person_id,
                @employee_name AS employee_name,
                @device_id AS device_id,
                @device_name AS device_name,
                @event_type AS event_type,
                @ts_vn AS ts_vn,
                @payload_json AS payload_json,
                0 AS DaXuLy
            ) AS src
            ON tgt.event_id = src.event_id
            WHEN MATCHED THEN
                UPDATE SET
                    tgt.employee_code = src.employee_code,
                    tgt.person_id = src.person_id,
                    tgt.employee_name = src.employee_name,
                    tgt.device_id = src.device_id,
                    tgt.device_name = src.device_name,
                    tgt.event_type = src.event_type,
                    tgt.ts_vn = src.ts_vn,
                    tgt.payload_json = src.payload_json
            WHEN NOT MATCHED THEN
                INSERT (event_id, employee_code, person_id, employee_name, device_id, device_name, event_type, ts_vn, payload_json, DaXuLy)
                VALUES (src.event_id, src.employee_code, src.person_id, src.employee_name, src.device_id, src.device_name, src.event_type, src.ts_vn, src.payload_json, src.DaXuLy);
        `);

        // MERGE completed silently
        
        // Tự động tạo/cập nhật nhân viên từ dữ liệu dulieutho
        if (p.personID && p.personName) {
            try {
                const employeeRequest = pool.request();
                employeeRequest.input('personID', sql.NVarChar(50), p.personID);
                employeeRequest.input('personName', sql.NVarChar(100), p.personName);
                employeeRequest.input('personTitle', sql.NVarChar(100), p.personTitle || null);
                employeeRequest.input('aliasID', sql.NVarChar(50), p.aliasID || null);
                
                await employeeRequest.query(`
                    MERGE dbo.NhanVien AS tgt
                    USING (SELECT
                        @personID AS MaNhanVienHANET,
                        @personName AS HoTen,
                        @personTitle AS ChucVu,
                        @aliasID AS MaNhanVienNoiBo
                    ) AS src
                    ON tgt.MaNhanVienHANET = src.MaNhanVienHANET
            WHEN MATCHED THEN
                UPDATE SET
                            tgt.HoTen = src.HoTen,
                            tgt.ChucVu = ISNULL(src.ChucVu, tgt.ChucVu),
                            tgt.MaNhanVienNoiBo = ISNULL(src.MaNhanVienNoiBo, tgt.MaNhanVienNoiBo),
                            tgt.NgayCapNhat = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (HoTen, ChucVu, MaNhanVienHANET, MaNhanVienNoiBo)
                        VALUES (src.HoTen, src.ChucVu, src.MaNhanVienHANET, src.MaNhanVienNoiBo);
                `);
                
                console.log(`✅ Đã cập nhật thông tin nhân viên: ${p.personName} (${p.personID})`);
            } catch (error) {
                console.error('❌ Lỗi cập nhật thông tin nhân viên:', error.message);
            }
        }
        
        // Chạy stored procedure với timeout riêng
        const spRequest = pool.request();
        spRequest.timeout = 20000; // 20 giây timeout cho SP
        
        try {
            await spRequest.query(`EXEC sp_XuLyChamCongMoi_Auto`);
            // Stored procedure completed silently
        } catch (spError) {
            console.error('⚠️ Lỗi stored procedure (không ảnh hưởng webhook):', spError.message);
            // Không throw error để webhook vẫn trả về thành công
        }
        
        logAttendanceEvent(type, hmsVN, empName, deviceName, deviceId, dmyVN);
        
        await pool.close();
        return res.status(200).json({ ok: true });
        
    } catch (error) {
        console.error('❌ Lỗi xử lý webhook:', error.message);
        return res.status(400).json({ error: error.message });
    }
});

router.get('/departments', async (req, res) => {
    try {
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        const result = await pool.request().query(
            'SELECT DISTINCT PhongBan FROM NhanVien WHERE PhongBan IS NOT NULL AND PhongBan != \'\' ORDER BY PhongBan;'
        );
        const departments = result.recordset.map(row => row.PhongBan);
        await pool.close();
        res.json(departments);
    } catch (error) {
        console.error('Lỗi lấy danh sách phòng ban:', error.message);
        res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách phòng ban' });
    }
});

router.get('/report/excel', async (req, res) => {
    try {
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        let pool;
        try {
            pool = await sql.connect(config);
            if (!pool) {
                throw new Error('Database connection failed');
            }
        } catch (error) {
            console.error('❌ Lỗi kết nối database:', error.message);
            return res.status(500).json({ error: 'Lỗi kết nối database: ' + error.message });
        }
        
        const request = pool.request();

        const result = await request.query(`
            SELECT
                nv.MaNhanVienNoiBo,
                nv.HoTen,
                c.NgayChamCong, 
                CONVERT(DATE, c.GioVao) AS NgayVao, 
                CONVERT(DATE, c.GioRa) AS NgayRa, 
                CONVERT(VARCHAR(8), c.GioVao, 108) AS GioVao,
                CONVERT(VARCHAR(8), c.GioRa, 108) AS GioRa,
                c.ThoiGianLamViec,
                c.TrangThai
            FROM ChamCongDaXuLyMoi AS c
            JOIN NhanVien AS nv ON c.MaNhanVienNoiBo = nv.MaNhanVienNoiBo
            ORDER BY c.NgayChamCong DESC;
        `);

        const data = result.recordset;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Báo cáo chấm công');

        // Cấu hình columns
        worksheet.columns = [
            { header: 'Mã Nhân Viên', key: 'MaNhanVienNoiBo', width: 20 },
            { header: 'Họ và tên', key: 'HoTen', width: 30 },
            { header: 'Ngày công', key: 'NgayChamCong', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
            { header: 'Ngày vào', key: 'NgayVao', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
            { header: 'Ngày ra', key: 'NgayRa', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
            { header: 'Giờ vào', key: 'GioVao', width: 15, style: { numFmt: '@' } },
            { header: 'Giờ ra', key: 'GioRa', width: 15, style: { numFmt: '@' } },
            { header: 'Thời gian làm việc (giờ)', key: 'ThoiGianLamViec', width: 25 },
            { header: 'Trạng thái', key: 'TrangThai', width: 25 }
        ];

        // Xử lý dữ liệu để tránh lỗi timezone
        const processedData = data.map(row => {
            const formatDate = (date) => {
                if (!date) return '';
                const d = new Date(date);
                return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            };
            
            const formatTime = (date) => {
                if (!date) return '';
                const d = new Date(date);
                // Sử dụng UTC để tránh timezone conversion
                const hours = d.getUTCHours();
                const minutes = d.getUTCMinutes();
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            };
            
            return {
                MaNhanVienNoiBo: row.MaNhanVienNoiBo,
                HoTen: row.HoTen,
                NgayChamCong: formatDate(row.NgayChamCong),
                NgayVao: formatDate(row.NgayVao),
                NgayRa: formatDate(row.NgayRa),
                GioVao: formatTime(row.GioVao),
                GioRa: formatTime(row.GioRa),
                ThoiGianLamViec: row.ThoiGianLamViec,
                TrangThai: row.TrangThai
            };
        });

        worksheet.addRows(processedData);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=bao_cao_cham_cong.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Lỗi tạo báo cáo Excel:', error.message);
        res.status(500).json({ error: 'Lỗi máy chủ khi tạo báo cáo' });
    }
});

router.get('/attendance-data', async (req, res) => {
    try {
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        const { startDate, endDate, personId, status, department, date } = req.query;

        let query = `
            SELECT
                nv.MaNhanVienNoiBo,
                nv.HoTen,
                       CAST(raw.ts_vn AS DATE) AS NgayChamCong,
                       CASE WHEN raw.event_type = 'vào' THEN raw.ts_vn ELSE NULL END AS GioVao,
                       CASE WHEN raw.event_type = 'ra' THEN raw.ts_vn ELSE NULL END AS GioRa,
                       NULL AS ThoiGianLamViec,
                       CASE 
                           WHEN raw.event_type = 'vào' THEN 'Check-in'
                           WHEN raw.event_type = 'ra' THEN 'Check-out'
                           ELSE raw.event_type
                       END AS TrangThai,
                       nv.CaLamViec,
                       CASE WHEN raw.event_type = 'vào' THEN raw.device_name ELSE NULL END AS DiaDiemVao,
                       CASE WHEN raw.event_type = 'ra' THEN raw.device_name ELSE NULL END AS DiaDiemRa,
                       raw.ts_vn AS ThoiGianXuLy
                   FROM dulieutho AS raw
                   LEFT JOIN NhanVien AS nv ON (raw.person_id = nv.MaNhanVienHANET OR raw.employee_code = nv.MaNhanVienNoiBo)
                   WHERE raw.employee_name IS NOT NULL 
                     AND raw.employee_name != '' 
                     AND raw.employee_name != '-'
                     AND (raw.person_id IS NOT NULL OR raw.employee_code IS NOT NULL)
               `;

        const whereClauses = [];
        const request = pool.request();

        // Thêm điều kiện WHERE
        if (date) {
            whereClauses.push(`CAST(raw.ts_vn AS DATE) = @date`);
            request.input('date', sql.Date, date);
        }
        if (startDate) {
            whereClauses.push(`CAST(raw.ts_vn AS DATE) >= @startDate`);
            request.input('startDate', sql.Date, startDate);
        }
        if (endDate) {
            whereClauses.push(`CAST(raw.ts_vn AS DATE) <= @endDate`);
            request.input('endDate', sql.Date, endDate);
        }
        if (personId) {
            // Try to find by name or employee code
            whereClauses.push(`(
                nv.HoTen = @personId 
                OR nv.HoTen LIKE @personIdLike
                OR raw.employee_name = @personId
                OR raw.employee_name LIKE @personIdLike
                OR nv.MaNhanVienNoiBo = @personId
                OR nv.MaNhanVienHANET = @personId
                OR raw.employee_code = @personId
                OR raw.person_id = @personId
            )`);
            request.input('personId', sql.NVarChar(100), personId);
            request.input('personIdLike', sql.NVarChar(100), `%${personId}%`);
        }
        if (status) {
            whereClauses.push(`LTRIM(RTRIM(raw.event_type)) = @status`);
            request.input('status', sql.NVarChar(50), status.trim());
        }
        if (department) {
            whereClauses.push(`nv.PhongBan = @department`);
            request.input('department', sql.NVarChar(100), department);
        }

        if (whereClauses.length > 0) {
            query += ' AND ' + whereClauses.join(' AND ');
        }
               query += ' ORDER BY ThoiGianXuLy DESC;';

        const result = await request.query(query);
        await pool.close();
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy dữ liệu chấm công:', error.message);
        res.status(500).json({ error: 'Lỗi máy chủ khi lấy dữ liệu' });
    }
});


// POST /restore-nhanvien - Khôi phục dữ liệu nhân viên từ backup
router.post('/restore-nhanvien', async (req, res) => {
    try {
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        
        // Kiểm tra bảng backup có tồn tại không
        const checkBackup = await pool.request().query(`
            SELECT COUNT(*) as count FROM sys.tables WHERE name = 'NhanVien_Backup'
        `);
        
        if (checkBackup.recordset[0].count === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bảng NhanVien_Backup không tồn tại!'
            });
        }
        
        // Xóa dữ liệu hiện tại
        await pool.request().query('DELETE FROM NhanVien');
        
        // Khôi phục từ backup
        const result = await pool.request().query(`
            INSERT INTO NhanVien (HoTen, NamSinh, ChucVu, PhongBan, CaLamViec, MaNhanVienNoiBo, MaNhanVienHANET, NgayCapNhat)
            SELECT HoTen, NamSinh, ChucVu, PhongBan, CaLamViec, MaNhanVienNoiBo, MaNhanVienHANET, NgayCapNhat
            FROM NhanVien_Backup
        `);
        
        await pool.close();
        res.json({
            success: true,
            message: `Đã khôi phục ${result.rowsAffected[0]} nhân viên từ backup`,
            restoredCount: result.rowsAffected[0]
        });
        
    } catch (error) {
        console.error('❌ Lỗi khôi phục nhân viên:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi khôi phục nhân viên',
            error: error.message
        });
    }
});

// POST /backup-nhanvien - Tạo backup dữ liệu nhân viên
router.post('/backup-nhanvien', async (req, res) => {
    try {
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        
        // Xóa bảng backup cũ nếu tồn tại
        await pool.request().query(`
            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'NhanVien_Backup')
                DROP TABLE NhanVien_Backup
        `);
        
        // Tạo bảng backup mới
        const result = await pool.request().query(`
            SELECT * INTO NhanVien_Backup FROM NhanVien
        `);
        
        await pool.close();
        res.json({
            success: true,
            message: `Đã tạo backup với ${result.rowsAffected[0]} nhân viên`,
            backupCount: result.rowsAffected[0]
        });
        
    } catch (error) {
        console.error('❌ Lỗi tạo backup nhân viên:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo backup nhân viên',
            error: error.message
        });
    }
});

// POST /create-employees-from-data - Tự động tạo nhân viên từ dữ liệu dulieutho
router.post('/create-employees-from-data', async (req, res) => {
    try {
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        
        // Lấy danh sách nhân viên duy nhất từ dulieutho
        const result = await pool.request().query(`
            SELECT DISTINCT
                person_id,
                employee_name,
                employee_code,
                payload_json
            FROM dulieutho 
            WHERE person_id IS NOT NULL 
                AND employee_name IS NOT NULL
                AND employee_name != '-'
            ORDER BY person_id
        `);
        
        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        
        for (const row of result.recordset) {
            try {
                let personTitle = null;
                let aliasID = row.employee_code;
                
                // Lấy thông tin từ payload_json nếu có
                if (row.payload_json) {
                    try {
                        const payload = JSON.parse(row.payload_json);
                        personTitle = payload.personTitle || null;
                        if (payload.aliasID) {
                            aliasID = payload.aliasID;
                        }
                    } catch (parseError) {
                        console.warn('Lỗi parse payload_json:', parseError.message);
                    }
                }
                
                const employeeRequest = pool.request();
                employeeRequest.input('personID', sql.NVarChar(50), row.person_id);
                employeeRequest.input('personName', sql.NVarChar(100), row.employee_name);
                employeeRequest.input('personTitle', sql.NVarChar(100), personTitle);
                employeeRequest.input('aliasID', sql.NVarChar(50), aliasID);
                
                const mergeResult = await employeeRequest.query(`
                    MERGE dbo.NhanVien AS tgt
                    USING (SELECT
                        @personID AS MaNhanVienHANET,
                        @personName AS HoTen,
                        @personTitle AS ChucVu,
                        @aliasID AS MaNhanVienNoiBo
                    ) AS src
                    ON tgt.MaNhanVienHANET = src.MaNhanVienHANET
                    WHEN MATCHED THEN
                        UPDATE SET
                            tgt.HoTen = src.HoTen,
                            tgt.ChucVu = ISNULL(src.ChucVu, tgt.ChucVu),
                            tgt.MaNhanVienNoiBo = ISNULL(src.MaNhanVienNoiBo, tgt.MaNhanVienNoiBo),
                            tgt.NgayCapNhat = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (HoTen, ChucVu, MaNhanVienHANET, MaNhanVienNoiBo)
                        VALUES (src.HoTen, src.ChucVu, src.MaNhanVienHANET, src.MaNhanVienNoiBo);
                    
                    SELECT @@ROWCOUNT as affected_rows;
                `);
                
                if (mergeResult.recordset[0].affected_rows > 0) {
                    // Kiểm tra xem có phải là INSERT hay UPDATE
                    const checkRequest = pool.request();
                    checkRequest.input('personID', sql.NVarChar(50), row.person_id);
                    const checkResult = await checkRequest.query(`
                        SELECT COUNT(*) as count FROM NhanVien WHERE MaNhanVienHANET = @personID
                    `);
                    
                    if (checkResult.recordset[0].count > 0) {
                        updatedCount++;
                    } else {
                        createdCount++;
                    }
                }
                
            } catch (error) {
                console.error('Lỗi xử lý nhân viên:', row.person_id, error.message);
                errorCount++;
            }
        }
        
        await pool.close();
        res.json({
            success: true,
            message: `Đã xử lý ${result.recordset.length} nhân viên`,
            createdCount,
            updatedCount,
            errorCount,
            totalProcessed: result.recordset.length
        });
        
    } catch (error) {
        console.error('❌ Lỗi tạo nhân viên từ dữ liệu:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo nhân viên từ dữ liệu',
            error: error.message
        });
    }
});

// Cập nhật employee_code từ aliasID trong payload_json cho dữ liệu cũ
router.post('/update-employee-codes', async (req, res) => {
    try {
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT 
                person_id,
                payload_json
            FROM dulieutho 
            WHERE payload_json IS NOT NULL 
                AND person_id IS NOT NULL
                AND (employee_code IS NULL OR employee_code = '')
            ORDER BY ts_vn DESC
        `);
        
        let updatedCount = 0;
        let errorCount = 0;
        
        for (const row of result.recordset) {
            try {
                const payload = JSON.parse(row.payload_json);
                if (payload.aliasID) {
                    const updateRequest = pool.request();
                    updateRequest.input('person_id', sql.NVarChar(50), row.person_id);
                    updateRequest.input('employee_code', sql.NVarChar(50), payload.aliasID);
                    
                    await updateRequest.query(`
                        UPDATE dulieutho 
                        SET employee_code = @employee_code 
                        WHERE person_id = @person_id AND (employee_code IS NULL OR employee_code = '')
                    `);
                    updatedCount++;
                }
            } catch (error) {
                console.error('Lỗi cập nhật employee_code cho person_id:', row.person_id, error.message);
                errorCount++;
            }
        }
        
        await pool.close();
        res.json({
            success: true,
            message: `Đã cập nhật ${updatedCount} nhân viên thành công`,
            updatedCount,
            errorCount,
            totalProcessed: result.recordset.length
        });
    } catch (error) {
        console.error('❌ Lỗi cập nhật employee_code:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật employee_code',
            error: error.message
        });
    }
});

// Test webhook endpoint để kiểm tra dữ liệu từ Hanet
router.get('/webhook-test', async (req, res) => {
    try {
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT TOP 10 
                event_type,
                employee_name,
                device_id,
                device_name,
                ts_vn,
                DaXuLy
            FROM dulieutho 
            ORDER BY ts_vn DESC
        `);
        
        await pool.close();
        res.json({
            success: true,
            message: 'Dữ liệu webhook gần nhất',
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (error) {
        console.error('❌ Error testing webhook data:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy dữ liệu webhook',
            error: error.message
        });
    }
});

// Test Hanet API connection - REMOVED DUPLICATE ENDPOINT

// Lấy danh sách thiết bị từ dữ liệu webhook
router.get('/devices', async (req, res) => {
    try {
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT 
                device_id as id,
                device_name as name,
                COUNT(*) as totalEvents,
                MAX(ts_vn) as last_seen,
                MIN(ts_vn) as firstSeen,
                DATEDIFF(MINUTE, MAX(ts_vn), GETDATE()) as minutesSinceLastSeen
            FROM dulieutho 
            WHERE device_id IS NOT NULL AND device_id != '-'
            GROUP BY device_id, device_name
            ORDER BY device_name
        `);
        
        const devices = result.recordset.map(row => {
            const minutesDiff = row.minutesSinceLastSeen;
            const hoursDiff = minutesDiff / 60;
            
            // Device status processed silently
            
            return {
                id: row.id,
                name: row.name,
                totalEvents: row.totalEvents,
                last_seen: row.last_seen,
                firstSeen: row.firstSeen,
                status: minutesDiff <= 5 ? 'online' : 'offline', // Online nếu hoạt động trong 5 phút qua
                hoursSinceLastSeen: minutesDiff > 5 ? Math.round(hoursDiff * 10) / 10 : 0,
                minutesSinceLastSeen: minutesDiff
            };
        });
        
        await pool.close();
        res.json(devices);
    } catch (error) {
        console.error('Lỗi lấy danh sách thiết bị:', error.message);
        res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách thiết bị' });
    }
});


// Export Excel cho báo cáo
router.get('/export/report', async (req, res) => {
    try {
        const { type, startDate, endDate, department, personId } = req.query;
        
        if (!type) {
            return res.status(400).json({ error: 'Thiếu loại báo cáo' });
        }
        
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        let query = `
            SELECT
                nv.MaNhanVienNoiBo,
                nv.HoTen,
                nv.PhongBan,
                c.NgayChamCong,
                c.GioVao,
                c.GioRa,
                c.ThoiGianLamViec,
                c.TrangThai
            FROM ChamCongDaXuLyMoi AS c
            JOIN NhanVien AS nv ON c.MaNhanVienNoiBo = nv.MaNhanVienNoiBo
            WHERE 1=1
        `;

        const request = pool.request();

        if (startDate) {
            query += ` AND c.NgayChamCong >= @startDate`;
            request.input('startDate', sql.Date, startDate);
        }

        if (endDate) {
            query += ` AND c.NgayChamCong <= @endDate`;
            request.input('endDate', sql.Date, endDate);
        }
        
        if (department) {
            query += ` AND nv.PhongBan = @department`;
            request.input('department', sql.NVarChar(100), department);
        }

        if (personId) {
            query += ` AND nv.MaNhanVienNoiBo LIKE @personId`;
            request.input('personId', sql.NVarChar(50), `%${personId}%`);
        }
        
        query += ` ORDER BY c.NgayChamCong DESC, nv.MaNhanVienNoiBo`;
        
        const result = await request.query(query);
        const data = result.recordset;
        
        // Tạo Excel file
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Báo cáo chấm công');
        
        // Định nghĩa columns
        worksheet.columns = [
            { header: 'Mã Nhân Viên', key: 'MaNhanVienNoiBo', width: 15 },
            { header: 'Họ và Tên', key: 'HoTen', width: 25 },
            { header: 'Phòng Ban', key: 'PhongBan', width: 20 },
            { header: 'Ngày', key: 'NgayChamCong', width: 12 },
            { header: 'Giờ Vào', key: 'GioVao', width: 15 },
            { header: 'Giờ Ra', key: 'GioRa', width: 15 },
            { header: 'Thời Gian Làm Việc (giờ)', key: 'ThoiGianLamViec', width: 20 },
            { header: 'Trạng Thái', key: 'TrangThai', width: 20 }
        ];
        
        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Thêm dữ liệu
        data.forEach(row => {
            // Xử lý timezone đúng cách
            const formatDate = (date) => {
                if (!date) return '';
                const d = new Date(date);
                return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            };
            
            const formatTime = (date) => {
                if (!date) return '';
                const d = new Date(date);
                // Sử dụng UTC để tránh timezone conversion
                const hours = d.getUTCHours();
                const minutes = d.getUTCMinutes();
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            };
            
            worksheet.addRow({
                MaNhanVienNoiBo: row.MaNhanVienNoiBo || '',
                HoTen: row.HoTen || '',
                PhongBan: row.PhongBan || '',
                NgayChamCong: formatDate(row.NgayChamCong),
                GioVao: formatTime(row.GioVao),
                GioRa: formatTime(row.GioRa),
                ThoiGianLamViec: row.ThoiGianLamViec ? row.ThoiGianLamViec.toFixed(4) : '',
                TrangThai: row.TrangThai || ''
            });
        });
        
        // Auto-fit columns
        worksheet.columns.forEach(column => {
            column.width = Math.max(column.width || 10, 12);
        });
        
        // Tạo filename
        const now = new Date();
        const timestamp = now.toISOString().slice(0,19).replace(/:/g, '-');
        const filename = `BaoCaoChamCong_${type}_${timestamp}.xlsx`;
        
        // Set headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Lỗi xuất Excel:', error.message);
        res.status(500).json({ error: 'Lỗi xuất file Excel' });
    }
});

// Raw events endpoint for employee detail
router.get('/raw-events', async (req, res) => {
    try {
        const { personName, personId, employeeCode, date } = req.query;
        
        if ((!personName && !personId && !employeeCode) || !date) {
            return res.status(400).json({ error: 'Thiếu tên nhân viên/mã nhân viên hoặc ngày' });
        }
        
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        
        // Build dynamic query based on available parameters
        let whereConditions = [];
        const request = pool.request();
        
        // Add name-based search conditions
        if (personName) {
            whereConditions.push(`(
                employee_name = @personName 
                OR employee_name LIKE @personNameLike
                OR employee_name LIKE @personNameNoAccent
                OR employee_name LIKE @personNameWithAccent
            )`);
            request.input('personName', sql.NVarChar(100), personName);
            request.input('personNameLike', sql.NVarChar(100), `%${personName}%`);
            request.input('personNameNoAccent', sql.NVarChar(100), `%${personName.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a').replace(/[èéẹẻẽêềếệểễ]/g, 'e').replace(/[ìíịỉĩ]/g, 'i').replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o').replace(/[ùúụủũưừứựửữ]/g, 'u').replace(/[ỳýỵỷỹ]/g, 'y').replace(/đ/g, 'd')}%`);
            request.input('personNameWithAccent', sql.NVarChar(100), `%${personName.replace(/a/g, '[àáạảãâầấậẩẫăằắặẳẵ]').replace(/e/g, '[èéẹẻẽêềếệểễ]').replace(/i/g, '[ìíịỉĩ]').replace(/o/g, '[òóọỏõôồốộổỗơờớợởỡ]').replace(/u/g, '[ùúụủũưừứựửữ]').replace(/y/g, '[ỳýỵỷỹ]').replace(/d/g, '[đd]')}%`);
        }
        
        // Add person_id search condition
        if (personId) {
            whereConditions.push(`person_id = @personId`);
            request.input('personId', sql.NVarChar(50), personId);
        }
        
        // Add employee_code search condition
        if (employeeCode) {
            whereConditions.push(`employee_code = @employeeCode`);
            request.input('employeeCode', sql.NVarChar(50), employeeCode);
        }
        
        const query = `
            SELECT 
                event_id,
                person_id,
                employee_name,
                employee_code,
                device_id,
                device_name,
                ts_vn,
                DaXuLy
            FROM dulieutho
            WHERE (${whereConditions.join(' OR ')})
            AND CAST(ts_vn AS DATE) = @date
            ORDER BY ts_vn DESC
        `;
        
        request.input('date', sql.Date, date);

        const result = await request.query(query);
        await pool.close();
        res.json(result.recordset);
        
    } catch (error) {
        console.error('❌ Lỗi lấy raw events:', error);
        res.status(500).json({ error: 'Lỗi lấy dữ liệu thô: ' + error.message });
    }
});

// Employee Management APIs

// Get all employees
router.get('/employees', async (req, res) => {
    try {
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        
        const query = `
            SELECT 
                ID,
                MaNhanVienNoiBo,
                HoTen,
                NamSinh,
                PhongBan,
                ChucVu,
                CaLamViec,
                MaNhanVienHANET,
                NgayTao,
                NgayCapNhat
            FROM NhanVien
            ORDER BY HoTen ASC
        `;
        
        const result = await pool.request().query(query);
        await pool.close();
        res.json(result.recordset);
        
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách nhân viên:', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách nhân viên: ' + error.message });
    }
});

// Get single employee
router.get('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        
        const query = `
            SELECT 
                ID,
                MaNhanVienNoiBo,
                HoTen,
                NamSinh,
                PhongBan,
                ChucVu,
                CaLamViec,
                MaNhanVienHANET,
                NgayTao,
                NgayCapNhat
            FROM NhanVien
            WHERE MaNhanVienNoiBo = @id
        `;
        
        const request = pool.request();
        request.input('id', sql.NVarChar(50), id);
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
        }
        
        await pool.close();
        res.json(result.recordset[0]);
        
    } catch (error) {
        console.error('❌ Lỗi lấy thông tin nhân viên:', error);
        res.status(500).json({ error: 'Lỗi lấy thông tin nhân viên: ' + error.message });
    }
});

// Add new employee
router.post('/add-employee', async (req, res) => {
    try {
        const {
            hoTen,
            namSinh,
            phongBan,
            chucVu,
            caLamViec,
            maNhanVienHANET,
            maNhanVienNoiBo
        } = req.body;
        
        // Validate required fields
        if (!hoTen || !caLamViec || !maNhanVienHANET || !maNhanVienNoiBo) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }
        
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        
        // Check if employee already exists
        const checkQuery = `
            SELECT COUNT(*) as count 
            FROM NhanVien 
            WHERE MaNhanVienNoiBo = @maNhanVienNoiBo
        `;
        
        const checkRequest = pool.request();
        checkRequest.input('maNhanVienNoiBo', sql.NVarChar(50), maNhanVienNoiBo);
        const checkResult = await checkRequest.query(checkQuery);
        
        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({ error: 'Mã nhân viên nội bộ đã tồn tại' });
        }
        
        // Check if HANET ID already exists
        const checkHanetQuery = `
            SELECT COUNT(*) as count 
            FROM NhanVien 
            WHERE MaNhanVienHANET = @maNhanVienHANET
        `;
        
        const checkHanetRequest = pool.request();
        checkHanetRequest.input('maNhanVienHANET', sql.NVarChar(50), maNhanVienHANET);
        const checkHanetResult = await checkHanetRequest.query(checkHanetQuery);
        
        if (checkHanetResult.recordset[0].count > 0) {
            return res.status(400).json({ error: 'Mã nhân viên HANET đã tồn tại' });
        }
        
        // Insert new employee
        const insertQuery = `
            INSERT INTO NhanVien (
                MaNhanVienNoiBo,
                HoTen,
                NamSinh,
                PhongBan,
                ChucVu,
                CaLamViec,
                MaNhanVienHANET
            ) VALUES (
                @maNhanVienNoiBo,
                @hoTen,
                @namSinh,
                @phongBan,
                @chucVu,
                @caLamViec,
                @maNhanVienHANET
            )
        `;
        
        const insertRequest = pool.request();
        insertRequest.input('maNhanVienNoiBo', sql.NVarChar(50), maNhanVienNoiBo);
        insertRequest.input('hoTen', sql.NVarChar(200), hoTen);
        insertRequest.input('namSinh', sql.Int, namSinh || null);
        insertRequest.input('phongBan', sql.NVarChar(100), phongBan || null);
        insertRequest.input('chucVu', sql.NVarChar(100), chucVu || null);
        insertRequest.input('caLamViec', sql.NVarChar(50), caLamViec);
        insertRequest.input('maNhanVienHANET', sql.NVarChar(50), maNhanVienHANET);
        
        await insertRequest.query(insertQuery);
        
        console.log('✅ Thêm nhân viên thành công:', hoTen);
        await pool.close();
        res.json({ message: 'Thêm nhân viên thành công', employee: { hoTen, maNhanVienNoiBo } });
        
    } catch (error) {
        console.error('❌ Lỗi thêm nhân viên:', error);
        res.status(500).json({ error: 'Lỗi thêm nhân viên: ' + error.message });
    }
});

// Update employee
router.put('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            hoTen,
            namSinh,
            phongBan,
            chucVu,
            caLamViec,
            maNhanVienHANET
        } = req.body;
        
        // Validate required fields
        if (!hoTen || !caLamViec || !maNhanVienHANET) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }
        
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        
        // Check if employee exists
        const checkQuery = `
            SELECT COUNT(*) as count 
            FROM NhanVien 
            WHERE MaNhanVienNoiBo = @id
        `;
        
        const checkRequest = pool.request();
        checkRequest.input('id', sql.NVarChar(50), id);
        const checkResult = await checkRequest.query(checkQuery);
        
        if (checkResult.recordset[0].count === 0) {
            return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
        }
        
        // Update employee
        const updateQuery = `
            UPDATE NhanVien SET
                HoTen = @hoTen,
                NamSinh = @namSinh,
                PhongBan = @phongBan,
                ChucVu = @chucVu,
                CaLamViec = @caLamViec,
                MaNhanVienHANET = @maNhanVienHANET,
                NgayCapNhat = GETDATE()
            WHERE MaNhanVienNoiBo = @id
        `;
        
        const updateRequest = pool.request();
        updateRequest.input('id', sql.NVarChar(50), id);
        updateRequest.input('hoTen', sql.NVarChar(200), hoTen);
        updateRequest.input('namSinh', sql.Int, namSinh || null);
        updateRequest.input('phongBan', sql.NVarChar(100), phongBan || null);
        updateRequest.input('chucVu', sql.NVarChar(100), chucVu || null);
        updateRequest.input('caLamViec', sql.NVarChar(50), caLamViec);
        updateRequest.input('maNhanVienHANET', sql.NVarChar(50), maNhanVienHANET);
        
        await updateRequest.query(updateQuery);
        
        console.log('✅ Cập nhật nhân viên thành công:', hoTen);
        await pool.close();
        res.json({ message: 'Cập nhật nhân viên thành công', employee: { hoTen, maNhanVienNoiBo: id } });
        
    } catch (error) {
        console.error('❌ Lỗi cập nhật nhân viên:', error);
        res.status(500).json({ error: 'Lỗi cập nhật nhân viên: ' + error.message });
    }
});

// Delete employee
router.delete('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const config = {
            user: 'sa',
            password: 'Admin@123',
            server: 'localhost', // Sử dụng SQL Authentication
            database: 'hanet',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        const pool = await sql.connect(config);
        
        // Check if employee exists
        const checkQuery = `
            SELECT HoTen, MaNhanVienNoiBo, MaNhanVienHANET
            FROM NhanVien 
            WHERE MaNhanVienNoiBo = @id OR MaNhanVienHANET = @id
        `;
        
        const checkRequest = pool.request();
        checkRequest.input('id', sql.NVarChar(50), id);
        const checkResult = await checkRequest.query(checkQuery);
        
        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
        }
        
        const hoTen = checkResult.recordset[0].HoTen;
        
        // Check if employee has attendance records
        const attendanceQuery = `
            SELECT COUNT(*) as count 
            FROM ChamCongDaXuLyMoi 
            WHERE MaNhanVienNoiBo = @id OR MaNhanVienNoiBo = @maNhanVienNoiBo
        `;
        
        const attendanceRequest = pool.request();
        attendanceRequest.input('id', sql.NVarChar(50), id);
        attendanceRequest.input('maNhanVienNoiBo', sql.NVarChar(50), checkResult.recordset[0].MaNhanVienNoiBo);
        const attendanceResult = await attendanceRequest.query(attendanceQuery);
        
        if (attendanceResult.recordset[0].count > 0) {
            return res.status(400).json({ error: 'Không thể xóa nhân viên đã có dữ liệu chấm công' });
        }
        
        // Delete employee
        const deleteQuery = `
            DELETE FROM NhanVien 
            WHERE MaNhanVienNoiBo = @id OR MaNhanVienHANET = @id
        `;
        
        const deleteRequest = pool.request();
        deleteRequest.input('id', sql.NVarChar(50), id);
        await deleteRequest.query(deleteQuery);
        
        console.log('✅ Xóa nhân viên thành công:', hoTen);
        await pool.close();
        res.json({ message: 'Xóa nhân viên thành công', employee: { hoTen, maNhanVienNoiBo: id } });
        
    } catch (error) {
        console.error('❌ Lỗi xóa nhân viên:', error);
        res.status(500).json({ error: 'Lỗi xóa nhân viên: ' + error.message });
    }
});

export default router;