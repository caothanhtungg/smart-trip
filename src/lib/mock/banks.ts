export interface BankItem {
  bin: string;
  shortName: string;
  name: string;
  code: string;
  logoText: string;
}

/**
 * 15 ngân hàng thương mại phổ biến tại Việt Nam hỗ trợ chuẩn VietQR / Napas 247.
 * Mã BIN chuẩn theo quy định của Ngân hàng Nhà nước và Napas.
 */
export const POPULAR_BANKS: readonly BankItem[] = Object.freeze([
  {
    bin: "970407",
    code: "TCB",
    shortName: "Techcombank",
    name: "Ngân hàng TMCP Kỹ Thương Việt Nam",
    logoText: "TCB",
  },
  {
    bin: "970436",
    code: "VCB",
    shortName: "Vietcombank",
    name: "Ngân hàng TMCP Ngoại Thương Việt Nam",
    logoText: "VCB",
  },
  {
    bin: "970422",
    code: "MB",
    shortName: "MBBank",
    name: "Ngân hàng TMCP Quân Đội",
    logoText: "MB",
  },
  {
    bin: "970415",
    code: "CTG",
    shortName: "VietinBank",
    name: "Ngân hàng TMCP Công Thương Việt Nam",
    logoText: "CTG",
  },
  {
    bin: "970418",
    code: "BIDV",
    shortName: "BIDV",
    name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    logoText: "BIDV",
  },
  {
    bin: "970432",
    code: "VPB",
    shortName: "VPBank",
    name: "Ngân hàng TMCP Việt Nam Thịnh Vượng",
    logoText: "VPB",
  },
  {
    bin: "970416",
    code: "ACB",
    shortName: "ACB",
    name: "Ngân hàng TMCP Á Châu",
    logoText: "ACB",
  },
  {
    bin: "970423",
    code: "TPB",
    shortName: "TPBank",
    name: "Ngân hàng TMCP Tiên Phong",
    logoText: "TPB",
  },
  {
    bin: "970403",
    code: "STB",
    shortName: "Sacombank",
    name: "Ngân hàng TMCP Sài Gòn Thương Tín",
    logoText: "STB",
  },
  {
    bin: "970437",
    code: "HDB",
    shortName: "HDBank",
    name: "Ngân hàng TMCP Phát triển TP.HCM",
    logoText: "HDB",
  },
  {
    bin: "970441",
    code: "VIB",
    shortName: "VIB",
    name: "Ngân hàng TMCP Quốc tế Việt Nam",
    logoText: "VIB",
  },
  {
    bin: "970443",
    code: "SHB",
    shortName: "SHB",
    name: "Ngân hàng TMCP Sài Gòn - Hà Nội",
    logoText: "SHB",
  },
  {
    bin: "970426",
    code: "MSB",
    shortName: "MSB",
    name: "Ngân hàng TMCP Hàng Hải Việt Nam",
    logoText: "MSB",
  },
  {
    bin: "970448",
    code: "OCB",
    shortName: "OCB",
    name: "Ngân hàng TMCP Phương Đông",
    logoText: "OCB",
  },
  {
    bin: "970429",
    code: "SCB",
    shortName: "SCB",
    name: "Ngân hàng TMCP Sài Gòn",
    logoText: "SCB",
  },
]);

export function findBankByBin(bin: string): BankItem | undefined {
  return POPULAR_BANKS.find((b) => b.bin === bin);
}
