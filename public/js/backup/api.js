// API functions với error handling tốt hơn
async function fetchDepartments() {
    try {
        const response = await fetch('/departments');
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Lỗi khi lấy danh sách phòng ban:', error);
        throw new Error('Không thể lấy danh sách phòng ban');
    }
}

async function fetchAttendance(params) {
    try {
        const response = await fetch(`/attendance-data?${params.toString()}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu chấm công:', error);
        throw error;
    }
}

// Lấy danh sách thiết bị
async function fetchDevices() {
    try {
        const response = await fetch('/devices');
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Lỗi khi lấy danh sách thiết bị:', error);
        throw new Error('Không thể lấy danh sách thiết bị');
    }
}

// Export functions to global scope
window.fetchDevices = fetchDevices;
