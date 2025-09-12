let currentData = [];

// Utility functions
const getDateKey = (date) => {
    const d = new Date(date);
    if (isNaN(d)) return null;
    
    // Format as DD/MM/YYYY
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};
const setTextContent = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value.toLocaleString('vi-VN');
};

// Helper function to convert date to YYYY-MM-DD format for API
const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d)) return null;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const buildQueryParams = (filters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            // Convert DD/MM/YYYY to YYYY-MM-DD for API calls
            if (key.includes('Date') && value.includes('/')) {
                const [day, month, year] = value.split('/');
                params.append(key, `${year}-${month}-${day}`);
            } else {
                params.append(key, value);
            }
        }
    });
    return params;
};

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const params = new URLSearchParams();
        const data = await fetchAttendance(params);
        currentData = data;
        updateDashboardKpis(data);
        renderDashboardBars(data);
        renderDashboardFriendly(data);
    } catch (error) {
        console.error('Lỗi nạp dữ liệu Dashboard:', error);
    }
    initTabs();
});

// Refresh Dashboard Data
window.refreshDashboardData = async () => {
    const refreshBtn = document.querySelector('#tab-dashboard .btn-refresh');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '🔄 Đang làm mới...';
        refreshBtn.style.opacity = '0.7';
    }
    
    try {
        const params = new URLSearchParams();
        const data = await fetchAttendance(params);
        currentData = data;
        updateDashboardKpis(data);
        renderDashboardBars(data);
        renderDashboardFriendly(data);
        
        // Hiển thị thông báo thành công
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = '✅ Đã cập nhật dữ liệu Dashboard!';
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Lỗi làm mới Dashboard:', error);
        alert('Lỗi làm mới dữ liệu Dashboard: ' + error.message);
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Làm mới';
            refreshBtn.style.opacity = '1';
        }
    }
};

// Main data fetching function
async function fetchAndDisplayData() {
    const filters = {
        startDate: document.getElementById('startDate')?.value || '',
        endDate: document.getElementById('endDate')?.value || '',
        personId: document.getElementById('personId')?.value || '',
        department: document.getElementById('department')?.value || '',
        status: document.getElementById('status')?.value || ''
    };

    try {
        const data = await fetchAttendance(buildQueryParams(filters));
        currentData = data;
        updateDashboardKpis(data);
        renderDashboardBars(data);
        renderDashboardFriendly(data);
        if (typeof displayTableData === 'function') displayTableData(data);
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
    }
}

// Tab-specific functions
window.loadFaceIdDepartments = async () => {
    try {
        displayFaceIdDepartments(await fetchDepartments());
    } catch (error) {
        console.error('Lỗi tải phòng ban:', error);
        alert('Lỗi tải phòng ban');
    }
};

// ===== REPORTS FUNCTIONS =====

// Initialize reports tab
window.initReportsTab = async () => {
    try {
        // Load departments for all selects
        const departments = await fetchDepartments();
        const departmentSelects = [
            'summary-department',
            'dept-select', 
            'month-department'
        ];
        
        departmentSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">-- Tất cả --</option>' + 
                    departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
                select.value = currentValue;
            }
        });
        
        console.log('✅ Đã khởi tạo tab Báo cáo thành công');
    } catch (error) {
        console.error('Lỗi khởi tạo tab Báo cáo:', error);
    }
};

// Refresh reports data
window.refreshReportsData = async () => {
    const refreshBtn = document.querySelector('#tab-reports .btn-refresh');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '🔄 Đang làm mới...';
        refreshBtn.style.opacity = '0.7';
    }
    
    try {
        await initReportsTab();
        
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = '✅ Đã làm mới dữ liệu báo cáo thành công!';
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Lỗi làm mới dữ liệu báo cáo:', error);
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = '❌ Lỗi làm mới dữ liệu báo cáo!';
        errorMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
            errorMsg.remove();
        }, 3000);
        
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Làm mới';
            refreshBtn.style.opacity = '1';
        }
    }
};

// Generate Summary Report
window.generateSummaryReport = async () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displaySummaryReport(data, startDate, endDate, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo tổng hợp:', error);
        alert('Lỗi tạo báo cáo tổng hợp');
    }
};

// Display Summary Report
function displaySummaryReport(data, startDate, endDate, department) {
    const container = document.getElementById('summary-results');
    if (!container) return;
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const departments = new Set(data.map(x => x.PhongBan).filter(Boolean)).size;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${departments}</div>
                <div class="stat-label">Phòng ban</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo phòng ban</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Phòng ban</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateDepartmentStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Stats
function generateDepartmentStats(data) {
    const deptStats = {};
    
    data.forEach(record => {
        const dept = (record.PhongBan || 'Khác').trim();
        if (!deptStats[dept]) {
            deptStats[dept] = { total: 0, onTime: 0, late: 0 };
        }
        
        deptStats[dept].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') deptStats[dept].onTime++;
        else if (status === 'Đi trễ') deptStats[dept].late++;
        else if (status === 'Về sớm') deptStats[dept].early++;
    });
    
    return Object.entries(deptStats)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([dept, stats]) => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${dept}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Name Report
window.generateNameReport = async () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', nameSearch);
        
        const data = await fetchAttendance(params);
        displayNameReport(data, nameSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tên:', error);
        alert('Lỗi tạo báo cáo theo tên');
    }
};

// Display Name Report
function displayNameReport(data, nameSearch) {
    const container = document.getElementById('name-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho tên: ' + nameSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate ID Report
window.generateIdReport = async () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', idSearch);
        
        const data = await fetchAttendance(params);
        displayIdReport(data, idSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo mã NV:', error);
        alert('Lỗi tạo báo cáo theo mã NV');
    }
};

// Display ID Report
function displayIdReport(data, idSearch) {
    const container = document.getElementById('id-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho mã NV: ' + idSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Report
window.generateDepartmentReport = async () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayDepartmentReport(data, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo phòng ban:', error);
        alert('Lỗi tạo báo cáo theo phòng ban');
    }
};

// Display Department Report
function displayDepartmentReport(data, department) {
    const container = document.getElementById('dept-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho phòng ban: ' + department + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateEmployeeStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Employee Stats
function generateEmployeeStats(data) {
    const empStats = {};
    
    data.forEach(record => {
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, total: 0, onTime: 0, late: 0 };
        }
        
        empStats[key].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') empStats[key].onTime++;
        else if (status === 'Đi trễ') empStats[key].late++;
        else if (status === 'Về sớm') empStats[key].early++;
    });
    
    return Object.values(empStats)
        .sort((a, b) => b.total - a.total)
        .map(stats => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Month Report
window.generateMonthReport = async () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng');
        return;
    }
    
    try {
        const [year, month] = monthStr.split('-').map(Number);
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 0));
        
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(start));
        params.append('endDate', formatDateForAPI(end));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayMonthReport(data, year, month, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tháng:', error);
        alert('Lỗi tạo báo cáo theo tháng');
    }
};

// Display Month Report
function displayMonthReport(data, year, month, department) {
    const container = document.getElementById('month-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho tháng ' + month + '/' + year + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Tổng hợp theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Số ngày công</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateMonthlyEmployeeStats(data, year, month)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Monthly Employee Stats
function generateMonthlyEmployeeStats(data, year, month) {
    const empStats = {};
    
    data.forEach(record => {
        if ((record.TrangThai || '').trim() !== 'Đúng giờ') return;
        
        const date = new Date(record.GioVao || record.NgayChamCong);
        if (isNaN(date) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month) return;
        
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, workingDays: 0, totalRecords: 0, onTime: 0 };
        }
        
        empStats[key].totalRecords++;
        empStats[key].onTime++;
        
        // Count unique working days
        const day = String(date.getUTCDate()).padStart(2, '0');
        if (!empStats[key].workingDays) empStats[key].workingDays = new Set();
        empStats[key].workingDays.add(day);
    });
    
    return Object.values(empStats)
        .map(stats => {
            const workingDays = stats.workingDays ? stats.workingDays.size : 0;
            const onTimeRate = stats.totalRecords > 0 ? ((stats.onTime / stats.totalRecords) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${workingDays}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        })
        .sort((a, b) => {
            const aDays = parseInt(a.match(/<td>(\d+)<\/td>/)[1]);
            const bDays = parseInt(b.match(/<td>(\d+)<\/td>/)[1]);
            return bDays - aDays;
        })
        .join('');
}

// Export functions (placeholder - will be implemented with Excel export)
// Export functions - Real implementation
window.exportSummaryReport = () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'summary');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportNameReport = () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'name');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', nameSearch);
    
    downloadExcelReport(params);
};

