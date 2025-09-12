// Utility functions để format date/time cho export
const formatDateForExport = (date) => date ? new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
const formatTimeForExport = (date) => date ? new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '';
const formatWorkingHoursForExport = (hours) => hours ? hours.toFixed(4) : '';
const generateFileName = () => {
    const now = new Date();
    return `DuLieuChamCong_${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}_${now.getHours()}-${now.getMinutes()}.xlsx`;
};

function exportToExcel(currentData) {
    if (!currentData?.length) {
        alert('Không có dữ liệu để xuất!');
        return;
    }

    const dataToExport = currentData.map(item => ({
        'Mã Nhân Viên': item.MaNhanVienNoiBo,
        'Họ và Tên': item.HoTen,
        'Ngày công': new Date(item.Ngay).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        'Ngày vào': formatDateForExport(item.GioVao),
        'Ngày ra': formatDateForExport(item.GioRa),
        'Giờ vào': formatTimeForExport(item.GioVao),
        'Giờ ra': formatTimeForExport(item.GioRa),
        'Thời gian làm việc (giờ)': formatWorkingHoursForExport(item.ThoiGianLamViec),
        'Trạng thái': item.TrangThai
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chấm Công');
    XLSX.writeFile(workbook, generateFileName());
}

window.exportToExcel = exportToExcel;
