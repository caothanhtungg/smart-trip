export type GuideRegion =
  | "all"
  | "north"
  | "central"
  | "south"
  | "highlands"
  | "islands";

export interface GuideSectionDay {
  day: number;
  title: string;
  places: string[];
  note: string;
}

export interface GuideFoodItem {
  name: string;
  desc: string;
  priceRange: string;
}

export interface GuideGalleryPhoto {
  url: string;
  caption: string;
  photographer: string;
  tags?: string[];
}

export interface TravelGuide {
  id: string;
  slug: string;
  title: string;
  destination: string;
  province: string;
  region: "north" | "central" | "south" | "highlands" | "islands";
  durationText: string;
  estimatedBudget: string;
  bestSeason: string;
  coverPhoto: {
    url: string;
    caption: string;
    photographer: string;
  };
  gallery?: readonly GuideGalleryPhoto[];
  summary: string;
  tags: string[];
  sections: {
    packingList: string[];
    sampleDays: GuideSectionDay[];
    foodHighlights: GuideFoodItem[];
    budgetTips: string[];
  };
}

export interface GuideRegionTab {
  key: GuideRegion;
  label: string;
}

export const GUIDE_REGION_TABS: readonly GuideRegionTab[] = [
  { key: "all", label: "Tất cả vùng miền" },
  { key: "north", label: "Miền Bắc & Tây Bắc" },
  { key: "central", label: "Miền Trung & Di sản" },
  { key: "highlands", label: "Tây Nguyên đại ngàn" },
  { key: "south", label: "Miền Nam & Sông nước" },
  { key: "islands", label: "Biển đảo thiên đường" },
] as const;

