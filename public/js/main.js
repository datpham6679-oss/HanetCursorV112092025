/**
 * Main Application Entry Point
 * Điểm khởi đầu chính của ứng dụng
 */

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Khởi tạo ứng dụng Hanet Attendance Management');
        
        // Initialize tabs
        window.data.initTabs();
        
        // Load initial data
        const params = new URLSearchParams();
        const data = await window.data.fetchAttendance(params);
        
        if (data && data.length > 0) {
            window.utils.currentData = data;
            console.log(`✅ Đã tải ${data.length} bản ghi chấm công`);
            
            // Initialize dashboard
            window.dashboard.updateDashboardKpis(data);
            window.dashboard.renderDashboardBars(data);
            window.dashboard.renderDashboardFriendly(data);
        } else {
            console.log('ℹ️ Không có dữ liệu chấm công');
        }
        
        // Set up refresh button handlers
        setupRefreshButtons();
        
        console.log('✅ Ứng dụng đã khởi tạo thành công');
        
    } catch (error) {
        console.error('❌ Lỗi khởi tạo ứng dụng:', error);
        window.utils.showNotification('Lỗi khởi tạo ứng dụng', 'error');
    }
});

/**
 * Setup refresh button handlers
 */
function setupRefreshButtons() {
    // Dashboard refresh button
    const dashboardRefreshBtn = document.getElementById('dashboard-refresh');
    if (dashboardRefreshBtn) {
        dashboardRefreshBtn.addEventListener('click', () => {
            window.dashboard.refreshDashboardData();
        });
    }
    
    // Activity refresh button
    const activityRefreshBtn = document.getElementById('activity-refresh');
    if (activityRefreshBtn) {
        activityRefreshBtn.addEventListener('click', () => {
            window.data.loadActivityData();
        });
    }
}

/**
 * Global refresh function for dashboard
 */
window.refreshDashboardData = () => {
    window.dashboard.refreshDashboardData();
};

// Export main functions
window.main = {
    setupRefreshButtons
};
