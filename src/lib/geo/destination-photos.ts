/**
 * Dịch vụ hình ảnh danh lam thắng cảnh và bộ sưu tập điểm đến Việt Nam.
 * Cung cấp ảnh chụp chất lượng cao, thông tin nhiếp ảnh, mô tả điểm tham quan
 * và mẹo du lịch cho giao diện Split-View và thẻ lịch trình thông minh.
 */

export interface DestinationPhoto {
  url: string;
  caption: string;
  photographer: string;
  tags: string[];
  description?: string;
  recommendedTip?: string;
}

export interface DiscoveryDestination {
  id: string;
  name: string;
  province: string;
  coordinates: [number, number];
  photo: DestinationPhoto;
  badge: string;
  category: 'mountain' | 'beach' | 'heritage' | 'city' | 'nature';
  description: string;
  recommendedSeason: string;
  estimatedBudget: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

// Kho ảnh chất lượng cao các danh lam thắng cảnh Việt Nam từ cộng đồng Unsplash
const LANDMARK_PHOTO_DATABASE: Array<{
  keywords: string[];
  photos: DestinationPhoto[];
}> = [
    {
      keywords: ['ninh binh', 'ninhbinh', 'trang an', 'tam coc', 'hang mua', 'hoa lu', 'bai dinh', 'bich dong', 'thung nham'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Quần thể danh thắng Tràng An – Tam Cốc non xanh nước biếc',
          photographer: 'Vietnam Heritage Collection',
          tags: ['Ninh Bình', 'Tràng An', 'Tam Cốc', 'Hang Múa', 'Di sản UNESCO'],
          description: 'Di sản văn hóa & thiên nhiên thế giới UNESCO với đò nan xuyên thủy động kỳ ảo, non nước hữu tình và đỉnh Ngọa Long Hang Múa.',
          recommendedTip: 'Leo gần 500 bậc đá lên đỉnh Hang Múa lúc hoàng hôn để bắt trọn ánh nắng rực rỡ chiếu xuống dòng sông Ngô Đồng.',
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Toàn cảnh dòng sông Ngô Đồng uốn lượn nhìn từ đỉnh Hang Múa',
          photographer: 'Tam Coc Landscapes',
          tags: ['Hang Múa', 'Đỉnh Ngọa Long', 'Mùa lúa'],
        },
      ],
    },
    {
      keywords: ['son doong', 'sondoong', 'phong nha', 'ke bang', 'quang binh', 'hang en', 'song chay', 'dong thien duong', 'ban doong'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Hang Sơn Đoòng - Kỳ quan hang động tự nhiên lớn nhất thế giới',
          photographer: 'Oxalis / Cave Explorer',
          tags: ['Sơn Đoòng', 'Phong Nha', 'Hang Én', 'Thám hiểm', 'Hố Sụt'],
          description: 'Hang động tự nhiên lớn nhất hành tinh với rừng nguyên sinh trong lòng hang, hố sụt Vọng Khủng Long và sông ngầm kỳ vĩ.',
          recommendedTip: 'Mùa săn tia nắng xuyên Hố Sụt 1 đẹp nhất từ tháng 2 đến tháng 4; luôn trang bị giày thoát nước nhanh có độ bám đá cao.',
        },
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Bãi cát hạ trại khổng lồ và hồ nước ngầm trong lòng Hang Én',
          photographer: 'Vietnam Caving Expedition',
          tags: ['Hang Én', 'Hạ trại', 'Hồ ngầm'],
        },
      ],
    },
    {
      keywords: ['ha long', 'halong', 'quang ninh', 'vinh ha long', 'ti top', 'sung sot', 'hang luon', 'bai chay', 'hon gai', 'tuan chau', 'thien cung', 'trong mai', 'cung ca heo'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới giữa làn nước ngọc bích',
          photographer: 'Halong Heritage Collection',
          tags: ['Vịnh Hạ Long', 'Du thuyền', 'Hang Sửng Sốt', 'Đảo Ti Tốp', 'Di sản UNESCO'],
          description: 'Quần thể đảo đá vôi kỳ vĩ vươn lên giữa vịnh biển ngọc bích, hang động thạch nhũ hàng triệu năm tuổi và bãi cát trăng lưỡi liềm Ti Tốp.',
          recommendedTip: 'Bắt buộc mang bình giữ nhiệt cá nhân vì cảng cấm đồ nhựa 1 lần; chọn Tuyến 2 (6 tiếng) để leo đỉnh Ti Tốp và vào Hang Sửng Sốt.',
        },
        {
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          caption: 'Hải trình du thuyền lướt sóng qua cụm hòn Trống Mái trên Vịnh Hạ Long',
          photographer: 'Cruise Explorer',
          tags: ['Hòn Trống Mái', 'Du thuyền', 'Vịnh Hạ Long'],
        },
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Chèo thuyền kayak và đò nan qua vòm đá tự nhiên tuyệt mỹ tại Hang Luồn',
          photographer: 'Kayak Adventure',
          tags: ['Hang Luồn', 'Chèo Kayak', 'Vòm đá'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Toàn cảnh 360 độ Vịnh Hạ Long nhìn từ đỉnh núi đá Đảo Ti Tốp',
          photographer: 'Halong Panorama',
          tags: ['Đảo Ti Tốp', 'Ngắm cảnh 360', 'Bãi tắm'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Bảo tàng Quảng Ninh kiến trúc than đá đen tuyền bên vịnh biển Hòn Gai',
          photographer: 'Quang Ninh Museum',
          tags: ['Bảo tàng Quảng Ninh', 'Hòn Gai', 'Kiến trúc'],
        },
      ],
    },
    {
      keywords: ['sa pa', 'sapa', 'fansipan', 'fanxipan', 'o quy ho', 'lao chai', 'ta van', 'cat cat', 'muong hoa', 'thac bac', 'ham rong', 'sun plaza', 'moana sapa', 'lao cai'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Đỉnh Fansipan 3.143m - Nóc nhà Đông Dương bồng bềnh giữa biển mây',
          photographer: 'Fansipan Legend Explorer',
          tags: ['Sa Pa', 'Fansipan', 'Săn mây', 'Hoàng Liên Sơn', 'Bản Cát Cát'],
          description: 'Chinh phục đỉnh cao 3.143m ngắm nhìn biển mây bồng bềnh, dạo bước qua các thửa ruộng bậc thang Mường Hoa và trải nghiệm văn hóa H\'Mông, Dao Đỏ.',
          recommendedTip: 'Nhiệt độ trên đỉnh Fansipan thấp hơn thị xã 8°C – 12°C và gió mạnh; luôn mặc nhiều lớp áo (layering) và dán miếng giữ nhiệt.',
        },
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Thung lũng Mường Hoa uốn lượn bên triền ruộng bậc thang mùa lúa chín',
          photographer: 'Sapa Valley Photographers',
          tags: ['Mường Hoa', 'Ruộng bậc thang', 'Tả Van', 'Lao Chải'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Bản Cát Cát cổ kính nép mình bên dòng thác Tiên Sa róc rách',
          photographer: 'Cat Cat Heritage',
          tags: ['Bản Cát Cát', 'Thác Tiên Sa', 'Bản H\'Mông'],
        },
        {
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          caption: 'Hoàng hôn rực lửa trên Đỉnh Đèo Ô Quy Hồ - Tứ đại đỉnh đèo Tây Bắc',
          photographer: 'O Quy Ho Pass',
          tags: ['Đèo Ô Quy Hồ', 'Cổng trời', 'Hoàng hôn', 'Tây Bắc'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Kiến trúc phong cách Pháp cổ kính của Toà nhà Sun Plaza tại trung tâm Sa Pa',
          photographer: 'Sun Plaza Sapa',
          tags: ['Sun Plaza', 'Nhà thờ Đá', 'Trung tâm Sa Pa'],
        },
      ],
    },
    {
      keywords: ['ha giang', 'hagiang', 'dong van', 'meo vac', 'ma pi leng', 'nho que', 'lung cu', 'quan ba', 'sung la', 'yen minh', 'lo lo chai', 'pa vi', 'tham ma', 'tu san'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Hẻm vực Tu Sản & dòng sông Nho Quế xanh ngọc bích dưới chân đèo Mã Pí Lèng',
          photographer: 'Ha Giang Loop Explorer',
          tags: ['Hà Giang', 'Mã Pí Lèng', 'Sông Nho Quế', 'Hẻm Tu Sản', 'Đồng Văn'],
          description: 'Công viên địa chất toàn cầu UNESCO với đệ nhất hùng quan Mã Pí Lèng, hẻm vực Tu Sản sâu nhất Đông Nam Á và cung đường phượt huyền thoại Ha Giang Loop.',
          recommendedTip: 'Đi thuyền sông Nho Quế nên gửi xe máy trên đỉnh dốc và đi xe ôm/xe trung chuyển xuống bến Tà Làng để đảm bảo an toàn tuyệt đối.',
        },
        {
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Đèo Mã Pí Lèng - Đệ nhất hùng quan hiểm trở bậc nhất Việt Nam',
          photographer: 'Vietnam Roadtrip Collection',
          tags: ['Mã Pí Lèng', 'Tứ đại đỉnh đèo', 'Cao nguyên đá'],
        },
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Cột cờ Quốc gia Lũng Cú kiêu hãnh tại điểm cực Bắc địa đầu Tổ quốc',
          photographer: 'Lung Cu Flag Tower',
          tags: ['Lũng Cú', 'Cực Bắc', 'Bản Lô Lô Chải'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Dốc Thẩm Mã uốn lượn chín khúc ngoạn mục giữa thung lũng đá tai mèo',
          photographer: 'Tham Ma Pass',
          tags: ['Dốc Thẩm Mã', 'Quốc lộ 4C', 'Đồng Văn'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Dinh thự Vua Mèo (Họ Vương) kiến trúc đá cổ kính giữa thung lũng Sà Phìn',
          photographer: 'Vuong Palace Heritage',
          tags: ['Dinh Vua Mèo', 'Sà Phìn', 'Kiến trúc cổ'],
        },
      ],
    },
    {
      keywords: ['my son', 'myson', 'thanh dia my son', 'tra kieu', 'ma chau', 'duy xuyen', 'champa', 'thanh ha', 'quang nam', 'thach ban', 'duy vinh'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Quần thể tháp Chăm cổ kính thâm nghiêm giữa thung lũng Thánh địa Mỹ Sơn',
          photographer: 'My Son Sanctuary Heritage',
          tags: ['Mỹ Sơn', 'Tháp Chăm', 'Di sản UNESCO', 'Quảng Nam', 'Văn hóa Champa'],
          description: 'Di sản văn hóa thế giới UNESCO với quần thể đền tháp Champa cổ đại xây bằng kỹ thuật gạch không mạch vữa kỳ bí trong thung lũng núi Chúa.',
          recommendedTip: 'Nên có mặt tại cổng soát vé lúc 06:30 sáng để ngắm ánh bình minh xiên qua tháp cổ, tránh nắng gắt và xem múa Apsara suất 09:15.',
        },
        {
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Chi tiết điêu khắc vũ nữ Apsara và hoa văn sa thạch tinh xảo trên tường tháp cổ',
          photographer: 'Champa Architecture',
          tags: ['Điêu khắc Champa', 'Apsara', 'Nhóm tháp B C D'],
        },
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Chùa Cầu và dòng sông Hoài thơ mộng tại trung tâm Phố cổ Hội An',
          photographer: 'Hoi An Ancient Town',
          tags: ['Phố cổ Hội An', 'Chùa Cầu', 'Sông Hoài'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Làng gốm Thanh Hà truyền thống 500 năm tuổi thanh bình bên bờ sông Thu Bồn',
          photographer: 'Thanh Ha Pottery',
          tags: ['Làng gốm Thanh Hà', 'Sông Thu Bồn', 'Làng nghề'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Bảo tàng Điêu khắc Chăm nơi lưu giữ các bảo vật quốc gia gốc từ Mỹ Sơn',
          photographer: 'Cham Sculpture Museum',
          tags: ['Bảo tàng Chăm', 'Đài thờ Mỹ Sơn E1', 'Cổ vật'],
        },
      ],
    },
    {
      keywords: ['chua thien mu', 'thien mu', 'linh mu tu', 'thap phuoc duyen', 'ha khe', 'kim long', 'thuy bieu', 'an hien', 'van thanh hue', 'huyen khong son thuong', 'hon chen', 'ho quyen', 'chua tu hieu'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Tháp Phước Duyên 7 tầng cao 21m biểu tượng linh thiêng bên bờ sông Hương trên đồi Hà Khê',
          photographer: 'Thien Mu Pagoda Heritage',
          tags: ['Chùa Thiên Mụ', 'Tháp Phước Duyên', 'Đồi Hà Khê', 'Sông Hương'],
          description: 'Chùa Thiên Mụ (Linh Mụ Tự) được Chúa Tiên Nguyễn Hoàng khởi lập năm 1601, là biểu tượng tâm linh và văn hóa nổi tiếng của cố đô Huế.',
          recommendedTip: 'Chùa mở cửa tự do và miễn phí vé. Nên đến sáng sớm 06:30 - 08:30 hoặc hoàng hôn 16:00 - 17:30 để đón trọn khung cảnh sông Hương tĩnh lặng.',
        },
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Nhà vườn An Hiên - Tuyệt tác kiến trúc nhà rường Huế truyền thống hơn 130 năm tuổi',
          photographer: 'An Hien Garden Explorer',
          tags: ['Nhà vườn An Hiên', 'Nhà rường Huế', 'Kim Long'],
        },
        {
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Huyền Không Sơn Thượng ẩn mình giữa thung lũng rừng thông và hồ nước tĩnh mịch',
          photographer: 'Huyen Khong Son Thuong',
          tags: ['Huyền Không Sơn Thượng', 'Rừng thông', 'Thiền viện'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Đấu trường Hổ Quyền cổ kính - Di tích đấu trường voi hổ độc nhất vô nhị Đông Nam Á',
          photographer: 'Ho Quyen Arena',
          tags: ['Hổ Quyền', 'Đấu trường', 'Thủy Biều'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Bến thuyền rồng ngắm hoàng hôn sông Hương trước cổng Tam Quan chùa Thiên Mụ',
          photographer: 'Perfume River Cruise',
          tags: ['Bến thuyền Thiên Mụ', 'Sông Hương', 'Hoàng hôn'],
        },
      ],
    },
    {
      keywords: ['hue', 'co do hue', 'dai noi', 'hoang thanh hue', 'khai dinh', 'tu duc', 'minh mang', 'song huong', 'truong tien', 'thuy xuan', 'vong canh', 'ru cha', 'an dinh', 'quoc hoc', 'dong ba', 'thua thien hue'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Cửa Ngọ Môn và quần thể Đại Nội Hoàng Thành Huế uy nghiêm cổ kính',
          photographer: 'Hue Monument Conservation',
          tags: ['Huế', 'Đại Nội', 'Hoàng Thành', 'Ngọ Môn', 'Di sản UNESCO'],
          description: 'Quần thể di tích Cố đô Huế - Di sản văn hóa thế giới UNESCO lưu giữ trọn vẹn cung điện triều Nguyễn, hệ thống lăng tẩm hoàng gia và nhã nhạc cung đình.',
          recommendedTip: 'Nên mua vé Tuyến gộp 4 điểm (Đại Nội + 3 Lăng) với giá 530.000đ tiết kiệm 120.000đ và mặc trang phục lịch sự khi vào các điện thờ.',
        },
        {
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Kiến trúc lăng Khải Định giao thoa Á - Âu độc đáo và nghệ thuật khảm sành sứ tinh xảo',
          photographer: 'Imperial Tomb Explorer',
          tags: ['Lăng Khải Định', 'Khảm sành sứ', 'Ứng Lăng'],
        },
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Chùa Thiên Mụ cổ kính soi bóng bên dòng sông Hương thơ mộng',
          photographer: 'Thien Mu Pagoda',
          tags: ['Chùa Thiên Mụ', 'Sông Hương', 'Tháp Phước Duyên'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Sắc màu rực rỡ của những bó chân hương tại Làng Hương Thuỷ Xuân',
          photographer: 'Thuy Xuan Village',
          tags: ['Làng Hương Thuỷ Xuân', 'Làng nghề', 'Check-in'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Cầu Trường Tiền sáu vài mười hai nhịp bắc qua dòng sông Hương êm đềm',
          photographer: 'Truong Tien Bridge',
          tags: ['Cầu Trường Tiền', 'Sông Hương', 'Biểu tượng Huế'],
        },
      ],
    },
    {
      keywords: ['hoi an', 'hoian', 'pho co hoi an', 'chua cau', 'song hoai', 'tan ky', 'phung hung', 'phuoc kien', 'an hoi', 'tra que', 'bay mau', 'cam thanh', 'an bang', 'ky uc hoi an'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Chùa Cầu cổ kính và dòng sông Hoài rực rỡ hoa đăng lung linh về đêm',
          photographer: 'Hoi An Heritage Explorer',
          tags: ['Phố Cổ Hội An', 'Chùa Cầu', 'Sông Hoài', 'Hoa đăng', 'Di sản UNESCO'],
          description: 'Đô thị cổ Hội An - Di sản văn hóa thế giới UNESCO với kiến trúc tường vàng mái ngói âm dương rêu phong giao thoa Việt - Hoa - Nhật và dòng sông Hoài thơ mộng.',
          recommendedTip: 'Phố cổ cấm xe máy từ 09:00 - 11:00 và 15:00 - 21:30. Hãy thuê xe đạp hoặc đi bộ để cảm nhận trọn vẹn vẻ đẹp thanh bình.',
        },
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Góc phố rêu phong với tường vàng hoa giấy đặc trưng của phố cổ Hội An',
          photographer: 'Hoi An Street Life',
          tags: ['Phố cổ', 'Tường vàng', 'Hoa giấy', 'Trần Phú'],
        },
        {
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Trải nghiệm ngồi thuyền thúng len lỏi qua Rừng Dừa Bảy Mẫu xanh mát',
          photographer: 'Bay Mau Coconut Forest',
          tags: ['Rừng Dừa Bảy Mẫu', 'Thuyền thúng', 'Cẩm Thanh', 'Sinh thái'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Cánh đồng xanh mướt ngát hương thảo mộc tại Làng rau Trà Quế truyền thống',
          photographer: 'Tra Que Herb Village',
          tags: ['Làng rau Trà Quế', 'Đồng quê', 'Trải nghiệm nông dân'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Bãi biển An Bàng cát trắng mịn làn nước trong xanh hoang sơ rì rào sóng vỗ',
          photographer: 'An Bang Beach Explorer',
          tags: ['Bãi biển An Bàng', 'Biển xanh', 'Nghỉ dưỡng', 'Hải sản'],
        },
      ],
    },
    {
      keywords: ['cat ba', 'catba', 'vinh lan ha', 'lan ha', 'hai phong', 'cai beo', 'viet hai', 'cat co', 'ngu lam', 'trung trang', 'quan y', 'ba trai dao', 'phu long', 'cat hai'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Vịnh Lan Hạ non xanh nước biếc bình yên bao bọc hàng trăm đảo đá vôi kỳ vĩ',
          photographer: 'Lan Ha Bay Heritage',
          tags: ['Vịnh Lan Hạ', 'Cát Bà', 'Chèo Kayak', 'Ba Trái Đào', 'Di sản UNESCO'],
          description: 'Quần đảo Cát Bà – Vịnh Lan Hạ thuộc Di sản Thiên nhiên Thế giới UNESCO, sở hữu vùng vịnh êm đềm với hàng trăm bãi cát tự nhiên, làng chài cổ Cái Bèo và rừng nguyên sinh trù phú.',
          recommendedTip: 'Nên mua tour tàu ghép trọn gói 1 ngày tại bến Cái Bèo để trải nghiệm chèo kayak Hang Sáng Tối, tắm biển Ba Trái Đào và đạp xe làng Việt Hải.',
        },
        {
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Làng chài cổ Cái Bèo - làng chài nổi cổ nhất Việt Nam với lịch sử hàng ngàn năm',
          photographer: 'Cai Beo Floating Village',
          tags: ['Làng chài Cái Bèo', 'Bè nổi', 'Lịch sử', 'Bến Cái Bèo'],
        },
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Toàn cảnh rừng nguyên sinh và núi đá trùng điệp từ đỉnh Ngự Lâm - Vườn Quốc gia Cát Bà',
          photographer: 'Cat Ba National Park',
          tags: ['Vườn Quốc gia', 'Đỉnh Ngự Lâm', 'Trekking', 'Kim giao'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Chèo thuyền Kayak len lỏi qua vòm hang nước ngầm Hang Sáng - Hang Tối',
          photographer: 'Lan Ha Kayak Explorer',
          tags: ['Hang Sáng Tối', 'Chèo Kayak', 'Thung lũng nước'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Đường ven biển ôm sát vách đá nối liền bãi tắm Cát Cò 1 và Cát Cò 3',
          photographer: 'Cat Co Beach Trail',
          tags: ['Bãi tắm Cát Cò', 'Đường ven núi đá', 'Hoàng hôn'],
        },
      ],
    },
    {
      keywords: ['thac ban gioc', 'ban gioc', 'cao bang', 'nguom ngao', 'khuoi ky', 'quay son', 'mat than nui', 'nui thung', 'pac bo', 'suoi le nin', 'ma phuc', 'trung khanh', 'me pia', 'phuc sen'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Thác Bản Giốc 3 tầng đổ trắng xóa hùng vĩ bên dòng sông Quây Sơn xanh ngọc bích',
          photographer: 'Ban Gioc Waterfall Explorer',
          tags: ['Thác Bản Giốc', 'Cao Bằng', 'Sông Quây Sơn', 'Trùng Khánh', 'Di sản UNESCO'],
          description: 'Thác Bản Giốc là thác nước tự nhiên xuyên biên giới lớn nhất Đông Nam Á, thuộc Công viên Địa chất Toàn cầu UNESCO Non nước Cao Bằng với phong cảnh non nước hữu tình kỳ vĩ.',
          recommendedTip: 'Khung giờ thác đầy nước đẹp nhất là 10:30 – 14:30 khi thủy điện thượng nguồn mở điều tiết nước. Nên lên bè mảng máy (50.000đ) để tiến sát chân thác.',
        },
        {
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Động Ngườm Ngao dài hơn 2.100m với kiệt tác thạch nhũ Đài Sen Úp Ngược lộng lẫy',
          photographer: 'Nguom Ngao Cave Explorer',
          tags: ['Động Ngườm Ngao', 'Hang động', 'Thạch nhũ', 'Đài sen'],
        },
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Mắt Thần Núi (Núi Thủng) sừng sững giữa thung lũng thảo nguyên hồ Nặm Trá',
          photographer: 'Mat Than Nui Landscape',
          tags: ['Mắt Thần Núi', 'Núi Thủng', 'Hồ Nặm Trá', 'Thảo nguyên'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Dòng suối Lê-nin xanh ngắt màu ngọc bích nhìn thấu đáy dưới chân Núi Các Mác tại Pác Bó',
          photographer: 'Pac Bo Historic Site',
          tags: ['Pác Bó', 'Suối Lê-nin', 'Núi Các Mác', 'Lịch sử'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Làng đá cổ Khuổi Ky hơn 400 năm tuổi của người Tày nép mình bên chân núi đá vôi',
          photographer: 'Khuoi Ky Stone Village',
          tags: ['Làng đá Khuổi Ky', 'Nhà sàn đá', 'Người Tày', 'Bản Giốc'],
        },
      ],
    },
    {
      keywords: ['phu quoc', 'phuquoc', 'duong dong', 'kien giang', 'bai sao', 'bai kem', 'hon thom', 'an thoi', 'sunset town', 'cau hon', 'grand world', 'vinwonders', 'safari phu quoc', 'rach vem', 'dinh cau', 'ham ninh'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Khoảnh khắc hoàng hôn tráng lệ bên Cầu Hôn và Thị trấn Hoàng Hôn Địa Trung Hải',
          photographer: 'Sunset Town Explorer',
          tags: ['Phú Quốc', 'Cầu Hôn', 'Thị trấn Hoàng Hôn', 'Kiss Bridge', 'Nam Đảo'],
          description: 'Đảo Ngọc Phú Quốc - Thiên đường biển nhiệt đới với những bãi cát trắng mịn như kem, quần đảo san hô An Thới, cáp treo vượt biển kỷ lục thế giới và các tổ hợp giải trí đỉnh cao.',
          recommendedTip: 'Tận dụng các tuyến xe buýt điện VinBus miễn phí 100% để di chuyển từ sân bay đến Dương Đông và Bắc Đảo (Grand World / Safari).',
        },
        {
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Bãi Sao với dải cát trắng mịn như kem và rặng dừa nghiêng bóng bên làn nước xanh ngọc',
          photographer: 'Bai Sao Beach Collection',
          tags: ['Bãi Sao', 'Cát trắng', 'Biển xanh', 'Nam Đảo'],
        },
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Tuyến Cáp treo Hòn Thơm 3 dây dài gần 7.900m vượt biển ngắm trọn quần đảo An Thới',
          photographer: 'Hon Thom Cable Car',
          tags: ['Cáp treo Hòn Thơm', 'An Thới', 'Hòn Móng Tay', 'Kỷ lục thế giới'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Làng chài Rạch Vẹm yên bình - Vương quốc sao biển đỏ bên bờ biển Bắc Đảo',
          photographer: 'Rach Vem Starfish Village',
          tags: ['Rạch Vẹm', 'Sao biển', 'Làng chài', 'Bắc Đảo'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Dinh Cậu cổ kính tọa lạc trên mỏm đá tự nhiên đón sóng hoàng hôn tại Dương Đông',
          photographer: 'Dinh Cau Heritage',
          tags: ['Dinh Cậu', 'Dương Đông', 'Hoàng hôn', 'Tâm linh'],
        },
      ],
    },
    {
      keywords: ['da lat', 'dalat', 'lam dong', 'xuan huong', 'lam vien', 'cau dat', 'langbiang', 'tuyen lam', 'datanla', 'trai mat', 'domaine de marie', 'chua linh phuoc', 'da phu', 'dinh bao dai'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
          caption: 'Hồ Xuân Hương và Quảng trường Lâm Viên biểu tượng nụ hoa Atiso giữa sương sớm',
          photographer: 'Da Lat City Explorer',
          tags: ['Đà Lạt', 'Hồ Xuân Hương', 'Quảng trường Lâm Viên', 'Hoa Atiso', 'Cao nguyên'],
          description: 'Thành phố ngàn hoa Đà Lạt tọa lạc trên cao nguyên Lâm Viên ở độ cao 1.500m, nơi sở hữu khí hậu ôn đới quanh năm mát mẻ, rừng thông thơ mộng và văn hóa kiến trúc Pháp cổ kính.',
          recommendedTip: 'Tránh các cò mồi mời đi vườn dâu miễn phí ven đường; hãy tự chọn các vườn dâu công nghệ cao uy tín trên bản đồ hoặc mua đặc sản tại chuỗi niêm yết giá cố định L\'angfarm.',
        },
        {
          url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
          caption: 'Đồi Chè Cầu Đất bồng bềnh biển mây sớm bên những cánh quạt điện gió khổng lồ',
          photographer: 'Cau Dat Wind Farm',
          tags: ['Đồi Chè Cầu Đất', 'Săn mây', 'Điện gió', 'Bình minh'],
        },
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Hồ Tuyền Lâm êm đềm tĩnh lặng soi bóng những rặng thông xanh ngút ngàn',
          photographer: 'Tuyen Lam Lake Heritage',
          tags: ['Hồ Tuyền Lâm', 'Rừng thông', 'Thiền viện Trúc Lâm', 'Yên bình'],
        },
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Máng trượt Alpine Coaster xuyên rừng thông nguyên sinh tại Khu du lịch Thác Datanla',
          photographer: 'Datanla Alpine Coaster',
          tags: ['Thác Datanla', 'Máng trượt', 'Rừng thông', 'Mạo hiểm'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Nhà ga Đà Lạt cổ kính với đầu tàu hơi nước và 3 chóp mái mô phỏng đỉnh Langbiang',
          photographer: 'Da Lat Railway Station',
          tags: ['Ga Đà Lạt', 'Kiến trúc Pháp', 'Đầu tàu hơi nước', 'Di sản'],
        },
      ],
    },
    {
      keywords: ['con dao', 'côn đảo', 'hang duong', 'hàng dương', 'vo thi sau', 'võ thị sáu', 'cau tau 914', 'cầu tàu 914', 'dam trau', 'đầm trầu', 'hon bay canh', 'hòn bảy cạnh', 'bai nhat', 'bãi nhát', 'mui ca map', 'mũi cá mập', 'dinh chua dao', 'dinh chúa đảo', 'chuong cop', 'chuồng cọp', 'phu hai', 'phú hải', 'chua nui mot', 'chùa núi một', 'co ong', 'cỏ ống', 'ben dam', 'bến đầm', 'an son', 'bà phi yến', 'ong dung', 'ông đụng'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          caption: 'Bãi Đầm Trầu nguyên sơ nước biển trong vắt tựa ngọc bích nép mình bên vách đá',
          photographer: 'Con Dao Explorer',
          tags: ['Bãi Đầm Trầu', 'Côn Đảo', 'Biển đảo', 'Ngắm máy bay'],
          description: 'Bãi biển đẹp và nổi tiếng nhất Côn Đảo với bãi cát vàng mịn màng, bao bọc bởi vách đá hình cánh cung và trải nghiệm độc đáo ngắm máy bay hạ cánh sạt ngay trên đầu.',
          recommendedTip: 'Dùng ứng dụng Flightradar24 để canh khung giờ máy bay hạ cánh xuống sân bay Cỏ Ống (thường từ 8:00 - 10:30 sáng) để có bức ảnh check-in độc nhất vô nhị.',
        },
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Nghĩa trang Hàng Dương linh thiêng dưới hàng dương rì rào trong ánh nến tri ân',
          photographer: 'Hang Duong Memorial',
          tags: ['Nghĩa trang Hàng Dương', 'Cô Võ Thị Sáu', 'Tâm linh', 'Di tích lịch sử'],
        },
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Rạn san hô rực rỡ và bãi đẻ rùa biển nguyên sinh tại Hòn Bảy Cạnh',
          photographer: 'Bay Canh Island Conservation',
          tags: ['Hòn Bảy Cạnh', 'Bảo tồn rùa biển', 'Lặn san hô', 'Vườn quốc gia'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Hoàng hôn buông đỏ rực bên Mũi Cá Mập và bãi cát trắng mịn Bãi Nhát',
          photographer: 'Bai Nhat Sunset',
          tags: ['Bãi Nhát', 'Mũi Cá Mập', 'Đỉnh Tình Yêu', 'Hoàng hôn'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Cầu Tàu 914 lịch sử soi bóng bên bờ vịnh Côn Sơn xanh biếc',
          photographer: 'Historic Pier 914',
          tags: ['Cầu Tàu 914', 'Vịnh Côn Sơn', 'Di tích lịch sử'],
        },
      ],
    },
    {
      keywords: ['mui ne', 'mũi né', 'phan thiet', 'phan thiết', 'bau trang', 'bàu trắng', 'doi cat bay', 'đồi cát bay', 'doi cat do', 'đồi cát đỏ', 'suoi tien', 'suối tiên', 'lang chai mui ne', 'làng chài mũi né', 'hon rom', 'hòn rơm', 'ke ga', 'kê gà', 'hai dang ke ga', 'hải đăng kê gà', 'po sah inu', 'tháp chàm', 'duc thanh', 'dục thanh', 'van thuy tu', 'vạn thủy tú', 'lang chai xua', 'làng chài xưa', 'novaworld', 'bikini beach', 'bai da ong dia', 'bãi đá ông địa', 'lau dai ruou vang', 'ham tien', 'hàm tiến', 'tien thanh', 'tiến thành', 'binh thuan', 'bình thuận'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          caption: 'Tiểu sa mạc Bàu Trắng với triền cát trắng tinh khôi soi bóng bên hồ sen Bàu Bà',
          photographer: 'Bau Trang White Sand Explorer',
          tags: ['Bàu Trắng', 'Mũi Né', 'Đồi cát', 'Xe Jeep', 'Bình minh'],
          description: 'Khu du lịch Bàu Trắng - viên ngọc sa mạc giữa lòng Bình Thuận với những đồi cát trắng uốn lượn kỳ vĩ ôm lấy mặt hồ sen Bàu Bà phẳng lặng và trải nghiệm xe Jeep địa hình tốc độ cao.',
          recommendedTip: 'Nên đi tour xe Jeep lúc 04:30 sáng đón bình minh trên đồi cát trắng và chụp ảnh cùng xe nước vàng trên cung đường đôi ven biển đẹp nhất Việt Nam.',
        },
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Làng chài Mũi Né tấp nập thuyền thúng hoa tiêu sau chuyến ra khơi lúc rạng đông',
          photographer: 'Mui Ne Fishing Village',
          tags: ['Làng chài Mũi Né', 'Thuyền thúng', 'Chợ hải sản', 'Bình minh'],
        },
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Dòng nước phù sa cam đỏ lượn quanh những tháp cát sừng sững tại Suối Tiên Mũi Né',
          photographer: 'Fairy Stream Explorer',
          tags: ['Suối Tiên', 'Fairy Stream', 'Hàm Tiến', 'Nhũ cát'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Hoàng hôn buông sắc đỏ rực trên Đồi Cát Bay lộng gió ngắm toàn cảnh vịnh Mũi Né',
          photographer: 'Red Sand Dunes Sunset',
          tags: ['Đồi Cát Bay', 'Đồi Cát Đỏ', 'Trượt cát', 'Hoàng hôn'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Ngọn Hải đăng Kê Gà bằng đá hoa cương cổ kính đứng sừng sững giữa ngàn trùng sóng',
          photographer: 'Ke Ga Lighthouse Heritage',
          tags: ['Hải đăng Kê Gà', 'Tiến Thành', 'Di tích', 'Hòn Bà'],
        },
      ],
    },
    {
      keywords: ['mai chau', 'mai châu', 'hoa binh', 'hòa bình', 'ban lac', 'bản lác', 'pom coong', 'pom coọng', 'thung khe', 'đá trắng', 'hang chieu', 'hang chiều', 'ba khan', 'tân mai', 'hồ hòa bình'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          caption: 'Thung lũng Mai Châu thanh bình với những cánh đồng lúa xanh mướt bao quanh nếp nhà sàn',
          photographer: 'Mai Chau Valley Explorer',
          tags: ['Mai Châu', 'Bản Lác', 'Thung lũng', 'Cánh đồng lúa'],
          description: 'Thung lũng Mai Châu nằm lọt thỏm giữa bốn bề núi đá vôi trập trùng, nơi cư trú lâu đời của người Thái trắng với những nếp nhà sàn gỗ mộc mạc, cánh đồng lúa bát ngát và điệu múa xòe nồng ấm.',
          recommendedTip: 'Nên thuê xe đạp dạo quanh các con đường nhỏ nối Bản Lác với Bản Pom Coọng vào sáng sớm hoặc chiều tà khi sương mù nhẹ giăng ngang sườn núi.',
        },
        {
          url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
          caption: 'Đèo Thung Khe (Đèo Đá Trắng) quanh năm mây mù bao phủ tựa ngọn đồi tuyết trắng Bắc Âu',
          photographer: 'Thung Khe Pass View',
          tags: ['Đèo Thung Khe', 'Đèo Đá Trắng', 'Hòa Bình', 'Săn mây'],
        },
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Tầm nhìn ngoạn mục bao trọn toàn bộ thị trấn Mai Châu từ cửa Di tích Hang Chiều',
          photographer: 'Hang Chieu Panoramic',
          tags: ['Hang Chiều', 'Bậc đá', 'Toàn cảnh Mai Châu'],
        },
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Non nước lòng hồ sông Đà phẳng lặng như gương tại vịnh Ba Khan Mai Châu',
          photographer: 'Ba Khan Lake View',
          tags: ['Ba Khan', 'Sông Đà', 'Hồ Hòa Bình', 'Kayak'],
        },
        {
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
          caption: 'Các cô gái Thái trong trang phục thổ cẩm rực rỡ bên khung cửi dệt truyền thống tại Bản Lác',
          photographer: 'Ban Lac Culture',
          tags: ['Bản Lác', 'Thổ cẩm', 'Văn hóa Thái', 'Múa xòe'],
        },
      ],
    },
    {
      keywords: ['nui ba den', 'núi bà đen', 'tay ninh', 'tây ninh', 'tay bo da son', 'tây bổ đà sơn', 'chua ba den', 'chùa bà đen', 'linh son tien thach tu', 'ga ba den', 'toa thanh tay ninh', 'tòa thánh tây ninh', 'ho dau tieng', 'hồ dầu tiếng', 'ma thien lanh', 'chua go ken', 'chùa gò kén'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
          caption: 'Đại tượng Phật Bà Tây Bổ Đà Sơn bằng đồng uy nghiêm giữa biển mây trên đỉnh Núi Bà Đen',
          photographer: 'Sun World Ba Den Mountain',
          tags: ['Núi Bà Đen', 'Tây Bổ Đà Sơn', 'Săn mây', 'Nóc nhà Nam Bộ'],
          description: 'Núi Bà Đen cao 986m được mệnh danh là Nóc nhà Nam Bộ, nổi bật với Đại tượng Phật Bà bằng đồng cao nhất châu Á tọa lạc trên đỉnh núi, quần thể tâm linh Chùa Bà linh thiêng và biển mây đĩa bay kỳ ảo.',
          recommendedTip: 'Nên đi chuyến cáp treo sớm lúc 05:30 sáng lên đỉnh Vân Sơn để đón bình minh và ngắm trọn biển mây bồng bềnh ôm trọn thung lũng đồng bằng trù phú.',
        },
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: 'Chùa Bà Đen (Linh Sơn Tiên Thạch Tự) cổ kính lưng chừng núi thu hút hàng triệu Phật tử chiêm bái',
          photographer: 'Linh Son Pagoda Heritage',
          tags: ['Chùa Bà Đen', 'Tâm linh', 'Linh Sơn Tiên Thạch Tự'],
        },
        {
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Kiến trúc rực rỡ và độc đáo có một không hai của Tòa Thánh Tây Ninh',
          photographer: 'Tay Ninh Holy See',
          tags: ['Tòa Thánh Tây Ninh', 'Đạo Cao Đài', 'Kiến trúc'],
        },
        {
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          caption: 'Hoàng hôn thanh bình buông xuống sau bóng Núi Bà Đen nhìn từ bờ Hồ Dầu Tiếng',
          photographer: 'Dau Tieng Lake Sunset',
          tags: ['Hồ Dầu Tiếng', 'Cắm trại', 'Hoàng hôn', 'Núi Bà Đen'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Đại tượng Phật Di Lặc bằng đá sa thạch khổng lồ và show trình diễn nhạc nước nghệ thuật trên đỉnh',
          photographer: 'Maitreya Water Show',
          tags: ['Phật Di Lặc', 'Nhạc nước', 'Đỉnh Núi Bà Đen'],
        },
      ],
    },
    {
      keywords: ['ba na hills', 'bà nà hills', 'bana hills', 'bà nà', 'cau vang', 'cầu vàng', 'golden bridge', 'lang phap', 'làng pháp', 'french village', 'nui chua', 'núi chúa', 'debay', "le jardin d'amour", 'fantasy park', 'lau dai mat trang', 'lâu đài mặt trăng', 'chua linh ung ba na'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
          caption: 'Cây Cầu Vàng (Golden Bridge) kỳ vĩ được nâng đỡ bởi đôi bàn tay khổng lồ giữa biển mây Bà Nà',
          photographer: 'Sun World Ba Na Hills',
          tags: ['Cầu Vàng', 'Golden Bridge', 'Bà Nà Hills', 'Biểu tượng', 'Núi Chúa'],
          description: 'Tuyệt tác Cầu Vàng vươn mình giữa lưng chừng mây núi Bà Nà ở độ cao hơn 1.400m, được tạp chí TIME vinh danh trong top 100 điểm đến tuyệt vời nhất thế giới.',
          recommendedTip: 'Nên đi chuyến cáp treo sớm nhất lúc 07:30 hoặc 08:00 sáng thẳng lên ga Marseille để có những bức ảnh Cầu Vàng vắng bóng người trong ánh nắng sớm tinh khôi.',
        },
        {
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
          caption: 'Làng Pháp (French Village) cổ kính với kiến trúc Gothic châu Âu lãng mạn trong làn sương mù',
          photographer: 'French Village Explorer',
          tags: ['Làng Pháp', 'Kiến trúc Gothic', 'Quảng trường Du Dôme'],
        },
        {
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          caption: "Vườn hoa Le Jardin D'Amour muôn sắc màu rực rỡ bên Hầm rượu cổ Debay 100 năm tuổi",
          photographer: "Le Jardin D'Amour View",
          tags: ['Vườn hoa', 'Hầm rượu Debay', 'Check-in'],
        },
        {
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          caption: 'Tuyến cáp treo Bà Nà đạt nhiều kỷ lục thế giới lướt êm đềm trên thảm rừng nguyên sinh đại ngàn',
          photographer: 'Cable Car Network',
          tags: ['Cáp treo', 'Rừng nguyên sinh', 'Kỷ lục thế giới'],
        },
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
          caption: 'Lâu đài Mặt Trăng (Moon Castle) nguy nga cổ tích kết nối bằng tàu hỏa leo núi',
          photographer: 'Moon Castle Heritage',
          tags: ['Lâu đài Mặt Trăng', 'Tàu hỏa leo núi', 'Cổ tích'],
        },
      ],
    },
  {
    keywords: ['tam dao', 'tam đảo', 'nha tho da tam dao', 'nhà thờ đá tam đảo', 'thac bac tam dao', 'thác bạc tam đảo', 'den ba chua thuong ngan', 'đền bà chúa thượng ngàn', 'cong troi tam dao', 'cổng trời tam đảo', 'quan gio tam dao', 'quán gió tam đảo', 'cau may studio', 'cầu mây studio', 'thien vien truc lam tay thien', 'thiền viện trúc lâm tây thiên', 'tay thien', 'tây thiên', 'ho xa huong', 'hồ xạ hương', 'vinh phuc', 'vĩnh phúc'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Thị trấn Tam Đảo huyền ảo bồng bềnh trong biển sương mây ngắm từ Cổng Trời',
        photographer: 'Tam Dao Misty Explorer',
        tags: ['Tam Đảo', 'Săn mây', 'Cổng Trời', 'Quán Gió', 'Vĩnh Phúc'],
        description: 'Thị trấn Tam Đảo nằm ở độ cao gần 1.000m trên dãy núi Tam Đảo, được mệnh danh là Đà Lạt thu nhỏ của miền Bắc với khí hậu bốn mùa luân chuyển trong một ngày và biển mây trắng muốt tràn qua thung lũng.',
        recommendedTip: 'Nên ghé Quán Gió Tam Đảo hoặc Cỏ Lạ Cafe vào khoảng 06:00 sáng hoặc 17:00 chiều để chiêm ngưỡng biển mây bồng bềnh và hoàng hôn tuyệt đẹp ôm trọn Lâu đài Tam Đảo.',
      },
      {
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
        caption: 'Nhà thờ Đá Tam Đảo cổ kính rêu phong xây dựng từ năm 1906 theo kiến trúc Gothic',
        photographer: 'Stone Church Heritage',
        tags: ['Nhà thờ Đá', 'Kiến trúc Gothic', 'Check-in', 'Lịch sử'],
      },
      {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        caption: 'Dòng Thác Bạc Tam Đảo trắng xóa đổ từ đỉnh núi cao ẩn mình giữa thung lũng đại ngàn',
        photographer: 'Silver Waterfall Explorer',
        tags: ['Thác Bạc', 'Trekking', 'Thung lũng'],
      },
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
        caption: 'Lối bậc đá xuyên qua rừng trúc xanh mướt dẫn lên Đền Bà Chúa Thượng Ngàn',
        photographer: 'Bamboo Forest Trail',
        tags: ['Đền Bà Chúa Thượng Ngàn', 'Rừng trúc', 'Tâm linh'],
      },
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: 'Thiền viện Trúc Lâm Tây Thiên thanh tịnh uy nghiêm lưng chừng non thiêng Tây Thiên',
        photographer: 'Tay Thien Zen Monastery',
        tags: ['Tây Thiên', 'Thiền viện Trúc Lâm', 'Tâm linh', 'Vĩnh Phúc'],
      },
    ],
  },
  {
    keywords: ['ba vi', 'ba vì', 'vuon quoc gia ba vi', 'vườn quốc gia ba vì', 'nha kinh xuong rong', 'nhà kính xương rồng', 'doi thong cot 400', 'đồi thông cốt 400', 'nha tho co ba vi', 'nhà thờ cổ ba vì', 'cot 1100', 'cốt 1100', 'den thuong ba vi', 'đền thượng ba vì', 'dinh tan vien', 'đỉnh tản viên', 'den tho bac ho ba vi', 'đền thờ bác hồ ba vì', 'dinh vua', 'đỉnh vua', 'hoa da quy ba vi', 'hoa dã quỳ ba vì', 'khoang xanh suoi tien', 'ao vua'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Rừng thông Cốt 400 bạt ngàn xanh ngát trong làn sương sớm trong lành tại VQG Ba Vì',
        photographer: 'Ba Vi National Park Eco-Explorer',
        tags: ['Ba Vì', 'Rừng thông', 'Cốt 400', 'Cắm trại', 'Lá phổi xanh'],
        description: 'Vườn Quốc gia Ba Vì với 3 đỉnh núi cao trên 1.200m được ví như lá phổi xanh phía Tây Hà Nội, nổi tiếng với rừng thông Cốt 400 ngút ngàn, mùa hoa dã quỳ vàng rực rỡ, phế tích Pháp cổ kính và quần thể tâm linh Đền Thượng – Đỉnh Vua linh thiêng.',
        recommendedTip: 'Nên cắm trại tại Đồi thông Cốt 400 vào mùa hè để tránh nóng hoặc lên Cốt 1100 vào tháng 11 để săn biển mây sáng sớm và ngắm hoa dã quỳ nở rộ khắp sườn đèo.',
      },
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
        caption: 'Nhà kính Xương rồng Ba Vì độc đáo với hơn 1.200 giống xương rồng khổng lồ muôn hình vạn trạng',
        photographer: 'Cactus Greenhouse Heritage',
        tags: ['Nhà kính Xương rồng', 'Check-in', 'Sinh thái'],
      },
      {
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
        caption: 'Phế tích Nhà thờ Cổ Pháp phủ đầy rêu phong ma mị huyền bí giữa rừng già Cốt 800',
        photographer: 'French Ruins Ba Vi',
        tags: ['Nhà thờ Cổ', 'Phế tích Pháp', 'Cốt 800', 'Rêu phong'],
      },
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Thảm hoa Dã Quỳ vàng rực rỡ bừng nở trải dài trên cung đường đèo Ba Vì dịp cuối thu đầu đông',
        photographer: 'Wild Sunflower Trail',
        tags: ['Hoa Dã Quỳ', 'Mùa hoa', 'Săn mây', 'Đèo Ba Vì'],
      },
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: 'Đền Thượng tọa lạc uy nghiêm trên đỉnh non thiêng Tản Viên 1.227m giữa ngút ngàn mây trắng',
        photographer: 'Tan Vien Peak Sacred Shrine',
        tags: ['Đền Thượng', 'Đỉnh Tản Viên', 'Đức Thánh Tản', 'Tâm linh'],
      },
    ],
  },
  {
    keywords: ['ham lon', 'hàm lợn', 'nui ham lon', 'núi hàm lợn', 'ho nui bau', 'hồ núi bàu', 'ho ham lon', 'hồ hàm lợn', 'ho dong do', 'hồ đồng đò', 'viet phu thanh chuong', 'việt phủ thành chương', 'den giong soc son', 'đền gióng sóc sơn', 'chua non nuoc', 'chùa non nước', 'soc son', 'sóc sơn'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
        caption: 'Khu cắm trại ven Hồ Núi Bàu dưới tán rừng thông xanh mát chân Núi Hàm Lợn',
        photographer: 'Ham Lon Lake Camping Explorer',
        tags: ['Hàm Lợn', 'Hồ Núi Bàu', 'Cắm trại', 'Rừng thông', 'Sóc Sơn'],
        description: 'Núi Hàm Lợn cao 462m được mệnh danh là Nóc nhà Thủ đô, điểm dã ngoại cắm trại và trekking quen thuộc của giới trẻ Hà Nội với rừng thông bạt ngàn ven Hồ Núi Bàu, cung trekking đường suối đầy thử thách và làn nước trong xanh Hồ Đồng Đò.',
        recommendedTip: 'Nên cắm trại qua đêm bên Hồ Núi Bàu từ chiều Thứ Bảy để ngắm hoàng hôn, nướng BBQ đốt lửa trại và xuất phát trekking đỉnh Hàm Lợn vào sớm Chủ Nhật khi trời còn mát mẻ.',
      },
      {
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Chinh phục cột mốc Đỉnh Núi Hàm Lợn 462m ngắm toàn cảnh núi rừng Sóc Sơn',
        photographer: 'Peak 462m Trekker',
        tags: ['Đỉnh Hàm Lợn', 'Trekking', 'Nóc nhà Thủ đô'],
      },
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Mặt nước xanh ngọc bích phẳng lặng tại Hồ Đồng Đò - thiên đường chèo SUP và nghỉ dưỡng',
        photographer: 'Dong Do Lake Watersports',
        tags: ['Hồ Đồng Đò', 'Chèo SUP', 'Kayak', 'Nghỉ dưỡng'],
      },
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: 'Không gian văn hóa kiến trúc cổ truyền thuần khiết Bắc Bộ tại Việt Phủ Thành Chương',
        photographer: 'Thanh Chuong Heritage View',
        tags: ['Việt Phủ Thành Chương', 'Văn hóa cổ', 'Kiến trúc'],
      },
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
        caption: 'Quần thể Di tích Quốc gia đặc biệt Đền Gióng Sóc Sơn linh thiêng giữa non ngàn thông reo',
        photographer: 'Soc Son Temple Shrine',
        tags: ['Đền Gióng', 'Chùa Non Nước', 'Tâm linh', 'Di tích Quốc gia'],
      },
    ],
  },
  {
    keywords: ['sam son', 'sầm sơn', 'bai bien sam son', 'bãi biển sầm sơn', 'quang truong bien sam son', 'quảng trường biển sầm sơn', 'den doc cuoc', 'đền độc cước', 'hon trong mai sam son', 'hòn trống mái sầm sơn', 'den co tien', 'đền cô tiên', 'sun world sam son', 'sun world sầm sơn', 'flc sam son', 'flc sầm sơn', 'cho cot do', 'chợ cột đỏ', 'thanh hoa', 'thanh hóa'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bãi biển Sầm Sơn trải dài cát mịn với những đợt sóng biển mạnh mẽ đặc trưng',
        photographer: 'Sam Son Beach Explorer',
        tags: ['Sầm Sơn', 'Bãi biển', 'Tắm biển', 'Hải sản', 'Thanh Hóa'],
        description: 'Sầm Sơn là đô thị du lịch biển lâu đời và nổi tiếng hàng đầu miền Bắc với bờ cát thoai thoải trải dài 6km, những đợt sóng mạnh mẽ sảng khoái, Quảng trường Biển quy mô lớn, dãy núi Trường Lệ huyền thoại và thế giới ẩm thực hải sản phong phú.',
        recommendedTip: 'Nên dậy sớm từ 05:30 sáng ra khu vực cuối Bãi C để xem ngư dân kéo lưới rùng, mua hải sản tươi sống trực tiếp từ thuyền và ngắm bình minh rực rỡ trên biển Đông.',
      },
      {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        caption: 'Trình diễn nhạc nước nghệ thuật lung linh sắc màu tại Quảng Trường Biển Sầm Sơn',
        photographer: 'Sam Son Sea Square Night',
        tags: ['Quảng Trường Biển', 'Nhạc nước', 'Phố đi bộ', 'Check-in'],
      },
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: 'Danh thắng Hòn Trống Mái và Đền Độc Cước linh thiêng trên đỉnh núi Trường Lệ',
        photographer: 'Truong Le Mountain Heritage',
        tags: ['Hòn Trống Mái', 'Đền Độc Cước', 'Núi Trường Lệ', 'Tâm linh'],
      },
      {
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Công viên nước Sun World Sầm Sơn với tổ hợp trò chơi cảm giác mạnh và bể tạo sóng thần',
        photographer: 'Sun World Sam Son Waterpark',
        tags: ['Sun World Sầm Sơn', 'Công viên nước', 'Giải trí', 'Bể tạo sóng'],
      },
      {
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
        caption: 'Quần thể nghỉ dưỡng sinh thái 5 sao FLC Sầm Sơn với bể bơi nước mặn lớn nhất Việt Nam',
        photographer: 'FLC Sam Son Resort View',
        tags: ['FLC Sầm Sơn', 'Resort 5 sao', 'Bể bơi nước mặn', 'Nghỉ dưỡng'],
      },
    ],
  },
  {
    keywords: ['tam chuc', 'tam chúc', 'chua tam chuc', 'chùa tam chúc', 'thuy dinh tam chuc', 'thủy đình tam chúc', 'ho luc nhac', 'hồ lục nhạc', 'dien tam the', 'điện tam thế', 'vuon cot kinh', 'vườn cột kinh', 'chua ngoc tam chuc', 'chùa ngọc tam chúc', 'chua ba danh', 'chùa bà đanh', 'dia tang phi lai tu', 'địa tạng phi lai tự', 'kem trong', 'kẽm trống', 'lang vu dai', 'làng vũ đại', 'ha nam', 'hà nam'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
        caption: 'Toàn cảnh quần thể Chùa Tam Chúc non nước hữu tình tựa Vịnh Hạ Long trên cạn',
        photographer: 'Tam Chuc Sacred Lake Explorer',
        tags: ['Tam Chúc', 'Hồ Lục Nhạc', 'Vịnh Hạ Long trên cạn', 'Tâm linh', 'Hà Nam'],
        description: 'Chùa Tam Chúc là quần thể Phật giáo lớn nhất thế giới tọa lạc giữa lòng hồ Lục Nhạc 600ha và núi đá vôi kỳ vĩ, nổi bật với Điện Tam Thế nguy nga, Vườn Cột Kinh đá khổng lồ, Chùa Ngọc trên đỉnh núi Thất Tinh và không gian tâm linh thanh tịnh.',
        recommendedTip: 'Nên chọn gói vé Combo Du thuyền + Xe điện để vừa được lướt thuyền ngắm hồ Lục Nhạc ghé Đình Tam Chúc, vừa thuận tiện đi xe điện ven hồ về bãi đỗ xe.',
      },
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: 'Chùa Ngọc bằng đá granite đỏ sừng sững trên đỉnh núi Thất Tinh ngắm trọn non nước Tam Chúc',
        photographer: 'Ngoc Pagoda Peak Heritage',
        tags: ['Chùa Ngọc', 'Núi Thất Tinh', 'Đàn Tế Trời', 'Đá granite'],
      },
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
        caption: 'Vườn Cột Kinh với 32 cột đá xanh nguyên khối khổng lồ khắc kinh Phật uy nghiêm',
        photographer: 'Sutra Pillar Garden View',
        tags: ['Vườn Cột Kinh', 'Cột đá nguyên khối', 'Điện Tam Thế'],
      },
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Nhà khách Thủy Đình soi bóng lung linh bên làn nước biếc hồ Tam Chúc rực rỡ nắng sớm',
        photographer: 'Thuy Dinh Water Pavilion',
        tags: ['Thủy Đình', 'Bến thuyền', 'Hồ Tam Chúc'],
      },
      {
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Không gian thiền tịnh thanh khiết với sân sỏi trắng tại Chùa Địa Tạng Phi Lai Tự',
        photographer: 'Dia Tang Phi Lai Zen Garden',
        tags: ['Địa Tạng Phi Lai Tự', 'Sân sỏi trắng', 'Thiền tịnh', 'Hà Nam'],
      },
    ],
  },
  {
    keywords: ['bat trang', 'bát tràng', 'lang gom bat trang', 'làng gốm bát tràng', 'bao tang gom bat trang', 'bảo tàng gốm bát tràng', 'trung tam tinh hoa lang nghe viet', 'trung tâm tinh hoa làng nghề việt', 'cho gom bat trang', 'chợ gốm bát tràng', 'lang co bat trang', 'làng cổ bát tràng', 'nha co van van', 'nhà cổ vạn vân', 'dinh bat trang', 'đình bát tràng', 'lo bau co', 'lò bầu cổ', 'ecopark', 'vinhomes ocean park', 'gia lam', 'gia lâm'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bảo tàng Gốm Bát Tràng với kiến trúc 7 bàn xoay gốm khổng lồ uốn lượn kỳ vĩ',
        photographer: 'Bat Trang Ceramic Heritage Explorer',
        tags: ['Bát Tràng', 'Bảo tàng Gốm', 'Kiến trúc xoắn ốc', 'Làng nghề', 'Hà Nội'],
        description: 'Làng gốm Bát Tràng có bề dày lịch sử hơn 700 năm bên dòng sông Hồng, nổi tiếng với kỹ nghệ chế tác gốm sứ tinh xảo, Bảo tàng Gốm kiến trúc 7 khối xoắn ốc độc đáo, mê cung ngõ cổ lát gạch Bát Tràng và trải nghiệm tự tay vuốt nặn gốm trên bàn xoay thủ công.',
        recommendedTip: 'Nên ghé Bảo tàng Gốm vào buổi sáng đón ánh nắng xiên qua các vòm xoắn ốc để có những bức ảnh check-in tuyệt đẹp, sau đó vào làng thử tài vuốt gốm và nung thành phẩm mang về.',
      },
      {
        url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
        caption: 'Trải nghiệm tự tay tạo hình sản phẩm gốm sứ trên bàn xoay thủ công truyền thống',
        photographer: 'Ceramic Workshop Experience',
        tags: ['Nặn gốm', 'Bàn xoay', 'Workshop DIY', 'Thủ công'],
      },
      {
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
        caption: 'Ngõ nhỏ lát gạch cổ kính rêu phong và giàn than phơi đặc trưng trong Làng Cổ Bát Tràng',
        photographer: 'Ancient Bat Trang Alley',
        tags: ['Làng Cổ Bát Tràng', 'Nhà cổ Vạn Vân', 'Ngõ gạch', 'Rêu phong'],
      },
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
        caption: 'Chợ gốm Bát Tràng ngập tràn sắc màu gốm men lam, men rạn, bình hoa và đồ sứ mỹ nghệ',
        photographer: 'Bat Trang Ceramic Market',
        tags: ['Chợ gốm Bát Tràng', 'Gốm men lam', 'Ấm chén', 'Mua sắm'],
      },
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: 'Đình Bát Tràng cổ kính uy nghiêm nhìn ra bến sông Hồng lộng gió',
        photographer: 'Dinh Bat Trang Riverside',
        tags: ['Đình Bát Tràng', 'Sông Hồng', 'Lễ hội rước nước', 'Di tích cổ'],
      },
    ],
  },
  {
    keywords: ['eo gio', 'eo gió', 'khu du lich eo gio', 'khu du lịch eo gió', 'con duong di bo ven bien eo gio', 'con đường đi bộ ven biển eo gió', 'tinh xa ngoc hoa', 'tịnh xá ngọc hoà', 'ky co', 'kỳ co', 'ky co beach', 'bãi biển kỳ co', 'bai bien ky co', 'flc quy nhon', 'flc quy nhơn', 'flc luxury resort quy nhon', 'doi cat phuong mai', 'đồi cát phương mai', 'thap doi', 'tháp đôi', 'ghenh rang', 'ghềnh ráng', 'bai trung', 'bãi trứng', 'quy nhon', 'quy nhơn', 'binh dinh', 'bình định'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Con đường đi bộ ven biển Eo Gió uốn lượn lưng chừng vách đá hùng vĩ nhìn ra biển xanh ngọc bích',
        photographer: 'Eo Gio Coastal Explorer',
        tags: ['Eo Gió', 'Quy Nhơn', 'Đảo Jeju Việt Nam', 'Con đường ven biển', 'Bình Định'],
        description: 'Eo Gió là eo biển hút gió kỳ vĩ tại xã Nhơn Lý, Quy Nhơn với cung đường bậc thang đá uốn lượn dọc vách núi cheo leo, hàng rào đỏ trắng nổi bật ôm lấy bờ biển ngọc bích và bãi đá Đẻ tự nhiên.',
        recommendedTip: 'Nên ghé Eo Gió vào sáng sớm (06:00 – 08:30) đón bình minh hoặc chiều muộn (16:00 – 18:00) đón hoàng hôn khi nắng đã dịu; mũ đội đầu bắt buộc phải có quai buộc cằm vì gió lốc ở eo biển rất mạnh.',
      },
      {
        url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bãi biển Kỳ Co trong vắt màu ngọc bích với cầu gỗ Hang Yến và vách đá sừng sững',
        photographer: 'Ky Co Beach Paradise',
        tags: ['Kỳ Co', 'Bãi biển Kỳ Co', 'Cano lặn san hô', 'Bãi Dứa'],
      },
      {
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
        caption: 'Tịnh xá Ngọc Hoà với tượng đôi Phật Bà Quan Âm cao nhất Việt Nam nhìn ra biển Đông',
        photographer: 'Ngoc Hoa Monastery View',
        tags: ['Tịnh xá Ngọc Hoà', 'Tượng Phật đôi', 'Tâm linh', 'Eo Gió'],
      },
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
        caption: 'Đồi Cát Phương Mai trải dài cát vàng thoai thoải và quần thể FLC Luxury Resort ven biển',
        photographer: 'Phuong Mai Sand Dunes',
        tags: ['Đồi Cát Phương Mai', 'Trượt cát', 'FLC Quy Nhơn', 'Bán đảo Phương Mai'],
      },
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bãi trứng Hoàng Hậu với vô số viên đá tròn nhẵn như trứng chim tại Khu du lịch Ghềnh Ráng',
        photographer: 'Ghenh Rang Queen Beach',
        tags: ['Ghềnh Ráng', 'Bãi trứng', 'Bãi Hoàng Hậu', 'Tháp Đôi', 'Hàn Mặc Tử'],
      },
    ],
  },
  {
    keywords: ['nha trang', 'vịnh nha trang', 'vinh nha trang', 'bãi biển nha trang', 'bai bien nha trang', 'tháp trầm hương', 'thap tram huong', 'quảng trường 2/4', 'quang truong 2/4', 'hòn tre', 'hon tre', 'vinwonders nha trang', 'vinpearl nha trang', 'vinpearl harbour', 'hòn mun', 'hon mun', 'hòn tằm', 'hon tam', 'tắm bùn hòn tằm', 'tam bun hon tam', 'viện hải dương học', 'vien hai duong hoc', 'tháp bà ponagar', 'thap ba ponagar', 'ponagar', 'hòn chồng', 'hon chong', 'chùa long sơn', 'chua long son', 'cảng vĩnh trường', 'cang vinh truong', 'khánh hòa', 'khanh hoa'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bãi biển Nha Trang trong xanh cát trắng ôm trọn cung đường Trần Phú và Tháp Trầm Hương',
        photographer: 'Nha Trang Bay Explorer',
        tags: ['Vịnh Nha Trang', 'Bãi biển Trần Phú', 'Tháp Trầm Hương', 'Biển đảo', 'Khánh Hòa'],
        description: 'Vịnh Nha Trang là một trong 29 vịnh biển đẹp nhất thế giới với 19 hòn đảo lớn nhỏ, bãi biển cát trắng mịn dài 7km, hệ sinh thái biển nguyên sơ phong phú và quần thể nghỉ dưỡng giải trí biển hàng đầu Đông Nam Á.',
        recommendedTip: 'Nên đặt Tour 3 đảo cano ghép đoàn xuất phát từ Cảng Vĩnh Trường lúc 8h sáng để lặn ngắm san hô tại Hòn Mun khi nước biển trong và nắng sáng chiếu xuyên đáy biển đẹp nhất.',
      },
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Quần thể công viên giải trí VinWonders và cáp treo vượt biển trên Đảo Hòn Tre',
        photographer: 'VinWonders Hon Tre View',
        tags: ['Đảo Hòn Tre', 'VinWonders', 'Cáp treo vượt biển', 'Tata Show'],
      },
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
        caption: 'Lặn ngắm rạn san hô nguyên sơ và sinh vật biển rực rỡ tại Khu bảo tồn Đảo Hòn Mun',
        photographer: 'Hon Mun Marine Reserve',
        tags: ['Đảo Hòn Mun', 'Lặn san hô', 'Khu bảo tồn biển', 'Scuba Diving'],
      },
      {
        url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
        caption: 'Thư giãn ngâm bùn khoáng nóng ngắm toàn cảnh Vịnh Nha Trang trên Đảo Hòn Tằm',
        photographer: 'Hon Tam Mud Bath Luxury',
        tags: ['Đảo Hòn Tằm', 'Tắm bùn khoáng', 'Hồ bơi vô cực', 'Nghỉ dưỡng'],
      },
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: 'Quần thể Di sản văn hóa Chăm Pa Tháp Bà Ponagar nghìn năm tuổi uy nghiêm bên dòng sông Cái',
        photographer: 'Ponagar Cham Towers Heritage',
        tags: ['Tháp Bà Ponagar', 'Di sản Chăm Pa', 'Đồi Cù Lao', 'Tâm linh'],
      },
    ],
  }
];

