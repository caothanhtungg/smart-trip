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
    keywords: ['fansipan', 'fanxipan'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1570784332176-fdd73da66f03?auto=format&fit=crop&w=1200&q=80',
        caption: 'Đỉnh Fansipan nóc nhà Đông Dương giữa biển mây',
        photographer: 'Unsplash Travel',
        tags: ['Núi cao', 'Sapa', 'Biển mây', 'Chinh phục'],
        description: 'Đỉnh núi cao nhất Việt Nam 3.143m, nơi bạn có thể săn mây bồng bềnh và ngắm trọn dãy Hoàng Liên Sơn hùng vĩ.',
        recommendedTip: 'Nên đi cáp treo vào buổi sáng sớm để tránh sương mù dày đặc và tận hưởng ánh nắng vàng.',
      },
      {
        url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Cảnh quan hùng vĩ dãy Hoàng Liên Sơn từ ga cáp treo Fansipan',
        photographer: 'Vietnamese Landscapes',
        tags: ['Thiên nhiên', 'Hùng vĩ'],
      },
    ],
  },
  {
    keywords: ['ba na', 'bana', 'cau vang'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Cầu Vàng Bà Nà Hills nâng đỡ bởi đôi bàn tay khổng lồ',
        photographer: 'Da Nang Tourism',
        tags: ['Bà Nà', 'Cầu Vàng', 'Đà Nẵng', 'Kiến trúc'],
        description: 'Kiến trúc kỳ quan nổi tiếng thế giới vắt ngang đỉnh núi Chúa ở độ cao 1.414m.',
        recommendedTip: 'Thời điểm chụp ảnh đẹp nhất là 7h - 8h sáng khi lượng khách tham quan chưa quá đông.',
      },
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: 'Làng Pháp cổ kính trên đỉnh Bà Nà Hills',
        photographer: 'Danang Vibes',
        tags: ['Làng Pháp', 'Kiến trúc'],
      },
    ],
  },
  {
    keywords: ['da lat', 'dalat', 'lam dong', 'xuan huong', 'langbiang'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
        caption: 'Hồ Xuân Hương và đồi thông mộng mơ thành phố Đà Lạt',
        photographer: 'Vietnam Travel',
        tags: ['Đà Lạt', 'Hồ Xuân Hương', 'Hoa', 'Mộng mơ'],
        description: 'Thành phố ngàn hoa với khí hậu ôn đới mát mẻ quanh năm, những đồi thông reo và quán cà phê view hoàng hôn tuyệt đẹp.',
        recommendedTip: 'Đừng quên chuẩn bị áo khoác nhẹ vì nhiệt độ ban đêm có thể xuống dưới 15°C.',
      },
      {
        url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sương sớm bảng lảng trên những đồi thông Đà Lạt',
        photographer: 'Da Lat Nature',
        tags: ['Đồi thông', 'Sương mù'],
      },
    ],
  },
  {
    keywords: ['da nang', 'danang', 'cau rong', 'my khe'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Thành phố biển Đà Nẵng năng động và Cầu Rồng rực rỡ',
        photographer: 'Da Nang Tourism',
        tags: ['Đà Nẵng', 'Biển Mỹ Khê', 'Cầu Rồng', 'Đáng sống'],
        description: 'Thành phố biển đáng sống nhất Việt Nam với bãi cát mịn trải dài, hải sản tươi ngon và nhịp sống văn minh.',
        recommendedTip: 'Cầu Rồng phun lửa và phun nước vào lúc 21:00 mỗi tối Thứ 7 và Chủ Nhật.',
      },
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bình minh êm ả trên bãi biển Mỹ Khê Đà Nẵng',
        photographer: 'Sea Breeze',
        tags: ['Biển Mỹ Khê', 'Bình minh'],
      },
    ],
  },
  {
    keywords: ['hoi an', 'hoian', 'quang nam', 'chua cau'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
        caption: 'Phố cổ Hội An lung linh sắc màu lồng đèn về đêm',
        photographer: 'Heritage Vietnam',
        tags: ['Hội An', 'Phố Cổ', 'Di sản', 'Lồng đèn'],
        description: 'Đô thị cổ được UNESCO công nhận là di sản văn hóa thế giới với những ngôi nhà sơn vàng cổ kính và dòng sông Hoài thơ mộng.',
        recommendedTip: 'Hãy thử đi thuyền thả hoa đăng trên sông Hoài vào lúc hoàng hôn.',
      },
      {
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
        caption: 'Nắng chiều chiếu rọi những bức tường vàng hoa giấy Hội An',
        photographer: 'Old Town Heritage',
        tags: ['Hoa giấy', 'Tường vàng'],
      },
    ],
  },
  {
    keywords: ['ha long', 'halong', 'quang ninh', 'vinh ha long'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: 'Kỳ quan thiên nhiên thế giới Vịnh Hạ Long',
        photographer: 'Halong Wonder',
        tags: ['Hạ Long', 'Vịnh', 'Kỳ quan', 'Du thuyền'],
        description: 'Vịnh biển với hàng nghìn hòn đảo đá vôi kỳ vĩ nhô lên giữa làn nước xanh ngọc lục bảo.',
        recommendedTip: 'Trải nghiệm chèo kayak luồn qua các hang luồn đá vôi để tận mắt ngắm nhìn thảm thực vật kỳ diệu.',
      },
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Hoàng hôn buông trên mặt biển phẳng lặng vịnh Hạ Long',
        photographer: 'Emerald Bay',
        tags: ['Hoàng hôn', 'Du thuyền'],
      },
    ],
  },
  {
    keywords: ['sa pa', 'sapa', 'lao cai', 'muong hoa'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1570784332176-fdd73da66f03?auto=format&fit=crop&w=1200&q=80',
        caption: 'Ruộng bậc thang xanh ngát thung lũng Mường Hoa Sa Pa',
        photographer: 'Highlands Vietnam',
        tags: ['Sa Pa', 'Ruộng bậc thang', 'Tây Bắc', 'Văn hóa bản địa'],
        description: 'Vùng cao Tây Bắc nổi tiếng với cảnh sắc kỳ vĩ của những thửa ruộng bậc thang uốn lượn và sắc màu thổ cẩm vùng cao.',
        recommendedTip: 'Mùa lúa chín vàng óng ả rơi vào cuối tháng 8 đến giữa tháng 10 hàng năm.',
      },
      {
        url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bản Cát Cát thơ mộng nép mình bên dòng suối',
        photographer: 'Northwest Scenery',
        tags: ['Bản làng', 'Bản Cát Cát'],
      },
    ],
  },
  {
    keywords: ['phu quoc', 'phuquoc', 'kien giang', 'bai sao', 'sunset sanato'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bãi biển cát trắng mịn và làn nước trong vắt tại đảo ngọc Phú Quốc',
        photographer: 'Island Explorer',
        tags: ['Phú Quốc', 'Đảo Ngọc', 'Bãi biển', 'Nghỉ dưỡng'],
        description: 'Hòn đảo nhiệt đới với bãi biển cát trắng tinh khôi, vườn tiêu xanh mướt và những khu nghỉ dưỡng đẳng cấp quốc tế.',
        recommendedTip: 'Thời gian lý tưởng nhất để du lịch Phú Quốc là mùa khô từ tháng 11 đến tháng 4 năm sau.',
      },
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Hoàng hôn đỏ rực trên biển đảo Phú Quốc',
        photographer: 'Tropical Sunset',
        tags: ['Hoàng hôn', 'Biển đảo'],
      },
    ],
  },
  {
    keywords: ['ha noi', 'hanoi', 'ho guom', 'pho co'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
        caption: 'Tháp Rùa trầm mặc soi bóng nước Hồ Gươm thủ đô Hà Nội',
        photographer: 'Capital Memories',
        tags: ['Hà Nội', 'Hồ Gươm', 'Thủ Đô', 'Ngàn năm văn hiến'],
        description: 'Thủ đô ngàn năm văn hiến với 36 phố phường nhộn nhịp, ẩm thực phở trứ danh và không khí thu nồng nàn hoa sữa.',
        recommendedTip: 'Đi dạo phố đi bộ quanh Hồ Gươm vào tối cuối tuần để cảm nhận trọn vẹn nhịp sống người Tràng An.',
      },
    ],
  },
  {
    keywords: ['ho chi minh', 'hcm', 'sai gon', 'saigon', 'landmark 81'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Thành phố Hồ Chí Minh rực rỡ ánh đèn về đêm bên bờ sông Sài Gòn',
        photographer: 'Saigon Nights',
        tags: ['Sài Gòn', 'TP. Hồ Chí Minh', 'Đô thị', 'Sôi động'],
        description: 'Trung tâm kinh tế sầm uất và không ngủ của Việt Nam với các tòa nhà chọc trời, ẩm thực đường phố phong phú.',
        recommendedTip: 'Hãy trải nghiệm xe buýt đường sông (Saigon Waterbus) lúc chiều tà để ngắm nhìn thành phố từ góc nhìn độc đáo.',
      },
    ],
  },
  {
    keywords: ['ninh binh', 'ninhbinh', 'trang an', 'tam coc', 'hang mua'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: 'Quần thể danh thắng Tràng An Ninh Bình non xanh nước biếc',
        photographer: 'Trang An Heritage',
        tags: ['Ninh Bình', 'Tràng An', 'Hang Múa', 'Di sản'],
        description: 'Vịnh Hạ Long trên cạn với hệ thống hang động đá vôi kỳ ảo hòa quyện cùng thảm thực vật xanh mướt.',
        recommendedTip: 'Leo 500 bậc đá lên đỉnh Hang Múa để có góc nhìn toàn cảnh Tam Cốc ngoạn mục nhất.',
      },
    ],
  },
  {
    keywords: ['hue', 'thua thien hue', 'dai noi', 'song huong'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
        caption: 'Cố đô Huế cổ kính trang nghiêm bên dòng sông Hương êm đềm',
        photographer: 'Hue Heritage',
        tags: ['Huế', 'Cố Đô', 'Đại Nội', 'Lăng tẩm'],
        description: 'Kinh đô triều Nguyễn lưu giữ trọn vẹn nét tôn nghiêm cung đình, nhã nhạc cung đình và ẩm thực tinh hoa.',
        recommendedTip: 'Nên thuê xe đạp dạo quanh các lăng tẩm và thưởng thức chè hẻm đặc sản xứ Huế.',
      },
    ],
  },
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
    id: 'da-nang',
    name: 'Đà Nẵng',
    province: 'TP. Đà Nẵng',
    coordinates: [16.0544, 108.2022],
    photo: {
      url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
      caption: 'Thành phố biển Đà Nẵng & Cầu Rồng',
      photographer: 'Da Nang Tourism',
      tags: ['Biển Mỹ Khê', 'Cầu Rồng', 'Bà Nà Hills'],
    },
    badge: 'Hot nhất hè',
    category: 'beach',
    description: 'Thành phố đáng sống với biển xanh Mỹ Khê, bán đảo Sơn Trà và ẩm thực miền Trung đậm đà.',
    recommendedSeason: 'Tháng 3 - Tháng 8',
    estimatedBudget: '2.500.000đ - 4.500.000đ / người',
  },
  {
    id: 'da-lat',
    name: 'Đà Lạt',
    province: 'Lâm Đồng',
    coordinates: [11.9404, 108.4583],
    photo: {
      url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
      caption: 'Đà Lạt ngàn hoa & đồi thông reo',
      photographer: 'Vietnam Travel',
      tags: ['Đồi thông', 'Hồ Xuân Hương', 'Hoa cà phê'],
    },
    badge: 'Khí hậu se lạnh',
    category: 'mountain',
    description: 'Xứ sở ngàn hoa với khí hậu se lạnh lãng mạn quanh năm, đồi thông bạt ngàn và quán cà phê ngắm mây.',
    recommendedSeason: 'Quanh năm (đẹp nhất T10 - T4)',
    estimatedBudget: '1.800.000đ - 3.200.000đ / người',
  },
  {
    id: 'hoi-an',
    name: 'Phố cổ Hội An',
    province: 'Quảng Nam',
    coordinates: [15.8801, 108.338],
    photo: {
      url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
      caption: 'Phố cổ Hội An lung linh lồng đèn',
      photographer: 'Heritage Vietnam',
      tags: ['Di sản UNESCO', 'Sông Hoài', 'Ẩm thực cao lầu'],
    },
    badge: 'Di sản thế giới',
    category: 'heritage',
    description: 'Đô thị cổ nghìn năm tuổi, rực rỡ sắc màu hoa đăng bên dòng sông Hoài thơ mộng.',
    recommendedSeason: 'Tháng 2 - Tháng 7',
    estimatedBudget: '1.500.000đ - 3.000.000đ / người',
  },
  {
    id: 'ha-long',
    name: 'Vịnh Hạ Long',
    province: 'Quảng Ninh',
    coordinates: [20.9505, 107.0734],
    photo: {
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      caption: 'Kỳ quan thiên nhiên vịnh Hạ Long',
      photographer: 'Halong Wonder',
      tags: ['Du thuyền', 'Hang Sửng Sốt', 'Chèo Kayak'],
    },
    badge: 'Kỳ quan thế giới',
    category: 'nature',
    description: 'Quần thể đảo đá vôi kỳ vĩ và hang động nguyên sơ giữa làn nước xanh ngọc bích.',
    recommendedSeason: 'Tháng 4 - Tháng 6 & Tháng 9 - Tháng 11',
    estimatedBudget: '2.000.000đ - 5.000.000đ / người',
  },
  {
    id: 'sa-pa',
    name: 'Sa Pa & Fansipan',
    province: 'Lào Cai',
    coordinates: [22.3364, 103.8438],
    photo: {
      url: 'https://images.unsplash.com/photo-1570784332176-fdd73da66f03?auto=format&fit=crop&w=1200&q=80',
      caption: 'Sa Pa bồng bềnh mây ngàn',
      photographer: 'Highlands Vietnam',
      tags: ['Đỉnh Fansipan', 'Ruộng bậc thang', 'Bản Cát Cát'],
    },
    badge: 'Săn mây Tây Bắc',
    category: 'mountain',
    description: 'Nóc nhà Đông Dương, những thửa ruộng bậc thang kỳ vĩ và nét văn hóa thổ cẩm đặc sắc.',
    recommendedSeason: 'Tháng 9 - Tháng 11 & Tháng 12 - Tháng 2 (Mùa tuyết/hoa đào)',
    estimatedBudget: '2.200.000đ - 3.800.000đ / người',
  },
  {
    id: 'phu-quoc',
    name: 'Đảo ngọc Phú Quốc',
    province: 'Kiên Giang',
    coordinates: [10.2899, 103.984],
    photo: {
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      caption: 'Bãi biển trong xanh tại Phú Quốc',
      photographer: 'Island Explorer',
      tags: ['Bãi Sao', 'Lặn ngắm san hô', 'Hải sản'],
    },
    badge: 'Thiên đường biển',
    category: 'beach',
    description: 'Bờ cát trắng mịn, ngắm hoàng hôn đỏ rực và thưởng thức hải sản tươi rói miền biển tây nam.',
    recommendedSeason: 'Tháng 11 - Tháng 4',
    estimatedBudget: '3.500.000đ - 6.500.000đ / người',
  },
  {
    id: 'ninh-binh',
    name: 'Ninh Bình - Tràng An',
    province: 'Ninh Bình',
    coordinates: [20.2506, 105.9745],
    photo: {
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      caption: 'Tràng An non nước hữu tình',
      photographer: 'Trang An Heritage',
      tags: ['Hang Múa', 'Tràng An', 'Tam Cốc'],
    },
    badge: 'Non nước hữu tình',
    category: 'nature',
    description: 'Vịnh Hạ Long trên cạn với cảnh sắc núi non trùng điệp, đầm sen thơm mát và dòng sông uốn lượn.',
    recommendedSeason: 'Tháng 1 - Tháng 3 (Lễ hội) & Tháng 5 - Tháng 6 (Lúa chín)',
    estimatedBudget: '1.200.000đ - 2.500.000đ / người',
  },
  {
    id: 'ha-noi',
    name: 'Thủ đô Hà Nội',
    province: 'TP. Hà Nội',
    coordinates: [21.0285, 105.8542],
    photo: {
      url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
      caption: 'Hà Nội ngàn năm văn hiến',
      photographer: 'Capital Memories',
      tags: ['Hồ Gươm', 'Phố Cổ', 'Phở gia truyền'],
    },
    badge: 'Văn hóa & Lịch sử',
    category: 'city',
    description: 'Thủ đô ngàn năm văn hiến, góc phố rêu phong cổ kính và nền ẩm thực phong phú bậc nhất.',
    recommendedSeason: 'Mùa thu (Tháng 9 - Tháng 11)',
    estimatedBudget: '1.500.000đ - 3.000.000đ / người',
  },
];