window.exportIdReport = () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'id');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', idSearch);
    
    downloadExcelReport(params);
};

window.exportDepartmentReport = () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'department');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportMonthReport = () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng trước khi xuất Excel');
        return;
    }
    
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    
    const params = new URLSearchParams();
    params.append('type', 'month');
    params.append('startDate', formatDateForAPI(start));
    params.append('endDate', formatDateForAPI(end));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

// Helper function để download Excel
function downloadExcelReport(params) {
    try {
        const url = `/export/report?${params.toString()}`;
        
        // Sử dụng fetch để download file
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                // Tạo URL từ blob
                const blobUrl = window.URL.createObjectURL(blob);
                
                // Tạo link download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'BaoCaoChamCong.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cleanup blob URL
                window.URL.revokeObjectURL(blobUrl);
                
                // Hiển thị thông báo thành công
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = '✅ Đã tải file Excel thành công!';
                successMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                `;
                document.body.appendChild(successMsg);
                
                setTimeout(() => {
                    successMsg.remove();
                }, 3000);
            })
            .catch(error => {
                console.error('Lỗi xuất Excel:', error);
                alert('Lỗi xuất file Excel: ' + error.message);
            });
        
    } catch (error) {
        console.error('Lỗi xuất Excel:', error);
        alert('Lỗi xuất file Excel: ' + error.message);
    }
}

window.loadActivityAttendance = async () => {
    const filters = {
        startDate: document.getElementById('act-start')?.value || '',
        endDate: document.getElementById('act-end')?.value || '',
        personId: document.getElementById('act-person')?.value || '',
        status: document.getElementById('act-status')?.value || ''
    };
    try {
        displayActivityAttendance(await fetchAttendance(buildQueryParams(filters)));
    } catch (error) {
        console.error('Lỗi tải chấm công:', error);
        alert('Lỗi tải chấm công');
    }
};

// ===== REPORTS FUNCTIONS =====

// Initialize reports tab
window.initReportsTab = async () => {
    try {
        // Load departments for all selects
        const departments = await fetchDepartments();
        const departmentSelects = [
            'summary-department',
            'dept-select', 
            'month-department'
        ];
        
        departmentSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">-- Tất cả --</option>' + 
                    departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
                select.value = currentValue;
            }
        });
        
        console.log('✅ Đã khởi tạo tab Báo cáo thành công');
    } catch (error) {
        console.error('Lỗi khởi tạo tab Báo cáo:', error);
    }
};

// Refresh reports data
window.refreshReportsData = async () => {
    const refreshBtn = document.querySelector('#tab-reports .btn-refresh');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '🔄 Đang làm mới...';
        refreshBtn.style.opacity = '0.7';
    }
    
    try {
        await initReportsTab();
        
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = '✅ Đã làm mới dữ liệu báo cáo thành công!';
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Lỗi làm mới dữ liệu báo cáo:', error);
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = '❌ Lỗi làm mới dữ liệu báo cáo!';
        errorMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
            errorMsg.remove();
        }, 3000);
        
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Làm mới';
            refreshBtn.style.opacity = '1';
        }
    }
};

// Generate Summary Report
window.generateSummaryReport = async () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displaySummaryReport(data, startDate, endDate, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo tổng hợp:', error);
        alert('Lỗi tạo báo cáo tổng hợp');
    }
};

// Display Summary Report
function displaySummaryReport(data, startDate, endDate, department) {
    const container = document.getElementById('summary-results');
    if (!container) return;
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const departments = new Set(data.map(x => x.PhongBan).filter(Boolean)).size;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${departments}</div>
                <div class="stat-label">Phòng ban</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo phòng ban</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Phòng ban</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateDepartmentStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Stats
function generateDepartmentStats(data) {
    const deptStats = {};
    
    data.forEach(record => {
        const dept = (record.PhongBan || 'Khác').trim();
        if (!deptStats[dept]) {
            deptStats[dept] = { total: 0, onTime: 0, late: 0 };
        }
        
        deptStats[dept].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') deptStats[dept].onTime++;
        else if (status === 'Đi trễ') deptStats[dept].late++;
        else if (status === 'Về sớm') deptStats[dept].early++;
    });
    
    return Object.entries(deptStats)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([dept, stats]) => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${dept}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Name Report
window.generateNameReport = async () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', nameSearch);
        
        const data = await fetchAttendance(params);
        displayNameReport(data, nameSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tên:', error);
        alert('Lỗi tạo báo cáo theo tên');
    }
};

// Display Name Report
function displayNameReport(data, nameSearch) {
    const container = document.getElementById('name-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho tên: ' + nameSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate ID Report
window.generateIdReport = async () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', idSearch);
        
        const data = await fetchAttendance(params);
        displayIdReport(data, idSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo mã NV:', error);
        alert('Lỗi tạo báo cáo theo mã NV');
    }
};

// Display ID Report
function displayIdReport(data, idSearch) {
    const container = document.getElementById('id-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho mã NV: ' + idSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Report
window.generateDepartmentReport = async () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayDepartmentReport(data, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo phòng ban:', error);
        alert('Lỗi tạo báo cáo theo phòng ban');
    }
};

// Display Department Report
function displayDepartmentReport(data, department) {
    const container = document.getElementById('dept-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho phòng ban: ' + department + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateEmployeeStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Employee Stats
function generateEmployeeStats(data) {
    const empStats = {};
    
    data.forEach(record => {
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, total: 0, onTime: 0, late: 0 };
        }
        
        empStats[key].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') empStats[key].onTime++;
        else if (status === 'Đi trễ') empStats[key].late++;
        else if (status === 'Về sớm') empStats[key].early++;
    });
    
    return Object.values(empStats)
        .sort((a, b) => b.total - a.total)
        .map(stats => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Month Report
window.generateMonthReport = async () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng');
        return;
    }
    
    try {
        const [year, month] = monthStr.split('-').map(Number);
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 0));
        
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(start));
        params.append('endDate', formatDateForAPI(end));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayMonthReport(data, year, month, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tháng:', error);
        alert('Lỗi tạo báo cáo theo tháng');
    }
};

// Display Month Report
function displayMonthReport(data, year, month, department) {
    const container = document.getElementById('month-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho tháng ' + month + '/' + year + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Tổng hợp theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Số ngày công</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateMonthlyEmployeeStats(data, year, month)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Monthly Employee Stats
function generateMonthlyEmployeeStats(data, year, month) {
    const empStats = {};
    
    data.forEach(record => {
        if ((record.TrangThai || '').trim() !== 'Đúng giờ') return;
        
        const date = new Date(record.GioVao || record.NgayChamCong);
        if (isNaN(date) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month) return;
        
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, workingDays: 0, totalRecords: 0, onTime: 0 };
        }
        
        empStats[key].totalRecords++;
        empStats[key].onTime++;
        
        // Count unique working days
        const day = String(date.getUTCDate()).padStart(2, '0');
        if (!empStats[key].workingDays) empStats[key].workingDays = new Set();
        empStats[key].workingDays.add(day);
    });
    
    return Object.values(empStats)
        .map(stats => {
            const workingDays = stats.workingDays ? stats.workingDays.size : 0;
            const onTimeRate = stats.totalRecords > 0 ? ((stats.onTime / stats.totalRecords) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${workingDays}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        })
        .sort((a, b) => {
            const aDays = parseInt(a.match(/<td>(\d+)<\/td>/)[1]);
            const bDays = parseInt(b.match(/<td>(\d+)<\/td>/)[1]);
            return bDays - aDays;
        })
        .join('');
}

// Export functions (placeholder - will be implemented with Excel export)
// Export functions - Real implementation
window.exportSummaryReport = () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'summary');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportNameReport = () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'name');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', nameSearch);
    
    downloadExcelReport(params);
};

window.exportIdReport = () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'id');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', idSearch);
    
    downloadExcelReport(params);
};

window.exportDepartmentReport = () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'department');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportMonthReport = () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng trước khi xuất Excel');
        return;
    }
    
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    
    const params = new URLSearchParams();
    params.append('type', 'month');
    params.append('startDate', formatDateForAPI(start));
    params.append('endDate', formatDateForAPI(end));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

// Helper function để download Excel
function downloadExcelReport(params) {
    try {
        const url = `/export/report?${params.toString()}`;
        
        // Sử dụng fetch để download file
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                // Tạo URL từ blob
                const blobUrl = window.URL.createObjectURL(blob);
                
                // Tạo link download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'BaoCaoChamCong.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cleanup blob URL
                window.URL.revokeObjectURL(blobUrl);
                
                // Hiển thị thông báo thành công
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = '✅ Đã tải file Excel thành công!';
                successMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                `;
                document.body.appendChild(successMsg);
                
                setTimeout(() => {
                    successMsg.remove();
                }, 3000);
            })
            .catch(error => {
                console.error('Lỗi xuất Excel:', error);
                alert('Lỗi xuất file Excel: ' + error.message);
            });
        
    } catch (error) {
        console.error('Lỗi xuất Excel:', error);
        alert('Lỗi xuất file Excel: ' + error.message);
    }
}

