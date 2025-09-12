import express from 'express';
import qs from 'querystring';
import ExcelJS from 'exceljs';
import moment from 'moment-timezone';
import { sql, poolPromise } from '../db.js';
import * as helpers from '../helpers.js';

const router = express.Router();

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
    console.log(`📌 [${type}] ${hmsVN} (VN)`);
    console.log(`👤 Nhân viên : ${empName}`);
    console.log(`🏢 Thiết bị : ${deviceName} (ID=${deviceId})`);
    console.log(`Thời gian: ${hmsVN} ${dmyVN}`);
};

router.post('/hanet-webhook', async (req, res) => {
    try {
        const p = parsePayload(req);

        const vnFull = helpers.normalizeDateString(p.date) || helpers.epochToVNString(p.time);
        const { tsVN, hmsVN, dmyVN } = helpers.buildTimes(vnFull);

        const type = helpers.resolveEventType(p.deviceName);
        const empName = p.personName || '-';
        const deviceName = p.deviceName || '-';
        const deviceId = p.deviceID || '-';
        const eventId = p.id || `${Date.now()}-${Math.random()}`;

        const pool = await poolPromise;
        const request = pool.request();

        // Thêm parameters với xử lý datetime
        request.input('event_id', sql.NVarChar(100), eventId);
        request.input('employee_code', sql.NVarChar(50), p.employee_code || null);
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

        // Thực hiện MERGE và stored procedures
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

        await request.query(`EXEC sp_XuLyChamCongMoi_Auto`);
        
        logAttendanceEvent(type, hmsVN, empName, deviceName, deviceId, dmyVN);
        return res.status(200).json({ ok: true });
        
    } catch (error) {
        console.error('❌ Lỗi xử lý webhook:', error.message);
        return res.status(400).json({ error: error.message });
    }
});

router.get('/departments', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(
            'SELECT DISTINCT PhongBan FROM NhanVien WHERE PhongBan IS NOT NULL AND PhongBan != \'\' ORDER BY PhongBan;'
        );
        const departments = result.recordset.map(row => row.PhongBan);
        res.json(departments);
    } catch (error) {
        console.error('Lỗi lấy danh sách phòng ban:', error.message);
        res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách phòng ban' });
    }
});

router.get('/report/excel', async (req, res) => {
    try {
        const pool = await poolPromise;
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
        const pool = await poolPromise;
        const { startDate, endDate, personId, status, department } = req.query;

        let query = `
            SELECT
                nv.MaNhanVienNoiBo,
                nv.HoTen,
                c.NgayChamCong,
                c.GioVao,
                c.GioRa,
                c.ThoiGianLamViec,
                c.TrangThai
            FROM ChamCongDaXuLyMoi AS c
            JOIN NhanVien AS nv ON c.MaNhanVienNoiBo = nv.MaNhanVienNoiBo
        `;

        const whereClauses = [];
        const request = pool.request();

        // Thêm điều kiện WHERE
        if (startDate) {
            whereClauses.push(`c.NgayChamCong >= @startDate`);
            request.input('startDate', sql.Date, startDate);
        }
        if (endDate) {
            whereClauses.push(`c.NgayChamCong <= @endDate`);
            request.input('endDate', sql.Date, endDate);
        }
        if (personId) {
            // Try to find by name instead of ID
            whereClauses.push(`(
                nv.HoTen = @personId 
                OR nv.HoTen LIKE @personIdLike
                OR c.TenNhanVien = @personId
                OR c.TenNhanVien LIKE @personIdLike
            )`);
            request.input('personId', sql.NVarChar(100), personId);
            request.input('personIdLike', sql.NVarChar(100), `%${personId}%`);
        }
        if (status) {
            whereClauses.push(`LTRIM(RTRIM(c.TrangThai)) = @status`);
            request.input('status', sql.NVarChar(50), status.trim());
        }
        if (department) {
            whereClauses.push(`nv.PhongBan = @department`);
            request.input('department', sql.NVarChar(100), department);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }
        query += ' ORDER BY c.NgayChamCong DESC;';

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy dữ liệu chấm công:', error.message);
        res.status(500).json({ error: 'Lỗi máy chủ khi lấy dữ liệu' });
    }
});

