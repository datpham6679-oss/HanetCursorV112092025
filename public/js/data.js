/**
 * Data Module
 * Xử lý các API calls và data fetching
 */

/**
 * Fetch attendance data from API
 * @param {URLSearchParams} params - Query parameters
 * @returns {Promise<Array>} - Attendance data
 */
async function fetchAttendance(params) {
    try {
        const response = await fetch(`/attendance-data?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi lấy dữ liệu chấm công:', error.message);
        throw error;
    }
}

/**
 * Fetch departments from API
 * @returns {Promise<Array>} - Departments list
 */
async function fetchDepartments() {
    try {
        const response = await fetch('/departments');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi lấy danh sách phòng ban:', error.message);
        throw error;
    }
}

/**
 * Fetch devices from API
 * @returns {Promise<Array>} - Devices list
 */
async function fetchDevices() {
    try {
        const response = await fetch('/devices');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi lấy danh sách thiết bị:', error.message);
        throw error;
    }
}

/**
 * Download Excel report
 * @param {Object} params - Report parameters
 */
async function downloadExcelReport(params) {
    try {
        window.utils.showNotification('Đang tạo file Excel...', 'info');
        
        const queryParams = window.utils.buildQueryParams(params);
        const response = await fetch(`/export/report?${queryParams.toString()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get filename from response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'bao_cao_cham_cong.xlsx';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        window.utils.showNotification('File Excel đã được tải xuống', 'success');
    } catch (error) {
        console.error('Lỗi tải file Excel:', error.message);
        window.utils.showNotification('Lỗi khi tải file Excel', 'error');
    }
}

/**
 * Add new employee
 * @param {Object} employeeData - Employee data
 * @returns {Promise<Object>} - Response data
 */
async function addEmployee(employeeData) {
    try {
        const response = await fetch('/add-employee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi thêm nhân viên:', error.message);
        throw error;
    }
}

/**
 * Initialize tabs functionality
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            const targetPanel = document.getElementById(targetTab);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            
            // Load data for the active tab
            loadTabData(targetTab);
        });
    });
}

/**
 * Load data for specific tab
 * @param {string} tabName - Tab name
 */
async function loadTabData(tabName) {
    try {
        switch (tabName) {
            case 'dashboard':
                await window.dashboard.refreshDashboardData();
                break;
            case 'reports':
                window.reports.initReportsTab();
                break;
            case 'devices':
                await loadDevicesData();
                break;
            case 'activity':
                await loadActivityData();
                break;
        }
    } catch (error) {
        console.error(`Lỗi load data cho tab ${tabName}:`, error);
        window.utils.showNotification(`Lỗi khi tải dữ liệu ${tabName}`, 'error');
    }
}

/**
 * Load devices data
 */
async function loadDevicesData() {
    try {
        window.utils.showLoading('devices-content', true);
        
        const devices = await fetchDevices();
        const container = document.getElementById('devices-content');
        
        if (devices && devices.length > 0) {
            container.innerHTML = `
                <div class="devices-grid">
                    ${devices.map(device => `
                        <div class="device-card">
                            <div class="device-header">
                                <h5>${device.device_name}</h5>
                                <span class="device-status ${device.isOnline ? 'online' : 'offline'}">
                                    ${device.isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                            <div class="device-info">
                                <p><strong>ID:</strong> ${device.device_id}</p>
                                <p><strong>Sự kiện:</strong> ${device.total_events}</p>
                                <p><strong>Lần cuối:</strong> ${device.last_seen}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<p class="text-center text-muted">Không có thiết bị nào</p>';
        }
    } catch (error) {
        console.error('Lỗi load devices:', error);
        document.getElementById('devices-content').innerHTML = 
            '<p class="text-center text-danger">Lỗi khi tải danh sách thiết bị</p>';
    } finally {
        window.utils.showLoading('devices-content', false);
    }
}

/**
 * Load activity data
 */
async function loadActivityData() {
    try {
        window.utils.showLoading('activity-content', true);
        
        const params = new URLSearchParams();
        const data = await fetchAttendance(params);
        
        const container = document.getElementById('activity-content');
        if (data && data.length > 0) {
            // Show recent activities (last 50 records)
            const recentData = data.slice(0, 50);
            
            container.innerHTML = `
                <div class="activity-list">
                    ${recentData.map(record => `
                        <div class="activity-item">
                            <div class="activity-info">
                                <strong>${record.TenNhanVien}</strong>
                                <span class="badge bg-${getStatusColor(record.TrangThai)}">${record.TrangThai}</span>
                            </div>
                            <div class="activity-details">
                                <small>${record.NgayChamCong} - ${record.GioVao} - ${record.GioRa}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<p class="text-center text-muted">Không có hoạt động nào</p>';
        }
    } catch (error) {
        console.error('Lỗi load activity:', error);
        document.getElementById('activity-content').innerHTML = 
            '<p class="text-center text-danger">Lỗi khi tải dữ liệu hoạt động</p>';
    } finally {
        window.utils.showLoading('activity-content', false);
    }
}

/**
 * Get status color class
 * @param {string} status - Status string
 * @returns {string} - CSS color class
 */
function getStatusColor(status) {
    switch (status) {
        case 'Đúng giờ': return 'success';
        case 'Đi trễ': return 'warning';
        case 'Về sớm': return 'info';
        default: return 'secondary';
    }
}

// Export functions
window.data = {
    fetchAttendance,
    fetchDepartments,
    fetchDevices,
    downloadExcelReport,
    addEmployee,
    initTabs,
    loadTabData,
    loadDevicesData,
    loadActivityData,
    getStatusColor
};