window.loadMonthlySummary = async () => {
    const monthStr = document.getElementById('act-month')?.value;
    if (!monthStr) return alert('Chọn tháng trước');
    
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));

    try {
        const data = await fetchAttendance(buildQueryParams({
            startDate: formatDateForAPI(start),
            endDate: formatDateForAPI(end)
        }));
        displayMonthlySummary(summarizeMonthlyAttendance(data, year, month));
    } catch (error) {
        console.error('Lỗi tổng hợp tháng:', error);
        alert('Lỗi tổng hợp tháng');
    }
};

// ===== REPORTS FUNCTIONS =====

// Initialize reports tab
window.initReportsTab = async () => {
    try {
        // Load departments for all selects
        const departments = await fetchDepartments();
        const departmentSelects = [
            'summary-department',
            'dept-select', 
            'month-department'
        ];
        
        departmentSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">-- Tất cả --</option>' + 
                    departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
                select.value = currentValue;
            }
        });
        
        console.log('✅ Đã khởi tạo tab Báo cáo thành công');
    } catch (error) {
        console.error('Lỗi khởi tạo tab Báo cáo:', error);
    }
};

// Refresh reports data
window.refreshReportsData = async () => {
    const refreshBtn = document.querySelector('#tab-reports .btn-refresh');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '🔄 Đang làm mới...';
        refreshBtn.style.opacity = '0.7';
    }
    
    try {
        await initReportsTab();
        
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = '✅ Đã làm mới dữ liệu báo cáo thành công!';
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Lỗi làm mới dữ liệu báo cáo:', error);
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = '❌ Lỗi làm mới dữ liệu báo cáo!';
        errorMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
            errorMsg.remove();
        }, 3000);
        
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Làm mới';
            refreshBtn.style.opacity = '1';
        }
    }
};

// Generate Summary Report
window.generateSummaryReport = async () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displaySummaryReport(data, startDate, endDate, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo tổng hợp:', error);
        alert('Lỗi tạo báo cáo tổng hợp');
    }
};

// Display Summary Report
function displaySummaryReport(data, startDate, endDate, department) {
    const container = document.getElementById('summary-results');
    if (!container) return;
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const departments = new Set(data.map(x => x.PhongBan).filter(Boolean)).size;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${departments}</div>
                <div class="stat-label">Phòng ban</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo phòng ban</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Phòng ban</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateDepartmentStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Stats
function generateDepartmentStats(data) {
    const deptStats = {};
    
    data.forEach(record => {
        const dept = (record.PhongBan || 'Khác').trim();
        if (!deptStats[dept]) {
            deptStats[dept] = { total: 0, onTime: 0, late: 0 };
        }
        
        deptStats[dept].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') deptStats[dept].onTime++;
        else if (status === 'Đi trễ') deptStats[dept].late++;
        else if (status === 'Về sớm') deptStats[dept].early++;
    });
    
    return Object.entries(deptStats)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([dept, stats]) => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${dept}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Name Report
window.generateNameReport = async () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', nameSearch);
        
        const data = await fetchAttendance(params);
        displayNameReport(data, nameSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tên:', error);
        alert('Lỗi tạo báo cáo theo tên');
    }
};

// Display Name Report
function displayNameReport(data, nameSearch) {
    const container = document.getElementById('name-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho tên: ' + nameSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate ID Report
window.generateIdReport = async () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', idSearch);
        
        const data = await fetchAttendance(params);
        displayIdReport(data, idSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo mã NV:', error);
        alert('Lỗi tạo báo cáo theo mã NV');
    }
};

// Display ID Report
function displayIdReport(data, idSearch) {
    const container = document.getElementById('id-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho mã NV: ' + idSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Report
window.generateDepartmentReport = async () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayDepartmentReport(data, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo phòng ban:', error);
        alert('Lỗi tạo báo cáo theo phòng ban');
    }
};

// Display Department Report
function displayDepartmentReport(data, department) {
    const container = document.getElementById('dept-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho phòng ban: ' + department + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateEmployeeStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Employee Stats
function generateEmployeeStats(data) {
    const empStats = {};
    
    data.forEach(record => {
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, total: 0, onTime: 0, late: 0 };
        }
        
        empStats[key].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') empStats[key].onTime++;
        else if (status === 'Đi trễ') empStats[key].late++;
        else if (status === 'Về sớm') empStats[key].early++;
    });
    
    return Object.values(empStats)
        .sort((a, b) => b.total - a.total)
        .map(stats => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Month Report
window.generateMonthReport = async () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng');
        return;
    }
    
    try {
        const [year, month] = monthStr.split('-').map(Number);
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 0));
        
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(start));
        params.append('endDate', formatDateForAPI(end));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayMonthReport(data, year, month, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tháng:', error);
        alert('Lỗi tạo báo cáo theo tháng');
    }
};

// Display Month Report
function displayMonthReport(data, year, month, department) {
    const container = document.getElementById('month-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho tháng ' + month + '/' + year + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Tổng hợp theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Số ngày công</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateMonthlyEmployeeStats(data, year, month)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Monthly Employee Stats
function generateMonthlyEmployeeStats(data, year, month) {
    const empStats = {};
    
    data.forEach(record => {
        if ((record.TrangThai || '').trim() !== 'Đúng giờ') return;
        
        const date = new Date(record.GioVao || record.NgayChamCong);
        if (isNaN(date) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month) return;
        
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, workingDays: 0, totalRecords: 0, onTime: 0 };
        }
        
        empStats[key].totalRecords++;
        empStats[key].onTime++;
        
        // Count unique working days
        const day = String(date.getUTCDate()).padStart(2, '0');
        if (!empStats[key].workingDays) empStats[key].workingDays = new Set();
        empStats[key].workingDays.add(day);
    });
    
    return Object.values(empStats)
        .map(stats => {
            const workingDays = stats.workingDays ? stats.workingDays.size : 0;
            const onTimeRate = stats.totalRecords > 0 ? ((stats.onTime / stats.totalRecords) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${workingDays}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        })
        .sort((a, b) => {
            const aDays = parseInt(a.match(/<td>(\d+)<\/td>/)[1]);
            const bDays = parseInt(b.match(/<td>(\d+)<\/td>/)[1]);
            return bDays - aDays;
        })
        .join('');
}

// Export functions (placeholder - will be implemented with Excel export)
// Export functions - Real implementation
window.exportSummaryReport = () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'summary');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportNameReport = () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'name');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', nameSearch);
    
    downloadExcelReport(params);
};

