/**
 * Reports Module
 * Xử lý các chức năng báo cáo
 */

/**
 * Initialize reports tab
 */
function initReportsTab() {
    const reportsTab = document.getElementById('reports-tab');
    if (!reportsTab) return;

    // Tạo các sub-tabs
    reportsTab.innerHTML = `
        <div class="reports-container">
            <div class="reports-header">
                <h3>Báo cáo chấm công</h3>
                <div class="reports-controls">
                    <button class="btn btn-primary" onclick="window.reports.refreshReportsData()">
                        <i class="fas fa-sync-alt"></i> Làm mới
                    </button>
                </div>
            </div>
            
            <div class="reports-tabs">
                <button class="tab-button active" onclick="window.reports.showReportTab('summary')">
                    Tổng hợp
                </button>
                <button class="tab-button" onclick="window.reports.showReportTab('name')">
                    Theo tên
                </button>
                <button class="tab-button" onclick="window.reports.showReportTab('id')">
                    Theo mã NV
                </button>
                <button class="tab-button" onclick="window.reports.showReportTab('department')">
                    Theo phòng ban
                </button>
                <button class="tab-button" onclick="window.reports.showReportTab('month')">
                    Theo tháng
                </button>
            </div>
            
            <div class="reports-content">
                <div id="summary-report" class="report-panel active">
                    ${generateSummaryReportPanel()}
                </div>
                <div id="name-report" class="report-panel">
                    ${generateNameReportPanel()}
                </div>
                <div id="id-report" class="report-panel">
                    ${generateIdReportPanel()}
                </div>
                <div id="department-report" class="report-panel">
                    ${generateDepartmentReportPanel()}
                </div>
                <div id="month-report" class="report-panel">
                    ${generateMonthReportPanel()}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate Summary Report Panel
 */
function generateSummaryReportPanel() {
    return `
        <div class="report-filters">
            <div class="row">
                <div class="col-md-3">
                    <label>Từ ngày:</label>
                    <input type="date" id="summary-start-date" class="form-control">
                </div>
                <div class="col-md-3">
                    <label>Đến ngày:</label>
                    <input type="date" id="summary-end-date" class="form-control">
                </div>
                <div class="col-md-3">
                    <label>Phòng ban:</label>
                    <select id="summary-department" class="form-control">
                        <option value="">Tất cả</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label>&nbsp;</label>
                    <button class="btn btn-primary w-100" onclick="window.reports.generateSummaryReport()">
                        Tạo báo cáo
                    </button>
                </div>
            </div>
        </div>
        <div id="summary-report-content" class="report-content">
            <p class="text-muted">Chọn khoảng thời gian và nhấn "Tạo báo cáo"</p>
        </div>
    `;
}

/**
 * Generate Name Report Panel
 */
function generateNameReportPanel() {
    return `
        <div class="report-filters">
            <div class="row">
                <div class="col-md-4">
                    <label>Tên nhân viên:</label>
                    <input type="text" id="name-search" class="form-control" placeholder="Nhập tên nhân viên">
                </div>
                <div class="col-md-4">
                    <label>Từ ngày:</label>
                    <input type="date" id="name-start-date" class="form-control">
                </div>
                <div class="col-md-4">
                    <label>&nbsp;</label>
                    <button class="btn btn-primary w-100" onclick="window.reports.generateNameReport()">
                        Tìm kiếm
                    </button>
                </div>
            </div>
        </div>
        <div id="name-report-content" class="report-content">
            <p class="text-muted">Nhập tên nhân viên để tìm kiếm</p>
        </div>
    `;
}

/**
 * Generate ID Report Panel
 */
function generateIdReportPanel() {
    return `
        <div class="report-filters">
            <div class="row">
                <div class="col-md-4">
                    <label>Mã nhân viên:</label>
                    <input type="text" id="id-search" class="form-control" placeholder="Nhập mã nhân viên">
                </div>
                <div class="col-md-4">
                    <label>Từ ngày:</label>
                    <input type="date" id="id-start-date" class="form-control">
                </div>
                <div class="col-md-4">
                    <label>&nbsp;</label>
                    <button class="btn btn-primary w-100" onclick="window.reports.generateIdReport()">
                        Tìm kiếm
                    </button>
                </div>
            </div>
        </div>
        <div id="id-report-content" class="report-content">
            <p class="text-muted">Nhập mã nhân viên để tìm kiếm</p>
        </div>
    `;
}

/**
 * Generate Department Report Panel
 */
function generateDepartmentReportPanel() {
    return `
        <div class="report-filters">
            <div class="row">
                <div class="col-md-4">
                    <label>Phòng ban:</label>
                    <select id="department-search" class="form-control">
                        <option value="">Chọn phòng ban</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label>Từ ngày:</label>
                    <input type="date" id="department-start-date" class="form-control">
                </div>
                <div class="col-md-4">
                    <label>&nbsp;</label>
                    <button class="btn btn-primary w-100" onclick="window.reports.generateDepartmentReport()">
                        Tạo báo cáo
                    </button>
                </div>
            </div>
        </div>
        <div id="department-report-content" class="report-content">
            <p class="text-muted">Chọn phòng ban để tạo báo cáo</p>
        </div>
    `;
}

/**
 * Generate Month Report Panel
 */
function generateMonthReportPanel() {
    return `
        <div class="report-filters">
            <div class="row">
                <div class="col-md-3">
                    <label>Năm:</label>
                    <select id="month-year" class="form-control">
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label>Tháng:</label>
                    <select id="month-month" class="form-control">
                        <option value="1">Tháng 1</option>
                        <option value="2">Tháng 2</option>
                        <option value="3">Tháng 3</option>
                        <option value="4">Tháng 4</option>
                        <option value="5">Tháng 5</option>
                        <option value="6">Tháng 6</option>
                        <option value="7">Tháng 7</option>
                        <option value="8">Tháng 8</option>
                        <option value="9">Tháng 9</option>
                        <option value="10">Tháng 10</option>
                        <option value="11">Tháng 11</option>
                        <option value="12">Tháng 12</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label>Phòng ban:</label>
                    <select id="month-department" class="form-control">
                        <option value="">Tất cả</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label>&nbsp;</label>
                    <button class="btn btn-primary w-100" onclick="window.reports.generateMonthReport()">
                        Tạo báo cáo
                    </button>
                </div>
            </div>
        </div>
        <div id="month-report-content" class="report-content">
            <p class="text-muted">Chọn năm, tháng để tạo báo cáo</p>
        </div>
    `;
}

/**
 * Show specific report tab
 * @param {string} tabName - Tên tab cần hiển thị
 */
function showReportTab(tabName) {
    // Ẩn tất cả panels
    document.querySelectorAll('.report-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Ẩn tất cả tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Hiển thị panel được chọn
    const targetPanel = document.getElementById(`${tabName}-report`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
    
    // Active tab button
    const targetButton = document.querySelector(`[onclick="window.reports.showReportTab('${tabName}')"]`);
    if (targetButton) {
        targetButton.classList.add('active');
    }
}

/**
 * Refresh reports data
 */
async function refreshReportsData() {
    try {
        window.utils.showNotification('Đang tải dữ liệu báo cáo...', 'info');
        
        // Load departments
        await loadDepartments();
        
        window.utils.showNotification('Dữ liệu báo cáo đã được cập nhật', 'success');
    } catch (error) {
        console.error('Lỗi refresh reports:', error);
        window.utils.showNotification('Lỗi khi tải dữ liệu báo cáo', 'error');
    }
}

/**
 * Load departments for dropdowns
 */
async function loadDepartments() {
    try {
        const response = await fetch('/departments');
        const departments = await response.json();
        
        // Update all department dropdowns
        const departmentSelects = document.querySelectorAll('select[id*="department"]');
        departmentSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Tất cả</option>';
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                select.appendChild(option);
            });
            select.value = currentValue;
        });
    } catch (error) {
        console.error('Lỗi load departments:', error);
    }
}

// Export functions
window.reports = {
    initReportsTab,
    showReportTab,
    refreshReportsData,
    loadDepartments,
    generateSummaryReportPanel,
    generateNameReportPanel,
    generateIdReportPanel,
    generateDepartmentReportPanel,
    generateMonthReportPanel
};
