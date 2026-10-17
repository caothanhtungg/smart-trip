import * as React from "react";

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="100%" height="100%">
  <defs>
    <linearGradient id="heroCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#D9ED92"/>
      <stop offset="35%" stopColor="#52B69A"/>
      <stop offset="70%" stopColor="#1A759F"/>
      <stop offset="100%" stopColor="#184E77"/>
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#184E77" floodOpacity="0.12"/>
    </filter>
    <filter id="floatShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#184E77" floodOpacity="0.15"/>
    </filter>
  </defs>

  {/*  Ambient Decorative Background Circles  */}
  <circle cx="300" cy="240" r="190" fill="#E2F2D5" opacity="0.45" />
  <circle cx="460" cy="120" r="90" fill="#D9ED92" opacity="0.6" />
  <circle cx="120" cy="380" r="70" fill="#B5E48C" opacity="0.35" />

  {/*  Connecting Curved Route / Dash Line  */}
  <path d="M 140,320 C 180,180 320,130 430,210 C 490,260 480,380 380,410" 
        fill="none" stroke="#52B69A" strokeWidth="4" strokeDasharray="8 8" strokeLinecap="round"/>

  {/*  Main Trip Card (Center Behind)  */}
  <g transform="translate(140, 70)" filter="url(#softShadow)">
    <rect width="320" height="230" rx="20" fill="#FFFFFF"/>
    {/*  Card Gradient Top Strip  */}
    <path d="M 0,20 Q 0,0 20,0 L 300,0 Q 320,0 320,20 L 320,56 L 0,56 Z" fill="url(#heroCardGrad)"/>
    <text x="24" y="36" fill="#FFFFFF" fontFamily="'Be Vietnam Pro', sans-serif" fontWeight="700" fontSize="16">Đà Lạt 3N2Đ • Nhóm bạn thân</text>
    
    {/*  Members in card  */}
    <g transform="translate(24, 76)">
      <circle cx="16" cy="16" r="16" fill="#D9ED92"/>
      <text x="16" y="21" fontFamily="sans-serif" fontWeight="bold" fontSize="11" fill="#184E77" textAnchor="middle">M</text>
      
      <circle cx="44" cy="16" r="16" fill="#B5E48C"/>
      <text x="44" y="21" fontFamily="sans-serif" fontWeight="bold" fontSize="11" fill="#184E77" textAnchor="middle">L</text>
      
      <circle cx="72" cy="16" r="16" fill="#99D98C"/>
      <text x="72" y="21" fontFamily="sans-serif" fontWeight="bold" fontSize="11" fill="#184E77" textAnchor="middle">T</text>

      <circle cx="100" cy="16" r="16" fill="#52B69A"/>
      <text x="100" y="21" fontFamily="sans-serif" fontWeight="bold" fontSize="11" fill="#FFFFFF" textAnchor="middle">H</text>

      <circle cx="128" cy="16" r="16" fill="#FFFFFF" stroke="#52B69A" strokeWidth="1.5" strokeDasharray="3 3"/>
      <text x="128" y="21" fontFamily="sans-serif" fontWeight="bold" fontSize="11" fill="#184E77" textAnchor="middle">N</text>

      <text x="160" y="21" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="13" fill="#5B6B78">+5 thành viên</text>
    </g>

    {/*  Expense Progress bar inside card  */}
    <g transform="translate(24, 126)">
      <text x="0" y="0" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="13" fill="#5B6B78">Ngân sách chi tiêu</text>
      <text x="272" y="0" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="13" fontWeight="600" fill="#184E77" textAnchor="end">8.450.000 ₫ / 10M</text>
      
      <rect x="0" y="10" width="272" height="8" rx="4" fill="#E2F2D5"/>
      <rect x="0" y="10" width="228" height="8" rx="4" fill="#76C893"/>
    </g>

    {/*  Quick Stat in card  */}
    <g transform="translate(24, 168)">
      <rect width="272" height="42" rx="10" fill="#F4F9EC"/>
      <text x="16" y="26" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="13" fill="#2B3A46">Số dư của bạn</text>
      <text x="256" y="26" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="14" fontWeight="700" fill="#2E7D5B" textAnchor="end">+350.000 ₫</text>
    </g>
  </g>

  {/*  Left Floating Receipt Card  */}
  <g transform="translate(50, 230)" filter="url(#floatShadow)">
    <rect width="190" height="200" rx="14" fill="#FFFFFF" stroke="#DDEBD0" strokeWidth="1.5"/>
    <rect x="18" y="18" width="34" height="34" rx="8" fill="#D9ED92"/>
    {/*  Receipt Icon in mini badge  */}
    <path d="M 27,27 L 43,27 M 27,34 L 39,34 M 27,41 L 35,41" stroke="#184E77" strokeWidth="2.5" strokeLinecap="round"/>
    
    <text x="60" y="32" fontFamily="'Be Vietnam Pro', sans-serif" fontWeight="700" fontSize="13" fill="#184E77">Lẩu bò Ba Toa</text>
    <text x="60" y="46" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="11" fill="#5B6B78">Chia theo từng món</text>

    {/*  Receipt rows  */}
    <line x1="18" y1="64" x2="172" y2="64" stroke="#DDEBD0" strokeWidth="1" strokeDasharray="4 3"/>
    <text x="18" y="86" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="12" fill="#2B3A46">Lẩu bò (L)</text>
    <text x="172" y="86" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="12" fontWeight="600" fill="#184E77" textAnchor="end">450.000 ₫</text>
    
    <text x="18" y="110" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="12" fill="#2B3A46">Bia & Nước ngọt</text>
    <text x="172" y="110" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="12" fontWeight="600" fill="#184E77" textAnchor="end">330.000 ₫</text>

    <text x="18" y="134" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="12" fill="#2B3A46">VAT & Phí DV</text>
    <text x="172" y="134" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="12" fontWeight="600" fill="#184E77" textAnchor="end">130.000 ₫</text>

    <line x1="18" y1="150" x2="172" y2="150" stroke="#DDEBD0" strokeWidth="1.5"/>
    <text x="18" y="174" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="12" fontWeight="700" fill="#184E77">Khớp hóa đơn</text>
    <rect x="118" y="159" width="54" height="22" rx="11" fill="#EAF7EC"/>
    <text x="145" y="174" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="11" fontWeight="600" fill="#2E7D5B" textAnchor="middle">Chuẩn 100%</text>
  </g>

  {/*  Right Floating QR / Transfer Card  */}
  <g transform="translate(360, 240)" filter="url(#floatShadow)">
    <rect width="195" height="190" rx="16" fill="#FFFFFF" stroke="#DDEBD0" strokeWidth="1.5"/>
    
    {/*  QR preview mockup block  */}
    <rect x="20" y="20" width="64" height="64" rx="8" fill="#F4F9EC" stroke="#1A759F" strokeWidth="1.5"/>
    {/*  QR pixel patterns  */}
    <rect x="26" y="26" width="14" height="14" fill="#184E77"/>
    <rect x="29" y="29" width="8" height="8" fill="#FFFFFF"/>
    <rect x="64" y="26" width="14" height="14" fill="#184E77"/>
    <rect x="67" y="29" width="8" height="8" fill="#FFFFFF"/>
    <rect x="26" y="64" width="14" height="14" fill="#184E77"/>
    <rect x="29" y="67" width="8" height="8" fill="#FFFFFF"/>
    <rect x="46" y="32" width="6" height="6" fill="#168AAD"/>
    <rect x="54" y="44" width="6" height="12" fill="#52B69A"/>
    <rect x="44" y="58" width="12" height="6" fill="#184E77"/>
    <rect x="62" y="58" width="8" height="8" fill="#1A759F"/>

    {/*  QR Right detail text  */}
    <text x="96" y="38" fontFamily="'Be Vietnam Pro', sans-serif" fontWeight="700" fontSize="13" fill="#184E77">QR Thanh toán</text>
    <text x="96" y="56" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="11" fill="#5B6B78">Vietcombank</text>
    <text x="96" y="74" fontFamily="'Be Vietnam Pro', sans-serif" fontWeight="700" fontSize="15" fill="#1A759F">120.000 ₫</text>

    {/*  Rút gọn nợ badge  */}
    <g transform="translate(18, 102)">
      <rect width="159" height="34" rx="8" fill="#FFF1E6"/>
      <path d="M 28,119 L 40,119 M 36,115 L 40,119 L 36,123" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="50" y="123" fontFamily="'Be Vietnam Pro', sans-serif" fontWeight="600" fontSize="11" fill="#C2410C">Rút gọn: 12 nợ → 3 lệnh</text>
    </g>

    {/*  Mini Action Button  */}
    <g transform="translate(18, 146)">
      <rect width="159" height="28" rx="8" fill="#1A759F"/>
      <text x="79" y="164" fontFamily="'Be Vietnam Pro', sans-serif" fontWeight="600" fontSize="11" fill="#FFFFFF" textAnchor="middle">Quét trả ngay</text>
    </g>
  </g>

  {/*  Big Decorative Map Pin & Badge (Top Right)  */}
  <g transform="translate(450, 40)" filter="url(#floatShadow)">
    <circle cx="28" cy="28" r="28" fill="#1A759F"/>
    <path d="M 28,14 C 21.4,14 16,19.4 16,26 C 16,35 28,44 28,44 C 28,44 40,35 40,26 C 40,19.4 34.6,14 28,14 Z" fill="#D9ED92"/>
    <circle cx="28" cy="24" r="4.5" fill="#184E77"/>
  </g>

  {/*  Decorative Green Badge (Top Left)  */}
  <g transform="translate(80, 80)" filter="url(#floatShadow)">
    <circle cx="22" cy="22" r="22" fill="#52B69A"/>
    <path d="M 14,22 L 20,28 L 30,16" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </g>
</svg>
  );
}