window.exportIdReport = () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'id');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', idSearch);
    
    downloadExcelReport(params);
};

window.exportDepartmentReport = () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'department');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportMonthReport = () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng trước khi xuất Excel');
        return;
    }
    
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    
    const params = new URLSearchParams();
    params.append('type', 'month');
    params.append('startDate', formatDateForAPI(start));
    params.append('endDate', formatDateForAPI(end));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

// Helper function để download Excel
function downloadExcelReport(params) {
    try {
        const url = `/export/report?${params.toString()}`;
        
        // Sử dụng fetch để download file
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                // Tạo URL từ blob
                const blobUrl = window.URL.createObjectURL(blob);
                
                // Tạo link download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'BaoCaoChamCong.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cleanup blob URL
                window.URL.revokeObjectURL(blobUrl);
                
                // Hiển thị thông báo thành công
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = '✅ Đã tải file Excel thành công!';
                successMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                `;
                document.body.appendChild(successMsg);
                
                setTimeout(() => {
                    successMsg.remove();
                }, 3000);
            })
            .catch(error => {
                console.error('Lỗi xuất Excel:', error);
                alert('Lỗi xuất file Excel: ' + error.message);
            });
        
    } catch (error) {
        console.error('Lỗi xuất Excel:', error);
        alert('Lỗi xuất file Excel: ' + error.message);
    }
}

// Monthly summary calculation
function summarizeMonthlyAttendance(data, year, month) {
    const attendanceMap = new Map();
    
    data.forEach(record => {
        if ((record.TrangThai || '').trim() !== 'Đúng giờ') return;
        
        const date = new Date(record.GioVao || record.NgayChamCong);
        if (isNaN(date) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month) return;
        
        const day = String(date.getUTCDate()).padStart(2, '0');
        const key = `${record.MaNhanVienNoiBo}|${day}`;
        if (!attendanceMap.has(key)) {
            attendanceMap.set(key, { MaNhanVienNoiBo: record.MaNhanVienNoiBo, HoTen: record.HoTen || '', Day: day });
        }
    });

    const personCountMap = new Map();
    attendanceMap.forEach(value => {
        const key = value.MaNhanVienNoiBo + '|' + value.HoTen;
        personCountMap.set(key, (personCountMap.get(key) || 0) + 1);
    });

    return Array.from(personCountMap.entries()).map(([key, cong]) => {
        const [maNhanVienNoiBo, hoTen] = key.split('|');
        return { MaNhanVienNoiBo: maNhanVienNoiBo, HoTen: hoTen, Thang: `${String(month).padStart(2,'0')}/${year}`, Cong: cong };
    }).sort((a,b) => a.MaNhanVienNoiBo.localeCompare(b.MaNhanVienNoiBo, 'vi'));
}

// Tab management
function initTabs() {
    const buttons = document.querySelectorAll('.menu-item');
    const faceidSubBtns = document.querySelectorAll('#tab-faceid .subtab-btn');
    const faceidSubPanels = document.querySelectorAll('#tab-faceid .subtab-panel');
    const reportTabBtns = document.querySelectorAll('.report-tab-btn');
    const reportPanels = document.querySelectorAll('.report-panel');
    const panels = {
        dashboard: document.getElementById('tab-dashboard'),
        devices: document.getElementById('tab-devices'),
        activity: document.getElementById('tab-activity'),
        reports: document.getElementById('tab-reports'),
        faceid: document.getElementById('tab-faceid')
    };
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            Object.values(panels).forEach(p => p.classList.remove('active'));
            panels[btn.getAttribute('data-tab')]?.classList.add('active');
            
            const tab = btn.getAttribute('data-tab');
            if (tab === 'activity') loadActivityAttendance();
            else if (tab === 'faceid') loadFaceIdDepartments();
            else if (tab === 'devices') loadDevices();
            else if (tab === 'reports') initReportsTab();
        });
    });

    faceidSubBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            faceidSubBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            faceidSubPanels.forEach(p => p.classList.remove('active'));
            document.getElementById(btn.getAttribute('data-subtab'))?.classList.add('active');
        });
    });

    // Report tabs management
    reportTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            reportTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            reportPanels.forEach(p => p.classList.remove('active'));
            document.getElementById(`report-${btn.getAttribute('data-report')}`)?.classList.add('active');
        });
    });
}

// Dashboard KPI updates
function updateDashboardKpis(data) {
    const stats = {
        total: data.length,
        onTime: data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length,
        late: data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length,
        early: data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length,
        departments: new Set(data.map(x => x.PhongBan).filter(Boolean)).size,
        people: new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size
    };
    setTextContent('kpi-total', stats.total);
    setTextContent('kpi-on-time', stats.onTime);
    setTextContent('kpi-late', stats.late);
    setTextContent('kpi-early', stats.early);
    setTextContent('kpi-departments', stats.departments);
    setTextContent('kpi-people', stats.people);
}

// Dashboard bar charts
function renderDashboardBars(data) {
    const statusWrap = document.getElementById('dashboard-status-bars');
    const deptWrap = document.getElementById('dashboard-dept-bars');
    if (!statusWrap || !deptWrap) return;

    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const total = Math.max(onTime + late + early, 1);
    
    statusWrap.innerHTML = '';
    statusWrap.appendChild(buildBarRow('Đúng giờ', onTime / total, 'status-ontime', onTime));
    statusWrap.appendChild(buildBarRow('Đi trễ', late / total, 'status-late', late));
    statusWrap.appendChild(buildBarRow('Về sớm', early / total, 'status-early', early));

    const deptCounts = {};
    data.forEach(x => {
        const dept = (x.PhongBan || 'Khác').trim();
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    
    const sortedDepts = Object.entries(deptCounts).sort((a,b) => b[1] - a[1]).slice(0, 10);
    const maxCount = Math.max(...sortedDepts.map(s => s[1]), 1);
    deptWrap.innerHTML = '';
    sortedDepts.forEach(([label, count]) => {
        deptWrap.appendChild(buildBarRow(label, count / maxCount, 'dept', count));
    });
}

// Bar row builder
function buildBarRow(label, ratio, className, value) {
    const row = document.createElement('div');
    row.className = 'bar';
    
    const name = document.createElement('div');
    name.className = 'bar-label';
    name.textContent = label;
    
    const track = document.createElement('div');
    track.className = 'bar-track';
    
    const fill = document.createElement('div');
    fill.className = 'bar-fill ' + className;
    fill.style.width = Math.round(ratio * 100) + '%';
    fill.title = value.toLocaleString('vi-VN');
    
    track.appendChild(fill);
    row.appendChild(name);
    row.appendChild(track);
    
    return row;
}

// Today's dashboard data
function renderDashboardFriendly(data) {
    const today = new Date();
    const todayKey = getDateKey(today);
    
    let onTime = 0, late = 0, early = 0;
    
    data.forEach(record => {
        const src = record.GioVao || record.NgayChamCong;
        const dateKey = getDateKey(src);
        
        if (dateKey === todayKey) {
            const status = (record.TrangThai || '').trim();
            if (status === 'Đúng giờ') onTime++;
            else if (status === 'Đi trễ') late++;
            else if (status === 'Về sớm') early++;
        }
    });
    
    setTextContent('today-on-time', onTime);
    setTextContent('today-late', late);
    setTextContent('today-early', early);
    setTextContent('today-total', onTime + late + early);

    // Leaderboard (if element exists)
    const leaderList = document.getElementById('leader-today');
    if (leaderList) {
        const scores = new Map();
        
        data.forEach(record => {
            const src = record.GioVao || record.NgayChamCong;
            const dateKey = getDateKey(src);
            
            if (dateKey !== todayKey) return;
            if ((record.TrangThai || '').trim() !== 'Đúng giờ') return;
            
            const key = (record.MaNhanVienNoiBo || '?') + '|' + (record.HoTen || '');
            scores.set(key, (scores.get(key) || 0) + 1);
        });
        
        const topPerformers = Array.from(scores.entries())
            .sort((a,b) => b[1] - a[1])
            .slice(0, 10);
        
        leaderList.innerHTML = '';
        
        if (topPerformers.length === 0) {
            leaderList.innerHTML = '<li>Chưa có dữ liệu hôm nay</li>';
        } else {
            topPerformers.forEach(([key, value]) => {
                const [id, name] = key.split('|');
                const li = document.createElement('li');
                
                const left = document.createElement('span');
                left.className = 'name';
                left.textContent = name || id;
                
                const right = document.createElement('span');
                right.className = 'value';
                right.textContent = value.toLocaleString('vi-VN');
                
                li.appendChild(left);
                li.appendChild(right);
                leaderList.appendChild(li);
            });
        }
    }
}

// Export functions to global scope
window.fetchAndDisplayData = fetchAndDisplayData;
window.getCurrentData = () => currentData;

// Load devices list
window.loadDevices = async () => {
    try {
        // Hiển thị loading
        const container = document.getElementById('devices-container');
        if (container) {
            container.innerHTML = '<div class="loading">Đang tải danh sách thiết bị...</div>';
        }
        
        const devices = await fetchDevices();
        displayDevicesList(devices);
        
        // Hiển thị thông báo thành công
        console.log('✅ Đã tải danh sách thiết bị thành công');
    } catch (error) {
        console.error('Lỗi tải danh sách thiết bị:', error);
        const container = document.getElementById('devices-container');
        if (container) {
            container.innerHTML = '<div class="error-message">Lỗi tải danh sách thiết bị</div>';
        }
    }
};

// ===== REPORTS FUNCTIONS =====

// Initialize reports tab
window.initReportsTab = async () => {
    try {
        // Load departments for all selects
        const departments = await fetchDepartments();
        const departmentSelects = [
            'summary-department',
            'dept-select', 
            'month-department'
        ];
        
        departmentSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">-- Tất cả --</option>' + 
                    departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
                select.value = currentValue;
            }
        });
        
        console.log('✅ Đã khởi tạo tab Báo cáo thành công');
    } catch (error) {
        console.error('Lỗi khởi tạo tab Báo cáo:', error);
    }
};

// Refresh reports data
window.refreshReportsData = async () => {
    const refreshBtn = document.querySelector('#tab-reports .btn-refresh');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '🔄 Đang làm mới...';
        refreshBtn.style.opacity = '0.7';
    }
    
    try {
        await initReportsTab();
        
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = '✅ Đã làm mới dữ liệu báo cáo thành công!';
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Lỗi làm mới dữ liệu báo cáo:', error);
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = '❌ Lỗi làm mới dữ liệu báo cáo!';
        errorMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
            errorMsg.remove();
        }, 3000);
        
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Làm mới';
            refreshBtn.style.opacity = '1';
        }
    }
};

// Generate Summary Report
window.generateSummaryReport = async () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displaySummaryReport(data, startDate, endDate, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo tổng hợp:', error);
        alert('Lỗi tạo báo cáo tổng hợp');
    }
};

// Display Summary Report
function displaySummaryReport(data, startDate, endDate, department) {
    const container = document.getElementById('summary-results');
    if (!container) return;
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const departments = new Set(data.map(x => x.PhongBan).filter(Boolean)).size;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${departments}</div>
                <div class="stat-label">Phòng ban</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo phòng ban</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Phòng ban</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateDepartmentStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Stats
function generateDepartmentStats(data) {
    const deptStats = {};
    
    data.forEach(record => {
        const dept = (record.PhongBan || 'Khác').trim();
        if (!deptStats[dept]) {
            deptStats[dept] = { total: 0, onTime: 0, late: 0 };
        }
        
        deptStats[dept].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') deptStats[dept].onTime++;
        else if (status === 'Đi trễ') deptStats[dept].late++;
        else if (status === 'Về sớm') deptStats[dept].early++;
    });
    
    return Object.entries(deptStats)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([dept, stats]) => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${dept}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Name Report
window.generateNameReport = async () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', nameSearch);
        
        const data = await fetchAttendance(params);
        displayNameReport(data, nameSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tên:', error);
        alert('Lỗi tạo báo cáo theo tên');
    }
};

// Display Name Report
function displayNameReport(data, nameSearch) {
    const container = document.getElementById('name-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho tên: ' + nameSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate ID Report
window.generateIdReport = async () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', idSearch);
        
        const data = await fetchAttendance(params);
        displayIdReport(data, idSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo mã NV:', error);
        alert('Lỗi tạo báo cáo theo mã NV');
    }
};

// Display ID Report
function displayIdReport(data, idSearch) {
    const container = document.getElementById('id-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho mã NV: ' + idSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Report
window.generateDepartmentReport = async () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayDepartmentReport(data, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo phòng ban:', error);
        alert('Lỗi tạo báo cáo theo phòng ban');
    }
};

// Display Department Report
function displayDepartmentReport(data, department) {
    const container = document.getElementById('dept-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho phòng ban: ' + department + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateEmployeeStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Employee Stats
function generateEmployeeStats(data) {
    const empStats = {};
    
    data.forEach(record => {
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, total: 0, onTime: 0, late: 0 };
        }
        
        empStats[key].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') empStats[key].onTime++;
        else if (status === 'Đi trễ') empStats[key].late++;
        else if (status === 'Về sớm') empStats[key].early++;
    });
    
    return Object.values(empStats)
        .sort((a, b) => b.total - a.total)
        .map(stats => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Month Report
window.generateMonthReport = async () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng');
        return;
    }
    
    try {
        const [year, month] = monthStr.split('-').map(Number);
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 0));
        
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(start));
        params.append('endDate', formatDateForAPI(end));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayMonthReport(data, year, month, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tháng:', error);
        alert('Lỗi tạo báo cáo theo tháng');
    }
};

// Display Month Report
function displayMonthReport(data, year, month, department) {
    const container = document.getElementById('month-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho tháng ' + month + '/' + year + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Tổng hợp theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Số ngày công</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateMonthlyEmployeeStats(data, year, month)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Monthly Employee Stats
function generateMonthlyEmployeeStats(data, year, month) {
    const empStats = {};
    
    data.forEach(record => {
        if ((record.TrangThai || '').trim() !== 'Đúng giờ') return;
        
        const date = new Date(record.GioVao || record.NgayChamCong);
        if (isNaN(date) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month) return;
        
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, workingDays: 0, totalRecords: 0, onTime: 0 };
        }
        
        empStats[key].totalRecords++;
        empStats[key].onTime++;
        
        // Count unique working days
        const day = String(date.getUTCDate()).padStart(2, '0');
        if (!empStats[key].workingDays) empStats[key].workingDays = new Set();
        empStats[key].workingDays.add(day);
    });
    
    return Object.values(empStats)
        .map(stats => {
            const workingDays = stats.workingDays ? stats.workingDays.size : 0;
            const onTimeRate = stats.totalRecords > 0 ? ((stats.onTime / stats.totalRecords) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${workingDays}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        })
        .sort((a, b) => {
            const aDays = parseInt(a.match(/<td>(\d+)<\/td>/)[1]);
            const bDays = parseInt(b.match(/<td>(\d+)<\/td>/)[1]);
            return bDays - aDays;
        })
        .join('');
}

// Export functions (placeholder - will be implemented with Excel export)
// Export functions - Real implementation
window.exportSummaryReport = () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'summary');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportNameReport = () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'name');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', nameSearch);
    
    downloadExcelReport(params);
};

window.exportIdReport = () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'id');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', idSearch);
    
    downloadExcelReport(params);
};

window.exportDepartmentReport = () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'department');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportMonthReport = () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng trước khi xuất Excel');
        return;
    }
    
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    
    const params = new URLSearchParams();
    params.append('type', 'month');
    params.append('startDate', formatDateForAPI(start));
    params.append('endDate', formatDateForAPI(end));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

// Helper function để download Excel
function downloadExcelReport(params) {
    try {
        const url = `/export/report?${params.toString()}`;
        
        // Sử dụng fetch để download file
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                // Tạo URL từ blob
                const blobUrl = window.URL.createObjectURL(blob);
                
                // Tạo link download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'BaoCaoChamCong.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cleanup blob URL
                window.URL.revokeObjectURL(blobUrl);
                
                // Hiển thị thông báo thành công
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = '✅ Đã tải file Excel thành công!';
                successMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                `;
                document.body.appendChild(successMsg);
                
                setTimeout(() => {
                    successMsg.remove();
                }, 3000);
            })
            .catch(error => {
                console.error('Lỗi xuất Excel:', error);
                alert('Lỗi xuất file Excel: ' + error.message);
            });
        
    } catch (error) {
        console.error('Lỗi xuất Excel:', error);
        alert('Lỗi xuất file Excel: ' + error.message);
    }
}

