/**
 * Utility Functions
 * Các hàm tiện ích chung cho ứng dụng
 */

// Global variables
let currentData = [];

/**
 * Chuyển đổi date thành định dạng DD/MM/YYYY
 * @param {string|Date} date - Ngày cần chuyển đổi
 * @returns {string|null} - Ngày định dạng DD/MM/YYYY hoặc null
 */
const getDateKey = (date) => {
    const d = new Date(date);
    if (isNaN(d)) return null;
    
    // Format as DD/MM/YYYY
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Set text content cho element với định dạng số Việt Nam
 * @param {string} id - ID của element
 * @param {number} value - Giá trị số
 */
const setTextContent = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value.toLocaleString('vi-VN');
};

/**
 * Chuyển đổi date thành định dạng YYYY-MM-DD cho API
 * @param {string|Date} date - Ngày cần chuyển đổi
 * @returns {string|null} - Ngày định dạng YYYY-MM-DD hoặc null
 */
const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d)) return null;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Xây dựng query parameters từ filters
 * @param {Object} filters - Object chứa các filter
 * @returns {URLSearchParams} - URLSearchParams object
 */
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

/**
 * Hiển thị loading state
 * @param {string} elementId - ID của element cần hiển thị loading
 * @param {boolean} show - Hiển thị hoặc ẩn loading
 */
const showLoading = (elementId, show = true) => {
    const element = document.getElementById(elementId);
    if (element) {
        if (show) {
            element.innerHTML = '<div class="loading">Đang tải...</div>';
        }
    }
};

/**
 * Hiển thị thông báo
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo (success, error, info)
 */
const showNotification = (message, type = 'info') => {
    // Tạo notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Thêm vào body
    document.body.appendChild(notification);
    
    // Tự động xóa sau 3 giây
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
};

// Export functions for use in other modules
window.utils = {
    currentData,
    getDateKey,
    setTextContent,
    formatDateForAPI,
    buildQueryParams,
    showLoading,
    showNotification
};
