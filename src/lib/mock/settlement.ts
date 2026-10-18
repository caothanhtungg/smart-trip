import type { MemberBankInfo } from "@/types/settlement";

/**
 * Dữ liệu ngân hàng giả lập cho các thành viên trong phiên demo (Quyết định Q2 đã duyệt).
 * - Thành viên chưa có tài khoản (m4 - Thanh Quang) KHÔNG có STK để kiểm thử trường hợp thanh toán tiền mặt (R17).
 * - Tất cả đều là dữ liệu minh họa giả định, không gọi API ngân hàng ngoài hệ thống.
 */
export const MOCK_MEMBER_BANK_INFO: Record<string, MemberBankInfo> = {
  // m1: Lan Nguyễn (Host)
  m1: {
    bankName: "Techcombank (Kỹ Thương)",
    bankBin: "970407",
    accountNumber: "19036542890011",
    accountHolder: "NGUYEN PHUONG LAN",
  },
  // m2: Tuấn Huy
  m2: {
    bankName: "Vietcombank (Ngoại Thương)",
    bankBin: "970436",
    accountNumber: "0071001234567",
    accountHolder: "TRAN TUAN HUY",
  },
  // m3: Quang Minh
  m3: {
    bankName: "MBBank (Quân Đội)",
    bankBin: "970422",
    accountNumber: "0987654321",
    accountHolder: "LE QUANG MINH",
  },
  // m5: Thu Hà
  m5: {
    bankName: "VPBank (Việt Nam Thịnh Vượng)",
    bankBin: "970432",
    accountNumber: "123456789",
    accountHolder: "HOANG THU HA",
  },
  // m4: Thanh Quang (isNoAccount) => undefined (Không có STK)
};