// Refresh devices data với animation
window.refreshDevices = async () => {
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        // Disable button và thêm animation
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '🔄 Đang làm mới...';
        refreshBtn.style.opacity = '0.7';
    }
    
    try {
        // Hiển thị loading
        const container = document.getElementById('devices-container');
        if (container) {
            container.innerHTML = '<div class="loading">🔄 Đang làm mới dữ liệu thiết bị...</div>';
        }
        
        // Gọi API để lấy dữ liệu mới
        const devices = await fetchDevices();
        displayDevicesList(devices);
        
        // Hiển thị thông báo thành công
        console.log('✅ Đã làm mới danh sách thiết bị thành công');
        
        // Hiển thị thông báo tạm thời
        if (container) {
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.textContent = '✅ Đã làm mới dữ liệu thành công!';
            successMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(successMsg);
            
            // Tự động ẩn sau 3 giây
            setTimeout(() => {
                successMsg.remove();
            }, 3000);
        }
        
    } catch (error) {
        console.error('Lỗi làm mới danh sách thiết bị:', error);
        const container = document.getElementById('devices-container');
        if (container) {
            container.innerHTML = '<div class="error-message">❌ Lỗi làm mới dữ liệu thiết bị</div>';
        }
        
        // Hiển thị thông báo lỗi
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = '❌ Lỗi làm mới dữ liệu!';
        errorMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
            errorMsg.remove();
        }, 3000);
        
    } finally {
        // Khôi phục button
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Làm mới';
            refreshBtn.style.opacity = '1';
        }
    }
};