// Ảnh mặc định du lịch chất lượng cao khi không khớp từ khóa
const DEFAULT_TRAVEL_PHOTO: DestinationPhoto = {
  url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  caption: 'Hành trình khám phá danh lam thắng cảnh Việt Nam',
  photographer: 'SmartTrip Explorer',
  tags: ['Du lịch', 'Khám phá', 'Việt Nam'],
  description: 'Trải nghiệm những cung đường tuyệt đẹp và lưu giữ những kỷ niệm đáng nhớ cùng bạn bè.',
  recommendedTip: 'Hãy ghi chú lại những địa điểm thú vị và sắp xếp lộ trình hợp lý để chuyến đi trọn vẹn.',
};

/**
 * Lấy ảnh đẹp nhất đại diện cho địa danh du lịch
 */
export function getDestinationPhoto(placeName: string, address?: string): DestinationPhoto {
  const combined = normalizeText(`${placeName} ${address || ''}`);

  for (const entry of LANDMARK_PHOTO_DATABASE) {
    for (const kw of entry.keywords) {
      if (combined.includes(normalizeText(kw))) {
        return entry.photos[0];
      }
    }
  }

  return DEFAULT_TRAVEL_PHOTO;
}

/**
 * Lấy toàn bộ bộ sưu tập ảnh (gallery) của một địa danh
 */
