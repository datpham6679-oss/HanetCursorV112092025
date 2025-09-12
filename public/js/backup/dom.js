// Utility functions để format date/time
const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---';
const formatTime = (date) => date ? new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '---';
const formatWorkingHours = (hours) => hours ? hours.toFixed(4) : '---';

// Function chung để tạo row HTML
const createAttendanceRow = (item) => `
    <td>${item.MaNhanVienNoiBo}</td>
    <td>${item.HoTen}</td>
    <td>${new Date(item.Ngay).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
    <td>${formatDate(item.GioVao)}</td>
    <td>${formatDate(item.GioRa)}</td>
    <td>${formatTime(item.GioVao)}</td>
    <td>${formatTime(item.GioRa)}</td>
    <td>${formatWorkingHours(item.ThoiGianLamViec)}</td>
    <td>${item.TrangThai}</td>
`;

// Function chung để hiển thị dữ liệu trong table
const displayTableDataGeneric = (data, tbodyId, emptyMessage = 'Không có dữ liệu chấm công nào.') => {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    tbody.innerHTML = data?.length ? data.map(item => `<tr>${createAttendanceRow(item)}</tr>`).join('') : `<tr><td colspan="9">${emptyMessage}</td></tr>`;
};

// Functions cụ thể cho từng table
function fillDepartmentsSelect(departments) {
    const select = document.getElementById('department');
    if (!select) return;
    select.innerHTML = '<option value="">-- Tất cả --</option>' + departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
}

function displayTableData(data) {
    displayTableDataGeneric(data, 'attendance-data');
}

function displayActivityAttendance(data) {
    displayTableDataGeneric(data, 'activity-attendance-data', 'Không có dữ liệu.');
}

function displayFaceIdDepartments(departments) {
    const ul = document.getElementById('faceid-dept-list');
    if (!ul) return;
    ul.innerHTML = departments?.length ? departments.map(d => `<li>${d}</li>`).join('') : '<li>Không có phòng ban.</li>';
}

function displayMonthlySummary(rows) {
    const tbody = document.getElementById('activity-monthly-data');
    if (!tbody) return;
    tbody.innerHTML = rows?.length ? rows.map(r => `<tr><td>${r.MaNhanVienNoiBo}</td><td>${r.HoTen}</td><td>${r.Thang}</td><td>${r.Cong}</td></tr>`).join('') : '<tr><td colspan="4">Không có dữ liệu.</td></tr>';
}

// Export functions to global scope
window.fillDepartmentsSelect = fillDepartmentsSelect;
window.displayTableData = displayTableData;
window.displayFaceIdDepartments = displayFaceIdDepartments;
window.displayActivityAttendance = displayActivityAttendance;
window.displayMonthlySummary = displayMonthlySummary;

// Hiển thị danh sách thiết bị
function displayDevicesList(devices) {
    const container = document.getElementById('devices-container');
    if (!container) return;
    
    if (!devices || devices.length === 0) {
        container.innerHTML = '<div class="no-devices">Không có thiết bị nào được phát hiện.</div>';
        updateDeviceStats(0, 0, 0);
        return;
    }
    
    // Lưu dữ liệu gốc để filter
    window.allDevices = devices;
    
    // Cập nhật thống kê
    const onlineCount = devices.filter(d => d.status === 'online').length;
    const offlineCount = devices.filter(d => d.status === 'offline').length;
    const totalCount = devices.length;
    updateDeviceStats(onlineCount, offlineCount, totalCount);
    
    // Hiển thị thiết bị
    renderDevices(devices);
}

// Render thiết bị với filter
function renderDevices(devices) {
    const container = document.getElementById('devices-container');
    if (!container) return;
    
    const devicesHTML = devices.map(device => `
        <div class="device-card ${device.status}">
            <div class="device-header">
                <div class="device-name">${device.name}</div>
                <div class="device-status">
                    <span class="status-indicator ${device.status}"></span>
                    <span class="status-text">${device.status === 'online' ? 'Online' : 'Offline'}</span>
                </div>
            </div>
            <div class="device-info">
                <div class="info-item">
                    <span class="label">Mã thiết bị:</span>
                    <span class="value">${device.id}</span>
                </div>
                <div class="info-item">
                    <span class="label">Tổng sự kiện:</span>
                    <span class="value">${device.totalEvents}</span>
                </div>
                <div class="info-item">
                    <span class="label">Lần cuối hoạt động:</span>
                    <span class="value">${device.lastSeen ? new Date(device.lastSeen).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Chưa có'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Thời gian offline:</span>
                    <span class="value">${device.status === 'offline' ? `${device.hoursSinceLastSeen} giờ` : 'Đang online'}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = devicesHTML;
}

// Filter thiết bị theo trạng thái
function filterDevices() {
    const statusFilter = document.getElementById('status-filter');
    if (!statusFilter || !window.allDevices) return;
    
    const selectedStatus = statusFilter.value;
    let filteredDevices = window.allDevices;
    
    if (selectedStatus !== 'all') {
        filteredDevices = window.allDevices.filter(device => device.status === selectedStatus);
    }
    
    // Cập nhật thống kê cho filtered data
    const onlineCount = filteredDevices.filter(d => d.status === 'online').length;
    const offlineCount = filteredDevices.filter(d => d.status === 'offline').length;
    const totalCount = filteredDevices.length;
    updateDeviceStats(onlineCount, offlineCount, totalCount);
    
    // Render thiết bị đã filter
    renderDevices(filteredDevices);
    
    // Hiển thị thông báo filter
    const filterInfo = document.getElementById('filter-info');
    if (filterInfo) {
        filterInfo.textContent = `Hiển thị ${totalCount} thiết bị${selectedStatus !== 'all' ? ` (${selectedStatus})` : ''}`;
    }
}

// Cập nhật thống kê thiết bị
function updateDeviceStats(online, offline, total) {
    const onlineElement = document.getElementById('online-count');
    const offlineElement = document.getElementById('offline-count');
    const totalElement = document.getElementById('total-count');
    
    if (onlineElement) onlineElement.textContent = online;
    if (offlineElement) offlineElement.textContent = offline;
    if (totalElement) totalElement.textContent = total;
}

// Export device function to global scope
window.displayDevicesList = displayDevicesList;
window.filterDevices = filterDevices;
window.renderDevices = renderDevices;