// ===== REPORTS FUNCTIONS =====

// Initialize reports tab
window.initReportsTab = async () => {
    try {
        // Load departments for all selects
        const departments = await fetchDepartments();
        const departmentSelects = [
            'summary-department',
            'dept-select', 
            'month-department'
        ];
        
        departmentSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">-- Tất cả --</option>' + 
                    departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
                select.value = currentValue;
            }
        });
        
        console.log('✅ Đã khởi tạo tab Báo cáo thành công');
    } catch (error) {
        console.error('Lỗi khởi tạo tab Báo cáo:', error);
    }
};

// Refresh reports data
window.refreshReportsData = async () => {
    const refreshBtn = document.querySelector('#tab-reports .btn-refresh');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '🔄 Đang làm mới...';
        refreshBtn.style.opacity = '0.7';
    }
    
    try {
        await initReportsTab();
        
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = '✅ Đã làm mới dữ liệu báo cáo thành công!';
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Lỗi làm mới dữ liệu báo cáo:', error);
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = '❌ Lỗi làm mới dữ liệu báo cáo!';
        errorMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
            errorMsg.remove();
        }, 3000);
        
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Làm mới';
            refreshBtn.style.opacity = '1';
        }
    }
};

// Generate Summary Report
window.generateSummaryReport = async () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displaySummaryReport(data, startDate, endDate, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo tổng hợp:', error);
        alert('Lỗi tạo báo cáo tổng hợp');
    }
};

// Display Summary Report
function displaySummaryReport(data, startDate, endDate, department) {
    const container = document.getElementById('summary-results');
    if (!container) return;
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const departments = new Set(data.map(x => x.PhongBan).filter(Boolean)).size;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${departments}</div>
                <div class="stat-label">Phòng ban</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo phòng ban</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Phòng ban</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateDepartmentStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Stats
function generateDepartmentStats(data) {
    const deptStats = {};
    
    data.forEach(record => {
        const dept = (record.PhongBan || 'Khác').trim();
        if (!deptStats[dept]) {
            deptStats[dept] = { total: 0, onTime: 0, late: 0 };
        }
        
        deptStats[dept].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') deptStats[dept].onTime++;
        else if (status === 'Đi trễ') deptStats[dept].late++;
        else if (status === 'Về sớm') deptStats[dept].early++;
    });
    
    return Object.entries(deptStats)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([dept, stats]) => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${dept}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Name Report
window.generateNameReport = async () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', nameSearch);
        
        const data = await fetchAttendance(params);
        displayNameReport(data, nameSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tên:', error);
        alert('Lỗi tạo báo cáo theo tên');
    }
};

// Display Name Report
function displayNameReport(data, nameSearch) {
    const container = document.getElementById('name-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho tên: ' + nameSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate ID Report
window.generateIdReport = async () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', idSearch);
        
        const data = await fetchAttendance(params);
        displayIdReport(data, idSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo mã NV:', error);
        alert('Lỗi tạo báo cáo theo mã NV');
    }
};

// Display ID Report
function displayIdReport(data, idSearch) {
    const container = document.getElementById('id-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho mã NV: ' + idSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Report
window.generateDepartmentReport = async () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayDepartmentReport(data, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo phòng ban:', error);
        alert('Lỗi tạo báo cáo theo phòng ban');
    }
};

// Display Department Report
function displayDepartmentReport(data, department) {
    const container = document.getElementById('dept-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho phòng ban: ' + department + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateEmployeeStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Employee Stats
function generateEmployeeStats(data) {
    const empStats = {};
    
    data.forEach(record => {
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, total: 0, onTime: 0, late: 0 };
        }
        
        empStats[key].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') empStats[key].onTime++;
        else if (status === 'Đi trễ') empStats[key].late++;
        else if (status === 'Về sớm') empStats[key].early++;
    });
    
    return Object.values(empStats)
        .sort((a, b) => b.total - a.total)
        .map(stats => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Month Report
window.generateMonthReport = async () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng');
        return;
    }
    
    try {
        const [year, month] = monthStr.split('-').map(Number);
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 0));
        
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(start));
        params.append('endDate', formatDateForAPI(end));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayMonthReport(data, year, month, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tháng:', error);
        alert('Lỗi tạo báo cáo theo tháng');
    }
};

// Display Month Report
function displayMonthReport(data, year, month, department) {
    const container = document.getElementById('month-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho tháng ' + month + '/' + year + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Tổng hợp theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Số ngày công</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateMonthlyEmployeeStats(data, year, month)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Monthly Employee Stats
function generateMonthlyEmployeeStats(data, year, month) {
    const empStats = {};
    
    data.forEach(record => {
        if ((record.TrangThai || '').trim() !== 'Đúng giờ') return;
        
        const date = new Date(record.GioVao || record.NgayChamCong);
        if (isNaN(date) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month) return;
        
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, workingDays: 0, totalRecords: 0, onTime: 0 };
        }
        
        empStats[key].totalRecords++;
        empStats[key].onTime++;
        
        // Count unique working days
        const day = String(date.getUTCDate()).padStart(2, '0');
        if (!empStats[key].workingDays) empStats[key].workingDays = new Set();
        empStats[key].workingDays.add(day);
    });
    
    return Object.values(empStats)
        .map(stats => {
            const workingDays = stats.workingDays ? stats.workingDays.size : 0;
            const onTimeRate = stats.totalRecords > 0 ? ((stats.onTime / stats.totalRecords) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${workingDays}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        })
        .sort((a, b) => {
            const aDays = parseInt(a.match(/<td>(\d+)<\/td>/)[1]);
            const bDays = parseInt(b.match(/<td>(\d+)<\/td>/)[1]);
            return bDays - aDays;
        })
        .join('');
}

// Export functions (placeholder - will be implemented with Excel export)
// Export functions - Real implementation
window.exportSummaryReport = () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'summary');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportNameReport = () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'name');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', nameSearch);
    
    downloadExcelReport(params);
};

