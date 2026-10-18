/**
 * Hạn mức tiền tối đa cho hệ thống Smart Trip: 2.000.000.000 VND (2 tỷ đồng).
 * Giá trị này đảm bảo an toàn tuyệt đối với kiểu dữ liệu INTEGER (32-bit có dấu, tối đa 2.147.483.647) của PostgreSQL.
 * Mọi hạn mức tiền chi tiêu, ngân sách chuyến đi và ngưỡng validation trong ứng dụng
 * bắt buộc phải nhỏ hơn hoặc bằng hằng số này.
 */
export const MAX_MONEY_VND = 2_000_000_000;

export const MAX_EXPENSE_AMOUNT = MAX_MONEY_VND;

export const MAX_TRIP_BUDGET = MAX_MONEY_VND;
