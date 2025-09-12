import moment from 'moment-timezone';

const TIMEZONE = 'Asia/Ho_Chi_Minh';
const DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss';

// Chuẩn hóa chuỗi ngày tháng sang định dạng chuẩn
export const normalizeDateString = (dateStr) => {
    if (!dateStr) return null;
    
    // Xử lý format có milliseconds và timezone
    let cleanDateStr = dateStr.toString().trim();
    
    // Loại bỏ milliseconds nếu có
    if (cleanDateStr.includes('.')) {
        cleanDateStr = cleanDateStr.split('.')[0];
    }
    
    // Xử lý format DD/MM/YYYY HH:mm:ss
    if (cleanDateStr.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) {
        // Chuyển từ DD/MM/YYYY sang YYYY-MM-DD
        const parts = cleanDateStr.split(' ');
        const datePart = parts[0].split('/');
        const timePart = parts[1];
        cleanDateStr = `${datePart[2]}-${datePart[1]}-${datePart[0]} ${timePart}`;
    }
    
    // Thêm timezone nếu không có
    if (!cleanDateStr.includes('+') && !cleanDateStr.includes('Z')) {
        cleanDateStr += '+07:00'; // GMT+7
    }
    
    const m = moment(cleanDateStr);
    return m.isValid() ? m.tz(TIMEZONE).format(DATE_FORMAT) : null;
};

// Chuyển đổi timestamp sang chuỗi ngày tháng VN
export const epochToVNString = (epoch) => {
    if (!epoch) return null;
    const m = moment.unix(epoch);
    return m.isValid() ? m.tz(TIMEZONE).format(DATE_FORMAT) : null;
};

// Phân tích chuỗi ngày tháng thành các phần
export const buildTimes = (vnFull) => {
    if (!vnFull) return { tsVN: '', hmsVN: '', dmyVN: '' };
    
    // Xử lý format có milliseconds và timezone
    let cleanDateStr = vnFull.toString().trim();
    
    // Loại bỏ milliseconds nếu có
    if (cleanDateStr.includes('.')) {
        cleanDateStr = cleanDateStr.split('.')[0];
    }
    
    // Xử lý format DD/MM/YYYY HH:mm:ss
    if (cleanDateStr.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) {
        // Chuyển từ DD/MM/YYYY sang YYYY-MM-DD
        const parts = cleanDateStr.split(' ');
        const datePart = parts[0].split('/');
        const timePart = parts[1];
        cleanDateStr = `${datePart[2]}-${datePart[1]}-${datePart[0]} ${timePart}`;
    }
    
    // Thêm timezone nếu không có
    if (!cleanDateStr.includes('+') && !cleanDateStr.includes('Z')) {
        cleanDateStr += '+07:00'; // GMT+7
    }
    
    const m = moment(cleanDateStr);
    
    if (!m.isValid()) {
        return { tsVN: '', hmsVN: '', dmyVN: '' };
    }
    
    return {
        tsVN: m.tz(TIMEZONE).format(DATE_FORMAT),
        hmsVN: m.tz(TIMEZONE).format('HH:mm:ss'),
        dmyVN: m.tz(TIMEZONE).format('DD/MM/YYYY')
    };
};

// Xác định loại sự kiện dựa trên tên thiết bị
export const resolveEventType = (deviceName) => {
    if (!deviceName) return 'không xác định';
    
    const device = deviceName.toLowerCase();
    const eventTypes = {
        vào: ['_vào', '_in'],
        ra: ['_ra', '_out']
    };
    
    for (const [type, suffixes] of Object.entries(eventTypes)) {
        if (suffixes.some(suffix => device.endsWith(suffix))) {
            return type;
        }
    }
    
    return 'không xác định';
};