window.exportIdReport = () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'id');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', idSearch);
    
    downloadExcelReport(params);
};

window.exportDepartmentReport = () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'department');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportMonthReport = () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng trước khi xuất Excel');
        return;
    }
    
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    
    const params = new URLSearchParams();
    params.append('type', 'month');
    params.append('startDate', formatDateForAPI(start));
    params.append('endDate', formatDateForAPI(end));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

// Helper function để download Excel
function downloadExcelReport(params) {
    try {
        const url = `/export/report?${params.toString()}`;
        
        // Sử dụng fetch để download file
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                // Tạo URL từ blob
                const blobUrl = window.URL.createObjectURL(blob);
                
                // Tạo link download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'BaoCaoChamCong.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cleanup blob URL
                window.URL.revokeObjectURL(blobUrl);
                
                // Hiển thị thông báo thành công
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = '✅ Đã tải file Excel thành công!';
                successMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                `;
                document.body.appendChild(successMsg);
                
                setTimeout(() => {
                    successMsg.remove();
                }, 3000);
            })
            .catch(error => {
                console.error('Lỗi xuất Excel:', error);
                alert('Lỗi xuất file Excel: ' + error.message);
            });
        
    } catch (error) {
        console.error('Lỗi xuất Excel:', error);
        alert('Lỗi xuất file Excel: ' + error.message);
    }
}

// Refresh activity data với animation
window.refreshActivityData = async () => {
    const refreshBtn = document.querySelector('#tab-activity .btn-refresh');
    if (refreshBtn) {
        // Disable button và thêm animation
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '🔄 Đang làm mới...';
        refreshBtn.style.opacity = '0.7';
    }
    
    try {
        // Hiển thị loading trong table
        const tbody = document.getElementById('activity-attendance-data');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" class="loading">🔄 Đang làm mới dữ liệu chấm công...</td></tr>';
        }
        
        // Gọi function load activity attendance
        await loadActivityAttendance();
        
        // Hiển thị thông báo thành công
        console.log('✅ Đã làm mới dữ liệu chấm công thành công');
        
        // Hiển thị thông báo tạm thời
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = '✅ Đã làm mới dữ liệu chấm công thành công!';
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(successMsg);
        
        // Tự động ẩn sau 3 giây
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Lỗi làm mới dữ liệu chấm công:', error);
        
        // Hiển thị thông báo lỗi
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = '❌ Lỗi làm mới dữ liệu chấm công!';
        errorMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
            errorMsg.remove();
        }, 3000);
        
    } finally {
        // Khôi phục button
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Làm mới';
            refreshBtn.style.opacity = '1';
        }
    }
};

// ===== REPORTS FUNCTIONS =====

// Initialize reports tab
window.initReportsTab = async () => {
    try {
        // Load departments for all selects
        const departments = await fetchDepartments();
        const departmentSelects = [
            'summary-department',
            'dept-select', 
            'month-department'
        ];
        
        departmentSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">-- Tất cả --</option>' + 
                    departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
                select.value = currentValue;
            }
        });
        
        console.log('✅ Đã khởi tạo tab Báo cáo thành công');
    } catch (error) {
        console.error('Lỗi khởi tạo tab Báo cáo:', error);
    }
};

// Refresh reports data
window.refreshReportsData = async () => {
    const refreshBtn = document.querySelector('#tab-reports .btn-refresh');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '🔄 Đang làm mới...';
        refreshBtn.style.opacity = '0.7';
    }
    
    try {
        await initReportsTab();
        
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = '✅ Đã làm mới dữ liệu báo cáo thành công!';
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Lỗi làm mới dữ liệu báo cáo:', error);
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = '❌ Lỗi làm mới dữ liệu báo cáo!';
        errorMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
            errorMsg.remove();
        }, 3000);
        
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Làm mới';
            refreshBtn.style.opacity = '1';
        }
    }
};

// Generate Summary Report
window.generateSummaryReport = async () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displaySummaryReport(data, startDate, endDate, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo tổng hợp:', error);
        alert('Lỗi tạo báo cáo tổng hợp');
    }
};

// Display Summary Report
function displaySummaryReport(data, startDate, endDate, department) {
    const container = document.getElementById('summary-results');
    if (!container) return;
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const departments = new Set(data.map(x => x.PhongBan).filter(Boolean)).size;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${departments}</div>
                <div class="stat-label">Phòng ban</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo phòng ban</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Phòng ban</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateDepartmentStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Stats
function generateDepartmentStats(data) {
    const deptStats = {};
    
    data.forEach(record => {
        const dept = (record.PhongBan || 'Khác').trim();
        if (!deptStats[dept]) {
            deptStats[dept] = { total: 0, onTime: 0, late: 0 };
        }
        
        deptStats[dept].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') deptStats[dept].onTime++;
        else if (status === 'Đi trễ') deptStats[dept].late++;
        else if (status === 'Về sớm') deptStats[dept].early++;
    });
    
    return Object.entries(deptStats)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([dept, stats]) => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${dept}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Name Report
window.generateNameReport = async () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', nameSearch);
        
        const data = await fetchAttendance(params);
        displayNameReport(data, nameSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tên:', error);
        alert('Lỗi tạo báo cáo theo tên');
    }
};

// Display Name Report
function displayNameReport(data, nameSearch) {
    const container = document.getElementById('name-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho tên: ' + nameSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate ID Report
window.generateIdReport = async () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('personId', idSearch);
        
        const data = await fetchAttendance(params);
        displayIdReport(data, idSearch);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo mã NV:', error);
        alert('Lỗi tạo báo cáo theo mã NV');
    }
};

// Display ID Report
function displayIdReport(data, idSearch) {
    const container = document.getElementById('id-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy dữ liệu cho mã NV: ' + idSearch + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
        </div>
        
        <h3>Chi tiết chấm công</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Thời gian làm việc</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(record => `
                    <tr>
                        <td>${record.MaNhanVienNoiBo}</td>
                        <td>${record.HoTen}</td>
                        <td>${new Date(record.NgayChamCong).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${record.GioVao ? new Date(record.GioVao).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.GioRa ? new Date(record.GioRa).toLocaleTimeString('vi-VN') : '---'}</td>
                        <td>${record.ThoiGianLamViec ? record.ThoiGianLamViec.toFixed(4) : '---'}</td>
                        <td>${record.TrangThai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Department Report
window.generateDepartmentReport = async () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(startDate));
        params.append('endDate', formatDateForAPI(endDate));
        params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayDepartmentReport(data, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo phòng ban:', error);
        alert('Lỗi tạo báo cáo theo phòng ban');
    }
};

// Display Department Report
function displayDepartmentReport(data, department) {
    const container = document.getElementById('dept-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho phòng ban: ' + department + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Chi tiết theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Tổng bản ghi</th>
                    <th>Đúng giờ</th>
                    <th>Không đúng giờ</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateEmployeeStats(data)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Employee Stats
function generateEmployeeStats(data) {
    const empStats = {};
    
    data.forEach(record => {
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, total: 0, onTime: 0, late: 0 };
        }
        
        empStats[key].total++;
        const status = (record.TrangThai || '').trim();
        if (status === 'Đúng giờ') empStats[key].onTime++;
        else if (status === 'Đi trễ') empStats[key].late++;
        else if (status === 'Về sớm') empStats[key].early++;
    });
    
    return Object.values(empStats)
        .sort((a, b) => b.total - a.total)
        .map(stats => {
            const onTimeRate = stats.total > 0 ? ((stats.onTime / stats.total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${stats.total}</td>
                    <td>${stats.onTime}</td>
                    <td>${stats.late}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        }).join('');
}

// Generate Month Report
window.generateMonthReport = async () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng');
        return;
    }
    
    try {
        const [year, month] = monthStr.split('-').map(Number);
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 0));
        
        const params = new URLSearchParams();
        params.append('startDate', formatDateForAPI(start));
        params.append('endDate', formatDateForAPI(end));
        if (department) params.append('department', department);
        
        const data = await fetchAttendance(params);
        displayMonthReport(data, year, month, department);
        
    } catch (error) {
        console.error('Lỗi tạo báo cáo theo tháng:', error);
        alert('Lỗi tạo báo cáo theo tháng');
    }
};

