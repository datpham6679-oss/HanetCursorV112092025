/**
 * Dashboard Module
 * Xử lý hiển thị dashboard và các KPI
 */

/**
 * Cập nhật các KPI trên dashboard
 * @param {Array} data - Dữ liệu chấm công
 */
function updateDashboardKpis(data) {
    const totalRecords = data.length;
    const dungGio = data.filter(r => r.TrangThai === 'Đúng giờ').length;
    const diTre = data.filter(r => r.TrangThai === 'Đi trễ').length;
    const veSom = data.filter(r => r.TrangThai === 'Về sớm').length;

    window.utils.setTextContent('total-records', totalRecords);
    window.utils.setTextContent('dung-gio-count', dungGio);
    window.utils.setTextContent('di-tre-count', diTre);
    window.utils.setTextContent('ve-som-count', veSom);
}

/**
 * Render biểu đồ cột cho dashboard
 * @param {Array} data - Dữ liệu chấm công
 */
function renderDashboardBars(data) {
    const container = document.getElementById('dashboard-bars');
    if (!container) return;

    const totalRecords = data.length;
    if (totalRecords === 0) {
        container.innerHTML = '<p class="text-center text-muted">Không có dữ liệu</p>';
        return;
    }

    const dungGio = data.filter(r => r.TrangThai === 'Đúng giờ').length;
    const diTre = data.filter(r => r.TrangThai === 'Đi trễ').length;
    const veSom = data.filter(r => r.TrangThai === 'Về sớm').length;

    container.innerHTML = `
        <div class="dashboard-bars">
            ${buildBarRow('Đúng giờ', dungGio / totalRecords, 'success', dungGio)}
            ${buildBarRow('Đi trễ', diTre / totalRecords, 'warning', diTre)}
            ${buildBarRow('Về sớm', veSom / totalRecords, 'info', veSom)}
        </div>
    `;
}

/**
 * Xây dựng một hàng biểu đồ cột
 * @param {string} label - Nhãn
 * @param {number} ratio - Tỷ lệ (0-1)
 * @param {string} className - CSS class
 * @param {number} value - Giá trị số
 * @returns {string} - HTML string
 */
function buildBarRow(label, ratio, className, value) {
    const percentage = Math.round(ratio * 100);
    return `
        <div class="bar-row">
            <div class="bar-label">${label}</div>
            <div class="bar-container">
                <div class="bar-fill bar-${className}" style="width: ${percentage}%"></div>
            </div>
            <div class="bar-value">${value}</div>
        </div>
    `;
}

/**
 * Render bảng dữ liệu thân thiện cho dashboard
 * @param {Array} data - Dữ liệu chấm công
 */
function renderDashboardFriendly(data) {
    const container = document.getElementById('dashboard-table');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Không có dữ liệu</p>';
        return;
    }

    // Nhóm dữ liệu theo ngày
    const groupedData = {};
    data.forEach(record => {
        const dateKey = window.utils.getDateKey(record.NgayChamCong);
        if (!groupedData[dateKey]) {
            groupedData[dateKey] = [];
        }
        groupedData[dateKey].push(record);
    });

    // Tạo HTML cho bảng
    let html = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Ngày</th>
                        <th>Tổng nhân viên</th>
                        <th>Đúng giờ</th>
                        <th>Đi trễ</th>
                        <th>Về sớm</th>
                        <th>Tỷ lệ đúng giờ</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Sắp xếp theo ngày (mới nhất trước)
    const sortedDates = Object.keys(groupedData).sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('/');
        const [dayB, monthB, yearB] = b.split('/');
        return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
    });

    sortedDates.forEach(date => {
        const dayData = groupedData[date];
        const total = dayData.length;
        const dungGio = dayData.filter(r => r.TrangThai === 'Đúng giờ').length;
        const diTre = dayData.filter(r => r.TrangThai === 'Đi trễ').length;
        const veSom = dayData.filter(r => r.TrangThai === 'Về sớm').length;
        const tyLeDungGio = total > 0 ? Math.round((dungGio / total) * 100) : 0;

        html += `
            <tr>
                <td><strong>${date}</strong></td>
                <td><span class="badge bg-primary">${total}</span></td>
                <td><span class="badge bg-success">${dungGio}</span></td>
                <td><span class="badge bg-warning">${diTre}</span></td>
                <td><span class="badge bg-info">${veSom}</span></td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-success" role="progressbar" 
                             style="width: ${tyLeDungGio}%" 
                             aria-valuenow="${tyLeDungGio}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                            ${tyLeDungGio}%
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Refresh dữ liệu dashboard
 */
async function refreshDashboardData() {
    try {
        window.utils.showLoading('dashboard-content', true);
        
        const params = new URLSearchParams();
        const data = await fetchAttendance(params);
        
        if (data && data.length > 0) {
            window.utils.currentData = data;
            updateDashboardKpis(data);
            renderDashboardBars(data);
            renderDashboardFriendly(data);
            window.utils.showNotification('Dữ liệu đã được cập nhật', 'success');
        } else {
            document.getElementById('dashboard-content').innerHTML = 
                '<p class="text-center text-muted">Không có dữ liệu chấm công</p>';
        }
    } catch (error) {
        console.error('Lỗi refresh dashboard:', error);
        window.utils.showNotification('Lỗi khi tải dữ liệu dashboard', 'error');
    } finally {
        window.utils.showLoading('dashboard-content', false);
    }
}

// Export functions
window.dashboard = {
    updateDashboardKpis,
    renderDashboardBars,
    buildBarRow,
    renderDashboardFriendly,
    refreshDashboardData
};