export function getDestinationGallery(placeName: string, address?: string): DestinationPhoto[] {
  const combined = normalizeText(`${placeName} ${address || ''}`);

  for (const entry of LANDMARK_PHOTO_DATABASE) {
    for (const kw of entry.keywords) {
      if (combined.includes(normalizeText(kw))) {
        return entry.photos;
      }
    }
  }

  return [DEFAULT_TRAVEL_PHOTO];
}

/**
 * Danh sách điểm đến nổi bật Việt Nam hiển thị trên Bản đồ Khám phá (Discovery Map & Split-View)
 */
export const POPULAR_DISCOVERY_DESTINATIONS: DiscoveryDestination[] = [
  {
    id: 'ninh-binh',
    name: 'Tràng An – Tam Cốc (Ninh Bình)',
    province: 'Ninh Bình',
    coordinates: [20.2567, 105.8964],
    photo: {
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      caption: 'Quần thể danh thắng Tràng An – Tam Cốc non xanh nước biếc',
      photographer: 'Vietnam Heritage Collection',
      tags: ['Tràng An', 'Tam Cốc', 'Hang Múa', 'Chùa Bái Đính'],
    },
    badge: 'Di sản thế giới UNESCO',
    category: 'heritage',
    description: 'Di sản văn hóa & thiên nhiên thế giới UNESCO với đò nan xuyên thủy động kỳ ảo, non nước hữu tình và đỉnh Ngọa Long Hang Múa.',
    recommendedSeason: 'Tháng 1 - Tháng 3 (Du xuân) & Cuối tháng 5 - Đầu tháng 6 (Mùa lúa chín)',
    estimatedBudget: '2.200.000đ - 3.500.000đ / người',
  },
  {
    id: 'hang-son-doong',
    name: 'Hang Sơn Đoòng & Phong Nha',
    province: 'Quảng Bình',
    coordinates: [17.4572, 106.2877],
    photo: {
      url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
      caption: 'Hang Sơn Đoòng - Kỳ quan hang động tự nhiên lớn nhất thế giới',
      photographer: 'Oxalis / Cave Explorer',
      tags: ['Sơn Đoòng', 'Phong Nha', 'Hang Én', 'Thám hiểm'],
    },
    badge: 'Kỳ quan hang động lớn nhất thế giới',
    category: 'mountain',
    description: 'Hang động tự nhiên lớn nhất hành tinh với rừng nguyên sinh trong lòng hang, hố sụt Vọng Khủng Long và sông ngầm kỳ vĩ.',
    recommendedSeason: 'Tháng 1 - Tháng 8 (Mùa săn tia nắng & bơi sông ngầm)',
    estimatedBudget: '3.000.000đ - 4.500.000đ (Phong Nha) / 75.000.000đ (Sơn Đoòng)',
  },
  {
    id: 'ha-long',
    name: 'Vịnh Hạ Long (Quảng Ninh)',
    province: 'Quảng Ninh',
    coordinates: [20.9101, 107.1839],
    photo: {
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      caption: 'Kỳ quan thiên nhiên thế giới Vịnh Hạ Long ngàn đảo đá vôi xanh biếc',
      photographer: 'Halong Heritage Collection',
      tags: ['Vịnh Hạ Long', 'Du thuyền', 'Đảo Ti Tốp', 'Hang Sửng Sốt', 'Chèo Kayak'],
    },
    badge: 'Kỳ quan thiên nhiên thế giới UNESCO',
    category: 'beach',
    description: 'Kỳ quan thiên nhiên thế giới UNESCO với hàng ngàn đảo đá vôi kỳ vĩ, du thuyền vịnh di sản, chèo kayak Hang Luồn và ngắm toàn cảnh 360 độ từ đỉnh Ti Tốp.',
    recommendedSeason: 'Tháng 4 - Tháng 6 (Đầu hè biển êm) & Tháng 9 - Tháng 11 (Thu dịu mát)',
    estimatedBudget: '2.800.000đ - 4.500.000đ / người',
  },
  {
    id: 'sa-pa',
    name: 'Sa Pa – Đỉnh Fansipan (Lào Cai)',
    province: 'Lào Cai',
    coordinates: [22.3350, 103.8414],
    photo: {
      url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      caption: 'Đỉnh Fansipan 3.143m - Nóc nhà Đông Dương bồng bềnh giữa biển mây',
      photographer: 'Fansipan Legend Explorer',
      tags: ['Sa Pa', 'Fansipan', 'Bản Cát Cát', 'Đèo Ô Quy Hồ', 'Mường Hoa'],
    },
    badge: 'Nóc nhà Đông Dương 3.143m',
    category: 'mountain',
    description: 'Chinh phục đỉnh cao Fansipan 3.143m giữa biển mây hùng vĩ, khám phá văn hóa bản địa Cát Cát, thung lũng Mường Hoa và săn hoàng hôn đèo Ô Quy Hồ.',
    recommendedSeason: 'Tháng 9 - Tháng 10 (Mùa lúa chín vàng & săn mây) & Tháng 3 - Tháng 5 (Hoa đỗ quyên)',
    estimatedBudget: '2.800.000đ - 4.500.000đ / người',
  },
  {
    id: 'ha-giang',
    name: 'Cao nguyên đá Đồng Văn (Hà Giang)',
    province: 'Hà Giang',
    coordinates: [23.2764, 105.3639],
    photo: {
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      caption: 'Hẻm vực Tu Sản & dòng sông Nho Quế xanh ngọc bích dưới chân đèo Mã Pí Lèng',
      photographer: 'Ha Giang Loop Explorer',
      tags: ['Hà Giang', 'Đồng Văn', 'Mã Pí Lèng', 'Sông Nho Quế', 'Lũng Cú'],
    },
    badge: 'Công viên địa chất UNESCO',
    category: 'mountain',
    description: 'Công viên Địa chất Toàn cầu UNESCO với cung đường phượt huyền thoại Ha Giang Loop, đệ nhất hùng quan Mã Pí Lèng, hẻm vực Tu Sản và Cột cờ Lũng Cú.',
    recommendedSeason: 'Tháng 10 - Tháng 11 (Mùa hoa Tam Giác Mạch) & Tháng 12 - Tháng 3 (Hoa đào, hoa mận)',
    estimatedBudget: '2.200.000đ - 3.500.000đ / người',
  },
  {
    id: 'my-son',
    name: 'Thánh địa Mỹ Sơn (Quảng Nam)',
    province: 'Quảng Nam',
    coordinates: [15.7642, 108.1242],
    photo: {
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      caption: 'Quần thể tháp Chăm cổ kính thâm nghiêm giữa thung lũng Thánh địa Mỹ Sơn',
      photographer: 'My Son Sanctuary Heritage',
      tags: ['Mỹ Sơn', 'Tháp Chăm', 'Hội An', 'Di sản UNESCO', 'Quảng Nam'],
    },
    badge: 'Di sản văn hóa thế giới UNESCO',
    category: 'heritage',
    description: 'Di sản văn hóa thế giới UNESCO với quần thể đền tháp Champa cổ đại huyền bí, nghệ thuật múa Apsara và trục kết nối làng nghề sông Thu Bồn – Phố cổ Hội An.',
    recommendedSeason: 'Tháng 2 - Tháng 4 (Đầu mùa khô nắng dịu) & Tháng 5 - Tháng 8 (Mùa hè tháp lên màu đẹp)',
    estimatedBudget: '2.200.000đ - 3.500.000đ / người',
  },
  {
    id: 'hue',
    name: 'Quần thể di tích Cố đô Huế',
    province: 'Thừa Thiên Huế',
    coordinates: [16.4698, 107.5784],
    photo: {
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      caption: 'Cửa Ngọ Môn và quần thể Đại Nội Hoàng Thành Huế uy nghiêm cổ kính',
      photographer: 'Hue Monument Conservation',
      tags: ['Huế', 'Đại Nội', 'Lăng Khải Định', 'Chùa Thiên Mụ', 'Sông Hương'],
    },
    badge: 'Di sản văn hóa thế giới UNESCO',
    category: 'heritage',
    description: 'Di sản văn hóa thế giới UNESCO với Hoàng Thành Huế nguy nga, hệ thống lăng tẩm hoàng gia uy nghiêm, chùa Thiên Mụ bên bờ sông Hương và ẩm thực cung đình độc đáo.',
    recommendedSeason: 'Tháng 1 - Tháng 4 (Mùa xuân mát dịu) & Tháng 5 - Tháng 8 (Mùa hoa sen & Festival)',
    estimatedBudget: '2.000.000đ - 3.200.000đ / người',
  },
  {
    id: 'chua-thien-mu',
    name: 'Chùa Thiên Mụ & Nhà vườn ven sông Hương',
    province: 'Thừa Thiên Huế',
    coordinates: [16.4533, 107.5450],
    photo: {
      url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      caption: 'Tháp Phước Duyên 7 tầng sừng sững bên bờ sông Hương trên đỉnh đồi Hà Khê',
      photographer: 'Thien Mu Pagoda Heritage',
      tags: ['Chùa Thiên Mụ', 'Tháp Phước Duyên', 'Đồi Hà Khê', 'Sông Hương', 'Kim Long'],
    },
    badge: 'Cổ tự danh thắng sông Hương',
    category: 'heritage',
    description: 'Ngôi quốc tự linh thiêng bậc nhất xứ Huế xây dựng năm 1601, gắn liền tháp Phước Duyên cổ kính, thủy trình sông Hương, nhà vườn cổ An Hiên và làng hoa trái Thủy Biều.',
    recommendedSeason: 'Tháng 1 - Tháng 4 (Mùa xuân mát mẻ, hoa sứ nở rộ) & Tháng 5 - Tháng 8 (Săn hoàng hôn sông Hương)',
    estimatedBudget: '1.800.000đ - 2.800.000đ / người',
  },
  {
    id: 'hoi-an',
    name: 'Phố Cổ Hội An (Quảng Nam)',
    province: 'Quảng Nam',
    coordinates: [15.8775, 108.3292],
    photo: {
      url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      caption: 'Chùa Cầu cổ kính và dòng sông Hoài rực rỡ hoa đăng lung linh về đêm',
      photographer: 'Hoi An Heritage Explorer',
      tags: ['Phố Cổ Hội An', 'Chùa Cầu', 'Sông Hoài', 'Đèn lồng', 'Di sản UNESCO'],
    },
    badge: 'Di sản văn hóa thế giới UNESCO',
    category: 'heritage',
    description: 'Di sản văn hóa thế giới UNESCO nổi tiếng với dãy nhà cổ tường vàng hoa giấy, Chùa Cầu biểu tượng, thuyền hoa đăng sông Hoài, làng rau Trà Quế và biển An Bàng.',
    recommendedSeason: 'Tháng 2 - Tháng 4 (Mát dịu, hoa giấy nở rộ) & Tháng 5 - Tháng 8 (Biển xanh An Bàng)',
    estimatedBudget: '2.200.000đ - 3.600.000đ / người',
  },
  {
    id: 'cat-ba',
    name: 'Quần đảo Cát Bà – Vịnh Lan Hạ (Hải Phòng)',
    province: 'Hải Phòng',
    coordinates: [20.7278, 107.0481],
    photo: {
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      caption: 'Vịnh Lan Hạ non xanh nước biếc bình yên bao bọc hàng trăm đảo đá vôi kỳ vĩ',
      photographer: 'Lan Ha Bay Heritage',
      tags: ['Cát Bà', 'Vịnh Lan Hạ', 'Ba Trái Đào', 'Làng Cái Bèo', 'Di sản UNESCO'],
    },
    badge: 'Di sản thiên nhiên thế giới UNESCO',
    category: 'beach',
    description: 'Di sản thiên nhiên thế giới UNESCO nổi bật với Vịnh Lan Hạ êm đềm, hàng trăm bãi cát san hô tự nhiên, làng chài cổ Cái Bèo, trekking rừng kim giao đỉnh Ngự Lâm và làng cổ Việt Hải.',
    recommendedSeason: 'Tháng 4 - Tháng 6 (Đầu hè biển trong xanh) & Tháng 9 - Tháng 11 (Thu mát trekking)',
    estimatedBudget: '2.500.000đ - 3.800.000đ / người',
  },
  {
    id: 'thac-ban-gioc',
    name: 'Thác Bản Giốc & Non nước Cao Bằng',
    province: 'Cao Bằng',
    coordinates: [22.8556, 106.7231],
    photo: {
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      caption: 'Thác Bản Giốc 3 tầng đổ trắng xóa hùng vĩ bên dòng sông Quây Sơn xanh ngọc bích',
      photographer: 'Ban Gioc Waterfall Explorer',
      tags: ['Thác Bản Giốc', 'Cao Bằng', 'Sông Quây Sơn', 'Động Ngườm Ngao', 'Di sản UNESCO'],
    },
    badge: 'Thác nước tự nhiên lớn nhất Đông Nam Á',
    category: 'mountain',
    description: 'Thác nước tự nhiên xuyên biên giới lớn nhất Đông Nam Á đổ trắng xóa bên dòng sông Quây Sơn xanh ngọc bích, cùng Động Ngườm Ngao kỳ vĩ, Mắt Thần Núi và suối Lê-nin Pác Bó.',
    recommendedSeason: 'Tháng 9 - Tháng 10 (Mùa lúa chín vàng & nước xanh ngọc) & Tháng 11 - Tháng 12 (Mùa hoa dã quỳ)',
    estimatedBudget: '2.200.000đ - 3.300.000đ / người',
  },
  {
    id: 'phu-quoc',
    name: 'Đảo Ngọc Phú Quốc (Kiên Giang)',
    province: 'Kiên Giang',
    coordinates: [10.2175, 103.9589],
    photo: {
      url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      caption: 'Khoảnh khắc hoàng hôn tráng lệ bên Cầu Hôn và Thị trấn Hoàng Hôn Địa Trung Hải',
      photographer: 'Sunset Town Explorer',
      tags: ['Phú Quốc', 'Bãi Sao', 'Cầu Hôn', 'Cáp treo Hòn Thơm', 'Nghỉ dưỡng'],
    },
    badge: 'Thiên đường biển đảo & Nghỉ dưỡng',
    category: 'beach',
    description: 'Đảo ngọc thiên đường biển nhiệt đới với Bãi Sao cát trắng mịn, cáp treo vượt biển Hòn Thơm, Thị trấn Hoàng Hôn, Grand World sôi động và thế giới ẩm thực hải sản trứ danh.',
    recommendedSeason: 'Tháng 11 - Tháng 4 (Mùa khô biển êm trong xanh) & Tháng 5 - Tháng 10 (Mùa hè Bãi Sao, Suối Tranh)',
    estimatedBudget: '3.800.000đ - 5.800.000đ / người',
  },
  {
    id: 'da-lat',
    name: 'Thành phố ngàn hoa Đà Lạt (Lâm Đồng)',
    province: 'Lâm Đồng',
    coordinates: [11.9404, 108.4429],
    photo: {
      url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
      caption: 'Hồ Xuân Hương và Quảng trường Lâm Viên biểu tượng nụ hoa Atiso giữa sương sớm',
      photographer: 'Da Lat City Explorer',
      tags: ['Đà Lạt', 'Hồ Xuân Hương', 'Cầu Đất', 'Hồ Tuyền Lâm', 'Langbiang'],
    },
    badge: 'Thành phố sương mù & Săn mây',
    category: 'mountain',
    description: 'Thành phố ngàn hoa trên cao nguyên Lâm Viên với khí hậu ôn đới mát mẻ quanh năm, rừng thông bạt ngàn, biển mây Cầu Đất, hồ Tuyền Lâm thơ mộng và ẩm thực đêm độc đáo.',
    recommendedSeason: 'Tháng 10 - Tháng 12 (Mùa hoa dã quỳ, cỏ hồng & săn mây) & Tháng 1 - Tháng 3 (Hoa mai anh đào)',
    estimatedBudget: '2.200.000đ - 3.500.000đ / người',
  },
  {
    id: 'con-dao',
    name: 'Quần đảo Côn Đảo (Bà Rịa – Vũng Tàu)',
    province: 'Bà Rịa – Vũng Tàu',
    coordinates: [8.6836, 106.6094],
    photo: {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      caption: 'Bờ biển nguyên sơ trong vắt tựa ngọc bích tại Bãi Đầm Trầu Côn Đảo',
      photographer: 'Con Dao Explorer',
      tags: ['Côn Đảo', 'Bãi Đầm Trầu', 'Hàng Dương', 'Hòn Bảy Cạnh', 'Di tích Quốc gia'],
    },
    badge: 'Di tích Lịch sử Đặc biệt & Sinh thái Biển',
    category: 'beach',
    description: 'Quần đảo tiền tiêu linh thiêng với hệ thống Di tích Nhà tù Côn Đảo lịch sử, Nghĩa trang Hàng Dương, rạn san hô nguyên sơ, trải nghiệm thả rùa con về biển và bãi biển cát trắng nước trong vắt.',
    recommendedSeason: 'Tháng 3 - Tháng 9 (Mùa biển êm & rùa biển đẻ trứng) & Tháng 10 - Tháng 2 (Mùa khô nắng vàng)',
    estimatedBudget: '3.200.000đ - 5.200.000đ / người',
  },
  {
    id: 'mui-ne',
    name: 'Mũi Né – Phan Thiết (Bình Thuận)',
    province: 'Bình Thuận',
    coordinates: [10.9486, 108.2961],
    photo: {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      caption: 'Tiểu sa mạc cát trắng Bàu Trắng và hồ sen Bàu Bà thơ mộng tại Mũi Né',
      photographer: 'Bau Trang White Sand Explorer',
      tags: ['Mũi Né', 'Phan Thiết', 'Bàu Trắng', 'Đồi Cát Bay', 'Thủ đô Resort'],
    },
    badge: 'Thủ đô Resort & Tiểu sa mạc cát',
    category: 'beach',
    description: 'Thiên đường nghỉ dưỡng biển và đồi cát sa mạc Bàu Trắng ngút ngàn, trải nghiệm xe Jeep địa hình, lướt ván diều, suối Tiên huyền ảo và ẩm thực lẩu thả, hải sản tươi sống.',
    recommendedSeason: 'Tháng 11 - Tháng 4 (Mùa khô trời xanh lướt ván diều) & Tháng 5 - Tháng 8 (Mùa hoa sen Bàu Trắng)',
    estimatedBudget: '2.200.000đ - 3.500.000đ / người',
  },
  {
    id: 'mai-chau',
    name: 'Thung lũng Mai Châu (Hòa Bình)',
    province: 'Hòa Bình',
    coordinates: [20.6582, 105.0833],
    photo: {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      caption: 'Thung lũng xanh mướt và những nếp nhà sàn truyền thống Bản Lác Mai Châu',
      photographer: 'Mai Chau Valley Explorer',
      tags: ['Mai Châu', 'Bản Lác', 'Đèo Đá Trắng', 'Ba Khan', 'Du lịch cộng đồng'],
    },
    badge: 'Thung lũng bản Thái & Đèo Đá Trắng',
    category: 'mountain',
    description: 'Thung lũng thơ mộng lọt thỏm giữa núi rừng Tây Bắc với những nếp nhà sàn người Thái bình yên tại Bản Lác, Đèo Đá Trắng mờ ảo sương khói và non nước vịnh Ba Khan lòng hồ sông Đà.',
    recommendedSeason: 'Tháng 3 - Tháng 4 & Tháng 9 - Tháng 10 (Mùa lúa chín vàng) & Tháng 11 - Tháng 2 (Mùa hoa đào, hoa mận)',
    estimatedBudget: '1.200.000đ - 3.000.000đ / người',
  },
  {
    id: 'nui-ba-den',
    name: 'Núi Bà Đen – Nóc nhà Nam Bộ (Tây Ninh)',
    province: 'Tây Ninh',
    coordinates: [11.3739, 106.1742],
    photo: {
      url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      caption: 'Đại tượng Phật Bà Tây Bổ Đà Sơn bằng đồng giữa biển mây trên đỉnh Núi Bà Đen',
      photographer: 'Sun World Ba Den Mountain',
      tags: ['Núi Bà Đen', 'Tây Ninh', 'Tây Bổ Đà Sơn', 'Chùa Bà Đen', 'Săn mây'],
    },
    badge: 'Nóc nhà Nam Bộ & Quần thể tâm linh',
    category: 'mountain',
    description: 'Nóc nhà Nam Bộ cao 986m sừng sững giữa đồng bằng, nổi bật với tượng Phật Bà Tây Bổ Đà Sơn bằng đồng cao nhất châu Á, tượng Phật Di Lặc sa thạch, chùa Bà linh thiêng và biển mây đĩa bay kỳ ảo.',
    recommendedSeason: 'Tháng 11 - Tháng 4 (Mùa khô săn mây) & Tháng Giêng (Hội Xuân Núi Bà)',
    estimatedBudget: '1.300.000đ - 3.500.000đ / người',
  },
  {
    id: 'ba-na-hills',
    name: 'Sun World Ba Na Hills (Đà Nẵng)',
    province: 'Đà Nẵng',
    coordinates: [15.9951, 107.9961],
    photo: {
      url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
      caption: 'Cầu Vàng bàn tay khổng lồ vươn mình giữa sương mây Bà Nà Hills',
      photographer: 'Sun World Ba Na Hills',
      tags: ['Bà Nà Hills', 'Cầu Vàng', 'Golden Bridge', 'Làng Pháp', 'Đà Nẵng'],
    },
    badge: 'Cầu Vàng biểu tượng & Làng Pháp',
    category: 'mountain',
    description: "Đường lên tiên cảnh trên đỉnh núi Chúa 1.487m với cây Cầu Vàng nổi tiếng toàn cầu, quần thể Làng Pháp châu Âu cổ kính, Lâu đài Mặt Trăng, vườn hoa Le Jardin D'Amour và khí hậu 4 mùa trong 1 ngày.",
    recommendedSeason: 'Tháng 3 - Tháng 8 (Mùa khô trời xanh rực rỡ) & Tháng 9 - Tháng 2 (Săn mây lãng mạn se lạnh)',
    estimatedBudget: '2.200.000đ - 4.800.000đ / người',
  },
  {
    id: 'tam-dao',
    name: 'Thị trấn Tam Đảo (Vĩnh Phúc)',
    province: 'Vĩnh Phúc',
    coordinates: [21.4563, 105.6438],
    photo: {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      caption: 'Thị trấn sương mù Tam Đảo bồng bềnh trong biển mây với Nhà thờ Đá cổ kính',
      photographer: 'Tam Dao Misty Explorer',
      tags: ['Tam Đảo', 'Nhà thờ Đá', 'Cổng Trời', 'Thác Bạc', 'Vĩnh Phúc', 'Săn mây'],
    },
    badge: 'Đà Lạt thu nhỏ miền Bắc & Thị trấn sương mù',
    category: 'mountain',
    description: 'Nằm ở độ cao gần 1.000m với khí hậu 4 mùa trong 1 ngày, Tam Đảo quyến rũ bởi biển mây bồng bềnh ôm trọn Nhà thờ Đá cổ kính, Cổng Trời lộng gió, Thác Bạc mát lạnh và ẩm thực ngọn su su, gà đồi nướng hấp dẫn.',
    recommendedSeason: 'Tháng 5 - Tháng 8 (Tránh nóng 20-26°C) & Tháng 10 - Tháng 2 (Săn mây se lạnh 8-16°C)',
    estimatedBudget: '1.300.000đ - 3.300.000đ / người',
  },
  {
    id: 'ba-vi',
    name: 'Vườn Quốc gia Ba Vì (Hà Nội)',
    province: 'Hà Nội',
    coordinates: [21.0811, 105.3769],
    photo: {
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
      caption: 'Rừng thông Cốt 400 bạt ngàn xanh ngát trong làn sương mờ ảo Vườn Quốc gia Ba Vì',
      photographer: 'Ba Vi National Park Eco-Explorer',
      tags: ['Ba Vì', 'Rừng thông', 'Hoa Dã Quỳ', 'Đền Thượng', 'Hà Nội', 'Cắm trại'],
    },
    badge: 'Lá phổi xanh Thủ đô & Rừng hoa dã quỳ',
    category: 'mountain',
    description: 'Nằm cách trung tâm Hà Nội chỉ 60km với 3 đỉnh núi cao trên 1.200m, Ba Vì là điểm trốn nóng và trekking lý tưởng với rừng thông ngút ngàn, mùa hoa dã quỳ vàng rực, phế tích Nhà thờ Cổ Pháp và đỉnh thiêng Tản Viên.',
    recommendedSeason: 'Tháng 10 - Tháng 12 (Mùa hoa dã quỳ & săn mây 15-22°C) & Tháng 4 - Tháng 8 (Tránh nóng mát mẻ)',
    estimatedBudget: '700.000đ - 2.800.000đ / người',
  },
  {
    id: 'ham-lon',
    name: 'Núi Hàm Lợn (Sóc Sơn – Hà Nội)',
    province: 'Hà Nội',
    coordinates: [21.2981, 105.7836],
    photo: {
      url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
      caption: 'Khu cắm trại rừng thông thơ mộng ven Hồ Núi Bàu dưới chân Núi Hàm Lợn',
      photographer: 'Ham Lon Camping View',
      tags: ['Hàm Lợn', 'Hồ Núi Bàu', 'Hồ Đồng Đò', 'Trekking', 'Hà Nội', 'Cắm trại'],
    },
    badge: 'Nóc nhà Thủ đô & Cắm trại ven hồ',
    category: 'mountain',
    description: 'Nóc nhà Thủ đô cao 462m thuộc dãy Độc Tôn, thiên đường dã ngoại cắm trại bên Hồ Núi Bàu thơ mộng, cung trekking đường suối mạo hiểm, chèo SUP tại Hồ Đồng Đò và văn hóa cổ Việt Phủ Thành Chương.',
    recommendedSeason: 'Tháng 9 - Tháng 4 (Mùa mát mẻ trekking & lửa trại 15-24°C) & Tháng 5 - Tháng 8 (Cắm trại rừng thông, chèo SUP)',
    estimatedBudget: '450.000đ - 2.500.000đ / người',
  },
  {
    id: 'sam-son',
    name: 'Bãi biển Sầm Sơn (Thanh Hóa)',
    province: 'Thanh Hóa',
    coordinates: [19.7408, 105.9056],
    photo: {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      caption: 'Bãi biển Sầm Sơn nhộn nhịp sóng vỗ ôm trọn dãy núi Trường Lệ thơ mộng',
      photographer: 'Sam Son Beach Explorer',
      tags: ['Sầm Sơn', 'Bãi biển', 'Quảng Trường Biển', 'Hải sản', 'Thanh Hóa'],
    },
    badge: 'Biển đảo sầm uất & Quảng trường biển',
    category: 'beach',
    description: 'Đô thị du lịch biển lâu đời và sôi động bậc nhất miền Bắc với bãi tắm cát mịn thoai thoải, sóng biển dồi dào, quần thể danh thắng núi Trường Lệ, show nhạc nước Quảng Trường Biển và thiên đường hải sản tươi sống.',
    recommendedSeason: 'Tháng 4 - Tháng 8 (Mùa tắm biển & nhạc nước sôi động) & Tháng 9 - Tháng 10 (Mùa thu nghỉ dưỡng dịu mát)',
    estimatedBudget: '1.600.000đ - 3.800.000đ / người',
  },
  {
    id: 'tam-chuc',
    name: 'Quần thể Chùa Tam Chúc (Hà Nam)',
    province: 'Hà Nam',
    coordinates: [20.5786, 105.8012],
    photo: {
      url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      caption: 'Quần thể Chùa Tam Chúc non nước hữu tình tựa Vịnh Hạ Long trên cạn',
      photographer: 'Tam Chuc Sacred Lake Explorer',
      tags: ['Tam Chúc', 'Hồ Lục Nhạc', 'Chùa Ngọc', 'Hà Nam', 'Tâm linh'],
    },
    badge: 'Vịnh Hạ Long trên cạn & Quần thể tâm linh kỷ lục',
    category: 'heritage',
    description: 'Quần thể tâm linh kỷ lục thế giới tọa lạc bên hồ Lục Nhạc 600ha và núi đá Thất Tinh, hòa quyện giữa cảnh quan non nước kỳ vĩ, Điện Tam Thế nguy nga, Vườn Cột Kinh đá nguyên khối và Chùa Ngọc trên đỉnh núi.',
    recommendedSeason: 'Tháng Giêng - Tháng 3 Âm lịch (Mùa lễ hội hành hương) & Tháng 9 - Tháng 11 (Mùa thu thanh tịnh)',
    estimatedBudget: '650.000đ - 2.500.000đ / người',
  },
  {
    id: 'bat-trang',
    name: 'Làng gốm Bát Tràng (Gia Lâm – Hà Nội)',
    province: 'Hà Nội',
    coordinates: [20.9765, 105.9168],
    photo: {
      url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
      caption: 'Bảo tàng Gốm Bát Tràng với 7 bàn xoay gốm khổng lồ bên bờ sông Hồng',
      photographer: 'Bat Trang Ceramic Heritage Explorer',
      tags: ['Bát Tràng', 'Làng gốm', 'Bảo tàng Gốm', 'Nặn gốm', 'Hà Nội'],
    },
    badge: 'Làng gốm cổ 700 năm & Bảo tàng gốm xoắn ốc',
    category: 'heritage',
    description: 'Làng nghề gốm sứ hơn 700 năm bên tả ngạn sông Hồng với Bảo tàng Gốm kiến trúc xoắn ốc ấn tượng, mê cung ngõ cổ lát gạch Bát Tràng, trải nghiệm bàn xoay vuốt gốm và mâm cỗ canh măng mực trứ danh.',
    recommendedSeason: 'Quanh năm (Lý tưởng nhất Tháng 9 - Tháng 4 năm sau & Hội Làng 14-16 tháng Hai Âm lịch)',
    estimatedBudget: '350.000đ - 2.500.000đ / người',
  },
  {
    id: 'eo-gio',
    name: 'Khu du lịch Eo Gió (Quy Nhơn – Bình Định)',
    province: 'Bình Định',
    coordinates: [13.8861, 109.2931],
    photo: {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      caption: 'Kiệt tác eo biển đá kỳ vĩ Eo Gió - Đảo Jeju của Việt Nam bên bờ biển Quy Nhơn',
      photographer: 'Eo Gio Coastal Explorer',
      tags: ['Eo Gió', 'Kỳ Co', 'Con đường ven biển', 'Quy Nhơn', 'Bình Định'],
    },
    badge: 'Đảo Jeju của Việt Nam & Con đường đi bộ ven biển',
    category: 'beach',
    description: 'Kiệt tác eo biển đá kỳ vĩ bậc nhất miền Trung với con đường đi bộ uốn lượn ven vách đá, hàng rào đỏ trắng đặc trưng nhìn ra biển ngọc bích, bãi đá Đẻ và điểm kết hợp lặn ngắm san hô Kỳ Co trứ danh.',
    recommendedSeason: 'Tháng 3 - Tháng 9 (Mùa khô, biển êm xanh ngọc bích & cano lặn san hô Kỳ Co)',
    estimatedBudget: '1.800.000đ - 4.200.000đ / người',
  },
  {
    id: 'nha-trang',
    name: 'Vịnh Nha Trang (Khánh Hòa)',
    province: 'Khánh Hòa',
    coordinates: [12.2388, 109.1967],
    photo: {
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      caption: 'Vịnh Nha Trang - Một trong những vịnh biển đẹp nhất thế giới với 19 hòn đảo kỳ thú',
      photographer: 'Nha Trang Bay Explorer',
      tags: ['Vịnh Nha Trang', 'Hòn Mun', 'VinWonders', 'Hòn Tằm', 'Khánh Hòa'],
    },
    badge: 'Vịnh biển đẹp nhất thế giới & Thiên đường lặn san hô',
    category: 'beach',
    description: 'Thành viên Câu lạc bộ các Vịnh đẹp nhất thế giới với 19 hòn đảo kỳ thú, bờ biển cát trắng trải dài đường Trần Phú, thiên đường lặn ngắm san hô Hòn Mun, đảo giải trí VinWonders và dịch vụ tắm bùn khoáng đảo Hòn Tằm đẳng cấp.',
    recommendedSeason: 'Tháng 1 - Tháng 8 (Mùa khô nắng ấm, biển êm như ngọc, lặn san hô & cano ra đảo lý tưởng)',
    estimatedBudget: '2.200.000đ - 5.200.000đ / người',
  }
];