export const TRAVEL_GUIDES: readonly TravelGuide[] = [
  {
    id: "guide-trangan-tamcoc",
    slug: "cam-nang-trang-an-tam-coc-ninh-binh-3n2d",
    title: "Cẩm nang du lịch Tràng An – Tam Cốc 3N2Đ: Di sản kép UNESCO, đò chèo hang nước & đỉnh Ngọa Long",
    destination: "Tràng An – Tam Cốc (Ninh Bình)",
    province: "Ninh Bình",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.200.000đ - 3.500.000đ / người",
    bestSeason: "Tháng 1 - Tháng 3 (Du xuân) & Cuối tháng 5 - Đầu tháng 6 (Mùa lúa chín)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      caption: "Quần thể danh thắng Tràng An non xanh nước biếc giữa núi đá vôi kỳ vĩ",
      photographer: "Vietnam Heritage Collection",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Toàn cảnh dòng sông Ngô Đồng uốn lượn nhìn từ đỉnh Hang Múa",
        photographer: "Tam Coc Landscapes",
        tags: ["Hang Múa", "Đỉnh Ngọa Long", "Mùa lúa"],
      },
      {
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        caption: "Thuyền nan xuôi dòng sông Ngô Đồng qua Tam Cốc - Bích Động",
        photographer: "Heritage Travel",
        tags: ["Tam Cốc", "Chèo đò", "Sông Ngô Đồng"],
      },
      {
        url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
        caption: "Hành lang La Hán và đại quần thể tâm linh Chùa Bái Đính",
        photographer: "Bai Dinh Photos",
        tags: ["Chùa Bái Đính", "Tâm linh", "Đại Phật"],
      },
      {
        url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
        caption: "Tháp Tứ Ân lung linh ánh đèn bên hồ Kỳ Lân tại Phố cổ Hoa Lư",
        photographer: "Hoa Lu Lights",
        tags: ["Phố cổ Hoa Lư", "Đêm lung linh"],
      },
    ],
    summary:
      "Trọn bộ kinh nghiệm 3N2Đ khám phá di sản kép thế giới Tràng An – Tam Cốc: đò nan xuyên thủy động kỳ ảo, chinh phục 500 bậc đá Hang Múa ngắm mùa vàng Tam Cốc, dạo phố cổ Hoa Lư và thưởng thức đặc sản dê núi cơm cháy nức tiếng.",
    tags: [
      "Tràng An",
      "Tam Cốc",
      "Hang Múa",
      "Cố đô Hoa Lư",
      "Chùa Bái Đính",
      "Di sản UNESCO",
      "Phố cổ Hoa Lư",
      "Dê núi Ninh Bình",
    ],
    sections: {
      packingList: [
        "Giày thể thao/giày đế bệt bám tốt: Bắt buộc khi leo gần 500 bậc đá ở Hang Múa và đi bộ khuôn viên rộng ở Chùa Bái Đính.",
        "Trang phục lịch sự: Mang theo ít nhất 1 bộ kín đáo (quần/váy dài qua đầu gối, áo có tay) để vào các đền, chùa (Tràng An, Bái Đính, Bích Động, Hoa Lư).",
        "Trang phục thoáng mát, thấm mồ hôi cho các hoạt động ngoài trời và chụp ảnh.",
        "Phụ kiện chống nắng/mưa: Ô (dù) gấp gọn, mũ rộng vành/nón lá, kính râm, kem chống nắng (ngồi đò Tam Cốc 2 giờ không có mái che cố định).",
        "Đồ dùng cá nhân: Thuốc xịt côn trùng (khi đi Thung Nham hoặc ở bungalow đồng ruộng), túi chống nước cho điện thoại khi đi đò, tiền mặt mệnh giá lẻ gửi xe và mua nước.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Cố đô Hoa Lư – KDL sinh thái Tràng An – Phố cổ Hoa Lư",
          places: [
            "Cố đô Hoa Lư (Đền vua Đinh Tiên Hoàng, Đền vua Lê Đại Hành)",
            "Khu du lịch sinh thái Tràng An (Tuyến 2 hoặc Tuyến 3 đò chèo hang nước)",
            "Hành Cung Vũ Lâm & Phim trường Kong: Skull Island",
            "Phố cổ Hoa Lư & Tháp Tứ Ân lên đèn hồ Kỳ Lân",
          ],
          note: "Tràng An và Cố đô Hoa Lư chỉ cách nhau khoảng 3 km dọc Đại lộ Tràng An. Nên đi thuyền Tràng An đầu giờ chiều để tránh nắng gắt và về trước 17:00.",
        },
        {
          day: 2,
          title: "Tam Cốc – Chùa Bích Động – Đền Thái Vi – Đỉnh Hang Múa",
          places: [
            "Bến thuyền Tam Cốc xuôi dòng Ngô Đồng qua Hang Cả, Hang Hai, Hang Ba",
            "Đạp xe xuyên đường làng rợp bóng cây vào Đền Thái Vi và Chùa Bích Động",
            "Nghỉ trưa tránh nắng và thưởng thức dê núi",
            "Chinh phục gần 500 bậc đá Hang Múa ngắm toàn cảnh sông Ngô Đồng lúc hoàng hôn",
            "Chụp ảnh đầm sen rộng lớn dưới chân núi Ngọa Long",
          ],
          note: "Các điểm Tam Cốc, Đền Thái Vi, Bích Động và Hang Múa nằm trong bán kính 2 – 4 km; đi xe đạp hoặc xe máy là phương án tối ưu nhất.",
        },
        {
          day: 3,
          title: "Chùa Bái Đính (hoặc KDL sinh thái Thung Nham) – Mua đặc sản",
          places: [
            "Lựa chọn 1 (Tâm linh): Đại lễ Phật Chùa Bái Đính (hành lang La Hán, điện Tam Thế, Bảo Tháp 13 tầng)",
            "Lựa chọn 2 (Sinh thái): Khám phá KDL Thung Nham (Hang Bụt, Động Vái Giời, thuyền ngắm chim tự nhiên)",
            "Ăn trưa, trả phòng homestay",
            "Mua đặc sản làm quà: Cơm cháy chà bông, nem chua Yên Mạc, mắm tép Gia Viễn",
          ],
          note: "Khuôn viên Chùa Bái Đính rất rộng, bắt buộc nên mua vé xe điện trung chuyển khứ hồi từ bến xe vào cổng chùa.",
        },
      ],
      foodHighlights: [
        {
          name: "Thịt dê núi Ninh Bình",
          desc: "Dê núi đá vôi thịt săn chắc, ngọt mềm, chế biến thành tái chanh, nướng tảng, ủ trấu thơm lừng hoặc lẩu dê nghi ngút khói.",
          priceRange: "150.000đ - 300.000đ / đĩa (Lẩu từ 350.000đ - 500.000đ / nồi)",
        },
        {
          name: "Cơm cháy sốt dê / sốt tim cật",
          desc: "Cơm cháy vàng giòn rụm chấm nước sốt tim cật hoặc nước sốt dê đậm đà, thơm béo cay nhẹ ăn cùng ruốc thịt.",
          priceRange: "60.000đ - 120.000đ / phần (Cơm cháy đóng gói mua về: 35.000đ - 55.000đ / gói)",
        },
        {
          name: "Ốc núi đá vôi (Theo mùa)",
          desc: "Ốc sống trong hốc đá vôi ăn thảo dược, thịt giòn ngọt sần sật, luộc sả ớt hoặc xào me cay chua dịu (mùa từ tháng 4 đến tháng 8).",
          priceRange: "80.000đ - 150.000đ / đĩa",
        },
        {
          name: "Miến lươn bà Phấn",
          desc: "Lươn xào săn đậm đà ăn cùng nước dùng hầm xương ngọt thanh và hoa chuối thái mỏng thanh mát.",
          priceRange: "40.000đ - 60.000đ / bát",
        },
        {
          name: "Gỏi cá nhệch Kim Sơn",
          desc: "Thịt cá nhệch tươi trộn thính thơm nức, cuốn lá sung, đinh lăng, mơ lông và chấm nước chẻo bùi béo cay ấm nồng.",
          priceRange: "150.000đ - 250.000đ / phần",
        },
        {
          name: "Canh cá rô Tổng Trường",
          desc: "Cá rô bắt ở vùng hang động đá vôi Tổng Trường, thịt chắc thơm ngậy nấu cùng rau cải ngọt thanh giải nhiệt.",
          priceRange: "80.000đ - 150.000đ / tô",
        },
        {
          name: "Nem chua Yên Mạc & Mắm tép Gia Viễn",
          desc: "Đặc sản truyền thống mua về làm quà: nem chua bùi cuốn lá ổi chấm mắm gừng và mắm tép đỏ tươi chưng thịt ba chỉ.",
          priceRange: "35.000đ - 50.000đ / quả nem; 80.000đ - 120.000đ / chai mắm tép 500ml",
        },
      ],
      budgetTips: [
        "Ghép thuyền đủ người: Đò ở Tràng An và Tam Cốc tính theo chuyến (4-5 khách/đò). Nếu đi 1-2 người, hãy đợi ở bến 5-10 phút để ghép đoàn cùng khách lẻ, tránh phải bao trọn thuyền.",
        "Chọn homestay tại khu vực Tam Cốc hoặc Trường Yên: Giá phòng 400.000 - 1.200.000đ hợp lý, gần trung tâm ẩm thực và thường được mượn xe đạp miễn phí đi dạo.",
        "Gửi xe đúng bãi niêm yết tại Hang Múa: Chạy thẳng vào bãi xe chính thức bên trong cổng khu du lịch, tránh các bãi xe tự phát bên ngoài để không bị ép mua đồ hay đội giá.",
        "Ăn uống tại khu dân sinh: Các quán dê núi dọc trục đường Tràng An (xã Trường Yên) hoặc trung tâm TP có mức giá mềm và định lượng đầy đặn hơn nhà hàng sát cổng bến thuyền.",
      ],
    },
  },
  {
    id: "guide-sondoong-phongnha",
    slug: "cam-nang-hang-son-doong-phong-nha-ke-bang",
    title: "Cẩm nang thám hiểm Hang Sơn Đoòng & VQG Phong Nha – Kẻ Bàng: Kỳ quan đệ nhất động & hố sụt nguyên sinh",
    destination: "Hang Sơn Đoòng & Phong Nha (Quảng Bình)",
    province: "Quảng Bình",
    region: "central",
    durationText: "3N2Đ (Phong Nha) hoặc 6N5Đ (Sơn Đoòng)",
    estimatedBudget: "3.000.000đ - 4.500.000đ (Phong Nha) / 75.000.000đ (Sơn Đoòng)",
    bestSeason: "Tháng 1 - Tháng 8 (Mở cửa duy nhất; Tháng 2 - 4 săn tia nắng đẹp nhất)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
      caption: "Vòm hang khổng lồ và tia nắng xuyên Hố Sụt tại kỳ quan Hang Sơn Đoòng",
      photographer: "Oxalis / Cave Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Bãi cát hạ trại khổng lồ và hồ nước ngầm trong lòng Hang Én",
        photographer: "Vietnam Caving Expedition",
        tags: ["Hang Én", "Hạ trại", "Hồ ngầm"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Thuyền rồng lướt trên dòng sông Son tiến vào Động Phong Nha",
        photographer: "Phong Nha National Park",
        tags: ["Động Phong Nha", "Sông Son", "Thuyền rồng"],
      },
      {
        url: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80",
        caption: "Trekking băng qua thung lũng Rào Thương và Bản Đoòng giữa rừng nguyên sinh",
        photographer: "Jungle Trekker",
        tags: ["Bản Đoòng", "Trekking", "Rào Thương"],
      },
      {
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        caption: "Zipline qua sông Chày màu ngọc bích và khám phá Hang Tối",
        photographer: "Song Chay Adventure",
        tags: ["Sông Chày", "Hang Tối", "Zipline"],
      },
    ],
    summary:
      "Cẩm nang thám hiểm Vườn quốc gia Phong Nha – Kẻ Bàng và Hang Sơn Đoòng với 2 phương án linh hoạt: Tuyến thám hiểm Sơn Đoòng 6N5Đ chuyên biệt (giới hạn 1.000 khách/năm) và Tuyến 3N2Đ phổ thông khám phá Động Phong Nha, chèo kayak Sông Chày, trekking Bản Đoòng – Hang Én.",
    tags: [
      "Hang Sơn Đoòng",
      "Phong Nha – Kẻ Bàng",
      "Hang Én",
      "Bản Đoòng",
      "Sông Chày Hang Tối",
      "Động Thiên Đường",
      "Di sản UNESCO",
      "Gà nướng muối cheo",
    ],
    sections: {
      packingList: [
        "Giày trekking thoát nước nhanh (tuyệt đối không chống thấm): Không mang giày Gore-Tex vì lội hàng chục con suối sâu đến gối nước không thoát được. Chọn giày đế cao su mềm bám đá ướt.",
        "Trang phục nhanh khô (Quick-dry): Quần dài và áo dài tay co giãn nhẹ để tránh vắt rừng, côn trùng và lá cây han gây ngứa rát.",
        "Tất cao cổ dày (3 - 4 đôi): Ôm sát cổ chân ngăn cát sỏi lọt vào giày và hạn chế vắt bám khi băng rừng.",
        "Balo trợ lực 20L - 30L & Túi khô (Dry bag): Bọc thiết bị điện tử, điện thoại và máy ảnh (độ ẩm lòng hang gần 100%).",
        "Đồ dùng y tế cá nhân: Phấn rôm hoặc thuốc chống nấm kẽ chân sau khi lội suối liên tục, viên sủi điện giải bù khoáng khi vận động nặng.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Động Phong Nha – Sông Chày & Hang Tối",
          places: [
            "Bến thuyền trung tâm ngược dòng sông Son vào Động Phong Nha",
            "Ăn trưa cá trắm sông Son, gà nướng mẹt muối cheo",
            "Đu dây Zipline 400m qua sông Chày màu ngọc bích",
            "Chèo thuyền kayak và tắm bùn khoáng tự nhiên trong lòng Hang Tối",
          ],
          note: "Cung đường từ trung tâm Phong Nha vào Sông Chày – Hang Tối khoảng 12 km đường nhựa bằng phẳng, đi xe máy hoặc ô tô mất khoảng 20 phút.",
        },
        {
          day: 2,
          title: "Trekking Bản Đoòng – Hạ trại lòng Hang Én (Cửa ngõ Sơn Đoòng)",
          places: [
            "Tập kết tại Oxalis Adventure, xe đưa đến Km 35 đường Hồ Chí Minh nhánh Tây",
            "Băng rừng nguyên sinh đổ dốc thung lũng Rào Thương thăm Bản Đoòng người Bru-Vân Kiều",
            "Trekking lội qua hơn 20 con suối cạn đến cửa vòm Hang Én (hang lớn thứ 3 thế giới)",
            "Hạ trại trên bãi cát khổng lồ trong lòng hang, bơi lội hồ ngầm và ăn tối BBQ",
          ],
          note: "Đoạn đường rừng dốc và băng suối đá trơn, bắt buộc đi theo đoàn có chuyên gia hướng dẫn viên và porter khuân vác, không tự ý đi lẻ.",
        },
        {
          day: 3,
          title: "Khám phá vòm Hang Én / Động Thiên Đường – Chày Lập Farmstay",
          places: [
            "Lựa chọn trekking: Leo vòm cửa sau Hang Én ngắm thung lũng dẫn sang cửa Hang Sơn Đoòng",
            "Lựa chọn nhẹ nhàng: Tham quan Động Thiên Đường dài 31km với thạch nhũ hoàng cung",
            "Tắm giải nhiệt tại Suối Nước Moọc giữa rừng râm mát",
            "Về Chày Lập Farmstay nghỉ ngơi, chèo SUP trên sông Son và kết thúc hành trình",
          ],
          note: "Đường Hồ Chí Minh nhánh Tây vắng vẻ, đèo dốc và không có cây xăng dọc đường rừng; cần đổ đầy bình xăng từ trung tâm Phong Nha.",
        },
      ],
      foodHighlights: [
        {
          name: "Gà nướng mẹt chấm muối cheo Phong Nha",
          desc: "Gà đồi thả rông nướng than hoa vàng giòn ăn kèm xôi nếp và muối cheo giã từ lá lốt, húng quế, ớt xanh và tiêu rừng cay nồng.",
          priceRange: "280.000đ - 400.000đ / mẹt (2 - 4 người ăn)",
        },
        {
          name: "Cá trắm sông Son",
          desc: "Cá trắm nuôi lồng bè tự nhiên trên dòng nước trong vắt sông Son, thịt dai ngọt om măng chua, nướng sả ớt hoặc làm chả giòn.",
          priceRange: "150.000đ - 300.000đ / món",
        },
        {
          name: "Cháo canh cá lóc ram giòn",
          desc: "Sợi bánh canh bột mì mềm mượt nấu nước hầm cá lóc sườn heo ngọt đậm, ăn kèm chả ram chiên giòn rụm và ớt chưng cay nồng.",
          priceRange: "30.000đ - 45.000đ / tô",
        },
        {
          name: "Tôm sông Son rang muối / nướng mọi",
          desc: "Tôm sông tự nhiên vỏ mỏng thịt ngọt giòn sần sật, chấm muối tiêu chanh hoặc muối cheo rừng.",
          priceRange: "120.000đ - 200.000đ / đĩa",
        },
        {
          name: "Bánh lọc, bánh nậm Quảng Bình",
          desc: "Bánh bột lọc nhân tôm thịt sông trong suốt dai mềm chấm mắm ớt cay xé lưỡi đậm chất miền Trung.",
          priceRange: "20.000đ - 35.000đ / đĩa",
        },
        {
          name: "Khoai deo Quảng Bình (Đặc sản làm quà)",
          desc: "Khoai lang đỏ luộc ủ phơi qua nhiều con nắng, dẻo quánh, vị ngọt bùi tự nhiên nhâm nhi cùng trà nóng.",
          priceRange: "70.000đ - 100.000đ / túi 500g",
        },
      ],
      budgetTips: [
        "Ghép thuyền tại Động Phong Nha: Thuyền rồng giá 550.000đ/chuyến (tối đa 12 người). Đứng chờ tại quầy điều phối khoảng 10-15 phút để ghép đủ đoàn, chia ra chỉ còn 45.000đ - 55.000đ/người.",
        "Chọn tour Hang Én / Hang Va thay thế: Hang Én chính là cửa ngõ và bãi trại đầu tiên của hành trình Sơn Đoòng, chi phí chỉ ~7.600.000đ - 8.000.000đ (bằng 1/9 so với Sơn Đoòng 75 triệu) nhưng mang lại trải nghiệm cắm trại hang khổng lồ tương đương.",
        "Mua vé cảnh quan cơ bản mùa lạnh: Từ tháng 11 đến tháng 2 nước suối lạnh không nên mua gói trò chơi nước toàn phần, chỉ cần mua vé ngắm cảnh 80.000đ - 150.000đ ở Sông Chày và Moọc.",
        "Đi xe buýt B4 từ Đồng Hới lên Phong Nha: Bắt tuyến xe buýt B4 từ trung tâm TP Đồng Hới lên Phong Nha với giá chỉ 35.000đ - 45.000đ/lượt thay vì đi taxi riêng 500.000đ - 600.000đ.",
      ],
    },
  },

  {
    id: "guide-halong-quangninh",
    slug: "cam-nang-du-lich-vinh-ha-long-quang-ninh-3n2d",
    title: "Cẩm nang du lịch Vịnh Hạ Long 3N2Đ: Kỳ quan thế giới UNESCO, hải trình Tuyến 2 & ẩm thực Hòn Gai",
    destination: "Vịnh Hạ Long (Quảng Ninh)",
    province: "Quảng Ninh",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.800.000đ - 4.500.000đ / người",
    bestSeason: "Tháng 4 - Tháng 6 (Đầu hè biển êm) & Tháng 9 - Tháng 11 (Thu dịu mát)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      caption: "Kỳ quan thiên nhiên thế giới Vịnh Hạ Long ngàn đảo đá vôi xanh biếc",
      photographer: "Halong Heritage Collection",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        caption: "Hải trình du thuyền lướt sóng qua cụm hòn Trống Mái trên Vịnh Hạ Long",
        photographer: "Cruise Explorer",
        tags: ["Hòn Trống Mái", "Du thuyền", "Vịnh Hạ Long"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Chèo thuyền kayak và đò nan qua vòm đá tự nhiên tuyệt mỹ tại Hang Luồn",
        photographer: "Kayak Adventure",
        tags: ["Hang Luồn", "Chèo Kayak", "Vòm đá"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Toàn cảnh 360 độ Vịnh Hạ Long nhìn từ đỉnh núi đá Đảo Ti Tốp",
        photographer: "Halong Panorama",
        tags: ["Đảo Ti Tốp", "Ngắm cảnh 360", "Bãi tắm"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Bảo tàng Quảng Ninh kiến trúc than đá đen tuyền bên vịnh biển Hòn Gai",
        photographer: "Quang Ninh Museum",
        tags: ["Bảo tàng Quảng Ninh", "Hòn Gai", "Kiến trúc"],
      },
    ],
    summary:
      "Trọn bộ kinh nghiệm du lịch Vịnh Hạ Long 3N2Đ: hải trình Tuyến 2 (Đảo Ti Tốp, Hang Sửng Sốt, Hang Luồn), trải nghiệm Sun World Bãi Cháy, check-in Bảo tàng Quảng Ninh và thưởng thức chả mực giã tay Hòn Gai.",
    tags: [
      "Vịnh Hạ Long",
      "Đảo Ti Tốp",
      "Hang Sửng Sốt",
      "Hang Luồn",
      "Chèo Kayak",
      "Bảo tàng Quảng Ninh",
      "Sun World Hạ Long",
      "Chả mực giã tay",
      "Di sản UNESCO",
    ],
    sections: {
      packingList: [
        "Bình giữ nhiệt hoặc chai nước thủy tinh cá nhân: Quy định Ban Quản lý cấm tuyệt đối đồ nhựa dùng 1 lần (chai nhựa, túi nilon, hộp xốp) mang lên tàu ra vịnh.",
        "Giày thể thao đế bám chống trơn: Bắt buộc để leo 400 bậc đá dốc lên đỉnh Ti Tốp và đi bộ khám phá Hang Sửng Sốt diện tích 10.000m².",
        "Đồ bơi & Dép sandal/xỏ ngón: Dễ dàng lội nước khi chèo kayak ở Hang Luồn và tắm biển Ti Tốp hoặc bãi tắm Bãi Cháy.",
        "Túi chống nước đeo cổ cho điện thoại: Bảo vệ máy ảnh, điện thoại khi chèo kayak giữa vịnh rất dễ bị văng nước.",
        "Thuốc chống say sóng & dị ứng hải sản: Uống trước khi tàu xuất bến 30 phút nếu bạn có tiền sử say tàu xe.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Hòn Gai – Bảo tàng Quảng Ninh – Cung Cá Heo – Biển Bãi Cháy",
          places: [
            "Check-in Bảo tàng Quảng Ninh & Cung Cá Heo (khối than đen kiến trúc độc đáo bên bờ vịnh)",
            "Dạo con đường bao biển Trần Quốc Nghiễn ngắm cảnh Hòn Gai",
            "Ăn trưa bánh cuốn chả mực giã tay phố Rạp Hát hoặc bún bề bề",
            "Về khách sạn Bãi Cháy nhận phòng, tắm biển và dạo bộ Bãi Cháy lúc hoàng hôn",
            "Ăn tối hải sản Cái Dăm và dạo phố cổ Bãi Cháy / chợ đêm Hạ Long",
          ],
          note: "Khu Hòn Gai và Bãi Cháy ngăn cách nhau bởi cầu Bãi Cháy (7–8 km); hãy gom trọn các điểm Hòn Gai vào buổi sáng để tối ưu thời gian.",
        },
        {
          day: 2,
          title: "Hải trình khám phá Vịnh Hạ Long Tuyến 2 (6 tiếng) – Phố biển đêm",
          places: [
            "Xuất phát từ Cảng tàu quốc tế Hạ Long (Bãi Cháy) hoặc Cảng Tuần Châu",
            "Tàu lướt qua Hòn Trống Mái, Hòn Chó Đá, Đỉnh Hương",
            "Khám phá Hang Sửng Sốt (hang động lớn và lộng lẫy nhất vịnh)",
            "Ăn trưa hải sản trên tàu, chèo thuyền kayak / đò nan xuyên Hang Luồn",
            "Cập bến Đảo Ti Tốp: tắm biển bãi cát vầng trăng hoặc leo 400 bậc đá ngắm toàn cảnh 360 độ",
            "15:30 tàu về cảng, tối thưởng thức sữa chua trân châu Hạ Long và cà phê view biển",
          ],
          note: "Cần xác định chính xác vé tàu xuất bến từ Cảng quốc tế Hạ Long hay Cảng Tuần Châu (cách nhau 12 km) để tránh đến nhầm cảng.",
        },
        {
          day: 3,
          title: "Sun World Ha Long – Chợ Hạ Long 1 – Mua đặc sản",
          places: [
            "Trải nghiệm Sun World Ha Long: Cáp treo Nữ Hoàng vượt biển sang Đồi Mặt Trời và Vòng quay Sun Wheel",
            "Tham quan Vườn Nhật Zen Garden ngắm trọn vẹn vịnh biển và cầu Bãi Cháy",
            "Trả phòng khách sạn, qua Hòn Gai ghé Chợ Hạ Long 1 mua chả mực giã tay, ruốc tôm và sá sùng",
            "Thưởng thức bún cù kỳ hoặc cháo ngán nóng hổi trước khi lên xe về",
          ],
          note: "Nếu đi Cáp treo Nữ Hoàng sang Đồi Mặt Trời, nên đi vào sáng sớm hoặc chiều tà để tránh nắng gắt.",
        },
      ],
      foodHighlights: [
        {
          name: "Bánh cuốn chả mực giã tay",
          desc: "Bánh cuốn tráng mỏng nóng hổi nhân mộc nhĩ thịt băm, ăn kèm chả mực giã tay vàng ruộm giòn sần sật và nước mắm chấm chua ngọt hạt tiêu.",
          priceRange: "40.000đ - 60.000đ / suất",
        },
        {
          name: "Bún bề bề & Bún cù kỳ",
          desc: "Nước dùng hầm cua biển và tôm ngọt đậm đà, phủ đầy bề bề bóc nõn hoặc thịt càng cù kỳ chắc ngọt ăn cùng rau sống thanh mát.",
          priceRange: "40.000đ - 65.000đ / bát",
        },
        {
          name: "Sam biển 7 món",
          desc: "Đặc sản biển Hạ Long chế biến thành gỏi sam, chân sam xào chua ngọt, chả sam cuốn lá lốt, trứng sam nướng béo bùi.",
          priceRange: "150.000đ - 250.000đ / đĩa",
        },
        {
          name: "Ngán biển nướng & Cháo ngán",
          desc: "Họ hàng nhà ngao nhưng to và giàu dinh dưỡng hơn, nướng mỡ hành thơm ngậy hoặc nấu cháo ngán ấm bụng và rượu tiết ngán.",
          priceRange: "150.000đ - 300.000đ / món",
        },
        {
          name: "Sữa chua trân châu Hạ Long",
          desc: "Sữa chua dẻo mịn mát lạnh kết hợp cốt dừa béo ngậy và trân châu trắng dẻo dai ấm nóng đặc trưng.",
          priceRange: "25.000đ - 35.000đ / cốc",
        },
        {
          name: "Chả mực giã tay & Ruốc tôm (Đặc sản làm quà)",
          desc: "Mực mai tươi sống giã tay tạo độ giòn sần sật nức tiếng (mua tại Chợ Hạ Long 1) cùng ruốc tôm thịt đậm đà.",
          priceRange: "400.000đ - 520.000đ / kg chả mực; 250.000đ - 350.000đ / hộp ruốc tôm 500g",
        },
      ],
      budgetTips: [
        "Chọn đi Tuyến 2 thay vì Tuyến 1: Giá vé thắng cảnh 250.000đ như nhau, chỉ chênh 50.000đ vé tàu nhưng được đi 6 tiếng, tham quan cả Đảo Ti Tốp và Hang Sửng Sốt đẹp nhất vịnh.",
        "Mua vé tàu ghép trực tiếp tại quầy Ban Quản lý cảng: Đến thẳng quầy vé tại Cảng quốc tế Hạ Long (Bãi Cháy) hoặc Tuần Châu để mua đúng giá niêm yết, tránh cò mồi bên ngoài cảng.",
        "Ăn uống bên khu Hòn Gai: Khu Bãi Cháy chuyên phục vụ du khách giá cao hơn 15 - 25%. Đi qua cầu Bãi Cháy sang đường bao biển Cột 3 - Cột 5 hoặc chợ Hạ Long 1 để ăn hải sản tươi giá dân sinh.",
        "Luôn hỏi giá theo cân/đĩa trước khi gọi: Tại các quán ốc và hải sản bình dân, hãy hỏi rõ đơn giá theo kg (đã bao gồm công chế biến chưa) trước khi chọn món.",
      ],
    },
  },
  {
    id: "guide-sapa-fansipan",
    slug: "cam-nang-du-lich-sa-pa-fansipan-3n2d",
    title: "Cẩm nang du lịch Sa Pa – Fansipan 3N2Đ: Chinh phục Nóc nhà Đông Dương 3.143m, săn mây Ô Quy Hồ & bản sắc Tây Bắc",
    destination: "Sa Pa – Đỉnh Fansipan (Lào Cai)",
    province: "Lào Cai",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.800.000đ - 4.500.000đ / người",
    bestSeason: "Tháng 9 - Tháng 10 (Mùa lúa chín vàng & săn mây) & Tháng 3 - Tháng 5 (Hoa đỗ quyên)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
      caption: "Đỉnh Fansipan 3.143m - Nóc nhà Đông Dương bồng bềnh giữa biển mây",
      photographer: "Fansipan Legend Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Thung lũng Mường Hoa uốn lượn bên triền ruộng bậc thang mùa lúa chín",
        photographer: "Sapa Valley Photographers",
        tags: ["Mường Hoa", "Ruộng bậc thang", "Tả Van"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Bản Cát Cát cổ kính nép mình bên dòng thác Tiên Sa róc rách",
        photographer: "Cat Cat Heritage",
        tags: ["Bản Cát Cát", "Thác Tiên Sa", "Bản H'Mông"],
      },
      {
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        caption: "Hoàng hôn rực lửa trên Đỉnh Đèo Ô Quy Hồ - Tứ đại đỉnh đèo Tây Bắc",
        photographer: "O Quy Ho Pass",
        tags: ["Đèo Ô Quy Hồ", "Cổng trời", "Săn hoàng hôn"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Kiến trúc phong cách Pháp cổ kính của Toà nhà Sun Plaza tại trung tâm Sa Pa",
        photographer: "Sun Plaza Sapa",
        tags: ["Sun Plaza", "Nhà thờ Đá", "Trung tâm Sa Pa"],
      },
    ],
    summary:
      "Chinh phục Nóc nhà Đông Dương Fansipan 3.143m ngắm nhìn biển mây bồng bềnh trên dãy Hoàng Liên Sơn, khám phá nét văn hóa bản địa mộc mạc tại Bản Cát Cát, thung lũng Mường Hoa và săn hoàng hôn rực rỡ tại đèo Ô Quy Hồ.",
    tags: [
      "Sa Pa",
      "Fansipan",
      "Săn mây",
      "Đèo Ô Quy Hồ",
      "Bản Cát Cát",
      "Mường Hoa",
      "Lào Cai",
      "Tây Bắc",
    ],
    sections: {
      packingList: [
        "Quần áo mặc theo lớp (Layering): Nhiệt độ trên đỉnh Fansipan (3.143m) luôn thấp hơn thị xã Sa Pa từ 8°C – 12°C kèm gió rít rất mạnh. Bắt buộc mang áo khoác gió chống thấm, áo giữ nhiệt mỏng, khăn quàng cổ và găng tay.",
        "Giày thể thao đế ma sát cao: Từ ga cáp treo lên đỉnh Fansipan có hơn 600 bậc đá dốc đứng và đường dốc ở bản Cát Cát rất dễ trơn trượt khi có sương mù.",
        "Miếng dán giữ nhiệt & Đồ ăn nhẹ năng lượng cao: Dán giữ nhiệt vào lưng/chân và dán mặt lưng điện thoại để tránh sập nguồn do lạnh; mang kẹo gừng hoặc socola để giữ ấm và tránh tụt huyết áp ở độ cao >3.000m.",
        "Giấy tờ tùy thân gốc (CCCD/Bằng lái xe): Bắt buộc phải có để làm thủ tục thuê xe máy và nhận phòng khách sạn.",
        "Kem chống nắng & thuốc cá nhân: Kem chống nắng chỉ số cao (tia UV trên núi cao rất gắt), thuốc cảm cúm, đau đầu do thay đổi độ cao.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Trung tâm Thị xã Sa Pa – Bản Cát Cát – Chợ đêm Sa Pa",
          places: [
            "Sun Plaza Sa Pa",
            "Nhà thờ Đá Sa Pa",
            "Moana Sapa",
            "Bản Cát Cát",
            "Thác Tiên Sa",
            "Hồ Mắt Ngọc & Chợ đêm Sa Pa",
          ],
          note: "08:00 – 11:30: Check-in Toà nhà Sun Plaza, Nhà thờ Đá Sa Pa, gửi hành lý và ghé Moana Sapa uống cà phê sáng ngắm dãy Hoàng Liên Sơn. 11:30 – 13:30: Ăn trưa lẩu cá tầm hoặc đồ nướng, nhận phòng khách sạn. 14:30 – 17:30: Tham quan Bản Cát Cát, dạo đường đá dốc, xem múa khèn tại thác Tiên Sa, thuê trang phục thổ cẩm. 19:00 – 22:00: Ăn tối đặc sản thắng cố hoặc cá hồi tươi, dạo hồ Mắt Ngọc và chợ đêm Sa Pa. Lưu ý: Lúc về từ cổng dưới Cát Cát nên bắt xe ôm hoặc xe điện 30k ngược dốc lên bãi gửi xe để giữ sức.",
        },
        {
          day: 2,
          title: "Chinh phục Đỉnh Fansipan – Thác Bạc – Săn hoàng hôn Đèo Ô Quy Hồ",
          places: [
            "Tàu hỏa Mường Hoa",
            "Ga Cáp treo Fansipan Legend",
            "Đại Tượng Phật A Di Đà",
            "Đỉnh Fansipan 3.143m",
            "Thác Bạc & Thác Tình Yêu",
            "Đỉnh Đèo Ô Quy Hồ (Cổng Trời)",
          ],
          note: "07:30 – 12:30: Đi tàu hỏa Mường Hoa lên Ga Cáp treo Fansipan, đi cáp treo vượt thung lũng Mường Hoa, viếng Đại Tượng Phật, Bích Vân Thiền Tự và chạm tay vào chóp inox Đỉnh Fansipan 3.143m. 12:30 – 14:00: Ăn trưa buffet tại nhà hàng Vân Sam. 14:30 – 16:00: Đi dọc QL4D tham quan Thác Bạc và Thác Tình Yêu. 16:15 – 18:00: Lên đỉnh Đèo Ô Quy Hồ săn biển mây hoàng hôn, thưởng thức trứng nướng, cơm lam bên than hồng. Lưu ý: Kiểm tra camera thời tiết trực tiếp tại Sun Plaza trước khi mua vé cáp; về lại thị xã trước 18:00 tránh sương mù đèo.",
        },
        {
          day: 3,
          title: "Thung lũng Mường Hoa – Trekking Bản Lao Chải & Tả Van – Mua đặc sản",
          places: [
            "Thung lũng Mường Hoa",
            "Bản Lao Chải",
            "Bản Tả Van",
            "Cầu Mây Sa Pa",
            "Tắm lá thuốc người Dao Đỏ",
            "Chợ Sa Pa",
          ],
          note: "08:00 – 11:30: Đi dọc sườn núi xuống Thung lũng Mường Hoa, trekking qua ruộng bậc thang nối liền Bản Lao Chải và Tả Van (người H'Mông đen và Dao Đỏ), check-in cầu Mây và cà phê suối. 12:00 – 14:00: Ăn trưa, trả phòng và trải nghiệm tắm lá thuốc Dao Đỏ thư giãn cơ bắp sau hành trình leo núi. 14:30 – 16:00: Ghé chợ Sa Pa mua thịt trâu gác bếp, tương ớt Mường Khương, nấm hương rừng trước khi lên xe về lại. Đường đèo xuống Tả Van hẹp và dốc, nếu lái xe máy yếu nên thuê taxi trọn gói 2 chiều (300k - 400k).",
        },
      ],
      foodHighlights: [
        {
          name: "Lẩu cá hồi & Gỏi cá hồi / Lẩu cá tầm Sa Pa",
          desc: "Cá hồi và cá tầm nuôi tại vùng nước lạnh Sa Pa thịt săn chắc, béo ngọt tự nhiên, nhúng nước lẩu chua cay măng chua rau rừng.",
          priceRange: "400.000đ - 700.000đ / nồi (cho 2 - 4 người)",
        },
        {
          name: "Gà đen (Gà ác) nướng mật ong kèm xôi ngũ sắc",
          desc: "Gà bản địa xương đen thịt chắc ngọt ướp mật ong rừng nướng than hoa thơm lừng chấm muối chẩm chéo cay tê, ăn cùng xôi ngũ sắc dẻo thơm.",
          priceRange: "250.000đ - 350.000đ / mẹt",
        },
        {
          name: "Lợn cắp nách Sa Pa (Hấp, nướng mắc khén, rựa mận)",
          desc: "Thịt lợn thả rông bì giòn rụm, thịt nạc mềm ngọt không ngấy tẩm ướp hạt dổi và mắc khén đặc trưng Tây Bắc.",
          priceRange: "150.000đ - 250.000đ / đĩa",
        },
        {
          name: "Thắng cố ngựa Bắc Hà truyền thống",
          desc: "Món ăn di sản vùng cao nấu từ thịt và nội tạng ngựa cùng 12 vị thảo quả, quế, hồi, thảo mộc, ăn kèm rau cải mèo và ngô ngọt.",
          priceRange: "300.000đ - 500.000đ / nồi",
        },
        {
          name: "Cốn sủi Sa Pa (Phở khan sốt sệt)",
          desc: "Sợi phở mềm ngập trong nước sốt đậm đà sánh mịn ăn kèm củ rong giòn sần sật, thịt thái chỉ, trứng luộc và tiêu thơm cay nồng ấm.",
          priceRange: "40.000đ - 50.000đ / bát",
        },
        {
          name: "Đồ nướng xiên que phố cổ Sa Pa",
          desc: "Ba chỉ cuộn cải mèo, bò cuộn nấm kim châm, cơm lam nướng ống tre, chả cá hồi nướng than hồng giữa trời lạnh buốt đêm Sa Pa.",
          priceRange: "15.000đ - 35.000đ / xiên",
        },
        {
          name: "Thịt trâu gác bếp & Tương ớt Mường Khương (Quà lưu niệm)",
          desc: "Thịt trâu bắp hun khói củi nhãn đượm mùi mắc khén xé sợi chấm tương ớt Mường Khương cay nồng trứ danh Lào Cai.",
          priceRange: "750.000đ - 900.000đ / kg thịt trâu; 35.000đ - 50.000đ / chai tương ớt",
        },
      ],
      budgetTips: [
        "Đi bộ 600 bậc đá chiều xuống trên đỉnh Fansipan: Thay vì mua tàu hỏa leo núi đỉnh cả 2 chiều (270k), chỉ mua chiều lên (150k) rồi đi bộ chiều xuống để vãn cảnh Đại Tượng Phật, Thác nước 9 tầng và chùa trên mây.",
        "Mua combo Vé Cáp treo + Buffet trưa trên đỉnh Fansipan: Tiết kiệm 200.000đ – 250.000đ/người so với mua vé cáp và ăn trưa lẻ tại các nhà hàng trên đỉnh.",
        "Đi nhóm 3 - 4 người nên đi taxi lên Ga Cáp treo: Tàu hỏa Mường Hoa 180k/người khứ hồi (4 người = 720k); đi taxi từ quảng trường lên ga chỉ 3km tốn 60k - 80k/chuyến.",
        "Không đưa tiền lẻ cho trẻ em bán hàng rong: Tại Quảng trường và Bản Cát Cát, hãy hỏi rõ trước khi chụp ảnh chung tránh bị xin tiền không mong muốn.",
      ],
    },
  },
  {
    id: "guide-hagiang-loop",
    slug: "cam-nang-du-lich-ha-giang-loop-dong-van-3n2d",
    title: "Cẩm nang du lịch Hà Giang Loop 3N2Đ: Chinh phục Cao nguyên đá Đồng Văn, Đèo Mã Pí Lèng & Hẻm Tu Sản",
    destination: "Cao nguyên đá Đồng Văn (Hà Giang)",
    province: "Hà Giang",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.200.000đ - 3.500.000đ / người",
    bestSeason: "Tháng 10 - Tháng 11 (Mùa hoa Tam Giác Mạch) & Tháng 12 - Tháng 3 (Mùa hoa cải, đào, mận)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      caption: "Hẻm vực Tu Sản & dòng sông Nho Quế xanh ngọc bích dưới chân đèo Mã Pí Lèng",
      photographer: "Ha Giang Loop Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Đèo Mã Pí Lèng - Đệ nhất hùng quan hiểm trở bậc nhất Việt Nam",
        photographer: "Vietnam Roadtrip Collection",
        tags: ["Mã Pí Lèng", "Tứ đại đỉnh đèo", "Cao nguyên đá"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Cột cờ Quốc gia Lũng Cú kiêu hãnh tại điểm cực Bắc địa đầu Tổ quốc",
        photographer: "Lung Cu Flag Tower",
        tags: ["Lũng Cú", "Cực Bắc", "Bản Lô Lô Chải"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Dốc Thẩm Mã uốn lượn chín khúc ngoạn mục giữa thung lũng đá tai mèo",
        photographer: "Tham Ma Pass",
        tags: ["Dốc Thẩm Mã", "Quốc lộ 4C", "Đồng Văn"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Dinh thự Vua Mèo (Họ Vương) kiến trúc đá cổ kính giữa thung lũng Sà Phìn",
        photographer: "Vuong Palace Heritage",
        tags: ["Dinh Vua Mèo", "Sà Phìn", "Kiến trúc cổ"],
      },
    ],
    summary:
      "Chinh phục cung đường phượt huyền thoại Ha Giang Loop qua 4 huyện vùng cao, chiêm ngưỡng Đệ nhất hùng quan Mã Pí Lèng, du thuyền trên dòng sông Nho Quế ngọc bích xuyên Hẻm Tu Sản và chạm tay vào Cột cờ Lũng Cú cực Bắc Tổ quốc.",
    tags: [
      "Hà Giang",
      "Đồng Văn",
      "Mã Pí Lèng",
      "Sông Nho Quế",
      "Lũng Cú",
      "Ha Giang Loop",
      "Quản Bạ",
      "Mèo Vạc",
      "UNESCO",
    ],
    sections: {
      packingList: [
        "Giấy tờ bắt buộc: CCCD gắn chip bản gốc, Bằng lái xe máy hạng A1/A2 (cảnh sát giao thông kiểm tra nồng độ cồn và bằng lái rất nghiêm ngặt tại TP. Hà Giang, Quản Bạ, Đồng Văn).",
        "Đồ bảo hộ đi xe đường đèo: Áo khoác gió 2 lớp cản gió, găng tay dài ngón, kính chắn bụi toàn mặt hoặc mũ bảo hiểm 3/4 có kính, bộ bọc đầu gối/khuỷu tay.",
        "Hành lý gọn nhẹ: Balo mềm thay vì vali kéo cứng để chằng buộc gọn gàng sau yên xe máy (các tiệm thuê xe tại TP. Hà Giang đều hỗ trợ gửi vali lớn miễn phí).",
        "Dụng cụ cá nhân: Dây chun ràng đồ, áo mưa bộ (quần rời áo rời chống cản gió khi đổ đèo), tiền mặt mệnh giá nhỏ (sóng 4G trên đèo yếu, khó chuyển khoản QR).",
        "Thuốc men & sơ cứu: Băng gạc cá nhân, thuốc đau bụng, thuốc chống say xe, dầu gió và miếng dán giữ nhiệt.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "TP. Hà Giang (Km 0) – Quản Bạ – Yên Minh – Sủng Là – Dinh Vua Mèo – Phố cổ Đồng Văn (155 km)",
          places: [
            "Cột mốc Km 0 Hà Giang",
            "Dốc Bắc Sum",
            "Cổng Trời Quản Bạ & Núi Đôi Cô Tiên",
            "Cây Cô Đơn Cán Tỷ",
            "Dốc Thẩm Mã & Dốc Chín Khoanh",
            "Nhà của Pao (Làng Lũng Cẩm)",
            "Dinh thự Vua Mèo (Họ Vương)",
            "Phố cổ Đồng Văn",
          ],
          note: "07:00 – 08:00: Nhận xe máy tại TP. Hà Giang, ăn sáng bánh cuốn trứng, check-in Cột mốc Km 0. 09:30 – 11:30: Vượt dốc Bắc Sum lên Cổng Trời Quản Bạ, ngắm Núi Đôi Cô Tiên, qua Cây Cô Đơn và ăn trưa tại Yên Minh. 13:30 – 16:30: Chinh phục Dốc Thẩm Mã, thăm Nhà của Pao (Sủng Là) và khám phá Dinh họ Vương. 17:30 – 21:30: Đến Phố cổ Đồng Văn nhận phòng, ăn tối lẩu gà đen và uống cà phê Phố Cổ. Lưu ý: Bắt buộc xuất phát trước 07:30 sáng từ TP. Hà Giang để đến Đồng Văn trước khi trời tối sập (17:30 trên đèo đã tối đen và nhiều sương mù).",
        },
        {
          day: 2,
          title: "Phố cổ Đồng Văn – Cột cờ Lũng Cú – Bản Lô Lô Chải – Đèo Mã Pí Lèng – Sông Nho Quế – Làng Pả Vi (90 km)",
          places: [
            "Cột cờ Quốc gia Lũng Cú",
            "Bản Lô Lô Chải",
            "Đèo Mã Pí Lèng",
            "Panorama Mã Pí Lèng",
            "Bến thuyền Tà Làng",
            "Sông Nho Quế & Hẻm Tu Sản",
            "Làng văn hóa Mông Pả Vi",
          ],
          note: "07:30 – 11:00: Chạy xe qua cung đá tai mèo lên điểm cực Bắc, leo 839 bậc thang lên Cột cờ Lũng Cú, ghé Bản Lô Lô Chải với những ngôi nhà trình tường đất vàng. 11:30 – 13:00: Ăn trưa tại Đồng Văn, trả phòng. 13:30 – 15:00: Vượt Đèo Mã Pí Lèng dài 20 km ngắm vực sông Nho Quế. 15:00 – 17:30: Xuống bến Tà Làng, đi thuyền máy ngược dòng sông Nho Quế xuyên Hẻm Tu Sản (sâu nhất Đông Nam Á), về nghỉ đêm tại Làng văn hóa Pả Vi (Mèo Vạc). Lưu ý: Đường xuống bến Tà Làng rất dốc và cua tay áo gắt; nên gửi xe máy trên đỉnh dốc và đi xe ôm/xe trung chuyển xuống bến.",
        },
        {
          day: 3,
          title: "Mèo Vạc – Mậu Duệ – Đường Thượng (Hoặc Du Già) – TP. Hà Giang (160 km)",
          places: [
            "Chợ phiên Mèo Vạc (hoặc Đồng Văn)",
            "Cung đèo Mậu Duệ – Đường Thượng",
            "Thung lũng đá Lũng Hồ",
            "Thị trấn Quản Bạ",
            "TP. Hà Giang",
          ],
          note: "07:00 – 08:30: Ghé Chợ phiên Mèo Vạc (nếu sáng Chủ Nhật) trải nghiệm giao thương đồng bào Mông, Dao, Lô Lô. 08:30 – 12:30: Xuất phát theo cung Mậu Duệ – Đường Thượng – Lũng Hồ – Quản Bạ tạo vòng lặp khép kín không trùng lặp đường cũ, ngắm ruộng bậc thang và thung lũng đá hoang sơ. 12:30 – 16:30: Ăn trưa tại Quản Bạ, chạy xe về lại TP. Hà Giang trả xe, tắm rửa nghỉ ngơi trước khi lên xe giường nằm đêm về Hà Nội. Lưu ý: Đoạn Mậu Duệ – Đường Thượng có một số đoạn mặt đường đá dăm gồ ghề; cần kiểm tra phanh và lốp xe trước khi rời Mèo Vạc.",
        },
      ],
      foodHighlights: [
        {
          name: "Bánh cuốn trứng nước xương nóng",
          desc: "Bánh cuốn tráng mỏng nhân trứng lòng đào thơm béo chấm ngập trong bát nước dùng ninh xương heo nóng hổi rắc hành hoa và lạp xưởng vùng cao.",
          priceRange: "35.000đ - 45.000đ / suất",
        },
        {
          name: "Thắng cố & Mèn mén người Mông",
          desc: "Món ăn truyền thống từ thịt và lòng ngựa/bò hầm cùng thảo quả rừng, ăn kèm mèn mén (bột ngô đồ chín dẻo bùi) chấm ớt nướng cay tê.",
          priceRange: "150.000đ - 300.000đ / nồi thắng cố; 15.000đ - 25.000đ / bát mèn mén",
        },
        {
          name: "Lẩu gà đen H'Mông rau rừng",
          desc: "Gà xương đen vùng cao thịt săn chắc ngọt đậm nhúng lẩu chua ngọt ăn kèm rau cải mèo đắng nhẹ giòn ngọt và ngọn tầm bóp mọc tự nhiên.",
          priceRange: "350.000đ - 500.000đ / nồi",
        },
        {
          name: "Cháo Ấu Tẩu (Cháo giải cảm đêm vùng cao)",
          desc: "Nấu từ củ ấu tẩu ninh nhừ cùng gạo tẻ, gạo nếp nương và chân giò heo; vị béo ngậy đượm đắng nhẹ hậu ngọt, giúp ấm bụng và ngủ sâu giấc.",
          priceRange: "40.000đ - 50.000đ / bát",
        },
        {
          name: "Bánh Tam Giác Mạch nướng than hồng",
          desc: "Hạt tam giác mạch xay mịn nhào bột nặn bánh tròn xốp nướng chín thơm lừng trên than hồng, xốp mềm bùi ngậy đặc trưng chợ phiên.",
          priceRange: "10.000đ - 15.000đ / chiếc",
        },
        {
          name: "Thắng dền Phố cổ Đồng Văn",
          desc: "Bánh trôi nếp nương nhân đỗ hoặc mè đen chan nước đường phèn gừng ấm nóng, rắc lạc rang thơm ngậy giữa đêm đông gió lạnh phố cổ.",
          priceRange: "15.000đ - 20.000đ / bát",
        },
        {
          name: "Phở chua Hà Giang & Phở tráng tay chợ phiên",
          desc: "Bánh phở tráng thủ công dày dặn trộn sốt chua ngọt, thịt xá xíu, lạp xưởng thái mỏng, đu đủ muối và lạc rang thơm bùi hấp dẫn.",
          priceRange: "35.000đ - 45.000đ / bát",
        },
        {
          name: "Mật ong Bạc Hà & Lạp xưởng gác bếp (Quà đặc sản)",
          desc: "Mật ong hoa bạc hà dại màu vàng chanh ánh xanh sánh đậm thơm mát chỉ có trên cao nguyên đá, cùng lạp xưởng hun khói củi mía thơm ngậy.",
          priceRange: "450.000đ - 650.000đ / lít mật ong; 350.000đ - 450.000đ / kg lạp xưởng",
        },
      ],
      budgetTips: [
        "Tận dụng phòng nghỉ sáng sớm miễn phí tại các tiệm thuê xe máy ở TP. Hà Giang: Đi xe giường nằm đêm từ Hà Nội lên đến TP. Hà Giang lúc 03:30 - 04:00 sáng, các tiệm cho thuê xe uy tín có sẵn phòng dorm tắm nóng lạnh miễn phí ngủ đến 07:00 sáng, tiết kiệm 1 đêm tiền khách sạn.",
        "Chọn thuê xe số (Blade / Wave RSX 110cc) thay vì xe tay ga: Tuyệt đối không đi xe ga lên cao nguyên đá vì đổ đèo dài dễ cháy phanh; xe số khỏe máy, hãm tốc bằng số an toàn và tiết kiệm xăng gấp rưỡi.",
        "Nghỉ đêm tại Làng văn hóa Pả Vi (Mèo Vạc) thay vì ở Đồng Văn cuối tuần: Đêm thứ Bảy tại Phố cổ Đồng Văn thường cháy phòng giá cao; chạy thêm 20 km qua đèo Mã Pí Lèng xuống Làng Pả Vi có homestay kiến trúc Mông rộng rãi, giá mềm hơn 20 - 30%.",
        "Đổ đầy bình xăng tại Quản Bạ, Yên Minh và Đồng Văn: Không mua xăng lẻ đóng chai dọc đèo vì giá cao và dễ lẫn tạp chất gây hụt ga khi leo dốc.",
      ],
    },
  },
  {
    id: "guide-my-son-hoian",
    slug: "cam-nang-du-lich-my-son-hoi-an-3n2d",
    title: "Cẩm nang du lịch Mỹ Sơn – Hội An 3N2Đ: Khám phá Thánh địa Champa cổ đại & Trục di sản sông Thu Bồn",
    destination: "Thánh địa Mỹ Sơn (Quảng Nam)",
    province: "Quảng Nam",
    region: "central",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.200.000đ - 3.500.000đ / người",
    bestSeason: "Tháng 2 - Tháng 4 (Đầu mùa khô mát mẻ) & Tháng 5 - Tháng 8 (Mùa hè nắng đẹp rực rỡ)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      caption: "Quần thể tháp Chăm cổ kính thâm nghiêm giữa thung lũng Thánh địa Mỹ Sơn",
      photographer: "My Son Sanctuary Heritage",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Chi tiết điêu khắc vũ nữ Apsara và hoa văn sa thạch tinh xảo trên tường tháp cổ",
        photographer: "Champa Architecture",
        tags: ["Điêu khắc Champa", "Apsara", "Nhóm tháp B C D"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Chùa Cầu và dòng sông Hoài thơ mộng tại trung tâm Phố cổ Hội An",
        photographer: "Hoi An Ancient Town",
        tags: ["Phố cổ Hội An", "Chùa Cầu", "Sông Hoài"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Làng gốm Thanh Hà truyền thống 500 năm tuổi thanh bình bên bờ sông Thu Bồn",
        photographer: "Thanh Ha Pottery",
        tags: ["Làng gốm Thanh Hà", "Sông Thu Bồn", "Làng nghề"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Bảo tàng Điêu khắc Chăm nơi lưu giữ các bảo vật quốc gia gốc từ Mỹ Sơn",
        photographer: "Cham Sculpture Museum",
        tags: ["Bảo tàng Chăm", "Đài thờ Mỹ Sơn E1", "Cổ vật"],
      },
    ],
    summary:
      "Hành trình kết nối di sản kép miền Trung: Chiêm ngưỡng tuyệt tác kiến trúc gạch nung Champa nghìn năm tuổi tại thung lũng Thánh địa Mỹ Sơn, xuôi dòng sông Thu Bồn khám phá làng nghề truyền thống và thả hoa đăng lung linh tại Phố cổ Hội An.",
    tags: [
      "Mỹ Sơn",
      "Thánh địa Mỹ Sơn",
      "Quảng Nam",
      "Hội An",
      "Champa",
      "Di sản UNESCO",
      "Duy Xuyên",
      "Thu Bồn",
    ],
    sections: {
      packingList: [
        "Trang phục chống nắng & Lịch sự: Khu đền tháp Mỹ Sơn nằm trong lòng chảo không có nhiều bóng râm; mang mũ rộng vành, kính râm, áo khoác chống UV và mặc trang phục kín đáo khi vào khu di tích tâm linh cổ.",
        "Giày đi bộ đế mềm thoáng khí: Toàn bộ lộ trình tham quan nối qua các nhóm tháp A, B, C, D, E, F, G, H dài khoảng 2 – 2,5 km trên nền đường lát gạch và bậc đá cổ.",
        "Nước uống & Quạt cầm tay mini: Lòng chảo thung lũng vào buổi trưa khá đứng gió và oi bức, mang theo quạt tích điện và chai nước khoáng bù điện giải.",
        "Điện thoại/Máy ảnh sạc đầy pin: Màu gạch nung đỏ của tháp Chăm tương phản với rừng cây xanh biếc lên hình rất ấn tượng; nên mang sạc dự phòng.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Thánh địa Mỹ Sơn – Kinh đô cổ Trà Kiệu – Làng lụa Mã Châu",
          places: [
            "Cổng soát vé & Bảo tàng Mỹ Sơn",
            "Nhóm tháp B, C, D Mỹ Sơn",
            "Biểu diễn Múa Apsara",
            "Kinh đô cổ Trà Kiệu",
            "Làng lụa Mã Châu (Duy Xuyên)",
            "Phố cổ Hội An",
          ],
          note: "06:30 – 07:30: Xuất phát sớm từ Hội An đến thung lũng Mỹ Sơn đón bình minh khi sương sớm còn vờn đỉnh núi Chúa. 07:30 – 10:30: Xem bảo tàng, đi xe điện xuyên rừng vào vùng lõi khám phá nhóm tháp B, C, D và xem múa Chăm Apsara lúc 09:15. 11:30 – 13:30: Về thị trấn Nam Phước ăn trưa Mì Quảng Phú Chiêm và Bê thui Cầu Mống. 14:00 – 16:30: Ghé di tích Kinh đô Sư Tử Trà Kiệu, Nhà thờ Trà Kiệu và làng lụa Mã Châu 400 năm tuổi. 17:00: Về Hội An nhận phòng nghỉ ngơi. Lưu ý: Xe điện 2km xuyên rừng đã bao gồm trong vé cổng; canh giờ xem múa Chăm lúc 09:15 hoặc 10:45.",
        },
        {
          day: 2,
          title: "Lò gạch cũ Duy Vinh – Làng gốm Thanh Hà – Phố cổ Hội An",
          places: [
            "Lò gạch cũ Duy Vinh",
            "Làng gốm Thanh Hà",
            "Công viên Đất nung Thanh Hà",
            "Chùa Cầu & Phố cổ Hội An",
            "Thuyền thả hoa đăng sông Hoài",
            "Chợ đêm Nguyễn Hoàng",
          ],
          note: "06:00 – 07:30: Qua cầu Cẩm Kim sang Duy Vinh check-in Lò gạch cũ giữa đồng lúa non và uống cà phê sáng. 08:30 – 11:00: Đi dọc sông Thu Bồn ghé Làng gốm Thanh Hà và Công viên Đất nung, tự tay chuốt gốm. 11:30 – 14:30: Ăn trưa Cơm gà Hội An, Cao lầu và nghỉ trưa tránh nắng. 15:30 – 21:00: Dạo bộ phố cổ (Chùa Cầu, Hội quán Phúc Kiến, Nhà cổ Tấn Ký), đi thuyền thả hoa đăng trên sông Hoài và ăn quà vặt chợ đêm. Lưu ý: Phố cổ cấm xe máy theo giờ; gửi xe ở rìa phố cổ (đường Hai Bà Trưng/Trần Hưng Đạo) rồi đi bộ.",
        },
        {
          day: 3,
          title: "Rừng dừa Bảy Mẫu – Bảo tàng Điêu khắc Chăm – Mua đặc sản",
          places: [
            "Rừng dừa Bảy Mẫu (Cẩm Thanh)",
            "Đà Nẵng",
            "Bảo tàng Điêu khắc Chăm Đà Nẵng",
            "Đài thờ Mỹ Sơn E1 (Bảo vật quốc gia)",
            "Sân bay / Nhà ga Đà Nẵng",
          ],
          note: "08:00 – 10:30: Đi thuyền thúng len lỏi rạch dừa nước tại Rừng dừa Bảy Mẫu, xem múa thúng và quăng chài. 11:30 – 13:30: Trả phòng, di chuyển về Đà Nẵng ăn trưa Bánh tráng cuốn thịt heo hai đầu da. 14:00 – 15:30: Tham quan Bảo tàng Điêu khắc Chăm (chiêm ngưỡng Đài thờ Mỹ Sơn E1 và phù điêu sa thạch nguyên bản đưa về từ Mỹ Sơn hơn 100 năm trước), hoàn thiện mảnh ghép lịch sử Champa trọn vẹn trước khi ra sân bay. Tuyến đường Mỹ Sơn – Hội An – Đà Nẵng đường nhựa phẳng đẹp, rất thuận tiện.",
        },
      ],
      foodHighlights: [
        {
          name: "Bê thui Cầu Mống xứ Quảng",
          desc: "Bê non thui rơm vàng ruộm thịt hồng đào mềm ngọt, thái mỏng cuộn bánh tráng và rau sống Trà Quế chấm mắm cái cá cơm thơm lừng.",
          priceRange: "150.000đ - 250.000đ / đĩa",
        },
        {
          name: "Mì Quảng Phú Chiêm (Duy Xuyên)",
          desc: "Sợi mì tráng tay mềm dai chan nước nhưn tôm thịt rim đậm đà và cua đồng, ăn kèm bánh tráng mè nướng giòn rụm và rau búp chuối thái mỏng.",
          priceRange: "30.000đ - 45.000đ / tô",
        },
        {
          name: "Cao lầu & Cơm gà Hội An",
          desc: "Sợi cao lầu giòn sần sật ngâm tro cù lao chàm ăn cùng thịt xíu thơm phức, và cơm gà xé vàng óng hạt dẻo thơm nước luộc gà.",
          priceRange: "40.000đ - 60.000đ / phần",
        },
        {
          name: "Bánh đập – Hến xào Cẩm Nam",
          desc: "Bánh ướt mềm kẹp giữa hai lớp bánh tráng nướng đập giòn tan chấm mắm nêm, xúc cùng hến xào sông Thu Bồn ngọt bùi thơm lừng hành phi.",
          priceRange: "40.000đ - 60.000đ / combo",
        },
        {
          name: "Cháo lươn xanh Duy Xuyên",
          desc: "Lươn đồng xào nghệ vàng thơm ngọt nấu cùng cháo gạo thơm và rau cải xanh thái chỉ, vị ngọt thanh cay ấm đặc trưng vùng sông nước.",
          priceRange: "35.000đ - 50.000đ / tô",
        },
        {
          name: "Nước Mót thảo mộc Phố Cổ",
          desc: "Thức uống thảo mộc nấu từ sả, chanh, lá sen, quế và cam thảo thơm mát giải nhiệt giữa những giờ dạo bước thung lũng di sản.",
          priceRange: "18.000đ - 20.000đ / cốc",
        },
        {
          name: "Bánh dừa nướng & Lụa tơ tằm Mã Châu (Quà lưu niệm)",
          desc: "Bánh dừa nướng giòn tan béo bùi đậm vị Quảng Nam cùng lụa tơ tằm thủ công mềm mát dệt từ làng nghề 400 năm tuổi ven sông Thu Bồn.",
          priceRange: "25.000đ - 35.000đ / gói bánh dừa; 200.000đ - 500.000đ / khăn lụa Mã Châu",
        },
      ],
      budgetTips: [
        "Đi tour ghép nửa ngày kết hợp Thuyền sông Thu Bồn từ Hội An: Đi lẻ 1 – 2 người nên đặt xe ghép từ Hội An đi Mỹ Sơn (180.000 – 250.000đ/người đã gồm thuyền chiều về), tiết kiệm hơn nhiều so với thuê taxi riêng (700.000 – 900.000đ khứ hồi).",
        "Quét mã QR thuyết minh tự động hoặc xin ghép đoàn nghe hướng dẫn viên: Khu di tích có chiều sâu văn hóa lớn, bạn có thể quét mã Audio Guide trên điện thoại hoặc ghép cùng nhóm khách tại cổng trạm xe điện để chia sẻ chi phí thuyết minh viên (100.000đ/đoàn).",
        "Canh giờ vàng 06:30 sáng tại cổng vé: Khu di tích mở cửa từ 06:00 sáng. Đến lúc 06:30 tránh được các đoàn tour lớn, chụp ảnh tháp cổ tĩnh lặng trong nắng sớm bình minh và không bị mệt vì nắng nóng.",
        "Thưởng thức đặc sản tại thị trấn Nam Phước (Duy Xuyên): Thay vì ăn trưa tại cổng khu du lịch, ghé thị trấn Nam Phước trên đường về Hội An có các quán Mì Quảng Phú Chiêm, bê thui chuẩn vị địa phương với giá chỉ 25.000 – 50.000đ.",
      ],
    },
  },
  {
    id: "guide-co-do-hue",
    slug: "cam-nang-du-lich-co-do-hue-3n2d",
    title: "Cẩm nang du lịch Cố đô Huế 3N2Đ: Khám phá Đại Nội uy nghiêm, Lăng tẩm triều Nguyễn & Ẩm thực sông Hương",
    destination: "Quần thể di tích Cố đô Huế",
    province: "Thừa Thiên Huế",
    region: "central",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.000.000đ - 3.200.000đ / người",
    bestSeason: "Tháng 1 - Tháng 4 (Mùa xuân & đầu hạ mát dịu) & Tháng 5 - Tháng 8 (Mùa hoa sen & Festival)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      caption: "Cửa Ngọ Môn và quần thể Đại Nội Hoàng Thành Huế uy nghiêm cổ kính",
      photographer: "Hue Monument Conservation",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Kiến trúc lăng Khải Định giao thoa Á - Âu độc đáo và nghệ thuật khảm sành sứ tinh xảo",
        photographer: "Imperial Tomb Explorer",
        tags: ["Lăng Khải Định", "Khảm sành sứ", "Ứng Lăng"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Chùa Thiên Mụ cổ kính soi bóng bên dòng sông Hương thơ mộng",
        photographer: "Thien Mu Pagoda",
        tags: ["Chùa Thiên Mụ", "Sông Hương", "Tháp Phước Duyên"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Sắc màu rực rỡ của những bó chân hương tại Làng Hương Thuỷ Xuân",
        photographer: "Thuy Xuan Village",
        tags: ["Làng Hương Thuỷ Xuân", "Làng nghề", "Check-in"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Cầu Trường Tiền sáu vài mười hai nhịp bắc qua dòng sông Hương êm đềm",
        photographer: "Truong Tien Bridge",
        tags: ["Cầu Trường Tiền", "Sông Hương", "Biểu tượng Huế"],
      },
    ],
    summary:
      "Chạm vào chiều sâu di sản triều Nguyễn tại Cố đô Huế: Dạo bước trong Hoàng Thành tráng lệ, chiêm ngưỡng nghệ thuật khảm sành sứ tuyệt mỹ tại Lăng Khải Định, nghe ca Huế trên sông Hương và thưởng thức thiên đường ẩm thực đường phố trứ danh.",
    tags: [
      "Huế",
      "Cố đô Huế",
      "Đại Nội",
      "Lăng Khải Định",
      "Lăng Tự Đức",
      "Chùa Thiên Mụ",
      "Sông Hương",
      "Di sản UNESCO",
    ],
    sections: {
      packingList: [
        "Trang phục đúng quy định di tích: Trang phục lịch sự, kín đáo khi vào Đại Nội và các điện thờ trong lăng (không mặc quần đùi ngắn, váy ngắn trên đầu gối, áo sát nách hoặc hở lưng).",
        "Ô (dù) gấp gọn & Kem chống nắng: Thời tiết Huế sáng nắng chiều mưa; chiếc ô vừa giúp che nắng sân Đại Nội, che mưa bất chợt vừa là phụ kiện chụp ảnh cổ kính tuyệt đẹp.",
        "Giày lười (Loafers) hoặc Giày thể thao dễ xỏ tháo: Vào thăm các điện thờ (Điện Thái Hòa, Thế Miếu, Cung Thiên Định) bắt buộc phải tháo giày dép để bên ngoài; giày dễ xỏ tháo giúp tiết kiệm rất nhiều thời gian.",
        "Cổ phục / Áo dài chụp ảnh: Chuẩn bị áo dài hoặc thuê cổ phục Nhật Bình, Áo Tấc để có những bộ ảnh cung đình ấn tượng.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Hoàng Thành Huế (Đại Nội) – Chùa Thiên Mụ – Ca Huế trên sông Hương",
          places: [
            "Cửa Ngọ Môn",
            "Điện Thái Hòa & Điện Kiến Trung",
            "Thế Tổ Miếu & Hiển Lâm Các",
            "Cồn Hến (Ăn trưa cơm hến)",
            "Chùa Thiên Mụ (Đồi Hà Khê)",
            "Cầu Trường Tiền & Cầu gỗ lim",
            "Bến Tòa Khâm (Nghe Ca Huế)",
          ],
          note: "07:30 – 11:00: Tham quan Hoàng Thành Huế qua Ngọ Môn, khám phá Điện Thái Hòa (vừa đại trùng tu), Thế Miếu và Điện Kiến Trung lộng lẫy. 11:30 – 14:30: Ăn trưa Cơm hến tại Cồn Hến, uống cà phê Muối, nghỉ trưa. 15:00 – 16:30: Đi xe dọc đường Kim Long lên viếng Chùa Thiên Mụ ngắm tháp Phước Duyên và sông Hương. 17:00 – 18:15: Dạo cầu Trường Tiền ngắm hoàng hôn. 19:00 – 21:30: Ăn bánh Huế, ra Bến Tòa Khâm lên thuyền Rồng nghe Ca Huế và thả hoa đăng. Lưu ý: Đại Nội rất rộng (đi bộ 3 - 4 km), nên đi sớm từ 07:30 sáng khi trời mát mẻ.",
        },
        {
          day: 2,
          title: "Tuyến Lăng tẩm phía Tây Nam (Lăng Minh Mạng – Lăng Khải Định – Lăng Tự Đức – Làng Hương – Đồi Vọng Cảnh)",
          places: [
            "Lăng Hoàng đế Minh Mạng (Hiếu Lăng)",
            "Lăng Khải Định (Ứng Lăng)",
            "Lăng Tự Đức (Khiêm Lăng)",
            "Làng Hương Thuỷ Xuân",
            "Đồi Vọng Cảnh",
          ],
          note: "07:30 – 09:30: Đi điểm xa nhất trước là Lăng Minh Mạng ngắm hồ Tân Nguyệt và rừng thông uy nghiêm. 09:45 – 11:30: Khám phá Lăng Khải Định với nghệ thuật khảm sành sứ Á - Âu tinh xảo. 12:00 – 14:00: Ăn trưa bánh khoái, nem lụi. 14:30 – 16:30: Thăm Lăng Tự Đức thơ mộng như công viên, ghé Làng Hương Thuỷ Xuân cách lăng 500m chụp ảnh cùng bó chân hương ngũ sắc. 16:45 – 18:00: Sang Đồi Vọng Cảnh ngắm khúc uốn sông Hương dưới ráng chiều hoàng hôn. Lộ trình xếp từ xa về gần giúp tiết kiệm tối đa thời gian di chuyển.",
        },
        {
          day: 3,
          title: "Rừng Rú Chá – Cung An Định – Trường Quốc Học Huế – Chợ Đông Ba",
          places: [
            "Rừng ngập mặn Rú Chá (Phá Tam Giang)",
            "Cung An Định",
            "Trường THPT chuyên Quốc Học Huế",
            "Chợ Đông Ba",
          ],
          note: "06:00 – 09:00: Khám phá Rừng Rú Chá (cách trung tâm 15 km), đi bộ trên đường bê tông xuyên rừng cây giá ma mị và lên đài quan sát ngắm đầm phá Tam Giang. 09:30 – 11:30: Về trung tâm thăm Cung An Định kiến trúc tân cổ điển châu Âu và chụp ảnh cổng trường đỏ Quốc Học Huế. 12:00 – 13:30: Ăn trưa bún bò Huế, chè Hẻm và trả phòng. 14:00 – 15:30: Dạo Chợ Đông Ba mua mè xửng, tôm chua, trà cung đình làm quà trước khi ra sân bay/ga tàu. Lưu ý: Trường Quốc Học chỉ mở cổng cho khách vào khuôn viên ngoài giờ học (chiều Chủ Nhật hoặc sau 17:00).",
        },
      ],
      foodHighlights: [
        {
          name: "Bún bò Huế truyền thống",
          desc: "Tô bún bò nước dùng đậm đà thơm nồng mùi mắm ruốc và sả cây, đầy ắp giò heo ninh mềm, chả cua quết tay, tiết luộc và bắp bò hoa thơm ngậy.",
          priceRange: "30.000đ - 50.000đ / tô",
        },
        {
          name: "Cơm hến / Bún hến / Mì hến Cồn Hến",
          desc: "Thịt hến xào đậm đà trộn cùng cơm nguội, bắp chuối thái mỏng, rau thơm, đậu phộng rang, da heo chiên giòn rụm và rưới nước luộc hến nóng hổi ngọt thanh.",
          priceRange: "15.000đ - 25.000đ / tô",
        },
        {
          name: "Combo Bánh Huế (Bèo, Nậm, Lọc, Ram ít)",
          desc: "Mẹt bánh Huế truyền thống gồm bánh bèo chén tôm chấy, bánh nậm mềm mịn gói lá chuối, bánh lọc nhân tôm thịt trong suốt dai giòn và bánh ram ít giòn rụm.",
          priceRange: "50.000đ - 80.000đ / khay đầy đủ",
        },
        {
          name: "Bánh khoái & Nem lụi nướng sả",
          desc: "Bánh khoái vỏ vàng giòn rụm nhân tôm thịt giá đỗ cùng nem lụi bọc cọng sả nướng than hồng, chấm nước lèo gan heo đậu phộng béo ngậy sánh mịn.",
          priceRange: "40.000đ - 70.000đ / phần",
        },
        {
          name: "Bánh canh Nam Phổ & Bánh canh cá lóc",
          desc: "Sợi bánh canh bột gạo mềm ngập trong nước dùng sền sệt màu đỏ gạch tôm cua đậm đà hoặc cá lóc đồng rim thơm phức tiêu cay nồng ấm.",
          priceRange: "20.000đ - 35.000đ / tô",
        },
        {
          name: "Chè Huế (Chè bột lọc heo quay & hạt sen)",
          desc: "Món chè độc nhất vô nhị với viên bột lọc dai dai bọc thịt heo quay mặn ngọt béo bùi, cùng chè hạt sen long nhãn ngọt thanh giải nhiệt thanh tao.",
          priceRange: "15.000đ - 25.000đ / ly",
        },
        {
          name: "Cà phê Muối xứ Huế",
          desc: "Thức uống khởi nguồn từ đất cố đô với lớp kem muối mặn mòi béo ngậy hòa quyện cùng cà phê phin đậm đà tạo dư vị khó quên.",
          priceRange: "15.000đ - 25.000đ / ly",
        },
        {
          name: "Mè xửng, Tôm chua & Trà cung đình (Quà đặc sản)",
          desc: "Mè xửng dẻo dai béo bùi hạt mè rang, tôm chua thơm nồng riềng ớt và trà thảo mộc cung đình thanh lọc cơ thể trứ danh xứ Huế.",
          priceRange: "25.000đ - 45.000đ / gói mè xửng; 60.000đ - 100.000đ / hũ tôm chua",
        },
      ],
      budgetTips: [
        "Bắt buộc mua Vé Tuyến Gộp 4 điểm ngay tại Đại Nội: Thay vì mua lẻ từng điểm (200k + 150k + 150k + 150k = 650.000đ), hãy mua luôn vé Tuyến 4 điểm tại Cửa Ngọ Môn với giá 530.000đ (tiết kiệm ngay 120.000đ/người, hạn dùng 2 ngày).",
        "Tận dụng xe đạp công cộng (Gbike) quanh Kinh thành: Đại Nội, Cầu Trường Tiền, Chợ Đông Ba đều có trạm xe đạp thông minh quét mã QR với giá chỉ 5.000 – 10.000đ/30 phút, dạo mát ngắm sông Hương rất thơ mộng.",
        "Thuê cổ phục tại các tiệm ngoài đường Đặng Thái Thân: Giá thuê áo dài/Nhật Bình chỉ từ 100.000 – 150.000đ/bộ giữ trọn cả buổi đi Lăng Tự Đức và Làng Hương, rẻ hơn và nhiều mẫu mới hơn so với thuê theo giờ trong di tích.",
        "Mua đặc sản tại tầng 1 Chợ Đông Ba hoặc các cơ sở gốc: Mua mè xửng, tôm chua tại các quầy sỉ tầng 1 chợ Đông Ba và mặc cả nhẹ 15 - 20%, hoặc mua đúng giá niêm yết tại các hiệu gốc trên đường Trần Hưng Đạo.",
      ],
    },
  },
  {
    id: "guide-chua-thien-mu",
    title: "Cẩm nang du lịch Chùa Thiên Mụ & Nhà vườn sông Hương 3N2Đ: Thủy trình Sông Hương, Cổ tự Rừng thông & Làng cổ Thủy Biều",
    slug: "cam-nang-du-lich-chua-thien-mu-hue-3n2d",
    destination: "Chùa Thiên Mụ & Nhà vườn sông Hương",
    province: "Thừa Thiên Huế",
    region: "central",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "1.800.000đ - 2.800.000đ / người",
    bestSeason: "Tháng 1 - Tháng 4 (Mát mẻ, hoa sứ nở) & Tháng 5 - Tháng 8 (Hoàng hôn sông Hương)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
      caption: "Tháp Phước Duyên 7 tầng sừng sững bên bờ sông Hương trên đỉnh đồi Hà Khê",
      photographer: "Thien Mu Pagoda Heritage",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Nhà vườn An Hiên - Tuyệt tác kiến trúc nhà rường Huế truyền thống hơn 130 năm tuổi",
        photographer: "An Hien Garden Explorer",
        tags: ["Nhà vườn An Hiên", "Nhà rường Huế", "Kim Long"],
      },
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Huyền Không Sơn Thượng ẩn mình giữa thung lũng rừng thông và hồ nước tĩnh mịch",
        photographer: "Huyen Khong Son Thuong",
        tags: ["Huyền Không Sơn Thượng", "Rừng thông", "Thiền viện"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Đấu trường Hổ Quyền cổ kính - Di tích đấu trường voi hổ độc nhất vô nhị Đông Nam Á",
        photographer: "Ho Quyen Arena",
        tags: ["Hổ Quyền", "Đấu trường", "Thủy Biều"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Bến thuyền rồng ngắm hoàng hôn sông Hương trước cổng Tam Quan chùa Thiên Mụ",
        photographer: "Perfume River Cruise",
        tags: ["Bến thuyền Thiên Mụ", "Sông Hương", "Hoàng hôn"],
      },
    ],
    summary:
      "Kinh nghiệm chi tiết khám phá Chùa Thiên Mụ 3N2Đ: thủy trình thuyền Rồng sông Hương cập bến đồi Hà Khê, khám phá nhà vườn An Hiên, thiền viện Huyền Không Sơn Thượng, đấu trường Hổ Quyền và thưởng thức đậu hũ Thiên Mụ, bánh ướt Kim Long.",
    tags: [
      "Chùa Thiên Mụ",
      "Tháp Phước Duyên",
      "Sông Hương",
      "Nhà vườn An Hiên",
      "Huyền Không Sơn Thượng",
      "Hổ Quyền",
      "Làng Thủy Biều",
      "Đậu hũ Thiên Mụ",
      "Bánh ướt Kim Long",
    ],
    sections: {
      packingList: [
        "Trang phục kín đáo, tôn nghiêm (Quy định bắt buộc tại cổng chùa): Bắt buộc mặc quần dài hoặc váy dài qua đầu gối, áo có tay kín cổ khi vào khuôn viên chùa và điện Đại Hùng.",
        "Mũ nón & Ô che nắng: Sân trước Tháp Phước Duyên và bậc tam cấp hướng ra sông Hương không có mái che, buổi trưa nắng phản chiếu khá gắt.",
        "Giày bệt/Sandal êm chân: Khuôn viên chùa kéo dài từ bờ sông sâu vào rừng thông đồi Hà Khê, đi bộ nhiều và cần tháo giày khi vào điện thờ.",
        "Tiền mặt mệnh giá nhỏ (10.000đ - 50.000đ): Tiện trả vé gửi xe 5k-10k, vé đò ngang và thưởng thức đậu hũ ven dốc chùa.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Thủy trình Sông Hương – Chùa Thiên Mụ – Nhà vườn An Hiên – Văn Thánh Huế",
          places: [
            "Xuất phát từ Bến thuyền Tòa Khâm, ngồi thuyền Rồng xuôi dòng sông Hương cập Bến thuyền Chùa Thiên Mụ",
            "Bước lên đồi Hà Khê chiêm ngưỡng Tháp Phước Duyên 7 tầng (cao 21m), Đại Hồng Chung và bia đá lưng rùa cẩm thạch",
            "Tham quan Điện Đại Hùng, khu vườn bonsai cổ thụ và di vật xe Austin của Hòa thượng Thích Quảng Đức",
            "Thưởng thức Đậu hũ gừng sầu riêng dưới chân chùa và ăn trưa Bánh ướt thịt nướng Kim Long",
            "Thăm Nhà vườn An Hiên (nhà rường cổ hơn 130 năm tuổi) và Đình làng Kim Long",
            "Ghé thăm Văn Thánh Huế sát bờ sông Hương và đón hoàng hôn buông xuống mặt nước trước bến chùa",
          ],
          note: "Trục đường Nguyễn Phúc Nguyên – Văn Thánh dài 2,5 km rợp bóng mát ven bờ Bắc sông Hương, rất thích hợp đi xe máy hoặc xe đạp.",
        },
        {
          day: 2,
          title: "Tuyến Cổ tự Rừng thông (Huyền Không Sơn Thượng – Điện Hòn Chén – Chùa Từ Hiếu)",
          places: [
            "Khám phá Huyền Không Sơn Thượng – ngôi thiền tự ẩn mình giữa thung lũng rừng thông và 5 hồ nước tĩnh mịch",
            "Di chuyển qua cầu Tuần sang bờ Nam sông Hương, chiêm bái Điện Hòn Chén trên sườn núi Ngọc Trản",
            "Ăn trưa cơm sen và các món chay thanh tịnh đậm vị xứ Huế tại Thủy Xuân",
            "Tham quan Chùa Từ Hiếu – ngôi cổ tự giữa rừng thông gắn liền với Thiền sư Thích Nhất Hạnh và nghĩa trang thái giám triều Nguyễn",
            "Check-in Làng Hương Thuỷ Xuân rực rỡ sắc màu chân hương xòe quạt",
          ],
          note: "Đường vào Huyền Không Sơn Thượng cách chùa Thiên Mụ khoảng 7 km qua đồi dốc quanh co; nên đi xe máy hoặc taxi gầm cao và giữ yên lặng tuyệt đối.",
        },
        {
          day: 3,
          title: "Hổ Quyền – Làng cổ Thủy Biều – Hoàng Thành Huế",
          places: [
            "Khám phá đấu trường cổ Hổ Quyền (đấu trường voi – hổ độc nhất Đông Nam Á) và điện Voi Ré",
            "Đạp xe xuyên vườn cây trái thanh trà xanh mát tại Làng cổ Thuỷ Biều ven sông Hương",
            "Thưởng thức bữa trưa đặc sản vả trộn tôm thịt, bún bò Huế và trả phòng",
            "Ghé thăm Hoàng Thành Huế (cách chùa Thiên Mụ 4,5 km) và mua đặc sản mè xửng, chè sen Huế làm quà",
          ],
          note: "Có thể đi đò ngang từ bến thuyền Thủy Biều sang thẳng bến Chùa Thiên Mụ để rút ngắn khoảng cách giữa hai bờ sông Hương.",
        },
      ],
      foodHighlights: [
        {
          name: "Đậu hũ (Tào phớ) Chùa Thiên Mụ",
          desc: "Đậu hũ mềm mịn nóng hổi ăn kèm nước đường gừng cay nồng ấm, đá bào hoặc cốt dừa sầu riêng thơm béo ngậy ngay dưới chân đồi Hà Khê.",
          priceRange: "10.000đ - 20.000đ / chén",
        },
        {
          name: "Bánh ướt & Bún thịt nướng Kim Long",
          desc: "Bánh ướt tráng mỏng mềm mướt cuộn thịt nướng thơm lừng mùi sả tiêu, chấm cùng nước tương đậu gan heo sánh mịn béo bùi độc nhất vô nhị.",
          priceRange: "30.000đ - 45.000đ / phần",
        },
        {
          name: "Bánh canh Nam Phổ & Bánh lọc gói lá chuối",
          desc: "Gánh hàng rong mộc mạc bên bờ sông Hương với bát bánh canh cua sánh đỏ và bánh bột lọc nhân tôm thịt đậm đà thơm ngậy.",
          priceRange: "15.000đ - 25.000đ / phần",
        },
        {
          name: "Ẩm thực Chay xứ Huế (Cơm sen chay & Lẩu nấm)",
          desc: "Nghệ thuật ẩm thực chay thanh đạm với cơm sen bọc lá, nấm kho tiêu, canh chua rong biển thanh lọc tâm hồn quanh trục Kim Long - Thủy Xuân.",
          priceRange: "30.000đ - 80.000đ / món",
        },
        {
          name: "Trái Thanh Trà Thủy Biều (Đặc sản bưởi ngọt thanh)",
          desc: "Giống bưởi quý tiến vua vỏ mỏng tép mọng nước ngọt thanh tao đặc sản của vùng phù sa Thủy Biều đối diện chùa Thiên Mụ (vào vụ tháng 7 - 9).",
          priceRange: "40.000đ - 70.000đ / quả",
        },
      ],
      budgetTips: [
        "Gửi xe tại bãi xe niêm yết chính thức bên hông chùa: Chạy thẳng qua cổng chùa một chút rẽ vào bãi giữ xe tập trung có niêm yết giá vé 5.000 – 10.000đ, tránh vào các quán vẫy ép mua đặc sản.",
        "Đi chiều lên bằng thuyền Rồng, chiều về bằng xe đạp công cộng hoặc Grab: Đi thuyền ghép 1 chiều từ Tòa Khâm lên Thiên Mụ ngắm cảnh (~50.000 – 80.000đ), chiều về đi bộ dạo đường Kim Long ghé nhà vườn An Hiên rồi bắt Grab/xe đạp về lại trung tâm chỉ mất 25.000 – 40.000đ.",
        "Thưởng thức đậu hũ tại các quán niêm yết giá rõ ràng: Chọn các quán có bảng giá công khai tại bàn chân dốc đồi Hà Khê (10.000đ/chén truyền thống, 15.000 – 20.000đ/chén thập cẩm sầu riêng).",
        "Tận dụng bối cảnh chụp ảnh cổ phục miễn phí 100%: Toàn bộ khuôn viên Chùa Thiên Mụ, bờ sông Hương và Văn Thánh Huế cách 800m đều mở cửa tự do miễn phí vé, giúp tiết kiệm chi phí bối cảnh đáng kể so với Đại Nội hay các Lăng tẩm.",
      ],
    },
  },
  {
    id: "guide-hoi-an",
    title: "Cẩm nang du lịch Phố Cổ Hội An 3N2Đ: Vùng lõi di sản, Thuyền hoa đăng sông Hoài, Làng nghề & Biển An Bàng",
    slug: "cam-nang-du-lich-pho-co-hoi-an-3n2d",
    destination: "Phố Cổ Hội An (Quảng Nam)",
    province: "Quảng Nam",
    region: "central",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.200.000đ - 3.600.000đ / người",
    bestSeason: "Tháng 2 - Tháng 4 (Mát dịu, hoa giấy nở rộ) & Tháng 5 - Tháng 8 (Mùa hè biển xanh)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
      caption: "Chùa Cầu cổ kính và dòng sông Hoài rực rỡ hoa đăng lung linh về đêm",
      photographer: "Hoi An Heritage Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Góc phố rêu phong với tường vàng hoa giấy đặc trưng của phố cổ Hội An",
        photographer: "Hoi An Street Life",
        tags: ["Phố cổ", "Tường vàng", "Hoa giấy", "Trần Phú"],
      },
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Trải nghiệm ngồi thuyền thúng len lỏi qua Rừng Dừa Bảy Mẫu xanh mát",
        photographer: "Bay Mau Coconut Forest",
        tags: ["Rừng Dừa Bảy Mẫu", "Thuyền thúng", "Cẩm Thanh", "Sinh thái"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Cánh đồng xanh mướt ngát hương thảo mộc tại Làng rau Trà Quế truyền thống",
        photographer: "Tra Que Herb Village",
        tags: ["Làng rau Trà Quế", "Đồng quê", "Trải nghiệm nông dân"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Bãi biển An Bàng cát trắng mịn làn nước trong xanh hoang sơ rì rào sóng vỗ",
        photographer: "An Bang Beach Explorer",
        tags: ["Bãi biển An Bàng", "Biển xanh", "Nghỉ dưỡng", "Hải sản"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch Phố Cổ Hội An 3N2Đ chi tiết: khám phá vùng lõi di sản Chùa Cầu - nhà cổ Tấn Ký, cà phê rooftop ngắm mái ngói rêu phong, thả hoa đăng sông Hoài, đi thuyền thúng Rừng Dừa Bảy Mẫu, đạp xe Làng rau Trà Quế và tắm biển An Bàng.",
    tags: [
      "Phố Cổ Hội An",
      "Chùa Cầu",
      "Sông Hoài",
      "Đèn lồng",
      "Rừng Dừa Bảy Mẫu",
      "Làng rau Trà Quế",
      "Biển An Bàng",
      "Cao lầu",
      "Cơm gà Hội An",
    ],
    sections: {
      packingList: [
        "Trang phục màu nổi bật (trắng, kem, đỏ đô, vàng nhạt, áo dài): Tương phản cực đẹp với tường vàng nghệ và giàn hoa giấy hồng rực rỡ khắp các góc phố cổ.",
        "Giày bệt, Sandal đế mềm hoặc Giày lười: Cung đường đi bộ trong khu phố cổ dài liên tục từ chiều đến tối, tránh đi giày cao gót nhọn.",
        "Đồ bơi & Phụ kiện chống nắng (nón lá, kính râm, kem chống nắng): Phục vụ tắm biển An Bàng và ngồi thuyền thúng ngoài trời tại Rừng Dừa Bảy Mẫu.",
        "Luôn giữ cuống vé tham quan Phố Cổ trong ví: Vé có giá trị trong suốt kỳ lưu trú, cần xuất trình khi bước vào tham quan các nhà cổ, hội quán và Chùa Cầu.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Vùng lõi Phố Cổ Hội An – Cà phê Rooftop – Thuyền hoa đăng sông Hoài",
          places: [
            "Check-in Chùa Cầu (biểu tượng phố Hội) và dạo bộ trục đường di sản Trần Phú – Nguyễn Thái Học",
            "Chiêm bái Hội Quán Phước Kiến và khám phá kiến trúc gỗ 3 nền văn hóa tại Nhà cổ Tấn Ký, Phùng Hưng",
            "Thưởng thức Cao lầu, Cơm gà tại chợ Hội An và giải khát bằng ly trà thảo mộc Mót",
            "Lên cà phê sân thượng (Faifo / 92 Station) ngắm toàn cảnh biển mái ngói âm dương rêu phong lúc hoàng hôn",
            "Đi thuyền gỗ thả hoa đăng giấy trên dòng sông Hoài, xem hát Bài Chòi và dạo chợ đêm đèn lồng Nguyễn Hoàng",
          ],
          note: "Khu phố cổ cấm xe máy từ 09:00 - 11:00 và 15:00 - 21:30; gửi xe máy tại các bãi ven rìa phố (đường Hai Bà Trưng, Phan Châu Trinh) rồi đi bộ vào.",
        },
        {
          day: 2,
          title: "Làng Gốm Thanh Hà – Rừng Dừa Bảy Mẫu – Đảo Ký ức Hội An",
          places: [
            "Đạp xe 3 km dọc sông Thu Bồn ghé Làng Gốm Thanh Hà, trải nghiệm tự tay chuốt gốm và nhận quà tò he",
            "Trở về phố ăn trưa Bánh mì Phượng / Madame Khánh, Bánh bao Bánh vạc hoa hồng trắng",
            "Di chuyển xuống Rừng Dừa Bảy Mẫu Cẩm Thanh, ngồi thuyền thúng xem biểu diễn lắc thúng và quăng chài",
            "Sang Đảo Ký ức Hội An xem minishow đường phố và đại cảnh thực cảnh hoành tráng 'Ký Ức Hội An'",
          ],
          note: "Nên đi Rừng Dừa Bảy Mẫu lúc 15:00 - 17:00 khi nắng đã dịu và thủy triều dâng đẹp; tránh đi giữa trưa vì ngồi thuyền thúng ngoài trời rất nắng.",
        },
        {
          day: 3,
          title: "Đạp xe Làng rau Trà Quế – Bãi Biển An Bàng – Mua đặc sản",
          places: [
            "Đạp xe sớm qua cánh đồng lúa đến Làng rau Trà Quế ngát hương thảo mộc, thử tưới rau bằng gáo gỗ hai vai",
            "Đạp tiếp 1,5 km ra Bãi Biển An Bàng tắm biển nước trong xanh hoặc thư giãn tại các quán bar ven biển rợp bóng dừa",
            "Thưởng thức bữa trưa hải sản tươi sống An Bàng hoặc về phố ăn Mì Quảng, chè bắp Cẩm Nam",
            "Ghé Chợ Hội An mua bánh dừa nướng, bánh đậu xanh nhân thịt và đèn lồng lụa gấp gọn làm quà",
          ],
          note: "Trục đường Hai Bà Trưng nối thẳng từ phố cổ qua Trà Quế đến biển An Bàng dài 4,5 km rất bằng phẳng và rợp bóng cây, đạp xe cực kỳ dễ dàng.",
        },
      ],
      foodHighlights: [
        {
          name: "Cao lầu Hội An",
          desc: "Sợi mì vàng dai giòn đặc trưng ăn cùng thịt xíu thái mỏng, tóp mỡ giòn rụm, nước sốt đậm đà và rau thơm Trà Quế trứ danh.",
          priceRange: "35.000đ - 55.000đ / tô",
        },
        {
          name: "Cơm gà Phố Hội",
          desc: "Cơm nấu nước luộc gà óng vàng dẻo thơm, thịt gà ta xé sợi bóp hành tây rau răm cay nồng, ăn kèm đu đủ chua ngọt và tương ớt Hội An.",
          priceRange: "45.000đ - 65.000đ / đĩa",
        },
        {
          name: "Bánh mì Hội An (Phượng / Madame Khánh)",
          desc: "Bánh mì vỏ giòn tan nhân pate béo ngậy, thịt xá xíu, chả lụa ngập tràn và nước sốt đặc chế cay ngọt thơm lừng nổi tiếng thế giới.",
          priceRange: "25.000đ - 40.000đ / ổ",
        },
        {
          name: "Bánh bao – Bánh vạc (Hoa hồng trắng)",
          desc: "Vỏ bột gạo trắng trong tạo hình cánh hoa hồng ôm trọn nhân tôm thịt xay nhuyễn giòn ngọt, rắc hành phi thơm nức chấm nước mắm ớt thanh tao.",
          priceRange: "70.000đ - 100.000đ / đĩa",
        },
        {
          name: "Bánh đập – Hến xào & Chè bắp Cẩm Nam",
          desc: "Bánh tráng nướng kẹp bánh ướt đập vụn chấm mắm nêm đậm đà, ăn kèm hến xào sông Hoài ngọt bùi và chén chè bắp non dẻo ngọt thanh mát.",
          priceRange: "40.000đ - 60.000đ / phần",
        },
      ],
      budgetTips: [
        "Di chuyển Đà Nẵng – Hội An bằng xe ghép hoặc xe buýt trợ giá: Đặt xe ghép đưa đón tận nơi (100k - 130k/người) hoặc đi xe buýt công cộng chỉ 30.000đ/lượt, tiết kiệm hơn nhiều so với taxi riêng (350k - 450k).",
        "Tận dụng xe đạp miễn phí của Homestay: Hơn 80% homestay Hội An cho mượn xe đạp miễn phí; cự ly ra biển An Bàng hay làng gốm chỉ 3-4 km rất thích hợp đạp xe, không mất tiền thuê xe máy lẫn phí gửi xe.",
        "Mua vé thuyền sông Hoài tại quầy điều phối bến Bạch Đằng: Mua trực tiếp tại quầy kiểm soát ngay chân cầu An Hội với giá niêm yết 150k/thuyền (1-3 khách) hoặc 200k/thuyền (4-5 khách) để tránh bị chèo kéo đẩy giá.",
        "Mua vé Rừng Dừa Bảy Mẫu tại các hợp tác xã bến thuyền uy tín: Giá chuẩn cho thuyền thúng kèm vé vào cổng chỉ từ 150k - 200k/thúng (2 người lớn); tránh đi theo cò mồi ngoài quốc lộ thu tới 300k - 400k.",
      ],
    },
  },
  {
    id: "guide-cat-ba",
    title: "Cẩm nang du lịch Cát Bà – Vịnh Lan Hạ 3N2Đ: Hải trình vịnh ngọc, Kayak hang nước & Trekking VQG",
    slug: "cam-nang-du-lich-cat-ba-lan-ha-3n2d",
    destination: "Quần đảo Cát Bà – Vịnh Lan Hạ (Hải Phòng)",
    province: "Hải Phòng",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.500.000đ - 3.800.000đ / người",
    bestSeason: "Tháng 4 - Tháng 6 (Biển xanh ngọc) & Tháng 9 - Tháng 11 (Thu mát dịu)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      caption: "Vịnh Lan Hạ non xanh nước biếc bình yên bao bọc hàng trăm đảo đá vôi kỳ vĩ",
      photographer: "Lan Ha Bay Heritage",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Làng chài cổ Cái Bèo - làng chài nổi cổ nhất Việt Nam với lịch sử hàng ngàn năm",
        photographer: "Cai Beo Floating Village",
        tags: ["Làng chài Cái Bèo", "Bè nổi", "Lịch sử", "Bến Cái Bèo"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Toàn cảnh rừng nguyên sinh và núi đá trùng điệp từ đỉnh Ngự Lâm - Vườn Quốc gia Cát Bà",
        photographer: "Cat Ba National Park",
        tags: ["Vườn Quốc gia", "Đỉnh Ngự Lâm", "Trekking", "Kim giao"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Chèo thuyền Kayak len lỏi qua vòm hang nước ngầm Hang Sáng - Hang Tối",
        photographer: "Lan Ha Kayak Explorer",
        tags: ["Hang Sáng Tối", "Chèo Kayak", "Thung lũng nước"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Đường ven biển ôm sát vách đá nối liền bãi tắm Cát Cò 1 và Cát Cò 3",
        photographer: "Cat Co Beach Trail",
        tags: ["Bãi tắm Cát Cò", "Đường ven núi đá", "Hoàng hôn"],
      },
    ],
    summary:
      "Trọn bộ kinh nghiệm du lịch Cát Bà - Vịnh Lan Hạ 3N2Đ: hải trình khám phá Vịnh Lan Hạ, chèo thuyền Kayak xuyên Hang Sáng Tối, tắm biển Ba Trái Đào, đạp xe Làng cổ Việt Hải, trekking Đỉnh Ngự Lâm Vườn Quốc Gia và thưởng thức bún tôm, tu hài nướng mỡ hành.",
    tags: [
      "Cát Bà",
      "Vịnh Lan Hạ",
      "Hải Phòng",
      "Làng chài Cái Bèo",
      "Làng cổ Việt Hải",
      "Hang Sáng Tối",
      "Vườn Quốc gia Cát Bà",
      "Bún tôm Cát Bà",
      "Di sản UNESCO",
    ],
    sections: {
      packingList: [
        "Hai loại giày dép riêng biệt: 1 đôi giày thể thao đế bám tốt để leo đá tai mèo chinh phục Đỉnh Ngự Lâm và 1 đôi sandal/dép đi biển chống trơn để chèo Kayak.",
        "Đồ bơi, Khăn tắm nhanh khô & Túi chống nước điện thoại: Phục vụ trải nghiệm chèo thuyền Kayak Hang Sáng Tối và nhảy tàu tắm biển Ba Trái Đào.",
        "Kem chống muỗi/côn trùng & Nước điện giải: Cực kỳ cần thiết khi đi bộ xuyên rừng ẩm tại Vườn Quốc gia Cát Bà và đạp xe ở làng cổ Việt Hải.",
        "Áo khoác gió nhẹ: Buổi tối dạo bãi biển Cát Cò hoặc boong tàu ngắm hoàng hôn vịnh có gió lộng se lạnh.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Cung đường xuyên đảo – Bãi tắm Cát Cò 1, 2, 3 – Đường ven núi đá – Chợ đêm Cát Bà",
          places: [
            "Sang đảo qua cáp treo Phù Long hoặc phà Cái Viềng, di chuyển dọc cung đường xuyên rừng tuyệt đẹp về thị trấn",
            "Nhận phòng khách sạn, nghỉ ngơi và thưởng thức bữa trưa bún tôm Cát Bà tại phố Núi Ngọc",
            "Đi xe điện ra cụm bãi tắm Cát Cò 1, Cát Cò 2, Cát Cò 3 tắm biển thỏa thích trong làn nước trong vắt",
            "Tản bộ trên con đường gỗ ven vách đá nối liền Cát Cò 1 và Cát Cò 3 ngắm trọn vẹn hoàng hôn buông xuống vịnh",
            "Thưởng thức bữa tối hải sản (tu hài, bề bề rang muối) dọc đại lộ 1/4 và dạo chợ đêm Cát Bà",
          ],
          note: "Từ ga cáp treo Phù Long về trung tâm thị trấn dài 25 km; nên đặt xe khách trọn gói đưa đón tận nơi thay vì đi taxi lẻ tốn kém.",
        },
        {
          day: 2,
          title: "Hải trình Vịnh Lan Hạ – Làng chài Cái Bèo – Hang Sáng Tối – Làng cổ Việt Hải (Trọn ngày)",
          places: [
            "Xuất phát từ bến Cái Bèo, tàu lướt qua Làng chài cổ Cái Bèo ngắm hàng trăm bè nổi cổ xưa",
            "Tàu thả neo tại Hang Sáng – Hang Tối, tự tay chèo thuyền Kayak xuyên hang đá ngập nước vào lòng thung lũng khép kín",
            "Ăn trưa hải sản tươi sống trên tàu, tắm biển nhảy tàu tại khu vực Ba Trái Đào hoặc Vạn Bội",
            "Cập bến Việt Hải, đạp xe xuyên rừng nguyên sinh vào Làng cổ Việt Hải và trải nghiệm massage cá suối tự nhiên",
            "17:00 tàu đưa về lại bến Cái Bèo, tối thưởng thức lẩu cá song hoặc sam biển nướng",
          ],
          note: "Nên đặt tour tàu ghép 1 ngày trọn gói (600k - 700k/người) đã bao gồm vé vịnh, ăn trưa, kayak và xe đạp tại làng Việt Hải.",
        },
        {
          day: 3,
          title: "Trekking Đỉnh Ngự Lâm (VQG Cát Bà) – Động Trung Trang – Hang Quân Y – Mua đặc sản",
          places: [
            "Chạy xe máy 14 km ngược đường xuyên đảo đến cổng Vườn Quốc gia Cát Bà",
            "Trekking xuyên rừng kim giao cổ thụ chinh phục Đỉnh Ngự Lâm ngắm toàn cảnh hàng trăm ngọn núi đá vôi hùng vĩ",
            "Khám phá Động Trung Trang dài 300m với hệ thống nhũ đá kỳ vĩ và Hang Quân Y bệnh viện dã chiến trong lòng núi",
            "Về thị trấn ăn trưa, trả phòng khách sạn và ghé chợ Cát Bà mua mực khô câu, nước mắm Cát Hải làm quà",
          ],
          note: "VQG Cát Bà, Động Trung Trang và Hang Quân Y đều nằm thẳng hàng trên trục đường xuyên đảo 356, thuê xe máy đi lại rất tiện lợi.",
        },
      ],
      foodHighlights: [
        {
          name: "Bún tôm Cát Bà",
          desc: "Nước dùng ngọt thanh đậm đà nấu từ xương ống và gạch tôm biển tươi, ăn cùng tôm biển bóc nõn, chả cá thu, chả lá lốt và dọc mùng giòn sần sật.",
          priceRange: "35.000đ - 50.000đ / bát",
        },
        {
          name: "Tu hài (Ốc vòi voi) nướng mỡ hành",
          desc: "Tu hài tươi sống nướng mỡ hành thơm nức mũi, thịt ngọt giòn béo ngậy chấm cùng muối tiêu chanh ớt cay the.",
          priceRange: "180.000đ - 280.000đ / đĩa",
        },
        {
          name: "Bề bề (Tôm tít) rang muối / hấp bia",
          desc: "Bề bề biển chắc nịch ngọt lịm rang muối đậm đà hoặc hấp sả bia giữ trọn vẹn vị ngọt nguyên bản từ biển khơi.",
          priceRange: "200.000đ - 350.000đ / đĩa",
        },
        {
          name: "Sam biển Cát Bà (Sam nướng & Xào chua ngọt)",
          desc: "Đặc sản nức tiếng chế biến theo cặp với tiết canh sam, gỏi sam hoa chuối, chân sam xào chua ngọt và mai sam nướng mỡ hành béo bùi.",
          priceRange: "150.000đ - 250.000đ / món",
        },
        {
          name: "Cá song (Cá mú) hấp xì dầu / Lẩu cá song",
          desc: "Thịt cá song biển nuôi bè nổi trắng phau dai ngọt tự nhiên hấp xì dầu gừng thì là hoặc nấu lẩu chua thanh giải nhiệt.",
          priceRange: "350.000đ - 600.000đ / kg",
        },
      ],
      budgetTips: [
        "Đi cáp treo Sun World hoặc xe khách trọn gói tránh tắc phà mùa hè: Vào dịp cuối tuần tháng 5 - 7 phà Đồng Bài thường kẹt ô tô 2-3 tiếng; đi cáp treo vượt biển chỉ 10 phút (50k - 100k) hoặc mua xe khách trọn gói từ Hà Nội rất thảnh thơi.",
        "Ăn hải sản tại các nhà hàng niêm yết giá theo kg công khai: Ưu tiên nhà hàng đường 1/4 hoặc phố Núi Ngọc có cân điện tử công khai, hoặc tự mua hải sản tươi sống ở Chợ Cát Bà buổi sáng nhờ homestay chế biến (phí 50k - 100k/món).",
        "Thuê xe máy đi Vườn Quốc gia thay vì đi taxi: Thuê xe máy chỉ 100k - 120k/ngày (đổ 30k xăng) so với taxi 350k - 450k, lại thỏa sức dừng chân chụp ảnh trên cung đường ven biển Tây Bắc và đường xuyên rừng.",
        "Không tắm biển sau 18:30 tại bãi Cát Cò: Thủy triều tại bãi Cát Cò lên rất nhanh vào chiều muộn kèm sóng ngầm mạnh; hãy tuân thủ hướng dẫn của nhân viên cứu hộ bờ biển để an toàn.",
      ],
    },
  },
  {
    id: "guide-thac-ban-gioc",
    title: "Cẩm nang du lịch Thác Bản Giốc & Cao Bằng 3N2Đ: Thác nước biên giới, Động Ngườm Ngao & Pác Bó",
    slug: "cam-nang-du-lich-thac-ban-gioc-cao-bang-3n2d",
    destination: "Thác Bản Giốc & Non nước Cao Bằng",
    province: "Cao Bằng",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.200.000đ - 3.300.000đ / người",
    bestSeason: "Tháng 9 - Tháng 10 (Mùa lúa chín vàng & nước xanh ngọc) & Tháng 11 - Tháng 12 (Dã quỳ)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      caption: "Thác Bản Giốc 3 tầng đổ trắng xóa hùng vĩ bên dòng sông Quây Sơn xanh ngọc bích",
      photographer: "Ban Gioc Waterfall Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Động Ngườm Ngao dài hơn 2.100m với kiệt tác thạch nhũ Đài Sen Úp Ngược lộng lẫy",
        photographer: "Nguom Ngao Cave Explorer",
        tags: ["Động Ngườm Ngao", "Hang động", "Thạch nhũ", "Đài sen"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Mắt Thần Núi (Núi Thủng) sừng sững giữa thung lũng thảo nguyên hồ Nặm Trá",
        photographer: "Mat Than Nui Landscape",
        tags: ["Mắt Thần Núi", "Núi Thủng", "Hồ Nặm Trá", "Thảo nguyên"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Dòng suối Lê-nin xanh ngắt màu ngọc bích nhìn thấu đáy dưới chân Núi Các Mác tại Pác Bó",
        photographer: "Pac Bo Historic Site",
        tags: ["Pác Bó", "Suối Lê-nin", "Núi Các Mác", "Lịch sử"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Làng đá cổ Khuổi Ky hơn 400 năm tuổi của người Tày nép mình bên chân núi đá vôi",
        photographer: "Khuoi Ky Stone Village",
        tags: ["Làng đá Khuổi Ky", "Nhà sàn đá", "Người Tày", "Bản Giốc"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch Thác Bản Giốc - Cao Bằng 3N2Đ trọn vẹn: chiêm ngưỡng thác nước tự nhiên lớn nhất Đông Nam Á, thám hiểm Động Ngườm Ngao, nghỉ đêm làng đá cổ Khuổi Ky, check-in Mắt Thần Núi và thăm di tích lịch sử Pác Bó - Suối Lê-nin.",
    tags: [
      "Thác Bản Giốc",
      "Cao Bằng",
      "Động Ngườm Ngao",
      "Làng đá Khuổi Ky",
      "Mắt Thần Núi",
      "Pác Bó",
      "Suối Lê-nin",
      "Hạt dẻ Trùng Khánh",
      "Di sản UNESCO",
    ],
    sections: {
      packingList: [
        "Áo mưa mỏng / Áo khoác trượt nước & Túi chống nước điện thoại: Khi đi bè mảng tiến sát vào chân Thác Bản Giốc, bụi nước từ độ cao 30m phả ra cực mạnh như cơn mưa rào nhỏ.",
        "Giày thể thao đế cao su bám tốt: Độ ẩm trong Động Ngườm Ngao cao, nền đá và bậc thang thường xuyên có nước nhỏ giọt từ trần hang xuống rất dễ trơn trượt.",
        "Giấy tờ tùy thân (CCCD bản gốc): Thác Bản Giốc, Ngọc Côn và Pác Bó đều là các xã biên giới sát đường biên Việt – Trung; luôn mang theo CCCD khi đi lại và lưu trú tại Khuổi Ky.",
        "Áo khoác ấm / Áo gió: Vùng núi Cao Bằng về đêm nhiệt độ xuống thấp se lạnh ngay cả trong mùa thu hè.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "TP. Cao Bằng – Đèo Mã Phục – Làng rèn Phúc Sen – Động Ngườm Ngao – Làng đá Khuổi Ky (90 km)",
          places: [
            "Khởi hành từ TP. Cao Bằng, ăn sáng bánh cuốn canh nóng ngọt thanh nước xương hầm",
            "Vượt Đèo Mã Phục 7 tầng uốn lượn hùng vĩ trên Quốc lộ 3 và ghé thăm Làng rèn Phúc Sen thủ công truyền thống",
            "Ăn trưa thị trấn Trùng Khánh thưởng thức vịt quay 7 vị lá mắc mật và khâu nhục mềm rục",
            "Khám phá Động Ngườm Ngao dài 2.100m chiêm ngưỡng kiệt tác Đài Sen Úp Ngược và nhũ đá lấp lánh",
            "Nhận phòng homestay nhà sàn đá hơn 400 năm tuổi tại Làng đá cổ Khuổi Ky, ăn tối lạp xưởng hun khói và ngâm chân thảo dược",
          ],
          note: "Đường từ TP. Cao Bằng đi Trùng Khánh khoảng 90 km đường nhựa phẳng nhưng có đèo Mã Phục dốc; giữ đúng làn đường khi vào cua khuất tầm nhìn.",
        },
        {
          day: 2,
          title: "Chùa Phật Tích Trúc Lâm – Thác Bản Giốc – Thung lũng Ngọc Côn – Mắt Thần Núi (85 km)",
          places: [
            "Leo lên Chùa Phật Tích Trúc Lâm Bản Giốc ngắm toàn cảnh Thác Bản Giốc 3 tầng đổ trắng xóa từ trên cao",
            "Xuống chân Thác Bản Giốc chụp ảnh cột mốc 836(2) và lên bè mảng máy tiến sát lòng thác đón bụi nước mát rượi",
            "Ăn trưa cá Trầm Hương sông Quây Sơn nướng và rau dạ hiến xào tỏi",
            "Chạy xe ngắm cảnh thung lũng biên giới Ngọc Côn – Phong Nậm đẹp như tranh thủy mặc với guồng nước tre",
            "Check-in Mắt Thần Núi (Núi Thủng) giữa thảo nguyên hồ Nặm Trá, sau đó về lại TP. Cao Bằng dạo phố đi bộ Kim Đồng",
          ],
          note: "Đoạn đường đất 1,5 km dẫn vào Mắt Thần Núi hơi dốc; nếu đi ô tô gầm thấp nên gửi xe bên ngoài đường bê tông rồi đi bộ hoặc xe ôm bản địa (20.000đ).",
        },
        {
          day: 3,
          title: "Khu di tích Pác Bó – Suối Lê-nin – Núi Các Mác – Mua đặc sản hạt dẻ Trùng Khánh (100 km)",
          places: [
            "Từ TP. Cao Bằng di chuyển 50 km theo đường lớn đến Khu di tích Quốc gia Đặc biệt Pác Bó (Hà Quảng)",
            "Dạo bộ dọc dòng Suối Lê-nin nước xanh ngắt nhìn thấu đáy, thăm Hang Cốc Bó, bàn đá lịch sử và Núi Các Mác",
            "Quay về TP. Cao Bằng thưởng thức Phở chua Cao Bằng và Bánh áp chao nóng hổi",
            "Ghé Chợ Xanh mua Hạt dẻ Trùng Khánh, miến dong Phia Đén, thạch đen và bánh khảo làm quà",
          ],
          note: "Đường từ TP. Cao Bằng đi Pác Bó là đại lộ rộng đẹp, dễ đi nhất trong các tuyến tại Cao Bằng, chỉ mất khoảng 1 giờ di chuyển.",
        },
      ],
      foodHighlights: [
        {
          name: "Bánh cuốn Cao Bằng (Bánh cuốn canh)",
          desc: "Bánh cuốn mềm mướt tráng mỏng chấm ngập trong bát nước dùng xương ống ninh ngọt thanh, ăn kèm giò lụa, trứng trần và măng ớt mắc mật cay nồng.",
          priceRange: "30.000đ - 40.000đ / suất",
        },
        {
          name: "Phở chua & Phở vịt quay lá mắc mật",
          desc: "Bánh phở tươi trộn nước sốt giấm đường chua ngọt thanh tao cùng thịt vịt quay da giòn bóng bẩy tẩm ướp lá mắc mật rừng thơm nức.",
          priceRange: "35.000đ - 45.000đ / bát",
        },
        {
          name: "Vịt quay 7 vị & Khâu nhục Trùng Khánh",
          desc: "Vịt quay da giòn đượm 7 loại gia vị cổ truyền cùng khâu nhục hấp cách thủy mềm tan béo bùi khoai môn dẻo thơm nức tiếng.",
          priceRange: "150.000đ - 280.000đ / phần",
        },
        {
          name: "Cá Trầm Hương sông Quây Sơn nướng",
          desc: "Loài cá quý sống ở vùng nước chảy xiết chân thác Bản Giốc, ăn rễ cây trầm hương nên thịt cá chắc nịch, thơm lừng và ngọt bùi hiếm có.",
          priceRange: "180.000đ - 300.000đ / đĩa",
        },
        {
          name: "Bánh Áp Chao & Hạt dẻ Trùng Khánh rang",
          desc: "Bánh nếp khoai môn nhân thịt vịt rán giòn rụm chấm nước mắm gừng ớt và hạt dẻ Trùng Khánh hạt to tròn bùi béo ngọt tự nhiên.",
          priceRange: "5.000đ - 8.000đ / chiếc áp chao; 80.000đ - 120.000đ / kg hạt dẻ",
        },
      ],
      budgetTips: [
        "Sử dụng xe buýt số 07 (TP. Cao Bằng – Thác Bản Giốc) nếu đi lẻ: Tuyến xe buýt chạy liên tục đưa đón tận cổng thác và động Ngườm Ngao chỉ 70.000đ/lượt, tiết kiệm hơn nhiều so với thuê taxi riêng (1,2 - 1,5 triệu đồng).",
        "Canh khung giờ 10:00 – 14:00 để xuống chân thác Bản Giốc: Đây là lúc thủy điện thượng nguồn xả nước điều tiết, thác đổ mạnh nhất cả 3 tầng tung bọt trắng xóa tuyệt đẹp.",
        "Nghỉ đêm 1 tối tại Làng đá Khuổi Ky và 1 tối tại TP. Cao Bằng: Tiết kiệm gần 3 tiếng chạy xe quay lại thành phố trong ngày đầu, lại được trải nghiệm ngủ nhà sàn đá cổ của người Tày với giá chỉ 150k/người.",
        "Cách chọn hạt dẻ Trùng Khánh chính gốc: Hạt dẻ chuẩn kích thước vừa phải, vỏ nâu sẫm có lớp lông tơ mịn ở đầu, mùi thơm bùi đặc trưng (thu hoạch vào tháng 9 - 11); tránh loại hạt to bóng nhẵn không lông.",
      ],
    },
  },
  {
    id: "guide-phu-quoc",
    title: "Cẩm nang du lịch Phú Quốc 3N2Đ: 3 Phân khu Bắc – Nam – Trung tâm & Tour 4 đảo An Thới",
    slug: "cam-nang-du-lich-dao-ngoc-phu-quoc-3n2d",
    destination: "Đảo Ngọc Phú Quốc (Kiên Giang)",
    province: "Kiên Giang",
    region: "islands",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "3.800.000đ - 5.800.000đ / người",
    bestSeason: "Tháng 11 - Tháng 4 (Mùa khô biển êm) & Tháng 5 - Tháng 10 (Mùa hè Bãi Sao)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
      caption: "Khoảnh khắc hoàng hôn tráng lệ bên Cầu Hôn và Thị trấn Hoàng Hôn Địa Trung Hải",
      photographer: "Sunset Town Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Bãi Sao với dải cát trắng mịn như kem và rặng dừa nghiêng bóng bên làn nước xanh ngọc",
        photographer: "Bai Sao Beach Collection",
        tags: ["Bãi Sao", "Cát trắng", "Biển xanh", "Nam Đảo"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Tuyến Cáp treo Hòn Thơm 3 dây dài gần 7.900m vượt biển ngắm trọn quần đảo An Thới",
        photographer: "Hon Thom Cable Car",
        tags: ["Cáp treo Hòn Thơm", "An Thới", "Hòn Móng Tay", "Kỷ lục thế giới"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Làng chài Rạch Vẹm yên bình - Vương quốc sao biển đỏ bên bờ biển Bắc Đảo",
        photographer: "Rach Vem Starfish Village",
        tags: ["Rạch Vẹm", "Sao biển", "Làng chài", "Bắc Đảo"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Dinh Cậu cổ kính tọa lạc trên mỏm đá tự nhiên đón sóng hoàng hôn tại Dương Đông",
        photographer: "Dinh Cau Heritage",
        tags: ["Dinh Cậu", "Dương Đông", "Hoàng hôn", "Tâm linh"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch Phú Quốc 3N2Đ phân luồng thông minh 3 khu vực: Trung tâm Dương Đông - Dinh Cậu, Nam Đảo - Tour cano 4 đảo & Cáp treo Hòn Thơm, Bắc Đảo - Vinpearl Safari & Rạch Vẹm, cùng thưởng thức bún quậy, gỏi cá trích.",
    tags: [
      "Phú Quốc",
      "Bãi Sao",
      "Cáp treo Hòn Thơm",
      "Thị trấn Hoàng Hôn",
      "Cầu Hôn",
      "Grand World",
      "Vinpearl Safari",
      "Bún quậy Kiến Xây",
      "Gỏi cá trích",
    ],
    sections: {
      packingList: [
        "Lưu ý vận chuyển Nước mắm lên máy bay: Hàng không cấm xách tay và ký gửi nước mắm; hãy nhờ cơ sở nhà thùng đóng thùng xốp gửi đường bưu điện/chuyển phát về tận nhà an toàn.",
        "Đồ bơi, Áo choàng đi biển & Kem chống nắng SPF 50+: Tour cano 4 đảo và công viên nước Hòn Thơm tiếp xúc trực tiếp nắng biển mạnh, cần chuẩn bị ít nhất 2 bộ đồ bơi.",
        "Thuốc chống say sóng & Túi chống nước điện thoại: Cực kỳ cần thiết khi đi cano cao tốc lướt sóng ra quần đảo An Thới hoặc đi tàu cao tốc.",
        "Bảo tồn sinh thái tại Rạch Vẹm: Tuyệt đối không nhấc sao biển lên khỏi mặt nước hoặc đặt lên cát khô chụp ảnh (sao biển sẽ chết ngạt chỉ sau 20-30 giây).",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Khu Trung tâm Dương Đông – Chùa Hộ Quốc – Bãi Sao – Chợ đêm Phú Quốc",
          places: [
            "Đáp sân bay Phú Quốc, về trung tâm Dương Đông thưởng thức Bún quậy Kiến Xây và nhận phòng khách sạn",
            "Di chuyển theo đường ven biển viếng Chùa Hộ Quốc (ngôi chùa lưng tựa núi, mặt hướng ra biển Đông hùng vĩ)",
            "Tham quan Di tích Lịch sử Nhà tù Phú Quốc và tắm biển Bãi Sao với bãi cát trắng mịn như kem",
            "Ngắm hoàng hôn lãng mạn tại Dinh Cậu hoặc Sunset Sanato Beach Club",
            "Thưởng thức Gỏi cá trích và dạo Chợ đêm Phú Quốc ăn hải sản nướng, kem cuộn, đậu phộng Chou Chou",
          ],
          note: "Sân bay Phú Quốc chỉ cách trung tâm Dương Đông 10 km và Bãi Sao 18 km; toàn bộ các điểm ngày 1 nằm gọn khu vực giữa đảo rất thuận tiện di chuyển.",
        },
        {
          day: 2,
          title: "Hành trình Nam Đảo – Cano 4 đảo An Thới – Cáp treo Hòn Thơm – Thị trấn Hoàng Hôn",
          places: [
            "Xuất phát từ cảng An Thới lên cano khám phá Hòn Móng Tay, chụp ảnh SUP Hòn Mây Rút Trong và lặn san hô Hòn Gầm Ghì",
            "Cano đưa sang đảo Hòn Thơm, vui chơi công viên nước Aquatopia và lên Cáp treo Hòn Thơm vượt biển dài nhất thế giới về ga An Thới",
            "Dạo bộ Thị trấn Hoàng Hôn mang kiến trúc Địa Trung Hải rực rỡ sắc màu",
            "Check-in Cầu Hôn (Kiss Bridge) ngắm hoàng hôn lặn chính giữa hai nhịp cầu",
            "Dạo chợ đêm VUI-Fest Bazaar ven biển và xem trình diễn bắn pháo hoa nghệ thuật hàng đêm",
          ],
          note: "Nên đặt tour Cano 4 đảo kết hợp cáp treo 1 chiều (khoảng 1,1 - 1,2 triệu đồng) đã có sẵn xe đưa đón tận khách sạn Dương Đông.",
        },
        {
          day: 3,
          title: "Hành trình Bắc Đảo – Vinpearl Safari – Rạch Vẹm – Grand World – Mua đặc sản",
          places: [
            "Bắt xe buýt điện VinBus miễn phí từ Dương Đông lên Bắc Đảo tham quan Vinpearl Safari Phú Quốc (khu bảo tồn bán hoang dã)",
            "Di chuyển sang Làng chài Rạch Vẹm ăn trưa hải sản trên nhà bè gỗ giữa biển và ngắm sao biển đỏ",
            "Khám phá 'Thành phố không ngủ' Grand World: check-in công trình Huyền thoại Tre và dạo kênh đào Venice thu nhỏ",
            "Trở về trung tâm ghé cơ sở mua nước mắm truyền thống, hồ tiêu, rượu sim rừng trước khi ra sân bay",
          ],
          note: "Bắc Đảo cách sân bay Phú Quốc 35 km (khoảng 1 tiếng đi xe); nếu bay chuyến chiều tối hãy canh giờ rời Grand World trước giờ bay ít nhất 2,5 tiếng.",
        },
      ],
      foodHighlights: [
        {
          name: "Bún quậy Phú Quốc (Kiến Xây)",
          desc: "Chả tôm và chả cá tươi quết trực tiếp vào đáy tô, trụng nước sôi sùng sục tại chỗ kèm mực trứng tươi rói, bò tái và nước chấm tự pha tắc ớt sánh đỏ.",
          priceRange: "50.000đ - 85.000đ / tô",
        },
        {
          name: "Gỏi cá trích Phú Quốc",
          desc: "Phi lê cá trích tươi sống bóp thính dừa nạo và hành tây giòn ngọt, cuốn bánh tráng cùng rau rừng bùi bùi chấm nước mắm đậu phộng sánh béo cay the.",
          priceRange: "120.000đ - 180.000đ / đĩa",
        },
        {
          name: "Bún kèn cá nhồng nước cốt dừa",
          desc: "Sợi bún tươi chan nước lèo cá nhồng xay nhuyễn nấu cùng nước cốt dừa béo ngậy và bột cà ri thơm lừng, ăn kèm đu đủ bào giòn rụm và rau thơm.",
          priceRange: "35.000đ - 45.000đ / tô",
        },
        {
          name: "Ghẹ Hàm Ninh hấp bia",
          desc: "Ghẹ đánh bắt tự nhiên từ làng chài cổ Hàm Ninh thịt chắc nịch ngọt đậm đà, chấm muối tiêu chanh ớt mộc mạc thơm lừng.",
          priceRange: "400.000đ - 600.000đ / kg",
        },
        {
          name: "Nhum biển (Cầu gai) nướng mỡ hành",
          desc: "Nhum biển tươi nướng trên than hồng thơm lừng mỡ hành béo ngậy và đậu phộng giòn bùi, hoặc ăn sống mù tạt béo ngậy vị biển.",
          priceRange: "25.000đ - 40.000đ / con",
        },
      ],
      budgetTips: [
        "Tận dụng tối đa xe buýt điện VinBus miễn phí 100%: Tuyến xe buýt điện màu xanh lá (tuyến 17, 19, 20) chạy liên tục từ Sân bay -> Dương Đông -> Grand World hoàn toàn miễn phí cho tất cả du khách, tiết kiệm hàng triệu đồng tiền taxi.",
        "Mua Combo Tour Cano 4 đảo + Cáp treo Hòn Thơm: Mua tour ghép trọn gói 1 ngày (1.150k - 1.250k/người) rẻ hơn nhiều so với tự mua vé cáp treo lẻ (650k) và thuê cano riêng (2 - 3 triệu đồng).",
        "Thuê khách sạn tại trung tâm Dương Đông để cân bằng di chuyển: Dương Đông nằm giữa đảo, thuận tiện đi cả Bắc Đảo (22 km) lẫn Nam Đảo (25 km), giá ăn uống sinh hoạt lại rẻ hơn trong các resort khép kín 30 - 50%.",
        "Ăn hải sản dọc đường 30/4 hoặc bè nổi Hàm Ninh thay vì trong Chợ Đêm: Chợ đêm chỉ nên dạo chơi ăn vặt (kem cuộn, dừa xiêm, chou chou); ăn bữa chính hải sản hãy ghé đường 30/4 để có giá niêm yết theo kg minh bạch.",
      ],
    },
  },
  {
    id: "guide-da-lat",
    title: "Cẩm nang du lịch Đà Lạt 3N2Đ: 3 Trục cung đường Săn mây Cầu Đất, Hồ Tuyền Lâm & Langbiang",
    slug: "cam-nang-du-lich-da-lat-3n2d",
    destination: "Thành phố ngàn hoa Đà Lạt (Lâm Đồng)",
    province: "Lâm Đồng",
    region: "highlands",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.200.000đ - 3.500.000đ / người",
    bestSeason: "Tháng 10 - Tháng 12 (Săn mây, dã quỳ, cỏ hồng) & Tháng 1 - Tháng 3 (Mai anh đào)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
      caption: "Hồ Xuân Hương và Quảng trường Lâm Viên biểu tượng nụ hoa Atiso giữa sương sớm",
      photographer: "Da Lat City Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80",
        caption: "Đồi Chè Cầu Đất bồng bềnh biển mây sớm bên những cánh quạt điện gió khổng lồ",
        photographer: "Cau Dat Wind Farm",
        tags: ["Đồi Chè Cầu Đất", "Săn mây", "Điện gió", "Bình minh"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Hồ Tuyền Lâm êm đềm tĩnh lặng soi bóng những rặng thông xanh ngút ngàn",
        photographer: "Tuyen Lam Lake Heritage",
        tags: ["Hồ Tuyền Lâm", "Rừng thông", "Thiền viện Trúc Lâm", "Yên bình"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Máng trượt Alpine Coaster xuyên rừng thông nguyên sinh tại Khu du lịch Thác Datanla",
        photographer: "Datanla Alpine Coaster",
        tags: ["Thác Datanla", "Máng trượt", "Rừng thông", "Mạo hiểm"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Nhà ga Đà Lạt cổ kính với đầu tàu hơi nước và 3 chóp mái mô phỏng đỉnh Langbiang",
        photographer: "Da Lat Railway Station",
        tags: ["Ga Đà Lạt", "Kiến trúc Pháp", "Đầu tàu hơi nước", "Di sản"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch Đà Lạt 3N2Đ phân luồng thông minh theo 3 trục đường không trùng lặp: Trục trung tâm & Hồ Tuyền Lâm - Thác Datanla, Trục Đông Nam săn mây Đồi Chè Cầu Đất - Chùa Ve Chai, Trục phía Bắc đỉnh Langbiang, cùng thưởng thức lẩu gà lá é, bánh căn nóng hổi.",
    tags: [
      "Đà Lạt",
      "Lâm Đồng",
      "Hồ Xuân Hương",
      "Đồi Chè Cầu Đất",
      "Hồ Tuyền Lâm",
      "Langbiang",
      "Thác Datanla",
      "Lẩu gà lá é",
      "Bánh căn Đà Lạt",
    ],
    sections: {
      packingList: [
        "Trang phục 4 mùa trong 1 ngày: Chuẩn bị áo khoác ấm/áo len, khăn choàng và găng tay để đi chợ đêm và săn mây Cầu Đất lúc 5h sáng (nhiệt độ 10°C - 14°C).",
        "Kem dưỡng ẩm & Son dưỡng môi: Khí hậu cao nguyên độ ẩm thấp vào mùa khô kèm gió lạnh rất dễ làm khô nẻ da và nứt môi.",
        "Áo mưa mỏng trong cốp xe (mùa mưa tháng 5 - 10): Luôn để sẵn ô gấp hoặc áo mưa bộ để ứng phó với mưa rào bất chợt buổi chiều.",
        "Giày thể thao đế êm chống trượt: Di chuyển qua nhiều dốc đứng, đồi dốc và tham quan thác nước.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Trục Trung tâm & Phía Nam (Ga Đà Lạt – Thiền Viện Trúc Lâm – Hồ Tuyền Lâm – Thác Datanla – Chợ Đêm)",
          places: [
            "Ăn sáng bánh căn nóng hổi hoặc bánh mì xíu mại chén, dạo bộ ngắm đầu tàu hơi nước cổ tại Ga Đà Lạt",
            "Thăm Nhà thờ Con Gà và Dinh III Bảo Đại tìm hiểu kiến trúc dinh thự Pháp cổ kính",
            "Ăn trưa Lẩu gà lá é Tao Ngộ chua thanh the mát và nhận phòng homestay nghỉ ngơi",
            "Đổ đèo Prenn nhẹ xuống viếng Thiền Viện Trúc Lâm, ngắm cảnh Hồ Tuyền Lâm êm đềm giữa rừng thông",
            "Trải nghiệm trượt máng Alpine Coaster xuyên rừng thông tại Thác Datanla",
            "Ăn tối Lẩu bò Ba Toa Quán Gỗ, dạo Quảng trường Lâm Viên và thưởng thức sữa đậu nành nóng, bánh tráng nướng Chợ Đêm",
          ],
          note: "Đà Lạt có hệ thống bùng binh và đường một chiều phức tạp quanh khu Hòa Bình – Chợ Đêm; chú ý biển báo cấm rẽ và khung giờ phố đi bộ buổi tối.",
        },
        {
          day: 2,
          title: "Trục Đông Nam (Săn mây Đồi Chè Cầu Đất – Chùa Linh Phước – Cà phê Hoàng hôn & Acoustic)",
          places: [
            "04:45 xuất phát sớm đi 25 km xuống Đồi Chè Cầu Đất đón biển mây bồng bềnh bình minh bên tua-bin điện gió khổng lồ",
            "Thưởng thức hồng treo gió tại vườn và ghé chiêm bái Chùa Linh Phước (Chùa Ve Chai) khảm sành sứ kỷ lục",
            "Về trung tâm ăn trưa Bánh ướt lòng gà, Nem nướng Bà Hùng và ngủ bù buổi trưa",
            "Check-in Nhà thờ Domaine de Marie màu hồng đặc trưng của kiến trúc châu Âu thế kỷ 17",
            "Đón hoàng hôn tại quán cà phê view thung lũng đồi thông, thưởng thức tiệc BBQ và nghe nhạc Acoustic giữa sương lạnh",
          ],
          note: "Đường đi Cầu Đất lúc 05:00 sáng trời rất lạnh và có sương mù dày; bắt buộc mặc áo ấm dày, đeo găng tay và chạy xe bám vạch kẻ đường.",
        },
        {
          day: 3,
          title: "Trục Phía Bắc (Đỉnh Langbiang – Thung Lũng Tình Yêu / Puppy Farm – Mua đặc sản)",
          places: [
            "Di chuyển 12 km về hướng Lạc Dương đến Khu du lịch Núi Langbiang, đi xe Jeep vượt dốc lên Đỉnh Radar ngắm toàn cảnh Suối Vàng – Suối Bạc",
            "Ghé Thung Lũng Tình Yêu hoặc nông trại cún Puppy Farm check-in đồi hoa cẩm tú cầu rực rỡ",
            "Ăn trưa cơm niêu Đà Lạt hoặc gà nướng cơm lam ống tre thơm lừng, trả phòng khách sạn",
            "Ghé vườn dâu tây công nghệ cao tự tay hái dâu và mua mứt atiso, hồng sấy dẻo tại chuỗi cửa hàng uy tín trước khi về",
          ],
          note: "Đường vào một số điểm vùng ven phía Bắc có đèo dốc gắt; nên thuê xe số khỏe hoặc xe tay ga đời mới được kiểm tra phanh kỹ lưỡng.",
        },
      ],
      foodHighlights: [
        {
          name: "Lẩu gà lá é Tao Ngộ",
          desc: "Nước lẩu ngọt thanh chua cay the mát nấu cùng thịt gà ta thả vườn, măng tươi giòn ngọt, nấm bào ngư và rổ lá é thơm nồng đặc trưng.",
          priceRange: "250.000đ - 350.000đ / nồi",
        },
        {
          name: "Lẩu bò Ba Toa Quán Gỗ",
          desc: "Nồi đất sôi sùng sục ngập tràn thịt bò bắp, đuôi bò, gân bò ninh mềm rục béo ngọt, ăn kèm mì trứng và rau tần ô tươi non mơn mởn.",
          priceRange: "200.000đ - 350.000đ / nồi",
        },
        {
          name: "Bánh căn Đà Lạt (Trứng cút & Bò bằm)",
          desc: "Bánh căn nướng khuôn đất giòn rụm bên ngoài xốp mềm bên trong, chấm ngập bát mắm nêm hoặc nước mắm xíu mại mỡ hành nóng hổi.",
          priceRange: "35.000đ - 50.000đ / phần",
        },
        {
          name: "Bánh ướt lòng gà & Trứng non",
          desc: "Bánh ướt dẻo mềm mướt trộn thịt gà đồi xé phay, lòng mề, trứng gà non vàng ươm và rau răm chua ngọt đậm đà đánh thức vị giác.",
          priceRange: "40.000đ - 55.000đ / tô",
        },
        {
          name: "Combo ăn vặt đêm Chợ Đà Lạt",
          desc: "Bánh tráng nướng giòn rụm trứng cút bò khô, ly sữa đậu nành nóng hổi khói bốc nghi ngút và ly kem bơ sầu riêng béo ngậy giữa đêm lạnh phố núi.",
          priceRange: "15.000đ - 40.000đ / món",
        },
      ],
      budgetTips: [
        "Tuyệt đối không nghe theo 'Cò mồi' dẫn đi vườn dâu dọc đường: Những người đi xe máy phát danh thiếp vườn dâu miễn phí thực chất dẫn vào các lò mứt ép mua giá cao; hãy tự tra Google Maps các nông trại dâu uy tín.",
        "Săn mây miễn phí 100% tại cung đường Đồi Chè Cầu Đất hoặc Đồi Đa Phú: Đứng ngay trên trục đường nhựa ngắm trọn biển mây và điện gió mà không phải tốn 80k - 120k vào các điểm check-in nhân tạo.",
        "Mua đặc sản tại chuỗi niêm yết giá cố định (L\'angfarm, siêu thị Go!): Tránh bị nói thách hoặc mua phải hàng kém chất lượng tại chợ; các chuỗi uy tín niêm yết rõ ràng từ 35k - 100k/gói.",
        "Hỏi giá trước khi chụp ảnh cùng thú cưng tại Quảng trường & Hồ Xuân Hương: Các dịch vụ chụp ảnh cùng chó Alaska, ngựa tại bờ hồ thường tính phí theo kiểu ảnh (20k - 50k); cần thỏa thuận rõ giá trước khi chụp.",
      ],
    },
  },
  {
    id: "guide-con-dao",
    slug: "cam-nang-du-lich-con-dao-3n2d",
    title: "Cẩm nang du lịch Côn Đảo 3N2Đ: Dấu ấn lịch sử, tâm linh Hàng Dương & Thiên đường biển đảo nguyên sơ",
    destination: "Côn Đảo, Bà Rịa - Vũng Tàu",
    province: "Bà Rịa – Vũng Tàu",
    region: "islands",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "3.200.000đ - 5.200.000đ / người",
    bestSeason: "Tháng 3 - Tháng 9 (Mùa biển êm ả, nắng ấm và cao điểm rùa biển lên Hòn Bảy Cạnh đẻ trứng)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      caption: "Bờ biển Bãi Đầm Trầu xanh ngọc bích nép mình bên vách đá nguyên sơ tại Côn Đảo",
      photographer: "Con Dao Islands Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Nghĩa trang Hàng Dương linh thiêng trong không gian tĩnh mịch và khói hương trầm mặc",
        photographer: "Hang Duong Memorial",
        tags: ["Nghĩa trang Hàng Dương", "Mộ Cô Sáu", "Tâm linh"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Trải nghiệm thả rùa con về biển đại dương và lặn ngắm san hô tại Hòn Bảy Cạnh",
        photographer: "Bay Canh Island Conservation",
        tags: ["Hòn Bảy Cạnh", "Rùa biển", "San hô", "Vườn quốc gia"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Hoàng hôn lãng mạn buông xuống sau Đỉnh Tình Yêu bên bờ cát trắng Bãi Nhát",
        photographer: "Bai Nhat Sunset View",
        tags: ["Bãi Nhát", "Đỉnh Tình Yêu", "Mũi Cá Mập"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Cầu Tàu 914 lịch sử soi bóng bên làn nước vịnh Côn Sơn trong vắt nhìn thấu đáy",
        photographer: "Historic Pier 914",
        tags: ["Cầu Tàu 914", "Vịnh Côn Sơn", "Di tích"],
      },
    ],
    summary:
      "Cẩm nang du lịch Côn Đảo 3N2Đ toàn diện theo 3 cụm: Cụm Di tích Lịch sử Nhà tù Côn Đảo & viếng Nghĩa trang Hàng Dương đêm, Trục biển Nam Đảo lặn ngắm san hô thả rùa con tại Hòn Bảy Cạnh - hoàng hôn Bãi Nhát, và Trục Bắc Đảo ngắm máy bay hạ cánh sạt đầu tại Bãi Đầm Trầu cùng các món ngon hải sản ốc vú nàng, cua mặt trăng.",
    tags: [
      "Côn Đảo",
      "Bà Rịa - Vũng Tàu",
      "Nghĩa trang Hàng Dương",
      "Võ Thị Sáu",
      "Nhà tù Côn Đảo",
      "Chuồng Cọp",
      "Hòn Bảy Cạnh",
      "Bãi Đầm Trầu",
      "Bảo tồn Rùa biển",
    ],
    sections: {
      packingList: [
        "Quy định 'Giỏ lễ Xanh - Không vàng mã & Đồ nhựa' (Bắt buộc): Huyện Côn Đảo nghiêm cấm đốt vàng mã và sử dụng túi nilon, mút xốp cắm hoa tại Nghĩa trang Hàng Dương và các di tích; chỉ sử dụng giỏ mây tre đan, hoa tươi (sen trắng, cúc trắng) và ngũ quả.",
        "Trang phục trang nghiêm, lịch sự: Bắt buộc mặc quần dài, áo có cổ kín đáo khi vào viếng Nghĩa trang Hàng Dương, hệ thống Nhà tù Côn Đảo, Chùa Núi Một và Miếu Bà Phi Yến.",
        "Kính râm, Kem chống nắng Reef-safe & Túi chống nước: Phục vụ cung đường chạy xe máy ven biển và tour cano lặn ngắm san hô tại Hòn Bảy Cạnh.",
        "Giày thể thao êm chân hoặc Sandal bám đá: Phù hợp đi bộ tham quan khuôn viên di tích rộng lớn hoặc leo 200 bậc đá lên Chùa Núi Một ngắm cảnh vịnh.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Quần thể Di tích Lịch sử Nhà tù Côn Đảo – Chùa Núi Một – Viếng Nghĩa trang Hàng Dương",
          places: [
            "Bảo tàng Côn Đảo",
            "Dinh Chúa Đảo",
            "Di tích Trại Phú Hải",
            "Chuồng Cọp Pháp (Trại Phú Tường)",
            "Chuồng Cọp Mỹ (Trại Phú Bình)",
            "Miếu An Sơn (Bà Phi Yến)",
            "Chùa Núi Một (Vân Sơn Tự)",
            "Nghĩa trang Hàng Dương (Mộ Cô Sáu)",
          ],
          note: "11:00 – 13:30: Đến đảo qua sân bay Cỏ Ống hoặc cảng Bến Đầm, ăn trưa Bún riêu Hai Khiêm và nhận phòng. 14:00 – 17:00: Mua vé combo di tích tại Bảo tàng Côn Đảo, lần lượt tham quan Dinh Chúa Đảo, Trại Phú Hải, Chuồng Cọp Pháp và Chuồng Cọp Mỹ để cảm nhận lịch sử hào hùng. 17:00 – 18:15: Viếng Miếu An Sơn và leo bậc đá lên Chùa Núi Một ngắm toàn cảnh hồ sen An Hải và vịnh Côn Sơn từ trên cao. 19:30 – 21:30: Chuẩn bị giỏ lễ tre xanh, dâng hương tưởng niệm các anh hùng liệt sĩ và Mộ Cô Võ Thị Sáu tại Nghĩa trang Hàng Dương. Lưu ý: Di tích đóng cửa trưa từ 11:30 - 13:30 và chiều lúc 17:00; Nghĩa trang mở cửa đến 22:00 đêm.",
        },
        {
          day: 2,
          title: "Cano khám phá Hòn Bảy Cạnh (Thả rùa con & Lặn san hô) – Cung đường Tây Nam – Hoàng hôn Bãi Nhát",
          places: [
            "Cầu tàu du lịch Côn Đảo",
            "Hòn Bảy Cạnh (Ấp trứng rùa & Rừng ngập mặn)",
            "Mũi Cá Mập",
            "Bãi Nhát",
            "Đỉnh Tình Yêu",
            "Cầu Tàu 914",
          ],
          note: "07:30 – 12:00: Lên cano vượt sóng ra Hòn Bảy Cạnh: đi bộ xuyên rừng ngập mặn nguyên sinh, nghe kiểm lâm hướng dẫn ấp trứng rùa, thả rùa con về biển và lặn ngắm rạn san hô cổ thụ cùng trai tai tượng khổng lồ. 12:00 – 15:00: Ăn trưa hải sản ốc vú nàng, cá mú đỏ tại thị trấn và nghỉ ngơi tránh nắng. 15:30 – 18:00: Chạy xe máy cung đường ven biển Tây Nam hướng Bến Đầm: check-in Mũi Cá Mập, ngắm Đỉnh Tình Yêu và dừng tại Bãi Nhát ngắm hoàng hôn lặn dần sau vách núi khi thủy triều rút cát trắng. 19:00 – 21:30: Ăn tối kem dừa Côn Đảo và dạo bờ kè đường Tôn Đức Thắng lắng nghe sóng vỗ Cầu Tàu 914.",
        },
        {
          day: 3,
          title: "Cung đường Đông Bắc – Miếu Cậu – Ngắm máy bay sạt đầu tại Bãi Đầm Trầu – Chợ Côn Đảo",
          places: [
            "Cung đường ven biển Đông Bắc",
            "Miếu Cậu (Hoàng tử Cải)",
            "Bãi Đầm Trầu",
            "Sân bay Cỏ Ống",
            "Chợ Côn Đảo",
          ],
          note: "07:30 – 11:00: Chạy xe máy theo cung đường ven biển Đông Bắc hướng ra sân bay: ghé viếng Miếu Cậu, sau đó ra Bãi Đầm Trầu tắm biển dưới vách đá vàng ươm và trải nghiệm khoảnh khắc máy bay lướt sạt ngay trên đầu để hạ cánh xuống đường băng Cỏ Ống. 11:30 – 13:00: Trở về thị trấn ăn trưa, trả phòng khách sạn. 13:30 – 15:00: Ghé Chợ Côn Đảo mua hạt bàng rang muối, mứt hạt bàng, mắm hàu và mực một nắng làm quà trước khi ra sân bay/bến cảng về đất liền. Lưu ý: Đoạn đường đèo ven biển có nhiều đàn khỉ rừng ngồi bên lan can; chạy xe vừa phải và không cho khỉ ăn thức ăn lạ.",
        },
      ],
      foodHighlights: [
        {
          name: "Bún riêu cua Hai Khiêm",
          desc: "Tô bún riêu cua biển giã tay ngọt đậm đà tự nhiên, kèm chả cá thu dai ngọt, huyết mềm và đậu hũ rán giòn - món ăn sáng nổi tiếng nhất đường Nguyễn Huệ.",
          priceRange: "35.000đ - 50.000đ / tô",
        },
        {
          name: "Ốc Vú Nàng nướng mỡ hành",
          desc: "Loài ốc hình chóp nón độc đáo chỉ bám ghềnh đá nước trong tại Côn Đảo, thịt giòn ngọt sần sật nướng cùng mỡ hành đậu phộng thơm nức mũi.",
          priceRange: "120.000đ - 180.000đ / đĩa",
        },
        {
          name: "Cá Mú Đỏ & Gỏi cá nhám Côn Đảo",
          desc: "Cá mú đỏ biển sâu thịt ngọt chắc hấp xì dầu Hồng Kông và gỏi cá nhám cuốn bánh tráng rau rừng chuối chát chấm nước tương đậu phộng cay the nồng.",
          priceRange: "150.000đ - 900.000đ / món",
        },
        {
          name: "Cua Mặt Trăng Côn Đảo",
          desc: "Loài cua quý hiếm với các đốm đỏ tròn như mặt trăng trên mai, thịt thơm ngọt đậm vị biển nướng hoặc hấp sả chấm muối tiêu chanh ớt hiểm.",
          priceRange: "350.000đ - 500.000đ / kg",
        },
        {
          name: "Kem dừa Côn Đảo & Hạt bàng rang muối",
          desc: "Viên kem dừa mát lạnh béo ngậy trong trái dừa xiêm non và đặc sản hạt bàng rang muối bùi ngậy từ những cây bàng di sản trăm tuổi trên đảo.",
          priceRange: "45.000đ - 110.000đ / phần",
        },
      ],
      budgetTips: [
        "Nhận xe máy ngay tại Sân bay Cỏ Ống hoặc Cảng Bến Đầm: Đặt trước tiệm thuê xe máy để họ giao xe trực tiếp tại sân bay/cảng miễn phí; tiết kiệm 100k tiền xe điện trung chuyển và chủ động ghé Bãi Đầm Trầu hoặc Bãi Nhát ngay trên đường về thị trấn.",
        "Đi tàu cao tốc từ cảng Trần Đề (Sóc Trăng): Tuyến Superdong / Phú Quốc Express từ Trần Đề ra Côn Đảo chỉ mất 2 tiếng 15 phút với giá vé ~320k - 390k; tiết kiệm gần một nửa chi phí và thời gian say sóng so với tàu từ Vũng Tàu.",
        "Tự chuẩn bị lễ vật thành tâm tại Chợ Côn Đảo: Ra chợ mua một bó hoa sen hoặc cúc trắng cùng mẹt ngũ quả tre đan nhỏ với giá chỉ 100k - 200k, tránh mua các mâm lễ bày sẵn nhiều tầng giá từ 800k - 2 triệu đồng.",
        "Tra cứu Flightradar24 để săn ảnh máy bay sạt đầu tại Bãi Đầm Trầu: Canh chuẩn xác giờ hạ cánh của các chuyến bay đến sân bay VCS (thường từ 8:00 - 10:30 sáng và 13:30 - 15:30 chiều) để không phải đứng chờ nắng lâu.",
      ],
    },
  },
  {
    id: "guide-mui-ne",
    slug: "cam-nang-du-lich-mui-ne-phan-thiet-3n2d",
    title: "Cẩm nang du lịch Mũi Né – Phan Thiết 3N2Đ: Tiểu sa mạc Bàu Trắng, Tour Xe Jeep & Thủ đô Resort",
    destination: "Mũi Né – Phan Thiết (Bình Thuận)",
    province: "Bình Thuận",
    region: "south",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.200.000đ - 3.500.000đ / người",
    bestSeason: "Tháng 11 - Tháng 4 (Trời khô ráo, nắng ấm, gió lý tưởng cho lướt ván diều và mùa hoa sen Bàu Trắng)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      caption: "Đồi cát trắng tinh khôi Bàu Trắng bên hồ sen Bàu Bà thanh bình tại Mũi Né",
      photographer: "Mui Ne Desert Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Làng chài Mũi Né rực rỡ sắc màu thuyền thúng cập bến trong nắng sớm",
        photographer: "Mui Ne Fishing Port",
        tags: ["Làng chài Mũi Né", "Thuyền thúng", "Hải sản"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Suối Tiên Hàm Tiến với hẻm nhũ cát màu cam đỏ và dòng nước mát lành",
        photographer: "Fairy Stream Heritage",
        tags: ["Suối Tiên", "Fairy Stream", "Hàm Tiến"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Hoàng hôn buông rực rỡ trên Đồi Cát Bay (Đồi Cát Đỏ) nhìn ra biển Hòn Rơm",
        photographer: "Red Sand Dunes View",
        tags: ["Đồi Cát Bay", "Đồi Cát Đỏ", "Hoàng hôn"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Ngọn Hải đăng Kê Gà bằng đá cổ kính xây dựng từ năm 1899 trên đảo đá",
        photographer: "Ke Ga Lighthouse",
        tags: ["Hải đăng Kê Gà", "Kê Gà", "Tiến Thành"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch Mũi Né – Phan Thiết 3N2Đ trọn vẹn theo 3 phân khu tuyến tính: Khám phá Tháp Chăm Po Sah Inư và Suối Tiên huyền ảo, chinh phục tiểu sa mạc Bàu Trắng bằng tour xe Jeep ngắm bình minh và check-in cung đường đôi xe nước vàng, dạo làng chài Mũi Né mua hải sản tươi và thưởng thức lẩu thả, bánh canh chả cá trứ danh.",
    tags: [
      "Mũi Né",
      "Phan Thiết",
      "Bình Thuận",
      "Bàu Trắng",
      "Đồi Cát Bay",
      "Tour Xe Jeep",
      "Suối Tiên",
      "Lẩu thả Mũi Né",
      "Làng chài Mũi Né",
      "Hải đăng Kê Gà",
    ],
    sections: {
      packingList: [
        "Kính râm ôm sát mắt & Khăn choàng chống nắng/gió cát: Trên đỉnh Đồi Cát Trắng (Bàu Trắng) và Đồi Cát Đỏ gió thổi rất mạnh làm cát bay rát mặt; kính râm bảo vệ mắt khỏi cát li ti và chụp ảnh xe Jeep cực ngầu.",
        "Trang phục theo bảng màu nổi bật trên cát trắng: Chuẩn bị trang phục phong cách Bohemian, Safari hoặc tông màu đỏ tươi, cam đất, vàng nghệ, xanh coban (tránh mặc đồ màu be nhạt dễ lẫn vào cát).",
        "Dép xỏ ngón / Sandal dễ rửa cát: Đi Suối Tiên và leo các đồi cát không nên mang giày thể thao vải lưới vì cát mịn và nước phù sa bám dính khó giặt.",
        "Kem chống nắng SPF 50+, mũ rộng vành & Áo khoác mỏng: Bảo vệ da trước cái nắng và gió biển đặc trưng của vùng duyên hải Bình Thuận.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Trung tâm Phan Thiết – Tháp Po Sah Inư – Lâu đài Rượu Vang – Bãi đá Ông Địa – Suối Tiên",
          places: [
            "Trung tâm TP. Phan Thiết",
            "Tháp Po Sah Inư",
            "Lâu đài Rượu vang RD (Sea Links)",
            "Suối Tiên (Fairy Stream)",
            "Bãi đá Ông Địa",
            "Bờ kè Hàm Tiến",
          ],
          note: "10:30 – 13:30: Đến Phan Thiết theo cao tốc Dầu Giây – Phan Thiết (2,5 tiếng từ TP.HCM), ăn trưa bánh canh chả cá hoặc lẩu thả Mũi Né, nhận phòng resort Hàm Tiến. 14:30 – 16:00: Thăm Tháp Chăm cổ Po Sah Inư trên đồi Bà Nài và tham quan hầm rượu ngầm RD Sea Links. 16:00 – 17:15: Xách dép lội bộ chân trần dòng suối màu cam đỏ uốn quanh nhũ cát tại Suối Tiên. 17:15 – 18:30: Ra Bãi đá Ông Địa chụp ảnh kè chắn sóng và ngắm hoàng hôn tại các Beach Bar đường Nguyễn Đình Chiểu. 19:30 – 22:00: Thưởng thức hải sản tươi sống bờ kè Hàm Tiến.",
        },
        {
          day: 2,
          title: "Tour Xe Jeep Bình minh Bàu Trắng – Cung đường đôi xe nước vàng – Làng Chài Mũi Né – Đồi Cát Bay",
          places: [
            "Đồi Cát Trắng (Bàu Trắng)",
            "Hồ sen Bàu Bà",
            "Cung đường đôi Bàu Trắng – Phan Rí",
            "Làng chài Mũi Né",
            "Đồi Cát Bay (Đồi Cát Đỏ)",
          ],
          note: "04:30 – 07:30: Xe Jeep đón tại resort chạy thẳng ra Bàu Trắng, trải nghiệm xe địa hình lướt trên triền cát trắng đón bình minh trên hồ sen Bàu Bà và trượt cát từ đỉnh dốc. 07:30 – 08:30: Check-in xe Jeep và xe nước vàng trên Cung đường đôi Bàu Trắng – Phan Rí. 08:30 – 09:30: Ghé Làng chài Mũi Né ngắm hàng trăm thuyền thúng tấp nập và mua hải sản vừa cập bờ nhờ luộc ăn liền. 10:00 – 15:30: Nghỉ trưa tắm biển resort tránh nắng gắt. 16:00 – 18:00: Check-in Đồi Cát Bay (Đồi Cát Đỏ) trượt cát ván nhựa và ăn bánh bột lọc gánh ngắm hoàng hôn.",
        },
        {
          day: 3,
          title: "Trường Dục Thanh – Dinh Vạn Thủy Tú – NovaWorld / Hải đăng Kê Gà – Mua đặc sản",
          places: [
            "Trường Dục Thanh",
            "Dinh Vạn Thủy Tú",
            "Bảo tàng Nước mắm Làng Chài Xưa",
            "Bikini Beach (NovaWorld Phan Thiết)",
            "Hải đăng Kê Gà",
            "Chợ Phan Thiết",
          ],
          note: "08:00 – 10:30: Lựa chọn 1 (Văn hóa trung tâm): Thăm Trường Dục Thanh, Dinh Vạn Thủy Tú (xương cá voi 22m) và Bảo tàng Làng Chài Xưa. Hoặc Lựa chọn 2 (Tuyến Nam Kê Gà): Check-in Bikini Beach NovaWorld và đi cano ra Hải đăng Kê Gà cổ nhất Việt Nam. 11:00 – 13:30: Ăn trưa bánh căn, bánh quai vạc hoặc cơm niêu, trả phòng. 14:00 – 15:30: Ghé chợ Phan Thiết mua nước mắm Tĩn, mực một nắng, bánh rế, thanh long trước khi lên cao tốc về lại.",
        },
      ],
      foodHighlights: [
        {
          name: "Lẩu thả Mũi Né",
          desc: "Bày biện nghệ thuật trong bẹ hoa chuối đỏ gồm cá mai tươi phi lê, thịt ba chỉ, trứng chiên sợi, xoài băm, bún tươi ăn kèm bánh tráng nướng và nước lẩu chua cay.",
          priceRange: "250.000đ - 400.000đ / mẹt",
        },
        {
          name: "Gỏi cá mai & Gỏi ốc giác",
          desc: "Phi lê cá mai trong suốt không tanh trộn thính gạo thơm, rau răm, đậu phộng cuốn bánh tráng mè chấm nước mắm me chua ngọt cay nồng.",
          priceRange: "100.000đ - 160.000đ / đĩa",
        },
        {
          name: "Dông cát nướng muối ớt & Chả dông",
          desc: "Đặc sản đồi cát Bình Thuận với thịt dông săn chắc ngọt thịt tẩm ướp muối ớt nướng vàng ruộm trên than hoa hoặc băm nhuyễn làm chả giòn rụm.",
          priceRange: "120.000đ - 220.000đ / món",
        },
        {
          name: "Bánh căn Phan Thiết xíu mại cá kho",
          desc: "Bánh căn giòn xốp đổ khuôn đất nung chấm ngập tô nước mắm xíu mại, trứng luộc, da heo dai giòn và cá nục kho béo ngọt đậm đà vị biển.",
          priceRange: "35.000đ - 55.000đ / phần",
        },
        {
          name: "Bánh canh chả cá & Bánh tráng cuốn dẻo mắm ruốc",
          desc: "Tô bánh canh bột gạo nước lèo xương cá ngọt thanh ăn cùng chả cá thu chiên và bánh tráng cuốn dẻo mắm ruốc nướng thơm phức vỉa hè phố biển.",
          priceRange: "15.000đ - 40.000đ / món",
        },
      ],
      budgetTips: [
        "Thuê nguyên chiếc Xe Jeep (550k - 600k/xe) đi tour Bàu Trắng: Nhóm 4 - 6 người chia ra chỉ hơn 100k/người cho 4 điểm; an toàn hơn chạy xe máy 50km gió bụi và tài xế chụp ảnh miễn phí cực đẹp.",
        "Phân biệt vé xe địa hình nội khu Bàu Trắng: Tour xe Jeep đưa tới chân đồi; vé xe ATV/Jeep vượt lên đỉnh cát thu riêng (150k - 200k/người). Nếu tiết kiệm có thể đi bộ ven hồ sen Bàu Bà và chơi trượt cát miễn phí vé tại Đồi Cát Đỏ.",
        "Mua hải sản tươi tại Làng Chài Mũi Né lúc 6h30 - 7h30 sáng: Giá ghẹ, tôm, mực tươi sống vừa gỡ lưới rẻ hơn nhà hàng 30 - 40%, thuê luộc tại chỗ 20k - 30k/kg kèm muối tiêu chanh.",
        "Ăn uống tại trung tâm TP. Phan Thiết thay vì phố Tây Nguyễn Đình Chiểu: Các quán bánh căn, bánh canh, hải sản bờ kè sông Cà Ty có giá bình dân người địa phương, rẻ hơn khu resort 30 - 50%.",
      ],
    },
  },
  {
    id: "guide-mai-chau",
    slug: "cam-nang-du-lich-mai-chau-hoa-binh-3n2d",
    title: "Cẩm nang du lịch Mai Châu 3N2Đ: Vượt Đèo Đá Trắng, đạp xe Bản Lác & Du ngoạn Ba Khan",
    destination: "Thung lũng Mai Châu (Hòa Bình)",
    province: "Hòa Bình",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "1.200.000đ - 3.000.000đ / người",
    bestSeason: "Tháng 3 - Tháng 4 & Tháng 9 - Tháng 10 (Mùa lúa chín vàng) & Tháng 11 - Tháng 2 (Mùa hoa mận, hoa đào)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      caption: "Cánh đồng lúa thanh bình nép mình bên vách núi đá vôi tại thung lũng Mai Châu",
      photographer: "Mai Chau Valley Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
        caption: "Đèo Thung Khe (Đèo Đá Trắng) bồng bềnh mây mù tựa ngọn đồi tuyết trắng Bắc Âu",
        photographer: "Thung Khe Mountain Pass",
        tags: ["Đèo Thung Khe", "Đèo Đá Trắng", "Săn mây"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Toàn cảnh thung lũng Bản Lác và thị trấn Mai Châu nhìn từ Di tích Hang Chiều",
        photographer: "Hang Chieu Cave View",
        tags: ["Hang Chiều", "Bậc đá", "Toàn cảnh"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Mặt hồ sông Đà xanh ngọc bích êm đềm tại khu vực Ba Khan và vịnh Tân Mai",
        photographer: "Ba Khan Lake Heritage",
        tags: ["Ba Khan", "Sông Đà", "Kayak"],
      },
      {
        url: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        caption: "Nếp nhà sàn gỗ truyền thống và cuộc sống cộng đồng bình dị tại Bản Pom Coọng",
        photographer: "Pom Coong Village Life",
        tags: ["Bản Pom Coọng", "Nhà sàn", "Văn hóa Thái"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch Mai Châu 3N2Đ trọn vẹn: Vượt Đèo Thung Khe (Đèo Đá Trắng) ngắm toàn cảnh thung lũng, thuê xe đạp xuyên cánh đồng lúa Bản Lác và Pom Coọng, leo 1.200 bậc đá khám phá Di tích Hang Chiều, du ngoạn lòng hồ sông Đà tại vịnh Ba Khan và thưởng thức cơm lam, mẹt lợn mán, cá suối nướng.",
    tags: [
      "Mai Châu",
      "Hòa Bình",
      "Bản Lác",
      "Bản Pom Coọng",
      "Đèo Thung Khe",
      "Đèo Đá Trắng",
      "Hang Chiều",
      "Ba Khan",
      "Cơm lam Mai Châu",
      "Thịt lợn mán",
    ],
    sections: {
      packingList: [
        "Giày thể thao bám đường tốt: Cần thiết để leo 1.200 bậc đá dốc đứng lên Di tích Hang Chiều và đạp xe dạo bản làng.",
        "Áo khoác gió hoặc áo giữ nhiệt mỏng: Thung lũng lọt giữa lòng núi đá vôi nên nhiệt độ ban đêm và sáng sớm thường giảm nhanh, se lạnh dễ chịu.",
        "Thuốc xịt chống muỗi & côn trùng: Rất quan trọng khi ngủ nhà sàn cộng đồng gần ruộng lúa và rừng tre nứa.",
        "Tiền mặt chuẩn bị sẵn: Các sạp bán đặc sản, dệt thổ cẩm tại bản và các quán ngô nướng trên đèo Thung Khe chủ yếu nhận tiền mặt hoặc chuyển khoản lẻ.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Vượt Đèo Đá Trắng – Khám phá Bản Lác & Bản Pom Coọng",
          places: [
            "Quốc lộ 6",
            "Đèo Thung Khe (Đèo Đá Trắng)",
            "Bản Lác",
            "Bản Pom Coọng",
          ],
          note: "07:00 – 10:30: Khởi hành theo QL6 lên Hòa Bình. Dừng chân tại Đèo Thung Khe lúc 10:00 ngắm toàn cảnh thung lũng Mai Châu trong sương khói, ăn ngô luộc, trứng nướng và cơm lam dẻo thơm. 11:30 – 14:00: Nhận phòng nhà sàn tại Bản Lác, dùng bữa trưa mẹt cỗ lá người Thái và nghỉ ngơi. 15:00 – 17:30: Thuê xe đạp dạo quanh cánh đồng lúa nối liền Bản Lác và Pom Coọng, tìm hiểu nghề dệt thổ cẩm truyền thống. 19:00 – 21:30: Ăn tối BBQ sân nhà sàn, giao lưu văn nghệ múa xòe Thái, nhảy sạp và uống rượu cần.",
        },
        {
          day: 2,
          title: "Chinh phục Hang Chiều – Du ngoạn lòng hồ sông Đà tại Ba Khan",
          places: [
            "Di Tích Hang Chiều",
            "Xã Tân Mai",
            "Ba Khan (Lòng hồ Hòa Bình)",
          ],
          note: "07:30 – 10:30: Vượt 1.200 bậc đá chinh phục Di Tích Hang Chiều, ngắm trọn vẹn thị trấn và các bản làng Mai Châu từ trên cao. 11:30 – 13:30: Ăn trưa và trả phòng bản Lác (nếu đổi sang khu nghỉ ven hồ) hoặc nghỉ ngơi. 14:30 – 17:30: Chạy xe 15km về phía xã Tân Mai (khu vực Ba Khan) ngắm non nước lòng hồ Hòa Bình ('Hạ Long trên núi'), chèo kayak hoặc bơi bể bơi vô cực nhìn ra hồ. 19:00: Thưởng thức bữa tối cá lăng, cá tầm sông Đà nướng muối ớt.",
        },
        {
          day: 3,
          title: "Chợ phiên vùng cao – Thưởng thức cà phê thung lũng – Mua quà đặc sản",
          places: [
            "Chợ phiên Mai Châu",
            "Cánh đồng lúa thung lũng",
            "Cửa hàng đặc sản",
          ],
          note: "06:30 – 08:30: Dậy sớm đón bình minh trên cánh đồng lúa, dạo chợ phiên địa phương mua măng khô, mắc khén, hạt dổi và thổ cẩm dệt tay. 09:00 – 11:30: Uống cà phê sáng ngắm sương sớm tan dần trên thung lũng, thu dọn hành lý và làm thủ tục trả phòng. 12:00 – 13:30: Ăn trưa nhẹ trước khi khởi hành về lại.",
        },
      ],
      foodHighlights: [
        {
          name: "Cơm lam Mai Châu muối vừng",
          desc: "Gạo nếp nương thơm dẻo nướng trong ống tre non trên than hoa, bóc lớp vỏ tre thơm lừng chấm muối vừng bùi ngậy chuẩn phong vị Tây Bắc.",
          priceRange: "15.000đ - 25.000đ / ống",
        },
        {
          name: "Mẹt lợn mán bản đủ món nướng mắc khén",
          desc: "Thịt lợn cắp nách thả đồi săn chắc bì giòn sần sật, chế biến đủ món hấp lá chuối, nướng mắc khén thơm nức mũi và dồi nướng đậm đà.",
          priceRange: "350.000đ - 600.000đ / mẹt",
        },
        {
          name: "Gà đồi nướng mắc khén & Cá suối nướng pa pỉnh tộp",
          desc: "Gà thả đồi ướp hạt mắc khén hạt dổi kẹp que tre nướng than hồng và cá suối tươi kẹp thanh tre gập nướng vàng giòn thơm ngậy vị sả ớt.",
          priceRange: "120.000đ - 350.000đ / món",
        },
        {
          name: "Xôi nếp nương ngũ sắc",
          desc: "Hạt gạo nếp nương nương dẻo quánh đồ cùng các loại lá rừng tự nhiên (lá cẩm, dành dành, gấc) tạo nên đĩa xôi rực rỡ bắt mắt và thơm dẻo.",
          priceRange: "50.000đ - 80.000đ / đĩa",
        },
        {
          name: "Thịt trâu nấu lá lồm & Rượu cần Mai Hạ",
          desc: "Thịt trâu tươi ninh nhừ cùng lá lồm chua thanh kích thích vị giác, thưởng thức cùng vò rượu cần vít cần men lá truyền thống của người Mường, Thái.",
          priceRange: "100.000đ - 250.000đ / phần",
        },
      ],
      budgetTips: [
        "Nghỉ nhà sàn tập thể tại Bản Lác hoặc Bản Pom Coọng: Giá chỉ 80.000 - 150.000 VNĐ/người/đêm sạch sẽ, thoáng mát, view cánh đồng và có chăn đệm thơm tho.",
        "Đặt ăn theo mẹt/mâm tại nhà sàn: Báo trước chủ nhà sàn chuẩn bị theo suất (khoảng 120k - 150k/người) vừa đầy đặn, chuẩn vị bản xứ và tiết kiệm hơn 25 - 30% so với ăn lẻ tại nhà hàng.",
        "Đi nhóm đông để chia tiền đội văn nghệ múa xòe & đốt lửa trại: Chi phí thuê đội múa xòe, nhảy sạp khoảng 800k - 1.500k/đêm, nhóm từ 8 - 15 người chia ra chỉ vài chục nghìn mỗi người.",
        "Thuê xe đạp tại bản thay vì đi xe điện: Chỉ 30.000 - 50.000 VNĐ/ngày tha hồ len lỏi vào các ngõ nhỏ giữa cánh đồng lúa và chụp ảnh không bị gò bó thời gian.",
      ],
    },
  },
  {
    id: "guide-nui-ba-den",
    slug: "cam-nang-du-lich-nui-ba-den-tay-ninh-3n2d",
    title: "Cẩm nang du lịch Núi Bà Đen 3N2Đ: Săn mây Nóc nhà Nam Bộ, Chiêm bái Phật Bà & Cắm trại Hồ Dầu Tiếng",
    destination: "Núi Bà Đen (Tây Ninh)",
    province: "Tây Ninh",
    region: "south",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "1.300.000đ - 3.500.000đ / người",
    bestSeason: "Tháng 11 - Tháng 4 (Mùa khô săn mây đĩa bay) & Tháng 1 Âm lịch (Hội Xuân Núi Bà)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
      caption: "Đại tượng Phật Bà Tây Bổ Đà Sơn sừng sững giữa mây ngàn đỉnh Núi Bà Đen 986m",
      photographer: "Sun World Ba Den Mountain",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Chùa Bà Đen (Linh Sơn Tiên Thạch Tự) thanh tịnh nơi lưng chừng núi mây ngàn",
        photographer: "Linh Son Temple View",
        tags: ["Chùa Bà Đen", "Linh Sơn Tiên Thạch", "Tâm linh"],
      },
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Kiến trúc tôn giáo độc đáo và rực rỡ sắc màu của Tòa Thánh Tây Ninh",
        photographer: "Tay Ninh Holy See",
        tags: ["Tòa Thánh Tây Ninh", "Đạo Cao Đài", "Kiến trúc"],
      },
      {
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        caption: "Cắm trại ngắm hoàng hôn buông xuống sau bóng Núi Bà Đen bên bờ Hồ Dầu Tiếng",
        photographer: "Dau Tieng Lake Camping",
        tags: ["Hồ Dầu Tiếng", "Cắm trại", "Hoàng hôn"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Đại tượng Phật Di Lặc bằng đá sa thạch và trình diễn nhạc nước ánh sáng nghệ thuật",
        photographer: "Maitreya Water Show",
        tags: ["Phật Di Lặc", "Nhạc nước", "Cầu Ước"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch Núi Bà Đen 3N2Đ trọn vẹn: Khám phá Tòa Thánh Tây Ninh rực rỡ và cắm trại ngắm hoàng hôn Núi Bà từ Hồ Dầu Tiếng, đi cáp treo lên đỉnh 986m săn biển mây đĩa bay, chiêm bái Tượng Phật Bà Tây Bổ Đà Sơn và Phật Di Lặc sa thạch lớn hàng đầu thế giới, thưởng thức bò tơ Năm Sánh, bánh canh Trảng Bàng.",
    tags: [
      "Núi Bà Đen",
      "Tây Ninh",
      "Tây Bổ Đà Sơn",
      "Chùa Bà Đen",
      "Hồ Dầu Tiếng",
      "Tòa Thánh Tây Ninh",
      "Bò tơ Tây Ninh",
      "Bánh canh Trảng Bàng",
    ],
    sections: {
      packingList: [
        "Trang phục lịch sự, kín đáo: Áo có tay, quần hoặc váy dài qua đầu gối khi chiêm bái quần thể tâm linh Chùa Bà và Đỉnh núi; mang theo áo khoác nhẹ vì đỉnh núi cao 986m nhiệt độ luôn thấp hơn chân núi 5 - 8°C và gió mạnh.",
        "Giày thể thao êm chân: Khuôn viên đỉnh núi và hệ thống bậc thang Chùa Bà rất rộng lớn, đi bộ nhiều; nếu chọn trekking đường cột điện hoặc Ma Thiên Lãnh cần giày leo núi chuyên dụng.",
        "Phụ kiện chống nắng: Kem chống nắng, kính râm và mũ có dây quai đeo (tránh bị gió lộng trên đỉnh núi thổi bay).",
        "Chuẩn bị đồ lễ từ trung tâm TP. Tây Ninh: Mua hoa tươi và trái cây tại chợ trước khi vào khu du lịch để có giá tốt và tươi ngon hơn.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "TP.HCM – Tòa Thánh Tây Ninh – Cắm trại Hồ Dầu Tiếng ngắm Núi Bà",
          places: [
            "Quốc lộ 22 / Tỉnh lộ 8",
            "Trảng Bàng (Ăn sáng bánh canh)",
            "Tòa Thánh Tây Ninh (Đạo Cao Đài)",
            "Hồ Dầu Tiếng",
          ],
          note: "07:00 – 10:00: Khởi hành từ TP.HCM đi Tây Ninh (khoảng 100km), dừng ăn sáng Bánh canh Trảng Bàng đậm đà rau rừng. 10:30 – 12:00: Tham quan Tòa Thánh Tây Ninh, chiêm ngưỡng kiến trúc độc đáo và xem lễ cúng chính ngọ lúc 12h trưa. 12:30 – 15:00: Ăn trưa trung tâm TP. Tây Ninh, nhận phòng khách sạn hoặc di chuyển ra khu cắm trại ven Hồ Dầu Tiếng. 16:00 – 20:00: Ngắm hoàng hôn tuyệt đẹp buông sau bóng Núi Bà Đen từ bờ hồ, mở tiệc BBQ nướng hoặc thưởng thức Bò tơ Tây Ninh.",
        },
        {
          day: 2,
          title: "Săn mây đỉnh Núi Bà Đen – Chiêm bái quần thể tâm linh – Show nhạc nước",
          places: [
            "Ga Bà Đen (Sun World)",
            "Đỉnh Núi Bà Đen (Tượng Phật Bà Tây Bổ Đà Sơn)",
            "Khu triển lãm Phật giáo",
            "Chùa Bà Đen (Linh Sơn Tiên Thạch Tự)",
            "Tượng Phật Di Lặc & Cầu Ước (Show nhạc nước)",
          ],
          note: "05:30 – 08:30: Đến Ga Bà Đen đi tuyến cáp Vân Sơn lên đỉnh núi 986m đón bình minh và săn biển mây bồng bềnh. 08:30 – 11:30: Chiêm bái Tượng Phật Bà Tây Bổ Đà Sơn bằng đồng cao nhất châu Á, tham quan khu triển lãm Phật giáo và vườn hoa bốn mùa. 11:30 – 13:30: Dùng buffet trưa tại nhà hàng Vân Sơn. 14:00 – 17:00: Đi cáp treo Chùa Hang xuống lễ Bà tại Linh Sơn Tiên Thạch Tự. 17:30 – 19:30: Trở lại đỉnh núi chiêm ngưỡng Tượng Phật Di Lặc bằng đá sa thạch và thưởng thức show nhạc nước nghệ thuật lung linh.",
        },
        {
          day: 3,
          title: "Vườn Quốc gia Lò Gò – Xa Mát hoặc Chùa Gò Kén – Mua đặc sản",
          places: [
            "Chùa Gò Kén (Thiền Lâm Tự)",
            "Thung lũng Ma Thiên Lãnh",
            "Cơ sở sản xuất đặc sản Tây Ninh",
          ],
          note: "07:30 – 10:30: Ghé thăm Chùa Gò Kén với tượng Phật Quan Âm giữa hồ nước hoặc khám phá thung lũng Ma Thiên Lãnh hoang sơ giữa 3 ngọn núi. 11:00 – 13:00: Trả phòng, ăn trưa với món thằn lằn núi hoặc lẩu cá lăng sông Vàm Cỏ. 13:30 – 15:00: Mua bánh tráng phơi sương, muối tôm Tây Ninh, mãng cầu Bà Đen làm quà trước khi khởi hành về lại TP.HCM.",
        },
      ],
      foodHighlights: [
        {
          name: "Bò tơ Tây Ninh Năm Sánh",
          desc: "Thịt bò tơ non mềm ngọt nướng tảng than hoa, cuốn bánh tráng phơi sương kèm đĩa rau rừng hơn 10 loại chấm mắm nêm đậm đà nức tiếng.",
          priceRange: "150.000đ - 300.000đ / món",
        },
        {
          name: "Bánh canh Trảng Bàng giò heo",
          desc: "Sợi bánh canh bột gạo trắng ngần dẻo dai hòa quyện cùng nước lèo trong veo ngọt thanh hầm từ xương tủy, ăn kèm giò heo luộc và mắm tiêu chanh.",
          priceRange: "50.000đ - 70.000đ / tô",
        },
        {
          name: "Bánh tráng phơi sương cuốn thịt luộc rau rừng",
          desc: "Bánh tráng phơi sương đêm dẻo mềm cuốn thịt ba chỉ bắp hoa thái mỏng cùng lá cóc, sao nhái, đọt choại chấm nước mắm chua ngọt hoặc mắm nêm cay xé lưỡi.",
          priceRange: "60.000đ - 100.000đ / phần",
        },
        {
          name: "Thằn lằn núi & Ốc xu Núi Bà",
          desc: "Ốc núi béo ngậy chỉ sống trên các vách đá ăn lá thuốc quý hấp sả gừng và thằn lằn núi chiên giòn mắm me - đặc sản trứ danh chỉ có tại Núi Bà Đen.",
          priceRange: "100.000đ - 250.000đ / đĩa",
        },
        {
          name: "Mãng cầu Bà Đen & Muối tôm Tây Ninh",
          desc: "Trái na mãng cầu thịt dai thơm ngọt trồng dưới chân núi thổ nhưỡng màu mỡ và hạt muối tôm hạt to cay nồng thơm lừng tôm khô phơi nắng.",
          priceRange: "20.000đ - 80.000đ / phần",
        },
      ],
      budgetTips: [
        "Mua Combo Cáp treo + Buffet trưa trên đỉnh Vân Sơn: Đặt vé online trước 1 ngày tiết kiệm 100k - 150k/người so với mua lẻ từng dịch vụ tại quầy.",
        "Săn vé cáp treo sau 17h00 nếu chỉ ngắm hoàng hôn & nhạc nước: Khu du lịch thường có gói vé cáp ưu đãi buổi chiều tối giá mềm hơn đáng kể.",
        "Tự chuẩn bị đồ lễ hoa tươi quả ngọt tại chợ trung tâm Tây Ninh: Vừa tiết kiệm chi phí, vừa tươi ngon và thành tâm hơn mua tại chân núi.",
        "Đi xe máy theo tuyến Tỉnh lộ 8 Củ Chi: Tuyến đường này rợp bóng mát, ít xe tải và container hơn so với Quốc lộ 22.",
      ],
    },
  },
  {
    id: "guide-ba-na-hills",
    slug: "cam-nang-du-lich-ba-na-hills-da-nang-3n2d",
    title: "Cẩm nang du lịch Ba Na Hills – Đà Nẵng 3N2Đ: Check-in Cầu Vàng, Lạc bước Làng Pháp & Khí hậu 4 mùa",
    destination: "Bà Nà Hills – Đà Nẵng",
    province: "Đà Nẵng",
    region: "central",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.200.000đ - 4.800.000đ / người",
    bestSeason: "Tháng 3 - Tháng 8 (Nắng đẹp trời xanh, lễ hội mùa hè) & Tháng 9 - Tháng 2 (Săn mây mùa đông se lạnh)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
      caption: "Cây Cầu Vàng nâng đỡ bởi bàn tay khổng lồ giữa biển mây trên đỉnh núi Chúa 1.487m",
      photographer: "Sun World Ba Na Hills",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Làng Pháp kiến trúc Gothic cổ kính lãng mạn tựa góc trời Âu trên đỉnh Bà Nà",
        photographer: "French Village Heritage",
        tags: ["Làng Pháp", "Gothic", "Quảng trường Du Dôme"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Vườn hoa Le Jardin D'Amour muôn sắc hoa rực rỡ và Hầm rượu cổ Debay",
        photographer: "Le Jardin D'Amour View",
        tags: ["Vườn hoa", "Hầm rượu Debay", "Check-in"],
      },
      {
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        caption: "Toàn cảnh cáp treo Bà Nà vượt qua những tầng mây và cánh rừng nguyên sinh bạt ngàn",
        photographer: "Ba Na Cable Car View",
        tags: ["Cáp treo", "Rừng nguyên sinh", "Kỷ lục"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Lâu đài Mặt Trăng nguy nga cổ tích và Quảng trường Nhật Thực tráng lệ",
        photographer: "Moon Castle View",
        tags: ["Lâu đài Mặt Trăng", "Quảng trường Nhật Thực"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch Đà Nẵng – Sun World Ba Na Hills 3N2Đ trọn vẹn: Khám phá biển Mỹ Khê, bán đảo Sơn Trà và xem Cầu Rồng phun lửa, dành trọn 1 ngày trên đỉnh núi Chúa 1.487m check-in Cầu Vàng sớm vắng khách, dạo Làng Pháp châu Âu cổ kính, thưởng thức đại tiệc buffet hơn 90 món và mua sắm đặc sản chợ Hàn.",
    tags: [
      "Bà Nà Hills",
      "Đà Nẵng",
      "Cầu Vàng",
      "Golden Bridge",
      "Làng Pháp",
      "Sun World",
      "Biển Mỹ Khê",
      "Cầu Rồng",
    ],
    sections: {
      packingList: [
        "Trang phục 4 mùa kèm áo khoác mỏng hoặc Cardigan: Thời tiết trên đỉnh Bà Nà luân chuyển 4 mùa trong 1 ngày; buổi chiều muộn nhiệt độ hạ nhanh (15 - 18°C) kèm sương mù se lạnh.",
        "Giày thể thao hoặc giày bệt êm chân: Khu du lịch Bà Nà Hills rất rộng, trung bình đi bộ 8.000 - 12.000 bước mỗi ngày qua các quảng trường, vườn hoa và lâu đài.",
        "Ô (dù) gấp gọn & Sạc dự phòng: Đề phòng mưa rào bất chợt trên núi; nhiệt độ mát lạnh và chụp ảnh liên tục làm điện thoại hao pin nhanh.",
        "Quy định không mang đồ ăn ngoài lên đỉnh: Khu du lịch cấm mang thức ăn đồ uống lên núi để bảo vệ cảnh quan; hãy tận dụng tiệc buffet quốc tế trên đỉnh.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Đón gió biển Mỹ Khê – Bán đảo Sơn Trà – Khám phá Đà Nẵng về đêm",
          places: [
            "Biển Mỹ Khê",
            "Bán đảo Sơn Trà (Chùa Linh Ứng Bãi Bụt)",
            "Cầu Rồng (Xem phun lửa, phun nước cuối tuần)",
            "Cầu Tình Yêu & Tượng Cá Chép Hóa Rồng",
          ],
          note: "09:00 – 12:00: Đến Đà Nẵng, ăn trưa Mì Quảng hoặc Bánh tráng cuốn thịt heo hai đầu da, nhận phòng khách sạn ven biển Mỹ Khê. 15:00 – 17:30: Lên Bán đảo Sơn Trà viếng Chùa Linh Ứng Bãi Bụt ngắm tượng Phật Quan Âm 67m và tắm biển Mỹ Khê. 19:00 – 22:00: Ăn tối hải sản tươi sống, dạo bờ sông Hàn xem Cầu Rồng phun lửa nước lúc 21:00 cuối tuần, check-in Cầu Tình Yêu.",
        },
        {
          day: 2,
          title: "Một ngày lạc bước Tiên cảnh Bà Nà Hills (Trọng tâm)",
          places: [
            "Cổng Sun World Ba Na Hills (Chân núi)",
            "Cầu Vàng (Ga Marseille)",
            "Vườn hoa Le Jardin D'Amour & Hầm rượu Debay",
            "Làng Pháp (French Village) & Quảng trường Du Dôme",
            "Lâu đài Mặt Trăng & Fantasy Park",
          ],
          note: "07:00 – 08:15: Khởi hành sớm từ trung tâm Đà Nẵng đi Bà Nà Hills (25km) để đón chuyến cáp treo đầu tiên. 08:30 – 11:00: Đi cáp lên ga Marseille check-in Cầu Vàng trong nắng sớm khi còn vắng khách, ngắm Vườn hoa Le Jardin D'Amour và Hầm rượu Debay 100 năm. 11:30 – 13:30: Đi tuyến cáp thứ 2 lên đỉnh núi Chúa, ăn đại tiệc Buffet trưa quốc tế hơn 90 món. 13:30 – 16:30: Dạo bước Làng Pháp cổ kính, đi tàu hỏa leo núi sang Lâu đài Mặt Trăng và vui chơi công viên Fantasy Park. 17:00 – 18:00: Lên cáp treo xuống núi ngắm hoàng hôn buông xuống rừng nguyên sinh, về lại thành phố ăn tối.",
        },
        {
          day: 3,
          title: "Ngũ Hành Sơn hoặc Chợ Hàn – Mua sắm đặc sản",
          places: [
            "Danh thắng Ngũ Hành Sơn (Động Huyền Không)",
            "Làng đá mỹ nghệ Non Nước",
            "Chợ Hàn / Chợ Cồn",
          ],
          note: "08:00 – 10:30: Tham quan Ngũ Hành Sơn, leo cổng trời khám phá Động Huyền Không lung linh ánh sáng và Làng đá mỹ nghệ Non Nước. 11:00 – 13:30: Trả phòng khách sạn, ăn trưa Bún chả cá Đà Nẵng hoặc bánh xèo tôm nhảy. 14:00 – 16:00: Dạo Chợ Hàn ăn chè sầu Liên, ốc hút và mua chả bò, mực rim me làm quà trước khi ra sân bay.",
        },
      ],
      foodHighlights: [
        {
          name: "Đại tiệc Buffet quốc tế trên đỉnh Bà Nà",
          desc: "Hơn 90 món ăn Á – Âu phong phú từ BBQ thịt nướng, hải sản, sushi đến quầy bánh ngọt tráng miệng tại nhà hàng Arapang, Taiga hoặc Beer Plaza.",
          priceRange: "350.000đ - 380.000đ / người",
        },
        {
          name: "Xúc xích Đức nướng & Bia tươi thủ công Sun KraftBeer",
          desc: "Xúc xích Đức nướng than hồng giòn sần sật béo ngậy nhâm nhi cùng ly bia tươi ủ men theo công nghệ Bavaria truyền thống ngay giữa quảng trường Beer Plaza.",
          priceRange: "80.000đ - 180.000đ / phần",
        },
        {
          name: "Bánh tráng cuốn thịt heo hai đầu da",
          desc: "Thịt ba chỉ luộc khéo léo giữ lại hai đầu mỡ giòn trong suốt, cuốn bánh tráng Đại Lộc cùng rau rừng phong phú chấm mắm nêm cá cơm nguyên chất cay the.",
          priceRange: "80.000đ - 160.000đ / phần",
        },
        {
          name: "Mì Quảng Đà Nẵng thập cẩm",
          desc: "Sợi mì gạo dày mềm thơm mùi nghệ vàng óng, nước nhưỡng tôm thịt đậm đà, ăn kèm bánh tráng nướng mè giòn rụm và rau búp chuối tươi non.",
          priceRange: "35.000đ - 65.000đ / tô",
        },
        {
          name: "Bún chả cá Đà Nẵng & Chè sầu Liên",
          desc: "Tô bún chả cá thu chiên thơm lừng nước dùng hầm bí đỏ ngọt thanh và bát chè sầu riêng nước cốt dừa béo ngậy làm say lòng mọi du khách.",
          priceRange: "35.000đ - 50.000đ / món",
        },
      ],
      budgetTips: [
        "Mua Combo Vé Cáp treo + Buffet trưa trực tuyến trước 1 ngày: Tiết kiệm từ 50k - 100k/người so với mua lẻ từng dịch vụ tại quầy, đồng thời quét mã QR vào thẳng cổng cáp treo không phải xếp hàng chờ đợi.",
        "Săn gói ưu đãi Ba Na By Night nếu chỉ đi buổi chiều tối: Sau 15:00 chiều có gói combo gồm xe đưa đón từ Đà Nẵng + Cáp treo + Buffet tối và bia tươi với mức giá ưu đãi mềm hơn nhiều.",
        "Không mua sẵn đồ ăn vặt mang lên núi: Khu du lịch kiểm tra balo tại cổng cáp treo và yêu cầu để lại đồ ăn ở tủ gửi đồ chân núi; hãy tập trung ăn bữa trưa buffet không giới hạn trên đỉnh.",
        "Đi xe buýt đưa đón (Shuttle Bus) thay vì taxi riêng: Tuyến xe buýt khứ hồi Đà Nẵng – Bà Nà chỉ 130k - 160k/người khứ hồi; tiết kiệm hơn 400.000 VNĐ so với thuê taxi riêng.",
      ],
    },
  },
  {
    id: "guide-tam-dao",
    slug: "cam-nang-du-lich-tam-dao-vinh-phuc-3n2d",
    title: "Cẩm nang du lịch Tam Đảo 3N2Đ: Trốn nóng thị trấn sương mây & Săn hoàng hôn Cổng Trời",
    destination: "Thị trấn Tam Đảo",
    province: "Vĩnh Phúc",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "1.300.000đ - 3.300.000đ / người",
    bestSeason: "Tháng 5 – Tháng 8 (Tránh nóng mát mẻ 20-26°C) & Tháng 10 – Tháng 2 (Săn mây bồng bềnh se lạnh 8-16°C)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      caption: "Thị trấn Tam Đảo huyền ảo bồng bềnh trong biển mây trắng muốt ôm trọn các triền núi",
      photographer: "Tam Dao Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Nhà thờ Đá Tam Đảo cổ kính rêu phong phong cách Gothic từ thời Pháp thuộc",
        photographer: "Stone Church Heritage",
        tags: ["Nhà thờ Đá", "Kiến trúc Gothic", "Check-in"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Săn mây hoàng hôn từ Quán Gió Tam Đảo ngắm nhìn toàn cảnh Lâu đài trên đỉnh núi",
        photographer: "Wind Cafe Sunset",
        tags: ["Quán Gió", "Cổng Trời", "Săn mây", "Lâu đài Tam Đảo"],
      },
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Thác Bạc dòng nước mát lạnh ẩn mình dưới thung lũng sâu giữa rừng nguyên sinh",
        photographer: "Silver Waterfall Trek",
        tags: ["Thác Bạc", "Trekking", "Thung lũng"],
      },
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Đoạn đường bậc đá xuyên qua rừng trúc xanh ngắt dẫn lên Đền Bà Chúa Thượng Ngàn",
        photographer: "Bamboo Forest Trail",
        tags: ["Đền Bà Chúa Thượng Ngàn", "Rừng trúc", "Tâm linh"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch Tam Đảo 3N2Đ: Tận hưởng khí hậu 4 mùa trong 1 ngày ở độ cao gần 1.000m, săn biển mây bồng bềnh tại Cổng Trời và Quán Gió, dạo bước qua Nhà thờ Đá cổ kính hơn trăm năm tuổi, chinh phục Thác Bạc, viếng Đền Bà Chúa Thượng Ngàn xuyên qua rừng trúc thơ mộng và thưởng thức đặc sản ngọn su su giòn ngọt cùng tiệc đồ nướng chợ đêm sương mù.",
    tags: [
      "Tam Đảo",
      "Vĩnh Phúc",
      "Săn mây",
      "Nhà thờ Đá",
      "Thác Bạc",
      "Cổng Trời",
      "Ngọn su su",
      "Nghỉ dưỡng cuối tuần",
    ],
    sections: {
      packingList: [
        "Áo khoác gió hoặc áo ấm mỏng ngay cả mùa hè: Nhiệt độ ban đêm tại Tam Đảo luôn hạ xuống 18°C – 20°C kèm gió lộng; nếu đi mùa đông cần chuẩn bị áo phao, găng tay và khăn ấm vì nhiệt độ có thể xuống 8°C – 12°C.",
        "Giày thể thao có độ bám tốt chống trơn trượt: Đường xuống Thác Bạc và bậc đá lên Đền Bà Chúa Thượng Ngàn (hoặc Tháp truyền hình) có nhiều đoạn ẩm ướt và rêu phong trơn trượt.",
        "Thuốc chống say xe & Miếng dán say xe: Cung đèo Tam Đảo dài 13km dốc đứng và có nhiều khúc cua tay áo gấp; nếu dễ say xe hãy uống thuốc trước 30 phút.",
        "Ô (dù) gấp gọn và áo mưa nhẹ: Thời tiết trên núi cao hay có sương mù dày, sương muối hoặc những cơn mưa rào bất chợt.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Hà Nội – Vượt đèo Tam Đảo – Nhà thờ Đá – Chợ đêm sương mù",
          places: [
            "Cung đèo Tam Đảo 13km",
            "Nhà thờ Đá Tam Đảo",
            "Cổng Trời & Quán Gió Tam Đảo",
            "Chợ đêm Tam Đảo",
          ],
          note: "08:00 – 10:30: Khởi hành từ Hà Nội đi Tam Đảo (80km). Chinh phục cung đèo Tam Đảo dài 13km uốn lượn giữa rừng thông. 11:00 – 14:00: Dùng bữa trưa tại thị trấn với gà đồi bọc đất và ngọn su su xào tỏi, nhận phòng homestay/khách sạn nghỉ ngơi. 15:00 – 17:30: Dạo bộ check-in Nhà thờ Đá cổ kính (xây từ 1906), ghé Cổng Trời và ngắm hoàng hôn tại Quán Gió view Lâu đài Tam Đảo. 19:00 – 22:00: Ăn tối với lẩu gà/cá tầm, dạo Quảng trường Trung tâm và thưởng thức xiên nướng, hạt dẻ nóng tại Chợ đêm trong sương mù. (Lưu ý: Không đi xe tay ga lên hoặc xuống đèo vì rất dễ mất phanh cháy phanh; đi xe số/côn tay và về số 1, 2 khi đổ đèo).",
        },
        {
          day: 2,
          title: "Săn mây sớm – Thác Bạc – Đền Bà Chúa Thượng Ngàn – Cầu Mây Studio",
          places: [
            "Quán cà phê săn mây (Cỏ Lạ / Morin)",
            "Đền Bà Chúa Thượng Ngàn & Rừng trúc",
            "Thác Bạc Tam Đảo",
            "Khu du lịch Cầu Mây Studio",
          ],
          note: "05:30 – 08:00: Dậy sớm săn biển mây bồng bềnh và đón bình minh tại các quán cà phê view thung lũng (Cỏ Lạ, Morin hoặc Tiệm Cà Phê Của Gió), ăn sáng bánh cuốn Tam Đảo. 08:30 – 10:30: Leo gần 200 bậc đá xuyên qua rừng trúc xanh mát viếng Đền Bà Chúa Thượng Ngàn. 10:30 – 12:00: Chinh phục Thác Bạc ẩn mình dưới thung lũng sâu (khoảng 400 bậc đá dốc đứng). 12:00 – 14:30: Ăn trưa lợn mán đủ món và nghỉ ngơi. 15:00 – 17:30: Tham quan chụp ảnh tại Cầu Mây Studio hoặc vườn hoa dã quỳ ngập tràn sắc hoa. 19:00: Tiệc nướng BBQ ngoài trời giữa tiết trời se lạnh sương mây về đêm.",
        },
        {
          day: 3,
          title: "Chợ su su địa phương – Thiền viện Trúc Lâm Tây Thiên / Hồ Xạ Hương – Hà Nội",
          places: [
            "Chợ địa phương Tam Đảo",
            "Thiền viện Trúc Lâm Tây Thiên / Cáp treo Tây Thiên",
            "Hồ Xạ Hương",
          ],
          note: "08:00 – 09:30: Ăn sáng, ghé chợ địa phương mua ngọn su su vừa hái sớm tinh sương, măng rừng và sâm sữa về làm quà. 10:00 – 13:30: Trả phòng, xuống chân núi vãn cảnh Hồ Xạ Hương thơ mộng hoặc đi cáp treo chiêm bái Thiền viện Trúc Lâm Tây Thiên (một trong 3 thiền viện lớn nhất Việt Nam). 14:30: Lên xe Limousine hoặc ô tô khởi hành về lại Hà Nội, kết thúc chuyến đi tuyệt vời.",
        },
      ],
      foodHighlights: [
        {
          name: "Ngọn su su Tam Đảo (xào tỏi / luộc chấm muối vừng)",
          desc: "Đặc sản số 1 của xứ sở sương mù; ngọn su su non được hái vào sáng sớm sương đọng, xào tỏi thơm nức, ăn giòn sần sật và ngọt mát thanh tao.",
          priceRange: "40.000đ - 90.000đ / đĩa (bó tươi: 15.000đ - 25.000đ)",
        },
        {
          name: "Gà đồi Tam Đảo bọc đất nướng & Lẩu gà nấm",
          desc: "Gà nuôi thả tự nhiên trên sườn núi dốc nên thịt cực kỳ săn chắc, da giòn vàng óng, bọc đất sét nướng than củi hoặc nướng mật ong chấm muối tiêu chanh ớt hiểm.",
          priceRange: "280.000đ - 380.000đ / con",
        },
        {
          name: "Bò tái kiến đốt",
          desc: "Miếng thịt bò tươi treo ngay trên cây rừng cho các loại kiến đốt ngấm vị cay the, sau đó nướng trên than hồng; chấm cùng nước tương gừng đậm đà độc nhất vô nhị.",
          priceRange: "200.000đ - 300.000đ / đĩa",
        },
        {
          name: "Lợn mán (lợn cắp nách) đủ món",
          desc: "Thịt lợn cắp nách nuôi tự nhiên của đồng bào vùng cao chế biến đủ món nướng riềng mẻ, hấp xả, xào lăn hoặc nấu rựa mận thơm lừng bì giòn sần sật.",
          priceRange: "150.000đ - 250.000đ / đĩa",
        },
        {
          name: "Lẩu cá tầm & Đồ nướng chợ đêm trong sương",
          desc: "Ngồi quây quần bên nồi lẩu cá tầm măng chua bốc khói nghi ngút và những xiên thịt nướng, hạt dẻ nướng thơm lừng giữa làn sương se lạnh 15°C về đêm.",
          priceRange: "15.000đ - 35.000đ / xiên; 450.000đ - 700.000đ / nồi lẩu",
        },
      ],
      budgetTips: [
        "Đi vào ngày thường (Chủ nhật – Thứ Năm): Giá phòng khách sạn và homestay tại Tam Đảo vào ngày thường rẻ hơn 30% – 50% so với tối Thứ Sáu và Thứ Bảy, đồng thời tránh tắc đường trên đèo.",
        "Phương tiện tiết kiệm từ Hà Nội: Đi xe buýt tuyến 58 + buýt 07 Vĩnh Phúc lên chân núi, hoặc đặt Limousine đưa đón tận nơi chỉ 250.000 – 300.000 VNĐ/người/khứ hồi.",
        "Hỏi giá trước ở chợ đêm: Khu vực chợ đêm và hàng nướng rất đông khách, nên hỏi giá từng xiên nướng hoặc cân lượng gà/cá tầm trước khi nướng để kiểm soát chi phí.",
        "Cảnh báo tuyệt đối không đi xe tay ga đổ đèo: Đèo dốc 10% liên tục khiến phanh xe ga quá nhiệt dẫn đến mất phanh nguy hiểm; hãy đi xe số hoặc thuê xe ô tô đưa đón.",
      ],
    },
  },
  {
    id: "guide-ba-vi",
    slug: "cam-nang-du-lich-vuon-quoc-gia-ba-vi-3n2d",
    title: "Cẩm nang du lịch Vườn Quốc gia Ba Vì 3N2Đ: Trekking 3 đỉnh non thiêng, Cắm trại rừng thông & Săn hoa dã quỳ",
    destination: "Vườn Quốc gia Ba Vì",
    province: "Hà Nội",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "700.000đ - 2.800.000đ / người",
    bestSeason: "Tháng 10 – Tháng 12 (Mùa hoa dã quỳ vàng rực rỡ & săn mây Cốt 1100 se lạnh 15-22°C) hoặc Tháng 4 – Tháng 8 (Mùa hè tránh nóng rừng thông mát mẻ)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
      caption: "Rừng thông bạt ngàn tại Cốt 400 Vườn Quốc gia Ba Vì trong làn sương sớm trong lành",
      photographer: "Ba Vi Eco Trail",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Nhà kính Xương rồng quy tụ hơn 1.200 giống loài xương rồng độc đáo nhất Việt Nam",
        photographer: "Cactus Garden Ba Vi",
        tags: ["Nhà kính Xương rồng", "Cốt 400", "Check-in"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Phế tích Nhà thờ Cổ Pháp phủ đầy rêu phong ma mị huyền bí giữa rừng già Cốt 800",
        photographer: "French Heritage Ruins",
        tags: ["Nhà thờ Cổ", "Cốt 800", "Phế tích Pháp"],
      },
      {
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        caption: "Mùa hoa Dã Quỳ nở vàng rực rỡ khắp hai bên cung đường đèo từ Cốt 400 lên Cốt 1100",
        photographer: "Wild Sunflower Season",
        tags: ["Hoa Dã Quỳ", "Săn mây", "Mùa thu Ba Vì"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Đền Thượng linh thiêng trên đỉnh Tản Viên 1.227m sừng sững giữa biển mây trời bao la",
        photographer: "Tan Vien Mountain Top",
        tags: ["Đền Thượng", "Đỉnh Tản Viên", "Đức Thánh Tản", "Tâm linh"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch VQG Ba Vì 3N2Đ tự túc: Cắm trại picnic dưới tán rừng thông Cốt 400 mát mẻ, khám phá Nhà kính Xương rồng và phế tích Nhà thờ Cổ Pháp rêu phong ma mị, săn mây ngắm rừng hoa dã quỳ vàng rực rỡ, chinh phục gần 2.000 bậc đá lên Đỉnh Vua (Đền Bác Hồ 1.296m) và Đỉnh Tản Viên (Đền Thượng 1.227m), thưởng thức bê non, gà đồi và đặc sản sữa tươi Ba Vì nức tiếng.",
    tags: [
      "Ba Vì",
      "Hà Nội",
      "Hoa Dã Quỳ",
      "Rừng thông Cốt 400",
      "Đền Thượng",
      "Nhà thờ Cổ",
      "Cắm trại",
      "Săn mây",
    ],
    sections: {
      packingList: [
        "Giày thể thao đế chống trượt bám dốc: Leo tổng cộng gần 2.000 bậc đá lên Đỉnh Vua và Đỉnh Tản Viên dưới tán rừng nguyên sinh ẩm ướt rêu phong.",
        "Áo khoác gió nhẹ: Đỉnh Cốt 1100 và các đỉnh núi gió lùa mạnh se lạnh quanh năm, chênh lệch 6-10°C so với trung tâm Hà Nội.",
        "Thuốc xịt côn trùng, vắt rừng & bông băng cá nhân: Cần thiết khi đi bộ vào các lối mòn rừng rậm ẩm ướt vào mùa mưa.",
        "Thảm bạt picnic và túi gom rác: Phục vụ trải bạt cắm trại BBQ tại đồi thông Cốt 400 và giữ gìn vệ sinh môi trường Vườn Quốc gia.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Hà Nội – Rừng thông Cốt 400 – Nhà kính Xương rồng – Cắm trại/Nghỉ dưỡng",
          places: [
            "Đại lộ Thăng Long",
            "Cổng VQG Ba Vì",
            "Đồi thông Cốt 400",
            "Nhà kính Xương rồng",
            "Nhà thờ Cổ Pháp Cốt 800",
          ],
          note: "07:30 – 09:00: Khởi hành từ trung tâm Hà Nội theo Đại lộ Thăng Long đi Vườn Quốc gia Ba Vì (60km). 09:30 – 12:00: Qua cổng soát vé, dừng chân tại Cốt 400 check-in Nhà kính Xương rồng quy tụ hơn 1.200 giống xương rồng và dạo bước đồi thông. 12:00 – 14:30: Tổ chức tiệc nướng BBQ picnic dưới tán thông hoặc ăn trưa tại nhà hàng, nhận lều trại/phòng homestay. 15:30 – 17:30: Trekking nhẹ xuyên rừng khám phá phế tích Nhà thờ Cổ Pháp rêu phong ma mị ở Cốt 800. 19:00 – 21:30: Ăn tối gà đồi Ba Vì nướng than hoa, bê non nướng tảng và đốt lửa trại giữa không khí se lạnh rừng thông. (Lưu ý: Xe ga chỉ nên đi đến Cốt 400; từ Cốt 400 lên Cốt 1100 dốc gắt nên gửi xe ga đi xe số hoặc thuê xe trung chuyển).",
        },
        {
          day: 2,
          title: "Săn mây Cốt 1100 – Chinh phục Đỉnh Vua & Đỉnh Tản Viên – Nghỉ dưỡng suối khoáng",
          places: [
            "Bãi đỗ xe Cốt 1100",
            "Cung đường hoa dã quỳ",
            "Đỉnh Tản Viên (Đền Thượng 1.227m)",
            "Đỉnh Vua (Đền thờ Bác Hồ 1.296m)",
            "Khoáng nóng Thuần Mỹ / Vân Hòa",
          ],
          note: "06:00 – 08:00: Di chuyển sớm lên Cốt 1100 đón bình minh, săn biển mây cuồn cuộn bao quanh sườn núi và check-in cung đường hoa dã quỳ (dịp tháng 10-11). 08:00 – 10:00: Từ Cốt 1100 leo bộ khoảng 500 bậc đá xuyên rừng già lên Đỉnh Tản Viên (1.227m) dâng hương Đền Thượng thờ Đức Thánh Tản Viên và Đền Mẫu. 10:00 – 12:00: Tiếp tục chinh phục gần 1.300 bậc đá lên Đỉnh Vua (1.296m) viếng Đền thờ Bác Hồ và ngắm toàn cảnh sông Đà từ Vọng Cảnh Đài. 12:30 – 14:30: Ăn trưa tại Cốt 1100 hoặc Cốt 400 với cơm lam trứng nướng. 15:00 – 18:00: Xuống chân núi về homestay/resort ven suối tại Vân Hòa hoặc ngâm mình thư giãn tại suối khoáng nóng Thuần Mỹ xua tan mỏi mệt.",
        },
        {
          day: 3,
          title: "Khu sinh thái Ao Vua / Khoang Xanh – Mua đặc sản sữa Ba Vì – Hà Nội",
          places: [
            "Khu du lịch sinh thái Ao Vua / Thiên Sơn Suối Ngà",
            "Làng văn hóa các dân tộc Việt Nam",
            "Trang trại sữa Ba Vì",
          ],
          note: "08:00 – 11:00: Ăn sáng, tham quan một trong các khu du lịch sinh thái chân núi như Thiên Sơn – Suối Ngà, Ao Vua hoặc Làng văn hóa du lịch các dân tộc Việt Nam (Đồng Mô). 11:30 – 13:30: Ăn trưa thưởng thức cá lăng sông Đà nướng riềng mẻ và canh chua ngạnh, làm thủ tục trả phòng. 14:00 – 16:00: Dừng chân tại các điểm dừng chân trên đường Láng – Hòa Lạc mua sữa tươi Ba Vì, sữa chua nếp cẩm, bánh sữa và bánh tẻ Phú Nhi làm quà trước khi về Hà Nội.",
        },
      ],
      foodHighlights: [
        {
          name: "Gà đồi Ba Vì nướng mật ong & Lẩu gà lá ngải",
          desc: "Gà thả đồi tự nhiên thịt săn chắc, da vàng giòn rụm, nướng than hoa mật ong thơm lừng chấm muối tiêu chanh ớt hoặc nhúng lẩu ngải cứu thanh mát.",
          priceRange: "280.000đ - 350.000đ / con",
        },
        {
          name: "Thịt bê non Ba Vì tái chanh & nướng tảng",
          desc: "Bê non nuôi thả trên các đồng cỏ Ba Vì thịt mềm ngọt tự nhiên, tái chanh bóp vừng bùi béo hoặc nướng tảng cuốn rau rừng chấm tương bần gừng.",
          priceRange: "150.000đ - 220.000đ / đĩa",
        },
        {
          name: "Lợn mán nướng mắc khén & xào lăn",
          desc: "Thịt lợn rừng lai thả dốc núi bì giòn sần sật, mỡ thơm không ngấy, tẩm ướp hạt dổi mắc khén nướng than hoa thơm nức mũi.",
          priceRange: "160.000đ - 250.000đ / đĩa",
        },
        {
          name: "Cá lăng sông Đà nướng & Canh chua cá ngạnh",
          desc: "Cá sông Đà tươi sống thịt dày trắng ngần, nướng riềng mẻ vàng ruộm hoặc nấu canh chua măng rừng ăn kèm bún tươi giải nhiệt.",
          priceRange: "350.000đ - 600.000đ / nồi",
        },
        {
          name: "Sữa tươi, Sữa chua nếp cẩm & Bánh sữa Ba Vì",
          desc: "Đặc sản trứ danh xứ Đoài từ nguồn sữa bò tươi nguyên chất, sữa chua nếp cẩm dẻo bùi béo ngậy và bánh sữa thơm ngon làm quà.",
          priceRange: "25.000đ - 60.000đ / hộp",
        },
      ],
      budgetTips: [
        "Mang theo thẻ Học sinh / Sinh viên: Giảm giá vé vào cổng từ 50% - 65% (chỉ còn 20.000đ - 30.000đ/người) khi xuất trình thẻ hợp lệ tại quầy vé.",
        "Tự chuẩn bị đồ nướng picnic tại Cốt 400: Chuẩn bị đồ ướp sẵn và thuê bạt + bếp than tại Cốt 400 (chỉ 150k - 300k cho cả nhóm), tiết kiệm hơn nhiều so với ăn nhà hàng.",
        "Đi sớm trước 07:30 vào mùa Hoa Dã Quỳ (tháng 11): Tránh tắc đường nghẽn đèo tại cổng soát vé và đường lên Cốt 1100 vào các ngày cuối tuần, đón trọn ánh nắng sớm và sương mây.",
        "Cảnh báo an toàn phanh xe máy: Đoạn đường 8km từ Cốt 400 lên Cốt 1100 dốc đứng và cua tay áo gắt; không đi xe tay ga để tránh nguy cơ cháy phanh khi đổ dốc.",
      ],
    },
  },
  {
    id: "guide-ham-lon",
    slug: "cam-nang-du-lich-nui-ham-lon-soc-son-3n2d",
    title: "Cẩm nang du lịch Núi Hàm Lợn 3N2Đ: Chinh phục nóc nhà Thủ đô & Cắm trại Hồ Núi Bàu – Hồ Đồng Đò",
    destination: "Núi Hàm Lợn",
    province: "Hà Nội",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "450.000đ - 2.500.000đ / người",
    bestSeason: "Tháng 9 – Tháng 4 năm sau (Mùa Thu – Đông – Xuân mát mẻ 15-24°C, ít mưa leo núi & đốt lửa trại) hoặc Tháng 5 – Tháng 8 (Cắm trại rừng thông & chèo SUP)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
      caption: "Cắm trại dã ngoại ngắm hoàng hôn bên bờ Hồ Núi Bàu dưới chân núi Hàm Lợn",
      photographer: "Ham Lon Camping Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
        caption: "Cột mốc Đỉnh Núi Hàm Lợn 462m - điểm check-in chinh phục Nóc nhà Thủ đô",
        photographer: "Peak 462m Explorer",
        tags: ["Đỉnh Hàm Lợn", "Trekking", "Cột mốc 462m"],
      },
      {
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        caption: "Mặt hồ trong xanh phẳng lặng tuyệt đẹp tại Hồ Đồng Đò - địa điểm chèo SUP lý tưởng",
        photographer: "Dong Do SUP Adventure",
        tags: ["Hồ Đồng Đò", "Chèo SUP", "Kayak"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Không gian kiến trúc cổ truyền thuần khiết và tinh tế tại Việt Phủ Thành Chương",
        photographer: "Viet Phu Thanh Chuong Heritage",
        tags: ["Việt Phủ Thành Chương", "Kiến trúc cổ", "Văn hóa"],
      },
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Quần thể Đền Gióng Sóc Sơn uy nghiêm linh thiêng giữa bạt ngàn thông reo",
        photographer: "Soc Son Sacred Shrine",
        tags: ["Đền Gióng", "Chùa Non Nước", "Tâm linh"],
      },
    ],
    summary:
      "Kinh nghiệm phượt cắm trại & trekking Núi Hàm Lợn 3N2Đ: Dựng lều bên bờ Hồ Núi Bàu thơ mộng dưới tán thông xanh, nướng BBQ và đốt lửa trại qua đêm, chinh phục cột mốc Nóc nhà Thủ đô 462m qua cung đường suối đá rêu phong kỳ thú, chèo SUP tại Hồ Đồng Đò và vãn cảnh văn hóa Việt Phủ Thành Chương – Đền Gióng Sóc Sơn.",
    tags: [
      "Hàm Lợn",
      "Sóc Sơn",
      "Hà Nội",
      "Cắm trại",
      "Hồ Núi Bàu",
      "Hồ Đồng Đò",
      "Trekking đường suối",
      "Chèo SUP",
    ],
    sections: {
      packingList: [
        "Giày leo núi hoặc thể thao có rãnh đế sâu bám đá: Cung đường suối có nhiều tảng đá rêu phong trơn trượt; tuyệt đối không đi giày đế bệt trơn.",
        "Găng tay bảo hộ có hạt nhựa chống trượt: Cực kỳ cần thiết để bám vào đá và cành cây rừng khi vượt các vách dốc cung đường suối.",
        "Áo khoác gió & Túi ngủ/chăn mỏng: Ban đêm cạnh mặt hồ và dưới tán rừng thông nhiệt độ hạ thấp kèm sương ẩm.",
        "Đèn pin đeo đầu & Thuốc xịt muỗi/côn trùng: Phục vụ sinh hoạt ban đêm tại khu cắm trại Hồ Núi Bàu và phòng chống muỗi vắt.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Hà Nội – Rừng thông Hồ Núi Bàu – Cắm trại & Lửa trại đêm",
          places: [
            "Cầu Nhật Tân – Võ Nguyên Giáp",
            "Hồ Núi Bàu (Hồ Hàm Lợn)",
            "Rừng thông ven hồ",
            "Bãi cắm trại dã ngoại",
          ],
          note: "08:30 – 10:00: Khởi hành từ trung tâm Hà Nội theo hướng cầu Nhật Tân – QL35 đến chân núi Hàm Lợn (40km). 10:00 – 12:00: Đến Hồ Núi Bàu, chọn bãi bằng phẳng dưới tán thông ven hồ dựng lều trại, chuẩn bị bếp nướng. 12:00 – 14:30: Thưởng thức bữa trưa dã ngoại, nghỉ ngơi trên võng mắc giữa gốc thông già. 15:00 – 17:30: Dạo bộ ven hồ chụp ảnh, chèo SUP/Kayak hoặc câu cá thư giãn ngắm hoàng hôn. 18:30 – 22:00: Nướng gà đồi, thịt xiên BBQ, đốt lửa trại và ngắm bầu trời sao bên hồ. (Lưu ý: Ngay chân núi có nhiều dịch vụ cho thuê trọn gói lều bạt, túi ngủ, củi đốt và than hoa rất tiện lợi).",
        },
        {
          day: 2,
          title: "Chinh phục đỉnh Hàm Lợn (462m) – Thư giãn tại Hồ Đồng Đò",
          places: [
            "Đỉnh Núi Hàm Lợn (Cột mốc 462m)",
            "Cung đường suối / Cung đường mòn",
            "Đập Hồ Đồng Đò",
            "Khu Homestay / Villa ven hồ",
          ],
          note: "06:00 – 07:30: Dậy sớm đón sương mù trên mặt hồ, pha cà phê nóng và ăn sáng nhẹ nạp năng lượng. 07:30 – 11:00: Bắt đầu trekking chinh phục Đỉnh Hàm Lợn 462m. Người mới có thể chọn cung đường mòn (2h); dân ưa mạo hiểm có thể chọn cung đường suối vượt vách đá (3 - 3,5h). 11:00 – 12:00: Check-in cột mốc Đỉnh Hàm Lợn, ngắm toàn cảnh đồi núi Sóc Sơn rồi xuống núi theo đường mòn. 12:30 – 14:30: Dọn lều trại, ăn trưa và di chuyển sang khu vực Hồ Đồng Đò nhận phòng homestay/villa nghỉ ngơi. 16:00 – 18:00: Đạp xe quanh đập Hồ Đồng Đò hoặc chèo SUP ngắm hoàng hôn trên hồ.",
        },
        {
          day: 3,
          title: "Việt Phủ Thành Chương – Đền Gióng Sóc Sơn – Về lại Hà Nội",
          places: [
            "Việt Phủ Thành Chương",
            "Quần thể Đền Gióng Sóc Sơn",
            "Chùa Non Nước",
          ],
          note: "08:00 – 10:30: Ăn sáng tại homestay, ghé thăm Việt Phủ Thành Chương chiêm ngưỡng không gian kiến trúc cổ truyền Bắc Bộ và các tác phẩm nghệ thuật độc bản. 10:30 – 12:00: Chiêm bái Khu di tích Đền Gióng Sóc Sơn và viếng tượng Phật Tổ bằng đồng nguyên khối tại Chùa Non Nước. 12:00 – 14:00: Thưởng thức bữa trưa với đặc sản gà đồi Sóc Sơn rang muối hoặc nướng mật ong, làm thủ tục trả phòng. 14:30 – 16:00: Lên xe khởi hành về lại trung tâm Hà Nội, kết thúc chuyến phượt cuối tuần trọn vẹn.",
        },
      ],
      foodHighlights: [
        {
          name: "Gà đồi Sóc Sơn nướng than hoa mật ong",
          desc: "Gà nuôi thả tự nhiên trên sườn đồi sim thịt săn chắc, tẩm mật ong rừng nướng nguyên con trên than hồng giòn rụm chấm muối tiêu chanh ớt.",
          priceRange: "250.000đ - 330.000đ / con",
        },
        {
          name: "Combo tiệc nướng BBQ cắm trại ven hồ",
          desc: "Thịt ba chỉ ướp sốt, bò cuộn nấm kim châm, sườn sụn, xúc xích, ngô và khoai lang nướng xèo xèo ấm cúng bên ánh lửa trại Hồ Núi Bàu.",
          priceRange: "120.000đ - 200.000đ / người",
        },
        {
          name: "Cá hồ nướng trui & Lẩu cá chép giòn",
          desc: "Cá tươi đánh bắt từ hồ nước ngọt thịt thơm ngọt đậm đà, nướng trui cuốn bánh tráng rau rừng hoặc nhúng lẩu riêu cua thanh mát.",
          priceRange: "300.000đ - 500.000đ / nồi",
        },
        {
          name: "Lợn mán Sóc Sơn đủ món",
          desc: "Thịt lợn cắp nách nuôi tự nhiên bì dày giòn sần sật, chế biến nướng riềng mẻ, hấp xả ớt hoặc xào lăn thơm phức mùi thảo mộc.",
          priceRange: "150.000đ - 220.000đ / đĩa",
        },
        {
          name: "Bánh đúc sốt xanh Phù Linh & Dứa đồi Sóc Sơn",
          desc: "Món quà quê dân dã truyền thống màu xanh ngọc bích nấu từ nước vôi trong và rau ngót sánh mịn, ăn kèm dứa đồi ngọt sắc làm quà.",
          priceRange: "15.000đ - 25.000đ / bát; 20.000đ - 40.000đ / quả",
        },
      ],
      budgetTips: [
        "Thuê đồ cắm trại chân núi thay vì mua mới: Ngay đầu lối vào chân núi có dịch vụ cho thuê lều 4-6 người chỉ 100k - 150k/đêm, bếp nướng 50k; đi theo nhóm chia sẻ chi phí rất rẻ.",
        "Tự ướp sẵn thực phẩm từ Hà Nội: Mua thịt, rau củ và bảo quản thùng đá mang lên núi tiết kiệm 30% - 40% chi phí và đúng khẩu vị mong muốn.",
        "Chọn cung đường mòn nếu không có porter: Đường mòn lối đi rõ ràng rất dễ tự leo; riêng đường suối nhiều vách đá trơn nên đi cùng người có kinh nghiệm.",
        "Giữ gìn vệ sinh và an toàn lửa trại: Dập tắt hoàn toàn tàn tro than hoa trước khi ngủ và gom rác vào túi đem xuống chân núi bảo vệ rừng thông.",
      ],
    },
  },
  {
    id: "guide-sam-son",
    slug: "cam-nang-du-lich-sam-son-thanh-hoa-3n2d",
    title: "Cẩm nang du lịch Sầm Sơn 3N2Đ: Tắm biển sóng khỏe, Xem nhạc nước & Khám phá núi Trường Lệ",
    destination: "Bãi biển Sầm Sơn",
    province: "Thanh Hóa",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "1.600.000đ - 3.800.000đ / người",
    bestSeason: "Tháng 4 – Tháng 8 (Mùa hè tắm biển, công viên nước & lễ hội nhạc nước rực rỡ) hoặc Tháng 9 – Tháng 10 (Mùa thu nghỉ dưỡng yên bình)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      caption: "Bãi biển Sầm Sơn sóng biển dồi dào ôm trọn bờ cát vàng mịn màng",
      photographer: "Sam Son Beach Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        caption: "Quảng trường Biển Sầm Sơn lung linh rực rỡ với các màn trình diễn nhạc nước nghệ thuật",
        photographer: "Sea Square Festival",
        tags: ["Quảng Trường Biển", "Nhạc nước", "Phố đi bộ"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Cụm danh thắng Hòn Trống Mái và Đền Độc Cước linh thiêng trên dãy núi Trường Lệ",
        photographer: "Truong Le Scenic Rocks",
        tags: ["Hòn Trống Mái", "Đền Độc Cước", "Tâm linh"],
      },
      {
        url: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
        caption: "Tổ hợp công viên nước Sun World Sầm Sơn với đường trượt nước hiện đại bậc nhất",
        photographer: "Sun World Sam Son",
        tags: ["Sun World Sầm Sơn", "Công viên nước", "Vui chơi"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Không gian nghỉ dưỡng sang trọng đẳng cấp tại quần thể FLC Sầm Sơn",
        photographer: "FLC Luxury Resort",
        tags: ["FLC Sầm Sơn", "Resort", "Nghỉ dưỡng 5 sao"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch biển Sầm Sơn 3N2Đ trọn vẹn: Tận hưởng những con sóng biển khỏe khoắn tại Bãi A - B - C, chiêm ngưỡng show nhạc nước hoành tráng tại Quảng Trường Biển, khám phá huyền tích Hòn Trống Mái – Đền Độc Cước trên núi Trường Lệ, bùng nổ tại công viên nước Sun World Sầm Sơn và thưởng thức hải sản tươi sống cùng đặc sản nem chua xứ Thanh.",
    tags: [
      "Sầm Sơn",
      "Thanh Hóa",
      "Tắm biển",
      "Quảng Trường Biển",
      "Hòn Trống Mái",
      "Sun World Sầm Sơn",
      "Hải sản tươi sống",
      "Nem chua",
    ],
    sections: {
      packingList: [
        "Đồ bơi & Kính bơi: Chuẩn bị 2-3 bộ đồ bơi đi biển cả sáng và chiều kèm kính bơi chơi tại công viên nước.",
        "Kem chống nắng chống nước SPF 50+ & Mũ rộng vành: Nắng biển mùa hè miền Trung khá gắt, cần thoa lại kem sau mỗi 2 giờ tắm biển.",
        "Trang phục kín đáo lịch sự: Để viếng các điểm tâm linh linh thiêng Đền Độc Cước và Đền Cô Tiên trên núi Trường Lệ.",
        "Túi chống nước điện thoại & Dép xỏ ngón: Rất cần thiết khi vui chơi tại công viên nước Sun World và đi dạo trên bờ cát.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Hà Nội – Tắm biển Sầm Sơn – Dạo phố đêm Quảng Trường Biển",
          places: [
            "Cao tốc Hà Nội – Thanh Hóa",
            "Bãi biển Sầm Sơn (Bãi A – B – C)",
            "Đường ven biển Hồ Xuân Hương",
            "Quảng Trường Biển Thành Phố Sầm Sơn",
          ],
          note: "07:30 – 10:00: Khởi hành từ Hà Nội theo cao tốc Pháp Vân – Mai Sơn – QL45 đi Sầm Sơn (chỉ mất 2,5 giờ). 11:00 – 14:00: Ăn trưa hải sản tươi sống, nhận phòng khách sạn nghỉ ngơi. 15:30 – 18:00: Tắm biển Sầm Sơn đắm mình trong làn sóng khỏe sảng khoái (Bãi A, B nhộn nhịp; Bãi C, D thoải và thoáng mát). 19:00 – 22:00: Ăn tối lẩu hải sản, đi xe điện dạo phố tới Quảng Trường Biển thưởng thức trình diễn nhạc nước nghệ thuật miễn phí và khám phá chợ đêm sôi động. (Lưu ý: Nội khu Sầm Sơn xe điện chạy 24/7 có niêm yết giá theo chặng rất tiện lợi).",
        },
        {
          day: 2,
          title: "Danh thắng núi Trường Lệ – Bùng nổ tại Công Viên Sun World Sầm Sơn",
          places: [
            "Đón bình minh kéo lưới rùng",
            "Đền Độc Cước",
            "Hòn Trống Mái (Sầm Sơn)",
            "Đền Cô Tiên",
            "Công Viên Sun World Sầm Sơn",
          ],
          note: "05:00 – 06:30: Dậy sớm ngắm bình minh trên biển, xem ngư dân kéo lưới rùng sát bờ và mua hải sản tươi rói vừa đánh bắt. 07:30 – 11:00: Đi xe điện khám phá dãy núi Trường Lệ rợp bóng thông: viếng Đền Độc Cước linh thiêng trên mỏm đá, check-in Hòn Trống Mái biểu tượng tình yêu chung thủy và Đền Cô Tiên cuối dãy núi. 11:30 – 13:30: Ăn trưa, nghỉ ngơi. 14:00 – 18:00: Vui chơi thỏa thích tại Công Viên Sun World Sầm Sơn với bể tạo sóng thần và đường trượt cảm giác mạnh hoặc chụp ảnh tại bể bơi nước mặn FLC Sầm Sơn. 19:30: Ăn tối gỏi cá nhệch, cà phê nghe nhạc Acoustic ven biển.",
        },
        {
          day: 3,
          title: "Chợ hải sản Cột Đỏ – Mua đặc sản xứ Thanh – Về lại Hà Nội",
          places: [
            "Chợ cột đỏ - Sầm sơn",
            "Làng nem chua Thanh Hóa",
            "Cao tốc QL45 – Mai Sơn – Hà Nội",
          ],
          note: "07:00 – 08:30: Tắm biển sáng sớm, thưởng thức bánh cuốn tôm thịt hoặc bún hải sản. 08:30 – 10:30: Ghé Chợ Cột Đỏ - chợ hải sản lớn nhất Sầm Sơn chọn mua mực khô, cá thu một nắng, tôm nõn, cua ghẹ và nem chua Thanh Hóa (tiểu thương hỗ trợ đóng thùng xốp ướp đá miễn phí mang về). 11:00 – 13:00: Trả phòng khách sạn, dùng bữa trưa trước khi lên xe cao tốc khởi hành về lại Hà Nội, kết thúc chuyến đi tuyệt vời.",
        },
      ],
      foodHighlights: [
        {
          name: "Hải sản tươi sống Sầm Sơn (tôm sú, cua gạch, ghẹ xanh, bề bề)",
          desc: "Hải sản tươi sống vớt ngay tại bể hấp sả, rang me hoặc sốt bơ tỏi ngọt đậm đà vị biển.",
          priceRange: "300.000đ - 650.000đ / kg",
        },
        {
          name: "Gỏi cá nhệch Sầm Sơn",
          desc: "Đặc sản trứ danh xứ Thanh, thịt cá nhệch giòn ngọt cuốn lá sung, rau thơm chấm cùng nước chẻo béo bùi cay nồng.",
          priceRange: "180.000đ - 300.000đ / suất",
        },
        {
          name: "Bánh cuốn tôm thịt & Cháo lươn Thanh Hóa",
          desc: "Bánh cuốn tráng mỏng nhân tôm thịt đậm đà rắc hành phi thơm nức và tô cháo lươn đồng cay the ấm bụng.",
          priceRange: "30.000đ - 60.000đ / món",
        },
        {
          name: "Mực nhồi thịt chiên vàng & Cá thu một nắng",
          desc: "Mực tươi ngọt thịt nhồi thịt nạc băm chiên vàng ruộm và cá thu nướng thơm lừng sốt cà chua.",
          priceRange: "150.000đ - 250.000đ / đĩa",
        },
        {
          name: "Nem chua Thanh Hóa, Chè lam & Bánh gai Tứ Trụ",
          desc: "Đặc sản quà biếu số một của xứ Thanh, nem chua giòn cay the sần sật và bánh gai dẻo thơm ngọt ngào.",
          priceRange: "35.000đ - 60.000đ / chục / gói",
        },
      ],
      budgetTips: [
        "Chủ động hỏi và thống nhất giá trước khi gọi món: Sầm Sơn đã niêm yết giá công khai nhưng vẫn nên hỏi rõ giá cân hải sản (đã gồm công chế biến chưa) trước khi chọn mua.",
        "Chọn khách sạn các con phố ngang (cách biển 100-200m): Giá phòng khách sạn đường Lê Lợi, Nguyễn Du rẻ hơn từ 30% - 50% so với mặt đường Hồ Xuân Hương đối diện biển, dù chỉ cách vài bước chân.",
        "Mua hải sản tại bến thuyền sáng sớm hoặc Chợ Cột Đỏ: Mua trực tiếp từ ngư dân kéo lưới lúc 5h30 sáng ở cuối bãi C/D hoặc tại Chợ Cột Đỏ rồi gửi nhà bếp hấp hộ (công 30k - 50k/kg), tiết kiệm 30% - 40% chi phí.",
        "Di chuyển bằng xe điện có niêm yết giá: Giá xe điện được ban quản lý quy định rõ theo chặng; nên hỏi trước điểm đến và giá niêm yết trước khi lên xe.",
      ],
    },
  },
  {
    id: "guide-tam-chuc",
    slug: "cam-nang-du-lich-chua-tam-chuc-ha-nam-3n2d",
    title: "Cẩm nang du lịch Chùa Tam Chúc 3N2Đ: Vãn cảnh vịnh Hạ Long trên cạn & Hành hương đất Phật Hà Nam",
    destination: "Quần thể Chùa Tam Chúc",
    province: "Hà Nam",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "650.000đ - 2.500.000đ / người",
    bestSeason: "Tháng Giêng – Tháng 3 Âm lịch (Hội Xuân Tam Chúc, mưa xuân mờ ảo) hoặc Tháng 9 – Tháng 11 (Mùa thu nắng vàng thanh tịnh)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
      caption: "Non nước Chùa Tam Chúc bồng bềnh mây khói soi bóng xuống lòng hồ Lục Nhạc",
      photographer: "Tam Chuc Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Chùa Ngọc Đàn Tế Trời trên đỉnh núi Thất Tinh ghép hoàn toàn từ đá granite đỏ",
        photographer: "Ngoc Pagoda Peak",
        tags: ["Chùa Ngọc", "Núi Thất Tinh", "Đàn Tế Trời"],
      },
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Vườn Cột Kinh đá xanh sừng sững uy nghiêm dẫn lối vào Điện Tam Thế",
        photographer: "Sutra Pillar Trail",
        tags: ["Vườn Cột Kinh", "Điện Tam Thế", "Kỷ lục"],
      },
      {
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        caption: "Nhà khách Thủy Đình soi bóng lung linh bên làn nước biếc hồ Tam Chúc",
        photographer: "Thuy Dinh Pavilion",
        tags: ["Thủy Đình", "Bến du thuyền", "Hồ Lục Nhạc"],
      },
      {
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        caption: "Sân sỏi trắng thanh khiết bình yên tại Chùa Địa Tạng Phi Lai Tự",
        photographer: "Dia Tang Phi Lai Zen",
        tags: ["Địa Tạng Phi Lai Tự", "Chùa Đùng", "Thiền tịnh"],
      },
    ],
    summary:
      "Kinh nghiệm hành hương và vãn cảnh Chùa Tam Chúc 3N2Đ: Đi du thuyền lướt qua hồ Lục Nhạc mênh mông 600ha ngắm 6 ngọn núi đá vôi nhô lên giữa lòng hồ, chiêm bái Vườn Cột Kinh khổng lồ cùng 3 chính điện nguy nga, leo 299 bậc đá lên Đỉnh núi Thất Tinh vái Chùa Ngọc, tìm về chốn thiền tịnh Chùa Bà Đanh – Chùa Địa Tạng Phi Lai Tự và thưởng thức đặc sản bánh cuốn Phủ Lý cùng cá kho niêu đất làng Vũ Đại.",
    tags: [
      "Tam Chúc",
      "Hà Nam",
      "Hồ Lục Nhạc",
      "Chùa Ngọc",
      "Địa Tạng Phi Lai Tự",
      "Chùa Bà Đanh",
      "Hành hương",
      "Cá kho Vũ Đại",
    ],
    sections: {
      packingList: [
        "Trang phục hành hương lịch sự, kín đáo: Áo có cổ, quần dài qua gối khi vào các điện thờ chính và Chùa Ngọc; tránh đồ ngắn bó sát.",
        "Giày thể thao êm chân hoặc giày lười đế bệt dễ tháo: Khuôn viên chùa cực kỳ rộng lớn, nhiều bậc đá cao và vào mỗi điện thờ đều phải cởi giày dép.",
        "Ô dù gấp gọn, nón mũ & nước suối cá nhân: Khoảng sân đá rộng lớn giữa các điện thờ ít bóng râm, cần che nắng và bổ sung nước khi leo Chùa Ngọc.",
        "Khăn choàng mỏng: Buổi sáng sớm trên hồ Lục Nhạc hoặc đỉnh núi Thất Tinh gió lộng khá se lạnh.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Hà Nội – Quần thể Chùa Tam Chúc – Du thuyền Hồ Lục Nhạc – Chùa Ngọc",
          places: [
            "Nhà khách Thủy Đình",
            "Du thuyền Hồ Lục Nhạc (Đình Tam Chúc)",
            "Cổng Tam Quan Nội",
            "Vườn Cột Kinh & Điện Tam Thế",
            "Chùa Ngọc (Đỉnh Thất Tinh)",
          ],
          note: "07:30 – 09:00: Khởi hành từ Hà Nội theo QL1A hoặc đường Cienco 5 đến thị trấn Ba Sao, Kim Bảng (60km). 09:00 – 10:30: Đến Nhà khách Thủy Đình, lên du thuyền lướt qua Hồ Lục Nhạc 600ha ghé thăm đảo Đình Tam Chúc. 10:30 – 12:30: Cập bến Tam Quan Nội, dạo bước qua Vườn Cột Kinh 32 cột đá xanh nguyên khối, chiêm bái Điện Quan Âm, Điện Giáo Chủ và Điện Tam Thế nguy nga. 12:30 – 14:00: Ăn trưa Buffet chay thanh đạm tại Thủy Đình. 14:30 – 16:30: Leo 299 bậc đá lên Đỉnh núi Thất Tinh chiêm bái Chùa Ngọc ghép từ đá granite đỏ và ngắm toàn cảnh non nước từ độ cao gần 200m. 17:00 – 20:00: Về Khách sạn Xá Lợi hoặc TP. Phủ Lý nghỉ ngơi, ăn tối thịt dê núi Kim Bảng. (Lưu ý: Khoảng cách từ cổng vào Tam Điện gần 5km nên bắt buộc đi thuyền hoặc xe điện).",
        },
        {
          day: 2,
          title: "Chùa Bà Đanh – Kẽm Trống – Chùa Địa Tạng Phi Lai Tự",
          places: [
            "Chùa Bà Đanh (Bảo Sơn Nữ Tự)",
            "Núi Cấm – Ngũ Động Thi Sơn",
            "Danh thắng Kẽm Trống",
            "Chùa Địa Tạng Phi Lai Tự (Chùa Đùng)",
          ],
          note: "08:00 – 10:00: Ăn sáng bánh cuốn chả nướng Phủ Lý, ghé thăm Chùa Bà Đanh êm đềm bên dòng sông Đáy và khám phá quần thể Ngũ Động Thi Sơn. 10:30 – 12:00: Di chuyển sang huyện Thanh Liêm ngắm cảnh Kẽm Trống sông Đáy lượn quanh vách núi đá vôi. 12:00 – 14:00: Dùng bữa trưa cá kho làng Vũ Đại với cơm trắng nóng hổi. 14:30 – 17:30: Viếng thăm Chùa Địa Tạng Phi Lai Tự chiêm ngưỡng không gian thiền tịnh sân sỏi trắng mang phong cách cố đô Nhật Bản giữa rừng thông xanh. 19:00: Ăn tối và dạo phố bờ sông Châu Giang tại TP. Phủ Lý.",
        },
        {
          day: 3,
          title: "Đền Trần Thương – Làng nghề Kho cá Vũ Đại – Về lại Hà Nội",
          places: [
            "Đền Trần Thương (Kho lương vua Trần)",
            "Làng Vũ Đại (xã Hòa Hậu)",
            "Nhà Bá Kiến",
          ],
          note: "08:00 – 10:30: Khởi hành về huyện Lý Nhân chiêm bái Đền Trần Thương gắn liền với kho lương của Hưng Đạo Đại Vương Trần Quốc Tuấn, ghé Làng Vũ Đại tìm hiểu quy trình kho cá niêu đất trên củi nhãn suốt 16 tiếng và tham quan Nhà Bá Kiến. 11:30 – 13:30: Trả phòng khách sạn, ăn trưa với bún cá rô đồng và chim to dần Hà Nam. 14:00 – 16:00: Mua chuối Ngự Đại Hoàng và niêu cá kho làm quà, lên xe khởi hành về lại Hà Nội.",
        },
      ],
      foodHighlights: [
        {
          name: "Buffet Chay tại Chùa Tam Chúc",
          desc: "Hơn 40 món chay thanh tịnh từ nấm rừng, đậu phụ non, rau củ quả tươi ngon chế biến tinh tế.",
          priceRange: "150.000đ - 200.000đ / người",
        },
        {
          name: "Bánh cuốn chả nướng Phủ Lý",
          desc: "Bánh cuốn tráng mỏng mềm mướt ăn kèm thịt nướng than hoa thơm lừng và nước mắm đu đủ chua ngọt.",
          priceRange: "35.000đ - 50.000đ / suất",
        },
        {
          name: "Bún cá rô đồng Hà Nam",
          desc: "Cá rô đồng rim gừng nghệ vàng óng thịt săn chắc, nước dùng ninh từ xương cá ngọt thanh ăn cùng rau cải cay.",
          priceRange: "35.000đ - 45.000đ / bát",
        },
        {
          name: "Thịt dê núi Kim Bảng & Chim to dần",
          desc: "Dê núi đá vôi thịt ngọt ít mỡ chế biến dê ủ trấu, tái chanh hoặc nhúng lẩu thảo mộc thơm lừng.",
          priceRange: "150.000đ - 250.000đ / đĩa",
        },
        {
          name: "Cá kho làng Vũ Đại & Chuối Ngự Đại Hoàng",
          desc: "Cá trắm đen kho niêu đất củi nhãn 16 tiếng xương nhừ thịt chắc và chuối Ngự tiến vua vỏ mỏng ngọt ngào.",
          priceRange: "450.000đ - 900.000đ / niêu; 40.000đ - 80.000đ / nải",
        },
      ],
      budgetTips: [
        "Chọn gói vé Combo Thuyền + Xe điện (270.000 VNĐ): Chiều đi thuyền ngắm trọn cảnh sắc hồ Lục Nhạc ghé Đình Tam Chúc, chiều về xe điện chạy thẳng bến xe tiết kiệm thời gian và trải nghiệm đủ cả 2 phương thức.",
        "Đi vào ngày thường hoặc trước 07:30 sáng dịp đầu năm: Tránh tình trạng chen chúc chờ thuyền 1-2 tiếng vào các ngày cuối tuần mùa lễ hội tháng Giêng.",
        "Bắt xe buýt hoặc Limousine từ Hà Nội: Tuyến xe buýt hoặc limousine Giáp Bát / Nước Ngầm đi thẳng cổng chùa chỉ từ 90.000 – 130.000 VNĐ/lượt.",
        "Đặt trước cá kho làng Vũ Đại: Nếu có ý định mua cá kho niêu đất làm quà, nên liên hệ cơ sở kho cá trước 1 ngày để nhận niêu cá mới nguội và giữ nguyên hương vị.",
      ],
    },
  },
  {
    id: "guide-bat-trang",
    slug: "cam-nang-du-lich-lang-gom-bat-trang-3n2d",
    title: "Cẩm nang du lịch Làng gốm Bát Tràng 3N2Đ: Tự tay vuốt gốm thủ công & Nghỉ dưỡng sinh thái ven đô",
    destination: "Làng gốm Bát Tràng",
    province: "Hà Nội",
    region: "north",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "350.000đ - 2.500.000đ / người",
    bestSeason: "Quanh năm (Tiết trời mát mẻ nhất Tháng 9 – Tháng 4 năm sau & Mùa lễ hội Làng gốm 14 – 16 tháng Hai Âm lịch)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80",
      caption: "Bảo tàng Gốm Bát Tràng với kiến trúc 7 bàn xoay khổng lồ độc nhất vô nhị",
      photographer: "Bat Trang Ceramic Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80",
        caption: "Trải nghiệm tự tay nhào đất vuốt tạo hình trên bàn xoay gốm thủ công",
        photographer: "Handmade Pottery Workshop",
        tags: ["Nặn gốm", "Bàn xoay", "Workshop"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Ngõ nhỏ lát gạch cổ kính rêu phong và giàn phơi than trong Làng Cổ Bát Tràng",
        photographer: "Ancient Alley Bat Trang",
        tags: ["Làng Cổ Bát Tràng", "Ngõ gạch", "Rêu phong"],
      },
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Chợ gốm Bát Tràng muôn vàn sắc men lam men rạn và gốm mỹ nghệ tinh xảo",
        photographer: "Ceramic Market Showcase",
        tags: ["Chợ gốm", "Gốm mỹ nghệ", "Mua sắm"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Đình Bát Tràng cổ kính uy nghiêm soi bóng bên bờ sông Hồng lộng gió",
        photographer: "Bat Trang Communal House",
        tags: ["Đình Bát Tràng", "Bến sông Hồng", "Lịch sử"],
      },
    ],
    summary:
      "Kinh nghiệm khám phá Làng gốm Bát Tràng 3N2Đ kết hợp nghỉ dưỡng ven đô: Check-in kiến trúc 7 bàn xoay xoắn ốc tại Trung tâm tinh hoa làng nghề Việt, bước vào trong lòng Lò Bầu Cổ gần trăm năm tuổi, tự tay nhào vuốt nặn gốm trên bàn xoay thủ công, dạo bước trong mê cung ngõ cổ lát gạch Bát Tràng, vãn cảnh Đình làng ven sông Hồng, dã ngoại hồ Thiên Nga Ecopark và thưởng thức mâm cỗ truyền thống canh măng mực tiến vua trứ danh.",
    tags: [
      "Bát Tràng",
      "Hà Nội",
      "Làng gốm",
      "Nặn gốm",
      "Bảo tàng Gốm",
      "Làng cổ",
      "Canh măng mực",
      "Ecopark",
    ],
    sections: {
      packingList: [
        "Trang phục chụp ảnh tông màu be, nâu đất, trắng hoặc áo dài: Lên hình cực kỳ nổi bật trên nền tường gốm đỏ cam xoắn ốc của bảo tàng và tường gạch cổ Bát Tràng.",
        "Trang phục gọn gàng khi vào xưởng nặn gốm: Quần áo dễ giặt vì đất sét ướt trên bàn xoay dễ bắn vào gấu quần (xưởng có phát tạp dề).",
        "Giày sneaker hoặc giày bệt êm chân: Để đi bộ dạo quanh mê cung các ngõ nhỏ lát gạch và chợ gốm.",
        "Balo hoặc túi vải canvas có lót giấy báo/xốp bọc: Đựng các món đồ gốm sứ, lọ hoa, ấm chén mua tại xưởng tránh va đập sứt mẻ.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Trung tâm tinh hoa làng nghề Việt – Lò Bầu Cổ – Nặn gốm thủ công",
          places: [
            "Đê tả ngạn sông Hồng",
            "Trung tâm tinh hoa làng nghề Việt (Bảo tàng Gốm)",
            "Lò Bầu Cổ",
            "Xưởng nặn gốm thủ công",
          ],
          note: "08:30 – 09:30: Di chuyển theo đê tả ngạn sông Hồng từ trung tâm Hà Nội đến Làng gốm Bát Tràng (14km). 09:30 – 12:00: Tham quan và chụp ảnh kiến trúc 7 khối xoắn ốc khổng lồ tại Trung tâm tinh hoa làng nghề Việt, chiêm ngưỡng cổ vật gốm sứ qua các triều đại. 12:00 – 14:00: Thưởng thức bữa trưa với mâm cỗ truyền thống canh măng mực Bát Tràng, nhận phòng nghỉ ngơi. 14:30 – 16:00: Ghé thăm Lò Bầu Cổ 5 bầu nung hình mai rùa trăm năm tuổi và bước vào lòng lò gốm xưa. 16:00 – 17:30: Trải nghiệm tự tay nặn gốm trên bàn xoay, vuốt tạo hình cốc bát và tự tô màu vẽ trang trí tác phẩm mang về. (Lưu ý: Ngõ làng cổ hẹp nên gửi xe tại bãi của bảo tàng hoặc chợ gốm rồi đi bộ/thuê xe điện dạo làng).",
        },
        {
          day: 2,
          title: "Làng Cổ Bát Tràng – Đình Bát Tràng – Dã ngoại xanh tại Khu Đô Thị Ecopark",
          places: [
            "Chợ sáng Bát Tràng",
            "Mê cung Làng Cổ Bát Tràng",
            "Nhà cổ Vạn Vân",
            "Đình Bát Tràng",
            "Chợ gốm Bát Tràng",
            "Khu Đô Thị Ecopark",
          ],
          note: "07:30 – 10:30: Ăn sáng bún chả chợ quê, đi bộ khám phá mê cung ngõ nhỏ tường gạch phơi than rêu phong trong Làng Cổ Bát Tràng, thăm Nhà cổ Vạn Vân lưu giữ hiện vật gốm cổ thế kỷ XV và dâng hương Đình Bát Tràng hướng ra sông Hồng. 10:30 – 12:00: Dạo Chợ gốm Bát Tràng mua sắm ấm chén men lam, men rạn, bình hoa gốm với giá xưởng. 12:30 – 14:30: Di chuyển 3km sang Khu Đô Thị Ecopark ăn trưa tại Phố Trúc và nhận phòng homestay ngắm hồ Thiên Nga. 15:30 – 18:30: Đạp xe dưới bóng cây cổ thụ, chèo thuyền Kayak và cắm trại dã ngoại ngắm đàn thiên nga bơi lội.",
        },
        {
          day: 3,
          title: "Biển hồ Vinhomes Ocean Park – Nhận thành phẩm gốm nung – Về lại Hà Nội",
          places: [
            "Vinhomes Ocean Park (Biển hồ nước mặn & Hồ Ngọc Trai)",
            "Xưởng gốm Bát Tràng",
            "Vườn ổi găng Đông Dư",
          ],
          note: "08:00 – 11:30: Ăn sáng, di chuyển khoảng 5km sang Vinhomes Ocean Park dạo chơi bên bãi cát trắng dừa xanh của Biển hồ nước mặn và Hồ Ngọc Trai. 12:00 – 14:00: Ăn trưa BBQ ven hồ, làm thủ tục trả phòng. 14:30 – 16:00: Quay lại xưởng gốm Bát Tràng nhận sản phẩm gốm tự nặn đã nung sấy khô hoàn thiện, mua ổi găng Đông Dư và bánh tẻ Bát Tràng làm quà trước khi về lại trung tâm Hà Nội.",
        },
      ],
      foodHighlights: [
        {
          name: "Canh măng mực Bát Tràng",
          desc: "Món tiến vua trứ danh mâm cỗ truyền thống, măng vầu tước sợi mảnh như tăm ninh cùng mực khô Thanh Hóa và nước luộc gà ngọt thanh tao kỳ công.",
          priceRange: "180.000đ - 280.000đ / bát (mâm cỗ 250.000đ - 350.000đ/người)",
        },
        {
          name: "Su hào xào mực khô",
          desc: "Su hào thái con chì xào giòn sần sật cùng mực khô xé sợi và mỡ gà béo ngậy thơm lừng.",
          priceRange: "120.000đ - 180.000đ / đĩa",
        },
        {
          name: "Bánh tẻ nóng Bát Tràng",
          desc: "Vỏ bột gạo tẻ dẻo mềm gói lá dong thơm ngát, nhân thịt ba chỉ mộc nhĩ nêm tiêu thơm lừng ăn khi còn nóng hổi.",
          priceRange: "7.000đ - 10.000đ / chiếc",
        },
        {
          name: "Bánh sắn nướng bến đình & Bánh cuốn nóng",
          desc: "Bánh sắn bùi ngậy nướng than hoa thơm phức và bánh cuốn tráng tay nóng hổi tại chợ sáng Bát Tràng.",
          priceRange: "10.000đ - 35.000đ / phần",
        },
        {
          name: "Nước ổi ép tươi & Ổi găng Đông Dư",
          desc: "Đặc sản ổi giòn ngọt thơm nức mũi của vùng đất phù sa ven sông Hồng giáp ranh Bát Tràng.",
          priceRange: "20.000đ - 30.000đ / cốc (ổi tươi: 25.000đ - 35.000đ/kg)",
        },
      ],
      budgetTips: [
        "Đi xe buýt số 47A từ Long Biên: Tuyến buýt 47A chạy liên tục 15-20 phút/chuyến giá chỉ 15.000 VNĐ/lượt đỗ ngay cổng chợ gốm, tiết kiệm và không lo tìm chỗ đỗ xe.",
        "Mua gốm ở ki-ốt sâu trong chợ hoặc xưởng ngõ nhỏ: Giá bán rẻ hơn từ 15% – 25% so với quầy ngoài cổng chợ và có thể thương lượng giảm thêm nếu mua theo bộ hoặc số lượng nhiều.",
        "Đặt trước mâm cỗ truyền thống Bát Tràng theo nhóm: Món canh măng mực rất cầu kỳ mất cả ngày chuẩn bị; đặt theo mâm cho nhóm 4-6 người tại các nhà cổ sẽ tiết kiệm hơn gọi món lẻ và thưởng thức đúng điệu.",
        "Ghé kết hợp Ecopark hoặc Vinhomes Ocean Park: Hai khu đô thị sinh thái nằm ngay sát Bát Tràng (chỉ 3-5km), rất tiện đi lại bằng xe buýt hoặc taxi công nghệ mà không phát sinh nhiều chi phí di chuyển.",
      ],
    },
  },
  {
    id: "guide-eo-gio",
    slug: "cam-nang-du-lich-eo-gio-quy-nhon-3n2d",
    title: "Cẩm nang du lịch Eo Gió Quy Nhơn 3N2Đ: Check-in Đảo Jeju Việt Nam, Cano lặn san hô Kỳ Co & Ẩm thực làng chài",
    destination: "Khu du lịch Eo Gió – Quy Nhơn",
    province: "Bình Định",
    region: "central",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "1.800.000đ - 4.200.000đ / người",
    bestSeason: "Tháng 3 - Tháng 9 (Mùa khô nắng vàng rực rỡ, biển êm xanh ngọc bích, cano chạy tốt)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      caption: "Con đường đi bộ ven biển Eo Gió uốn lượn lưng chừng vách đá hùng vĩ nhìn ra biển xanh ngọc bích",
      photographer: "Eo Gio Coastal Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
        caption: "Bãi biển Kỳ Co trong vắt màu ngọc bích với cầu gỗ Hang Yến và vách đá sừng sững",
        photographer: "Ky Co Beach Paradise",
        tags: ["Kỳ Co", "Bãi biển Kỳ Co", "Cano", "Bãi Dứa"],
      },
      {
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        caption: "Tịnh xá Ngọc Hoà với tượng đôi Phật Bà Quan Âm cao nhất Việt Nam nhìn ra biển Đông",
        photographer: "Ngoc Hoa Monastery View",
        tags: ["Tịnh xá Ngọc Hoà", "Tượng Phật đôi", "Tâm linh"],
      },
      {
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        caption: "Đồi Cát Phương Mai trải dài cát vàng thoai thoải và quần thể FLC Luxury Resort ven biển",
        photographer: "Phuong Mai Sand Dunes",
        tags: ["Đồi Cát Phương Mai", "Trượt cát", "FLC Quy Nhơn"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Bãi trứng Hoàng Hậu với vô số viên đá tròn nhẵn như trứng chim tại Khu du lịch Ghềnh Ráng",
        photographer: "Ghenh Rang Queen Beach",
        tags: ["Ghềnh Ráng", "Bãi trứng", "Tháp Đôi", "Hàn Mặc Tử"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch Eo Gió – Quy Nhơn 3N2Đ chi tiết: Dạo bước con đường ven biển ngoạn mục, chiêm bái tượng đôi Quan Âm Tịnh xá Ngọc Hoà, vi vu cano siêu tốc ra Bãi Kỳ Co lặn ngắm san hô Bãi Dứa, trượt cát Đồi Phương Mai, tham quan Tháp Đôi Chăm Pa, Bãi trứng Ghềnh Ráng và đại tiệc hải sản làng chài trứ danh.",
    tags: [
      "Eo Gió",
      "Kỳ Co",
      "Quy Nhơn",
      "Bình Định",
      "Đảo Jeju Việt Nam",
      "Con đường ven biển",
      "Lặn san hô",
      "Ghềnh Ráng",
    ],
    sections: {
      packingList: [
        "Mũ có quai buộc cằm & Kính râm, kem chống nắng SPF 50+: Con đường đi bộ ven biển Eo Gió hoàn toàn lộ thiên dưới nắng và gió lốc eo biển rất mạnh, mũ không quai buộc rất dễ bị thổi bay xuống biển.",
        "Trang phục màu trắng, vàng rực hoặc xanh dương (váy maxi bay bổng): Cực kỳ ăn ảnh khi đứng trên nền hàng rào gạch đỏ và vách đá xám của Eo Gió.",
        "Giày thể thao bám tốt hoặc sandal quai hậu: Giúp leo hàng ngàn bậc thang đá và bước đi an toàn trên bãi đá cuội Đẻ ven bờ biển (tránh giày cao gót nhọn).",
        "Túi chống nước cho điện thoại & Khăn tắm cá nhân: Tiện lợi khi đi cano vượt sóng ra Bãi Kỳ Co và lặn ngắm san hô tại Bãi Dứa.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Cầu Thị Nại – Đồi Cát Phương Mai – Eo Gió đón hoàng hôn – Tịnh xá Ngọc Hoà",
          places: [
            "Cầu Thị Nại",
            "Đồi Cát Phương Mai",
            "Tịnh xá Ngọc Hoà",
            "Khu Du Lịch Eo Gió",
            "Con đường đi bộ ven biển",
          ],
          note: "09:00 – 12:00: Đến Quy Nhơn, thưởng thức đặc sản Bún chả cá hoặc Bánh hỏi lòng heo, nhận phòng khách sạn nghỉ ngơi. 14:30 – 15:30: Chạy xe máy qua Cầu Thị Nại ra bán đảo Phương Mai, dừng chân trượt cát tại Đồi Cát Phương Mai. 15:45 – 16:30: Chiêm bái tượng đôi Phật Bà Quan Âm cao nhất Việt Nam tại Tịnh xá Ngọc Hoà. 16:30 – 18:15: Mua vé vào Eo Gió (25k), dạo bước ngắm biển ngọc bích trên Con đường ven biển đón hoàng hôn. 19:00: Ăn tối hải sản tươi sống tại làng chài Nhơn Lý.",
        },
        {
          day: 2,
          title: "Cano vượt sóng Ky Co Beach – Lặn san hô Bãi Dứa – Khám phá làng chài Nhơn Lý",
          places: [
            "Bến cano Nhơn Lý",
            "Ky Co Beach",
            "Cầu gỗ Hang Yến",
            "Rạn san hô Bãi Dứa",
            "FLC Luxury Resort Quy Nhon",
          ],
          note: "07:30 – 08:30: Ăn sáng, ra bến thuyền làng chài Nhơn Lý lên cano siêu tốc ra đảo Kỳ Co. 08:45 – 11:00: Tắm biển Kỳ Co với làn nước 2 màu lam - ngọc bích, chụp ảnh cầu gỗ Hang Yến và hồ bơi tự nhiên giữa ghềnh đá. 11:00 – 12:00: Cano đưa đến Bãi Dứa lặn ngắm san hô rực rỡ. 12:00 – 14:30: Tắm nước ngọt và thưởng thức combo hải sản 8-9 món (nhum biển nướng, ốc vú nàng, bào ngư). 15:00 – 17:30: Dạo bước check-in làng chài bích họa hoặc uống cà phê ngắm biển tại FLC Luxury Resort.",
        },
        {
          day: 3,
          title: "Tháp Đôi Chăm Pa cổ kính – Bãi trứng Ghềnh Ráng – Mua sắm đặc sản làm quà",
          places: [
            "Tháp Đôi Quy Nhơn",
            "Bãi trứng Hoàng Hậu",
            "Đồi Thi Nhân (Mộ Hàn Mặc Tử)",
            "Chợ Đầm Quy Nhơn",
          ],
          note: "08:00 – 09:30: Ăn sáng, tham quan Di tích kiến trúc Chăm Pa độc đáo tại Tháp Đôi ngay trong lòng phố. 09:30 – 11:30: Khám phá Bãi trứng Ghềnh Ráng với hàng vạn viên đá tròn nhẵn như trứng chim khổng lồ và viếng mộ thi sĩ Hàn Mặc Tử. 12:00 – 14:00: Trả phòng, ăn trưa Bánh xèo tôm nhảy giòn rụm và ghé cửa hàng đặc sản mua bánh ít lá gai, chả ram tôm đất, tré rơm trước khi ra sân bay Phù Cát.",
        },
      ],
      foodHighlights: [
        {
          name: "Combo Hải sản làng chài Nhơn Lý",
          desc: "Hải sản tươi sống vừa đánh bắt nướng và hấp ngay tại chỗ gồm nhum nướng mỡ hành, hàu sữa, ốc vú nàng, bào ngư và lẩu sứa nước lèo.",
          priceRange: "200.000đ - 350.000đ / người",
        },
        {
          name: "Bánh xèo tôm nhảy Quy Nhơn",
          desc: "Vỏ bánh giòn rụm đúc bằng khuôn gang với những con tôm đất đỏ tươi nhảy tanh tách, ăn kèm bánh tráng mỏng, rau mầm và chén nước mắm chua ngọt.",
          priceRange: "35.000đ - 55.000đ / đĩa",
        },
        {
          name: "Bún chả cá & Bún sứa nước lèo",
          desc: "Nước dùng ngọt thanh nấu từ xương cá thu, chả cá hấp dai giòn và sứa tươi sần sật mát lạnh.",
          priceRange: "35.000đ - 50.000đ / tô",
        },
        {
          name: "Bánh hỏi cháo lòng",
          desc: "Đĩa bánh hỏi rắc hẹ mỡ hành thơm phức kèm đĩa lòng heo tươi luộc nóng hổi và tô cháo lòng đậm đà.",
          priceRange: "35.000đ - 55.000đ / suất",
        },
        {
          name: "Chả ram tôm đất, Bánh ít lá gai & Tré rơm",
          desc: "Chả ram tôm giòn tan, bánh ít ngọt dẻo bùi bùi và tré rơm chua cay thơm nồng củ riềng tỏi ớt đặc trưng Bình Định.",
          priceRange: "40.000đ - 180.000đ / phần",
        },
      ],
      budgetTips: [
        "Mua Combo Tour Cano Kỳ Co + Eo Gió + Ăn trưa hải sản: Đặt trọn gói tại các nhà hàng làng chài Nhơn Lý khoảng 650.000đ - 750.000đ/người bao gồm trọn gói vé vào cổng cả 2 điểm, cano khứ hồi, lặn san hô và bữa ăn hải sản 8 món thịnh soạn.",
        "Thuê xe máy tự túc vượt Cầu Thị Nại: Giá thuê xe chỉ 120.000đ - 150.000đ/ngày giúp chủ động dừng ngắm cảnh Đồi Cát Phương Mai và tiết kiệm hơn 500k so với đi taxi 2 chiều.",
        "Tránh khung giờ nắng gắt 11:00 – 14:30: Vách đá tại Eo Gió hấp thụ nhiệt rất nóng làm nhanh mất sức; nên đi vào sáng sớm 06:00 - 08:30 hoặc chiều muộn 16:00 - 18:00 để chụp ảnh đẹp nhất.",
        "Mua đặc sản tại Chợ Đầm hoặc xưởng chế biến địa phương: Giá chả ram tôm đất và bánh ít lá gai rẻ hơn 15-20% so với các quầy hàng lưu niệm tại sân bay.",
      ],
    },
  },
  {
    id: "guide-nha-trang",
    slug: "cam-nang-du-lich-vinh-nha-trang-3n2d",
    title: "Cẩm nang du lịch Vịnh Nha Trang 3N2Đ: Tour 3 Đảo Hòn Mun, Oanh tạc VinWonders & Tắm bùn khoáng Hòn Tằm",
    destination: "Vịnh Nha Trang",
    province: "Khánh Hòa",
    region: "central",
    durationText: "3 ngày 2 đêm",
    estimatedBudget: "2.200.000đ - 5.200.000đ / người",
    bestSeason: "Tháng 1 - Tháng 8 (Mùa khô biển êm trong vắt nhìn sâu 10-15m, cano lặn biển tuyệt đỉnh)",
    coverPhoto: {
      url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      caption: "Bãi biển Nha Trang trong xanh cát trắng ôm trọn cung đường Trần Phú và Tháp Trầm Hương",
      photographer: "Nha Trang Bay Explorer",
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        caption: "Quần thể công viên giải trí VinWonders và cáp treo vượt biển trên Đảo Hòn Tre",
        photographer: "VinWonders Hon Tre View",
        tags: ["Đảo Hòn Tre", "VinWonders", "Cáp treo vượt biển"],
      },
      {
        url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
        caption: "Lặn ngắm rạn san hô nguyên sơ và sinh vật biển rực rỡ tại Khu bảo tồn Đảo Hòn Mun",
        photographer: "Hon Mun Marine Reserve",
        tags: ["Đảo Hòn Mun", "Lặn san hô", "Scuba Diving"],
      },
      {
        url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
        caption: "Thư giãn ngâm bùn khoáng nóng ngắm toàn cảnh Vịnh Nha Trang trên Đảo Hòn Tằm",
        photographer: "Hon Tam Mud Bath Luxury",
        tags: ["Đảo Hòn Tằm", "Tắm bùn khoáng", "Hồ bơi vô cực"],
      },
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        caption: "Quần thể Di sản văn hóa Chăm Pa Tháp Bà Ponagar nghìn năm tuổi uy nghiêm bên dòng sông Cái",
        photographer: "Ponagar Cham Towers Heritage",
        tags: ["Tháp Bà Ponagar", "Di sản Chăm Pa", "Đồi Cù Lao"],
      },
    ],
    summary:
      "Kinh nghiệm du lịch Vịnh Nha Trang 3N2Đ toàn diện: Tắm biển Trần Phú, dạo cáp treo vượt biển sang Đảo Hòn Tre quẩy VinWonders và xem Tata Show, đi cano Tour 3 Đảo lặn ngắm rạn san hô Hòn Mun, ăn hải sản lồng bè và ngâm bùn khoáng Hòn Tằm, chiêm bái Tháp Bà Ponagar, Hòn Chồng và thưởng thức bún chả cá sứa, nem nướng Ninh Hòa trứ danh.",
    tags: [
      "Vịnh Nha Trang",
      "Nha Trang",
      "Khánh Hòa",
      "Hòn Mun",
      "VinWonders",
      "Hòn Tằm",
      "Tắm bùn khoáng",
      "Tháp Bà Ponagar",
    ],
    sections: {
      packingList: [
        "2-3 bộ đồ bơi (nên có bộ dài tay chống nắng) & Túi chống nước điện thoại: Cần thiết khi đi tour cano đảo, lặn ngắm san hô tại Hòn Mun và tắm bùn khoáng Hòn Tằm.",
        "Kem chống nắng phổ rộng SPF 50+ (ưu tiên loại Reef-safe thân thiện với san hô) & Kính râm, mũ rộng vành, xịt khoáng làm dịu da.",
        "Trang phục lịch sự kín đáo qua gối: Bắt buộc khi vào làm lễ bên trong các tháp chính tại Tháp Bà Ponagar và viếng tượng Phật trắng Chùa Long Sơn.",
        "Khăn tắm mỏng nhanh khô & Đồ thể thao thoáng mát: Giúp thuận tiện tham gia các trò chơi cảm giác mạnh tại VinWonders.",
      ],
      sampleDays: [
        {
          day: 1,
          title: "Tắm biển Trần Phú – Viện Hải dương học – Oanh tạc VinWonders Đảo Hòn Tre & Xem Tata Show",
          places: [
            "Bãi biển Trần Phú",
            "Viện Hải dương học Nha Trang",
            "Cáp treo vượt biển",
            "VinWonders Nha Trang (Đảo Hòn Tre)",
            "Vinpearl Harbour",
          ],
          note: "08:30 – 10:30: Đến Nha Trang, ăn sáng Bún cá sứa, gửi hành lý khách sạn và tham quan Viện Hải dương học với hơn 20.000 mẫu sinh vật biển. 11:00 – 13:30: Ăn trưa Nem nướng Ninh Hòa hoặc Bò nướng Lạc Cảnh, nhận phòng nghỉ ngơi. 14:00 – 20:30: Đi cáp treo sang Đảo Hòn Tre, dạo Vinpearl Harbour, thử sức đường trượt Zipline, Vịnh phao nổi tại VinWonders và thưởng thức siêu phẩm Tata Show lúc 19:30. 21:00: Về đất liền ăn hải sản khu Bờ Kè Tháp Bà và dạo Chợ đêm.",
        },
        {
          day: 2,
          title: "Cano du ngoạn Tour 3 Đảo Vịnh Nha Trang (Hòn Mun – Làng Chài – Tắm bùn Đảo Hòn Tằm)",
          places: [
            "Cảng Vĩnh Trường",
            "Đảo Hòn Mun (Khu bảo tồn biển)",
            "Làng Chài trên vịnh",
            "Đảo Hòn Tằm (Tắm bùn khoáng nóng)",
            "Bãi biển Trần Phú",
          ],
          note: "08:00 – 08:45: Ăn sáng, ra Cảng Vĩnh Trường lên cano cao tốc ra vịnh. 09:00 – 11:30: Đến Đảo Hòn Mun, bơi lội trong làn nước xanh ngọc bích, lặn ống thở snorkeling hoặc lặn bình khí ngắm san hô. 11:30 – 13:30: Đến Làng Chài bè nổi ăn trưa hải sản tươi sống. 13:45 – 16:30: Cano đưa sang Đảo Hòn Tằm trải nghiệm ngâm bùn khoáng nóng bồn đá hướng vịnh, tắm ôn tuyền thủy liệu và hồ bơi vô cực. 17:00 – 20:00: Về đất liền tắm biển chiều và ăn tối hải sản.",
        },
        {
          day: 3,
          title: "Tháp Bà Ponagar cổ kính – Danh thắng Hòn Chồng – Chùa Long Sơn – Mua đặc sản",
          places: [
            "Tháp Bà Ponagar",
            "Danh thắng Hòn Chồng",
            "Chùa Long Sơn (Tượng Kim Thân Phật Tổ)",
            "Chợ Đầm Nha Trang",
          ],
          note: "07:30 – 09:30: Ăn sáng Bánh căn hải sản, tham quan Tháp Bà Ponagar di sản kiến trúc Chăm Pa hơn 1.000 năm tuổi trên đồi Cù Lao nhìn ra cửa biển. 09:30 – 11:30: Check-in cụm đá Hòn Chồng vươn ra biển và viếng tượng Kim Thân Phật Tổ tại Chùa Long Sơn. 12:00 – 14:30: Trả phòng, ăn trưa và ghé Chợ Đầm mua Yến sào Khánh Hòa, chả cá thu, mực rim me, bánh xoài Cam Ranh trước khi ra sân bay Cam Ranh.",
        },
      ],
      foodHighlights: [
        {
          name: "Bún chả cá & Bún sứa Nha Trang",
          desc: "Nước lèo nấu từ cá thu cá cờ ngọt thanh không dầu mỡ, chả cá chiên hấp dai giòn và sứa tươi giòn sần sật.",
          priceRange: "35.000đ - 55.000đ / tô",
        },
        {
          name: "Nem nướng Ninh Hòa",
          desc: "Nem nướng than hoa thơm lừng cuốn bánh tráng chiên giòn, xoài non, dưa chuột và chấm nước sốt tương nếp gan thịt vàng óng bí truyền.",
          priceRange: "45.000đ - 65.000đ / phần",
        },
        {
          name: "Bánh căn hải sản Nha Trang",
          desc: "Bánh nướng khuôn đất nung giòn đáy nhân tôm tươi, mực sữa và trứng cút, chấm mắm nêm hoặc nước mắm xíu mại mỡ hành ngập bát.",
          priceRange: "40.000đ - 70.000đ / đĩa",
        },
        {
          name: "Bò nướng Lạc Cảnh",
          desc: "Thịt bò tươi tẩm ướp gia vị mật ong gia truyền hơn 40 năm nướng trực tiếp trên vỉ than hồng thơm phức ăn kèm bánh mì xé và rau sống.",
          priceRange: "180.000đ - 250.000đ / đĩa",
        },
        {
          name: "Hải sản tươi sống làng chài & Bờ Kè Tháp Bà",
          desc: "Tôm hùm bông, ốc hương sốt trứng muối, nhum biển nướng mỡ hành, cá bò da nướng muối ớt bắt tươi tại bể.",
          priceRange: "250.000đ - 600.000đ / người",
        },
        {
          name: "Yến sào Khánh Hòa & Bánh xoài Cam Ranh",
          desc: "Tổ yến đảo thiên nhiên nguyên chất bổ dưỡng và bánh xoài chua ngọt dẻo thơm nức tiếng làm quà biếu cao cấp.",
          priceRange: "30.000đ - 350.000đ / phần",
        },
      ],
      budgetTips: [
        "Đặt Tour 3 Đảo Cano ghép đoàn thay vì thuê cano riêng: Với nhóm dưới 6 người, tour ghép 600k - 750k/người đã bao gồm trọn gói cano, vé các đảo, tắm bùn Hòn Tằm và ăn trưa bè nổi, tiết kiệm hơn 50% so với tự thuê cano riêng.",
        "Chọn khách sạn khu phố Tây (Nguyễn Thiện Thuật, Hùng Vương, Biệt Thự): Chỉ cách biển Trần Phú 2-3 phút đi bộ nhưng giá phòng 3-4 sao rẻ hơn 30% - 40% so với mặt tiền đường Trần Phú.",
        "Ăn hải sản bên khu Bờ Kè đường Tháp Bà hoặc chợ Vĩnh Lương: Hải sản tươi sống cân tại bể niêm yết giá rõ ràng, rẻ hơn đáng kể so với các nhà hàng lớn khu trung tâm du lịch.",
        "Đi xe buýt Đất Mới từ sân bay Cam Ranh về trung tâm: Giá vé chỉ 65.000 VNĐ/lượt đỗ ngay đường Trần Phú, tiết kiệm nhiều so với đi taxi riêng (250k - 300k/chiều).",
      ],
    },
  },
] as const;

export function getAllGuides(): readonly TravelGuide[] {
  return TRAVEL_GUIDES;
}

export function getGuideBySlug(slug: string): TravelGuide | undefined {
  return TRAVEL_GUIDES.find((g) => g.slug === slug);
}

export function filterGuidesByRegion(region: GuideRegion): TravelGuide[] {
  if (region === "all") {
    return [...TRAVEL_GUIDES];
  }
  return TRAVEL_GUIDES.filter((g) => g.region === region);
}

function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function searchGuides(query: string): TravelGuide[] {
  if (!query || query.trim() === "") {
    return [...TRAVEL_GUIDES];
  }
  const cleanQ = normalizeSearch(query);
  return TRAVEL_GUIDES.filter((g) => {
    const titleMatch = normalizeSearch(g.title).includes(cleanQ);
    const destMatch = normalizeSearch(g.destination).includes(cleanQ);
    const provMatch = normalizeSearch(g.province).includes(cleanQ);
    const tagsMatch = g.tags.some((t) => normalizeSearch(t).includes(cleanQ));
    return titleMatch || destMatch || provMatch || tagsMatch;
  });
}

/**
 * Trích xuất danh sách ảnh đầy đủ cho Lightbox từ một cẩm nang (bao gồm ảnh bìa + bộ sưu tập)
 */
export function getGuideGallery(guide: TravelGuide): GuideGalleryPhoto[] {
  const photos: GuideGalleryPhoto[] = [
    {
      url: guide.coverPhoto.url,
      caption: guide.coverPhoto.caption,
      photographer: guide.coverPhoto.photographer,
      tags: ["Ảnh bìa", guide.destination],
    },
  ];

  if (guide.gallery && guide.gallery.length > 0) {
    for (const p of guide.gallery) {
      if (p.url !== guide.coverPhoto.url) {
        photos.push(p);
      }
    }
  }

  return photos;
}