// Lấy danh sách thiết bị từ dữ liệu webhook
router.get('/devices', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT DISTINCT 
                device_id,
                device_name,
                COUNT(*) as total_events,
                MAX(ts_vn) as last_seen,
                MIN(ts_vn) as first_seen
            FROM dulieutho 
            WHERE device_id IS NOT NULL AND device_id != '-'
            GROUP BY device_id, device_name
            ORDER BY device_name
        `);
        
        const devices = result.recordset.map(row => {
            const lastSeen = new Date(row.last_seen);
            const now = new Date();
            const timeDiff = now - lastSeen;
            const hoursDiff = timeDiff / (1000 * 60 * 60); // Chuyển đổi sang giờ
            
            return {
                id: row.device_id,
                name: row.device_name,
                totalEvents: row.total_events,
                lastSeen: row.last_seen,
                firstSeen: row.first_seen,
                status: hoursDiff <= 24 ? 'online' : 'offline', // Online nếu hoạt động trong 24h qua
                hoursSinceLastSeen: Math.round(hoursDiff * 10) / 10
            };
        });
        
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
        
        const pool = await poolPromise;
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
        const { personName, date } = req.query;
        
        if (!personName || !date) {
            return res.status(400).json({ error: 'Thiếu tên nhân viên hoặc ngày' });
        }
        
        const pool = await poolPromise;
        
        // Try to find employee by name with multiple variations
        const query = `
            SELECT 
                event_id,
                person_id,
                employee_name,
                device_id,
                device_name,
                ts_vn,
                DaXuLy
            FROM dulieutho
            WHERE (
                employee_name = @personName 
                OR employee_name LIKE @personNameLike
                OR employee_name LIKE @personNameNoAccent
                OR employee_name LIKE @personNameWithAccent
            )
            AND CAST(ts_vn AS DATE) = @date
            ORDER BY ts_vn DESC
        `;
        
        const request = pool.request();
        request.input('personName', sql.NVarChar(100), personName);
        request.input('personNameLike', sql.NVarChar(100), `%${personName}%`);
        request.input('personNameNoAccent', sql.NVarChar(100), `%${personName.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a').replace(/[èéẹẻẽêềếệểễ]/g, 'e').replace(/[ìíịỉĩ]/g, 'i').replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o').replace(/[ùúụủũưừứựửữ]/g, 'u').replace(/[ỳýỵỷỹ]/g, 'y').replace(/đ/g, 'd')}%`);
        request.input('personNameWithAccent', sql.NVarChar(100), `%${personName.replace(/a/g, '[àáạảãâầấậẩẫăằắặẳẵ]').replace(/e/g, '[èéẹẻẽêềếệểễ]').replace(/i/g, '[ìíịỉĩ]').replace(/o/g, '[òóọỏõôồốộổỗơờớợởỡ]').replace(/u/g, '[ùúụủũưừứựửữ]').replace(/y/g, '[ỳýỵỷỹ]').replace(/d/g, '[đd]')}%`);
        request.input('date', sql.Date, date);
        
        const result = await request.query(query);
        console.log(`📊 Raw events query for ${personName} on ${date}:`, result.recordset.length, 'records');
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
        const pool = await poolPromise;
        const query = `
            SELECT 
                MaNhanVienNoiBo,
                HoTen,
                GioiTinh,
                NgaySinh,
                SoDienThoai,
                PhongBan,
                ChucVu,
                CaLamViec,
                MaNhanVienHANET
            FROM NhanVien
            ORDER BY HoTen ASC
        `;
        
        const result = await pool.request().query(query);
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
        const pool = await poolPromise;
        
        const query = `
            SELECT 
                MaNhanVienNoiBo,
                HoTen,
                GioiTinh,
                NgaySinh,
                SoDienThoai,
                PhongBan,
                ChucVu,
                CaLamViec,
                MaNhanVienHANET
            FROM NhanVien
            WHERE MaNhanVienNoiBo = @id
        `;
        
        const request = pool.request();
        request.input('id', sql.NVarChar(50), id);
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
        }
        
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
            gioiTinh,
            ngaySinh,
            soDienThoai,
            phongBan,
            chucVu,
            caLamViec,
            maNhanVienHANET,
            maNhanVienNoiBo
        } = req.body;
        
        // Validate required fields
        if (!hoTen || !gioiTinh || !caLamViec || !maNhanVienHANET || !maNhanVienNoiBo) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }
        
        const pool = await poolPromise;
        
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
                GioiTinh,
                NgaySinh,
                SoDienThoai,
                PhongBan,
                ChucVu,
                CaLamViec,
                MaNhanVienHANET
            ) VALUES (
                @maNhanVienNoiBo,
                @hoTen,
                @gioiTinh,
                @ngaySinh,
                @soDienThoai,
                @phongBan,
                @chucVu,
                @caLamViec,
                @maNhanVienHANET
            )
        `;
        
        const insertRequest = pool.request();
        insertRequest.input('maNhanVienNoiBo', sql.NVarChar(50), maNhanVienNoiBo);
        insertRequest.input('hoTen', sql.NVarChar(200), hoTen);
        insertRequest.input('gioiTinh', sql.NVarChar(10), gioiTinh);
        insertRequest.input('ngaySinh', sql.Date, ngaySinh || null);
        insertRequest.input('soDienThoai', sql.NVarChar(20), soDienThoai || null);
        insertRequest.input('phongBan', sql.NVarChar(100), phongBan || null);
        insertRequest.input('chucVu', sql.NVarChar(100), chucVu || null);
        insertRequest.input('caLamViec', sql.NVarChar(10), caLamViec);
        insertRequest.input('maNhanVienHANET', sql.NVarChar(50), maNhanVienHANET);
        
        await insertRequest.query(insertQuery);
        
        console.log('✅ Thêm nhân viên thành công:', hoTen);
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
            gioiTinh,
            ngaySinh,
            soDienThoai,
            phongBan,
            chucVu,
            caLamViec,
            maNhanVienHANET
        } = req.body;
        
        // Validate required fields
        if (!hoTen || !gioiTinh || !caLamViec || !maNhanVienHANET) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }
        
        const pool = await poolPromise;
        
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
                GioiTinh = @gioiTinh,
                NgaySinh = @ngaySinh,
                SoDienThoai = @soDienThoai,
                PhongBan = @phongBan,
                ChucVu = @chucVu,
                CaLamViec = @caLamViec,
                MaNhanVienHANET = @maNhanVienHANET
            WHERE MaNhanVienNoiBo = @id
        `;
        
        const updateRequest = pool.request();
        updateRequest.input('id', sql.NVarChar(50), id);
        updateRequest.input('hoTen', sql.NVarChar(200), hoTen);
        updateRequest.input('gioiTinh', sql.NVarChar(10), gioiTinh);
        updateRequest.input('ngaySinh', sql.Date, ngaySinh || null);
        updateRequest.input('soDienThoai', sql.NVarChar(20), soDienThoai || null);
        updateRequest.input('phongBan', sql.NVarChar(100), phongBan || null);
        updateRequest.input('chucVu', sql.NVarChar(100), chucVu || null);
        updateRequest.input('caLamViec', sql.NVarChar(10), caLamViec);
        updateRequest.input('maNhanVienHANET', sql.NVarChar(50), maNhanVienHANET);
        
        await updateRequest.query(updateQuery);
        
        console.log('✅ Cập nhật nhân viên thành công:', hoTen);
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
        const pool = await poolPromise;
        
        // Check if employee exists
        const checkQuery = `
            SELECT HoTen 
            FROM NhanVien 
            WHERE MaNhanVienNoiBo = @id
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
            WHERE MaNhanVienNoiBo = @id
        `;
        
        const attendanceRequest = pool.request();
        attendanceRequest.input('id', sql.NVarChar(50), id);
        const attendanceResult = await attendanceRequest.query(attendanceQuery);
        
        if (attendanceResult.recordset[0].count > 0) {
            return res.status(400).json({ error: 'Không thể xóa nhân viên đã có dữ liệu chấm công' });
        }
        
        // Delete employee
        const deleteQuery = `
            DELETE FROM NhanVien 
            WHERE MaNhanVienNoiBo = @id
        `;
        
        const deleteRequest = pool.request();
        deleteRequest.input('id', sql.NVarChar(50), id);
        await deleteRequest.query(deleteQuery);
        
        console.log('✅ Xóa nhân viên thành công:', hoTen);
        res.json({ message: 'Xóa nhân viên thành công', employee: { hoTen, maNhanVienNoiBo: id } });
        
    } catch (error) {
        console.error('❌ Lỗi xóa nhân viên:', error);
        res.status(500).json({ error: 'Lỗi xóa nhân viên: ' + error.message });
    }
});

export default router;