// Display Month Report
function displayMonthReport(data, year, month, department) {
    const container = document.getElementById('month-results');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu cho tháng ' + month + '/' + year + '</div>';
        return;
    }
    
    const totalRecords = data.length;
    const onTime = data.filter(x => (x.TrangThai || '').trim() === 'Đúng giờ').length;
    const late = data.filter(x => (x.TrangThai || '').trim() === 'Đi trễ').length;
    const early = data.filter(x => (x.TrangThai || '').trim() === 'Về sớm').length;
    const employees = new Set(data.map(x => x.MaNhanVienNoiBo).filter(Boolean)).size;
    
    const html = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Tổng bản ghi</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${onTime}</div>
                <div class="stat-label">Đúng giờ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${late}</div>
                <div class="stat-label">Đi trễ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${employees}</div>
                <div class="stat-label">Nhân viên</div>
            </div>
        </div>
        
        <h3>Tổng hợp theo nhân viên</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Số ngày công</th>
                    <th>Tỷ lệ đúng giờ</th>
                </tr>
            </thead>
            <tbody>
                ${generateMonthlyEmployeeStats(data, year, month)}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Generate Monthly Employee Stats
function generateMonthlyEmployeeStats(data, year, month) {
    const empStats = {};
    
    data.forEach(record => {
        if ((record.TrangThai || '').trim() !== 'Đúng giờ') return;
        
        const date = new Date(record.GioVao || record.NgayChamCong);
        if (isNaN(date) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month) return;
        
        const empId = record.MaNhanVienNoiBo;
        const empName = record.HoTen;
        const key = `${empId}|${empName}`;
        
        if (!empStats[key]) {
            empStats[key] = { id: empId, name: empName, workingDays: 0, totalRecords: 0, onTime: 0 };
        }
        
        empStats[key].totalRecords++;
        empStats[key].onTime++;
        
        // Count unique working days
        const day = String(date.getUTCDate()).padStart(2, '0');
        if (!empStats[key].workingDays) empStats[key].workingDays = new Set();
        empStats[key].workingDays.add(day);
    });
    
    return Object.values(empStats)
        .map(stats => {
            const workingDays = stats.workingDays ? stats.workingDays.size : 0;
            const onTimeRate = stats.totalRecords > 0 ? ((stats.onTime / stats.totalRecords) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${stats.id}</td>
                    <td>${stats.name}</td>
                    <td>${workingDays}</td>
                    <td>${onTimeRate}%</td>
                </tr>
            `;
        })
        .sort((a, b) => {
            const aDays = parseInt(a.match(/<td>(\d+)<\/td>/)[1]);
            const bDays = parseInt(b.match(/<td>(\d+)<\/td>/)[1]);
            return bDays - aDays;
        })
        .join('');
}

// Export functions (placeholder - will be implemented with Excel export)
// Export functions - Real implementation
window.exportSummaryReport = () => {
    const startDate = document.getElementById('summary-start')?.value;
    const endDate = document.getElementById('summary-end')?.value;
    const department = document.getElementById('summary-department')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'summary');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportNameReport = () => {
    const startDate = document.getElementById('name-start')?.value;
    const endDate = document.getElementById('name-end')?.value;
    const nameSearch = document.getElementById('name-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!nameSearch) {
        alert('Vui lòng nhập tên nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'name');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', nameSearch);
    
    downloadExcelReport(params);
};

window.exportIdReport = () => {
    const startDate = document.getElementById('id-start')?.value;
    const endDate = document.getElementById('id-end')?.value;
    const idSearch = document.getElementById('id-search')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!idSearch) {
        alert('Vui lòng nhập mã nhân viên trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'id');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('personId', idSearch);
    
    downloadExcelReport(params);
};

window.exportDepartmentReport = () => {
    const startDate = document.getElementById('dept-start')?.value;
    const endDate = document.getElementById('dept-end')?.value;
    const department = document.getElementById('dept-select')?.value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn khoảng thời gian trước khi xuất Excel');
        return;
    }
    
    if (!department) {
        alert('Vui lòng chọn phòng ban trước khi xuất Excel');
        return;
    }
    
    const params = new URLSearchParams();
    params.append('type', 'department');
    params.append('startDate', formatDateForAPI(startDate));
    params.append('endDate', formatDateForAPI(endDate));
    params.append('department', department);
    
    downloadExcelReport(params);
};

window.exportMonthReport = () => {
    const monthStr = document.getElementById('month-select')?.value;
    const department = document.getElementById('month-department')?.value;
    
    if (!monthStr) {
        alert('Vui lòng chọn tháng trước khi xuất Excel');
        return;
    }
    
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    
    const params = new URLSearchParams();
    params.append('type', 'month');
    params.append('startDate', formatDateForAPI(start));
    params.append('endDate', formatDateForAPI(end));
    if (department) params.append('department', department);
    
    downloadExcelReport(params);
};

// Helper function để download Excel
function downloadExcelReport(params) {
    try {
        const url = `/export/report?${params.toString()}`;
        
        // Sử dụng fetch để download file
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                // Tạo URL từ blob
                const blobUrl = window.URL.createObjectURL(blob);
                
                // Tạo link download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'BaoCaoChamCong.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cleanup blob URL
                window.URL.revokeObjectURL(blobUrl);
                
                // Hiển thị thông báo thành công
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = '✅ Đã tải file Excel thành công!';
                successMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                `;
                document.body.appendChild(successMsg);
                
                setTimeout(() => {
                    successMsg.remove();
                }, 3000);
            })
            .catch(error => {
                console.error('Lỗi xuất Excel:', error);
                alert('Lỗi xuất file Excel: ' + error.message);
            });
        
    } catch (error) {
        console.error('Lỗi xuất Excel:', error);
        alert('Lỗi xuất file Excel: ' + error.message);
    }
}
