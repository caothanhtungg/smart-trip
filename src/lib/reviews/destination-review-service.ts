export interface DestinationReview {
  id: string;
  destinationId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  visitMonth: string;
  helpfulCount: number;
  createdAt: string;
  verifiedTraveler?: boolean;
}

export interface DestinationRatingSummary {
  averageRating: number;
  totalReviews: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

const SEED_REVIEWS: readonly DestinationReview[] = [
  {
    id: "rev-nb-1",
    destinationId: "ninh-binh",
    authorName: "Mai Linh",
    rating: 5,
    comment:
      "Ngồi thuyền Tràng An lướt qua các hang động kỳ ảo, nước trong vắt nhìn thấy cả rong rêu. Leo đỉnh Hang Múa ngắm Tam Cốc chụp ảnh tuyệt đẹp.",
    visitMonth: "Tháng 03/2026",
    helpfulCount: 29,
    createdAt: "2026-03-12T16:00:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-nb-2",
    destinationId: "ninh-binh",
    authorName: "Đức Huy",
    rating: 5,
    comment:
      "Mùa lúa chín Tam Cốc tháng 5 vàng rực hai bên bờ sông Ngô Đồng. Dê núi nướng tảng và cơm cháy sốt dê tại Ninh Bình ngon xuất sắc!",
    visitMonth: "Tháng 05/2026",
    helpfulCount: 18,
    createdAt: "2026-05-28T11:20:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-sd-1",
    destinationId: "hang-son-doong",
    authorName: "Việt Hùng",
    rating: 5,
    comment:
      "Chuyến thám hiểm để đời! Cảnh tượng ánh sáng xuyên Hố Sụt 1 và bãi trại Hang Én hùng vĩ ngoài sức tưởng tượng. Đội ngũ chuyên gia và porter Oxalis cực kỳ chu đáo và an toàn.",
    visitMonth: "Tháng 03/2026",
    helpfulCount: 45,
    createdAt: "2026-03-20T14:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-sd-2",
    destinationId: "hang-son-doong",
    authorName: "Thanh Hương",
    rating: 5,
    comment:
      "Động Phong Nha nước xanh ngọc bích, zipline sông Chày và tắm bùn Hang Tối trải nghiệm rất đã. Gà nướng mẹt chấm muối cheo thơm nức mũi.",
    visitMonth: "Tháng 04/2026",
    helpfulCount: 22,
    createdAt: "2026-04-05T18:00:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-hl-1",
    destinationId: "ha-long",
    authorName: "Quỳnh Nga",
    rating: 5,
    comment:
      "Hải trình Tuyến 2 tuyệt mỹ! Hang Sửng Sốt thạch nhũ lung linh kỳ ảo, leo đỉnh Ti Tốp ngắm toàn cảnh 360 độ vịnh Hạ Long đẹp nghẹt thở. Chèo kayak ở Hang Luồn cực kỳ thú vị.",
    visitMonth: "Tháng 04/2026",
    helpfulCount: 36,
    createdAt: "2026-04-18T10:15:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-hl-2",
    destinationId: "ha-long",
    authorName: "Tuấn Anh",
    rating: 5,
    comment:
      "Bảo tàng Quảng Ninh kiến trúc than đá đen tuyền chụp ảnh siêu sang. Bánh cuốn chả mực giã tay bên Hòn Gai ăn một lần nhớ mãi, chả mực giòn ngọt sần sật.",
    visitMonth: "Tháng 05/2026",
    helpfulCount: 24,
    createdAt: "2026-05-10T16:40:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-sp-1",
    destinationId: "sa-pa",
    authorName: "Hồng Nhung",
    rating: 5,
    comment:
      "Chạm tay vào chóp inox Fansipan 3.143m giữa biển mây bồng bềnh là khoảnh khắc xúc động tuyệt vời! Đi bộ 600 bậc đá xuống ngắm tượng Phật rất thanh tịnh, lẩu cá tầm và cá hồi Sa Pa tươi ngọt.",
    visitMonth: "Tháng 03/2026",
    helpfulCount: 38,
    createdAt: "2026-03-22T09:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-sp-2",
    destinationId: "sa-pa",
    authorName: "Minh Trí",
    rating: 5,
    comment:
      "Hoàng hôn trên đèo Ô Quy Hồ đẹp đến ngỡ ngàng, mây cuộn như sóng thần bên dưới thung lũng. Trekking bản Tả Van và tắm lá thuốc người Dao Đỏ xong nhẹ cả người.",
    visitMonth: "Tháng 04/2026",
    helpfulCount: 27,
    createdAt: "2026-04-12T17:45:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-hg-1",
    destinationId: "ha-giang",
    authorName: "Đăng Khoa",
    rating: 5,
    comment:
      "Chuyến phượt Ha Giang Loop đẹp ngỡ ngàng ngoài sức tưởng tượng! Đứng trên đèo Mã Pí Lèng nhìn xuống dòng sông Nho Quế xanh như ngọc bích và đi thuyền xuyên Hẻm Tu Sản là trải nghiệm tuyệt vời nhất đời.",
    visitMonth: "Tháng 10/2026",
    helpfulCount: 42,
    createdAt: "2026-10-24T15:20:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-hg-2",
    destinationId: "ha-giang",
    authorName: "Khánh Linh",
    rating: 5,
    comment:
      "Bản Lô Lô Chải dưới chân Cột cờ Lũng Cú cực kỳ yên bình và mộc mạc. Bánh cuốn trứng nước xương nóng hổi ăn buổi sáng se lạnh ngon khó cưỡng. Cung đường đèo rất hùng vĩ!",
    visitMonth: "Tháng 11/2026",
    helpfulCount: 31,
    createdAt: "2026-11-05T08:45:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-ms-1",
    destinationId: "my-son",
    authorName: "Bảo Trâm",
    rating: 5,
    comment:
      "Thung lũng Mỹ Sơn buổi sáng sớm thâm nghiêm kỳ bí vô cùng! Kỹ thuật xây tháp bằng gạch nung không mạch vữa của người Chăm thật đáng kinh ngạc. Điệu múa Apsara và tiếng kèn Saranai dưới chân tháp cổ khiến mình nổi da gà vì quá xúc động.",
    visitMonth: "Tháng 03/2026",
    helpfulCount: 39,
    createdAt: "2026-03-18T08:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-ms-2",
    destinationId: "my-son",
    authorName: "Hoàng Nam",
    rating: 5,
    comment:
      "Kết hợp đi Mỹ Sơn buổi sáng rồi về ăn mì Quảng Phú Chiêm và bê thui Cầu Mống tại Nam Phước cực kỳ hợp lý. Chiều về Hội An thả hoa đăng sông Hoài thật trọn vẹn cung đường di sản miền Trung.",
    visitMonth: "Tháng 04/2026",
    helpfulCount: 28,
    createdAt: "2026-04-09T16:15:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-hue-1",
    destinationId: "hue",
    authorName: "Nhật Minh",
    rating: 5,
    comment:
      "Đại Nội Huế và Điện Kiến Trung vừa phục dựng đẹp lộng lẫy ngoài sức tưởng tượng! Đi lăng Khải Định nhìn tận mắt nghệ thuật khảm sành sứ tinh xảo đến từng chi tiết nhỏ. Đồ ăn Huế rẻ bất ngờ và ngon xuất sắc.",
    visitMonth: "Tháng 03/2026",
    helpfulCount: 46,
    createdAt: "2026-03-26T11:20:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-hue-2",
    destinationId: "hue",
    authorName: "Thùy Trang",
    rating: 5,
    comment:
      "Ngồi thuyền Rồng nghe Ca Huế trên sông Hương lúc tối thả hoa đăng rất lãng mạn. Buổi chiều lên đồi Vọng Cảnh ngắm hoàng hôn sông Hương và ghé làng hương Thuỷ Xuân chụp ảnh cổ phục siêu đẹp!",
    visitMonth: "Tháng 04/2026",
    helpfulCount: 35,
    createdAt: "2026-04-14T18:40:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-tm-1",
    destinationId: "chua-thien-mu",
    authorName: "Khánh Huyền",
    rating: 5,
    comment:
      "Ngắm hoàng hôn sông Hương từ bậc đá chùa Thiên Mụ là trải nghiệm đẹp nhất chuyến đi Huế của mình! Tháp Phước Duyên trầm mặc cổ kính soi bóng xuống dòng sông êm đềm. Bát đậu hũ gừng nóng dưới dốc chùa chỉ 10k mà ngon ấm lòng.",
    visitMonth: "Tháng 04/2026",
    helpfulCount: 38,
    createdAt: "2026-04-20T17:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-tm-2",
    destinationId: "chua-thien-mu",
    authorName: "Đức Trí",
    rating: 5,
    comment:
      "Tuyến kết hợp thuyền Rồng lên Thiên Mụ rồi đi bộ sang Nhà vườn An Hiên cực kỳ thơ mộng và nhẹ nhàng. Khuyên mọi người nên ghé cả Huyền Không Sơn Thượng trong rừng thông, không gian thiền tịnh tuyệt đối.",
    visitMonth: "Tháng 05/2026",
    helpfulCount: 26,
    createdAt: "2026-05-12T09:15:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-ha-1",
    destinationId: "hoi-an",
    authorName: "Thùy Dương",
    rating: 5,
    comment:
      "Phố cổ Hội An ban đêm lung linh huyền ảo như trong truyện cổ tích! Trải nghiệm đi thuyền gỗ thả hoa đăng trên sông Hoài và ăn cao lầu ở quán Liên thật sự khó quên. Hoa giấy tháng 3 nở rực rỡ khắp các mái ngói rêu phong.",
    visitMonth: "Tháng 03/2026",
    helpfulCount: 41,
    createdAt: "2026-03-24T19:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-ha-2",
    destinationId: "hoi-an",
    authorName: "Thanh Tùng",
    rating: 5,
    comment:
      "Ngồi thuyền thúng ở Rừng Dừa Bảy Mẫu lắc thúng cười nghiêng ngả, buổi chiều đạp xe ra biển An Bàng uống nước dừa ngắm hoàng hôn cực chill. Show Ký Ức Hội An dàn dựng đại cảnh sân khấu nước quá đỉnh cao!",
    visitMonth: "Tháng 04/2026",
    helpfulCount: 33,
    createdAt: "2026-04-16T15:20:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-cb-1",
    destinationId: "cat-ba",
    authorName: "Minh Hoàng",
    rating: 5,
    comment:
      "Vịnh Lan Hạ nước trong vắt và bình yên hơn Hạ Long rất nhiều. Chèo kayak xuyên hang Sáng Tối rồi tắm biển ở bãi Ba Trái Đào phê quên lối về! Bún tôm Cát Bà ở phố Núi Ngọc nước dùng siêu ngọt.",
    visitMonth: "Tháng 05/2026",
    helpfulCount: 37,
    createdAt: "2026-05-18T14:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-cb-2",
    destinationId: "cat-ba",
    authorName: "Hồng Nhung",
    rating: 5,
    comment:
      "Trekking Đỉnh Ngự Lâm ở VQG Cát Bà view ngắm trọn rừng kim giao và núi đá điệp trùng quá ngoạn mục. Làng cổ Việt Hải yên bình, được cá suối massage chân rất thư giãn.",
    visitMonth: "Tháng 06/2026",
    helpfulCount: 29,
    createdAt: "2026-06-08T11:15:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-bg-1",
    destinationId: "thac-ban-gioc",
    authorName: "Tuấn Kiệt",
    rating: 5,
    comment:
      "Thác Bản Giốc mùa lúa chín tháng 10 đẹp ngỡ ngàng! Nước sông Quây Sơn xanh như ngọc bích, đứng trên bè mảng sát chân thác bụi nước tung trắng xóa mát lạnh. Ngủ nhà sàn đá Khuổi Ky không gian rất tĩnh lặng.",
    visitMonth: "Tháng 10/2026",
    helpfulCount: 44,
    createdAt: "2026-10-18T10:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-bg-2",
    destinationId: "thac-ban-gioc",
    authorName: "Phương Mai",
    rating: 5,
    comment:
      "Suối Lê-nin ở Pác Bó nước trong vắt nhìn thấy từng đàn cá bơi lội, Động Ngườm Ngao thạch nhũ đài sen úp ngược siêu kỳ ảo. Bánh cuốn canh xương ở chợ Cao Bằng ăn sáng ấm bụng cực kỳ ngon!",
    visitMonth: "Tháng 10/2026",
    helpfulCount: 32,
    createdAt: "2026-10-25T16:15:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-pq-1",
    destinationId: "phu-quoc",
    authorName: "Hải Đăng",
    rating: 5,
    comment:
      "Hoàng hôn tại Thị trấn Hoàng Hôn và Cầu Hôn đẹp như một bức tranh Địa Trung Hải! Cáp treo Hòn Thơm nhìn xuống biển An Thới nước xanh ngọc bích cực kỳ choáng ngợp. Bún quậy Kiến Xây tự pha nước chấm ăn rất cuốn.",
    visitMonth: "Tháng 12/2026",
    helpfulCount: 48,
    createdAt: "2026-12-10T17:40:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-pq-2",
    destinationId: "phu-quoc",
    authorName: "Mai Anh",
    rating: 5,
    comment:
      "Bãi Sao cát trắng mịn như bột không hề có đá dăm, nước biển trong vắt. VinBus chạy miễn phí liên tục từ Dương Đông lên Grand World rất tiện lợi và tiết kiệm chi phí taxi.",
    visitMonth: "Tháng 01/2026",
    helpfulCount: 36,
    createdAt: "2026-01-15T10:20:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-dl-1",
    destinationId: "da-lat",
    authorName: "Thanh Trúc",
    rating: 5,
    comment:
      "Săn mây ở Đồi Chè Cầu Đất lúc 5h30 sáng đẹp nghẹt thở! Biển mây cuồn cuộn dưới chân cánh quạt điện gió khổng lồ. Tối về ăn nồi lẩu gà lá é Tao Ngộ cay the ấm nồng giữa trời 14 độ thật sự chuẩn bài.",
    visitMonth: "Tháng 11/2026",
    helpfulCount: 52,
    createdAt: "2026-11-20T08:15:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-dl-2",
    destinationId: "da-lat",
    authorName: "Quốc Bảo",
    rating: 5,
    comment:
      "Máng trượt thác Datanla siêu đã, lượn xuyên rừng thông rất an toàn và phấn khích. Hồ Tuyền Lâm buổi chiều yên bình tĩnh lặng, không khí mát dịu trong lành tuyệt đối.",
    visitMonth: "Tháng 12/2026",
    helpfulCount: 39,
    createdAt: "2026-12-05T16:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-cd-1",
    destinationId: "con-dao",
    authorName: "Khánh Linh",
    rating: 5,
    comment:
      "Viếng mộ Cô Sáu và các anh hùng liệt sĩ tại Nghĩa trang Hàng Dương lúc 20h đêm trong tiếng thông reo là trải nghiệm thiêng liêng và xúc động nhất cuộc đời mình. Mọi người nhớ chuẩn bị giỏ lễ tre xanh, không dùng đồ nhựa nhé.",
    visitMonth: "Tháng 04/2026",
    helpfulCount: 56,
    createdAt: "2026-04-18T20:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-cd-2",
    destinationId: "con-dao",
    authorName: "Hoàng Nam",
    rating: 5,
    comment:
      "Bãi Đầm Trầu cát vàng biển trong vắt, khoảnh khắc máy bay lướt sát đỉnh đầu để hạ cánh xuống Cỏ Ống thật sự choáng ngợp! Tour cano ra Hòn Bảy Cạnh xem thả rùa con về biển cực kỳ ý nghĩa và lặn ngắm san hô rất đẹp.",
    visitMonth: "Tháng 06/2026",
    helpfulCount: 42,
    createdAt: "2026-06-12T11:45:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-mn-1",
    destinationId: "mui-ne",
    authorName: "Đình Phúc",
    rating: 5,
    comment:
      "Tour xe Jeep đón lúc 4h30 sáng đi Bàu Trắng ngắm bình minh quá đỉnh cao! Đồi cát trắng mênh mông như sa mạc Dubai, tài xế xe Jeep chụp ảnh tạo dáng cực kỳ có tâm trên nóc xe. Cung đường đôi xe nước vàng đẹp không góc chết.",
    visitMonth: "Tháng 02/2026",
    helpfulCount: 47,
    createdAt: "2026-02-22T08:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-mn-2",
    destinationId: "mui-ne",
    authorName: "Bích Phương",
    rating: 5,
    comment:
      "Lội bộ chân trần dưới dòng suối mát lạnh ở Suối Tiên rất thích, hai bên bờ nhũ cát đỏ cam dựng đứng rất độc đáo. Lẩu thả mẹt hoa chuối tại Hàm Tiến ăn ngon lạ miệng, hải sản mua ở Làng chài Mũi Né sáng sớm tươi rói và rẻ.",
    visitMonth: "Tháng 03/2026",
    helpfulCount: 38,
    createdAt: "2026-03-15T14:20:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-mc-1",
    destinationId: "mai-chau",
    authorName: "Văn Hùng",
    rating: 5,
    comment:
      "Dừng chân ăn ngô nướng ở Đèo Đá Trắng trong sương mù cực kỳ chill! Bản Lác yên bình, sáng đạp xe giữa cánh đồng lúa ngát hương rồi tối ngồi ăn mẹt lợn mán xem múa xòe múa sạp uống rượu cần thật sự ấm cúng.",
    visitMonth: "Tháng 04/2026",
    helpfulCount: 45,
    createdAt: "2026-04-10T11:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-mc-2",
    destinationId: "mai-chau",
    authorName: "Thu Hà",
    rating: 5,
    comment:
      "Leo 1.200 bậc đá lên Hang Chiều nhìn xuống toàn cảnh thung lũng tuyệt đẹp! Khu vực Ba Khan ven hồ Hòa Bình nước xanh như ngọc bích, cảnh sắc yên bình không hề ồn ào.",
    visitMonth: "Tháng 09/2026",
    helpfulCount: 36,
    createdAt: "2026-09-18T16:45:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-nbd-1",
    destinationId: "nui-ba-den",
    authorName: "Nhật Minh",
    rating: 5,
    comment:
      "Đi cáp treo chuyến 5h30 sáng lên đỉnh Núi Bà Đen đón bình minh và săn được hiện tượng mây đĩa bay đẹp nghẹt thở! Tượng Phật Bà Tây Bổ Đà Sơn bằng đồng cực kỳ uy nghiêm giữa vườn hoa ngập tràn sắc màu.",
    visitMonth: "Tháng 01/2026",
    helpfulCount: 51,
    createdAt: "2026-01-20T08:15:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-nbd-2",
    destinationId: "nui-ba-den",
    authorName: "Thùy Trang",
    rating: 5,
    comment:
      "Buổi tối xem show nhạc nước ánh sáng ở tượng Phật Di Lặc lung linh huyền ảo. Chiều hôm trước cắm trại ở Hồ Dầu Tiếng ngắm hoàng hôn lặn sau bóng Núi Bà đẹp như tranh thủy mặc. Bò tơ Năm Sánh thịt mềm ngọt cuốn bánh tráng rau rừng ăn là ghiền!",
    visitMonth: "Tháng 03/2026",
    helpfulCount: 43,
    createdAt: "2026-03-08T19:40:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-bnh-1",
    destinationId: "ba-na-hills",
    authorName: "Khánh Toàn",
    rating: 5,
    comment:
      "Lên chuyến cáp treo đầu tiên lúc 7h30 sáng lên Cầu Vàng là quyết định đúng đắn nhất chuyến đi! Không một bóng người chen chúc, sương sớm bay lững lờ dưới chân cầu đẹp như tiên cảnh. Làng Pháp về chiều sương giăng lãng mạn như Paris.",
    visitMonth: "Tháng 04/2026",
    helpfulCount: 58,
    createdAt: "2026-04-25T09:20:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-bnh-2",
    destinationId: "ba-na-hills",
    authorName: "Minh Trang",
    rating: 5,
    comment:
      "Buffet trưa ở nhà hàng Arapang siêu nhiều món, ăn no nê tiếp sức vui chơi cả buổi chiều ở Lâu đài Mặt Trăng. Đi tàu hỏa leo núi ngắm cảnh núi rừng rất thích. Tối về trung tâm Đà Nẵng ăn bánh tráng thịt heo chấm mắm nêm chuẩn bài!",
    visitMonth: "Tháng 06/2026",
    helpfulCount: 46,
    createdAt: "2026-06-18T16:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-td-1",
    destinationId: "tam-dao",
    authorName: "Vũ Hải Đăng",
    rating: 5,
    comment:
      "Tam Đảo cuối tuần trốn nóng từ Hà Nội quá tuyệt vời! Buổi sáng săn mây ở Quán Gió ngắm nhìn lâu đài cực đỉnh, tối ăn đồ nướng chợ đêm và lẩu cá tầm trong sương mù se lạnh đúng chất Đà Lạt miền Bắc. Lưu ý đường đèo dốc nên đi xe số hoặc thuê limousine cho an toàn.",
    visitMonth: "Tháng 07/2026",
    helpfulCount: 38,
    createdAt: "2026-07-22T08:15:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-td-2",
    destinationId: "tam-dao",
    authorName: "Nguyễn Quỳnh Chi",
    rating: 5,
    comment:
      "Đoạn bậc thang leo lên Đền Bà Chúa Thượng Ngàn qua rừng trúc đẹp tựa phim kiếm hiệp! Nhà thờ Đá lên ảnh rất Tây. Đặc biệt ngọn su su xào tỏi ở đây giòn ngọt đỉnh chóp, mình mua hẳn 5 bó đem về làm quà. Đi ngày trong tuần giá phòng rẻ hơn nửa so với thứ 7.",
    visitMonth: "Tháng 08/2026",
    helpfulCount: 29,
    createdAt: "2026-08-28T14:40:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-bv-1",
    destinationId: "ba-vi",
    authorName: "Trần Quốc Dũng",
    rating: 5,
    comment:
      "Đi Ba Vì đúng mùa dã quỳ tháng 11 tuyệt đẹp không từ nào tả xiết! Cả triền núi nhuộm vàng rực rỡ, sáng sớm lên Cốt 1100 săn được cả biển mây tràn qua thung lũng. Leo gần 1.300 bậc lên Đền Bác Hồ hơi mỏi chân nhưng lên đến Vọng Cảnh Đài nhìn xuống sông Đà thì xứng đáng từng bước đi. Lưu ý từ Cốt 400 trở lên dốc đứng cua gắt nên đi xe số cho an toàn.",
    visitMonth: "Tháng 11/2026",
    helpfulCount: 42,
    createdAt: "2026-11-15T09:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-bv-2",
    destinationId: "ba-vi",
    authorName: "Lê Thu Trang",
    rating: 5,
    comment:
      "Cuối tuần đưa cả gia đình đi cắm trại ở Rừng thông Cốt 400 cực kỳ chill và mát mẻ, nhiệt độ thấp hơn nội thành Hà Nội hẳn 7-8 độ. Các bạn nhỏ rất thích check-in Nhà kính Xương rồng với đủ hình thù ngộ nghĩnh. Xuống núi mua sữa chua nếp cẩm và bánh sữa Ba Vì về làm quà ai cũng khen ngon nức nở. Xuất trình thẻ sinh viên được giảm nửa tiền vé vào cổng!",
    visitMonth: "Tháng 07/2026",
    helpfulCount: 35,
    createdAt: "2026-07-20T16:45:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-hl-1",
    destinationId: "ham-lon",
    authorName: "Đặng Hoàng Long",
    rating: 5,
    comment:
      "Cung đường suối leo Đỉnh Hàm Lợn cực kỳ kích thích cho dân mê mạo hiểm! Băng qua các tảng đá rêu phong và khe nước mát rượi, lên đến đỉnh chạm vào cột mốc 462m ngắm toàn cảnh Sóc Sơn cảm giác rất tự hào. Nhớ chuẩn bị giày bám tốt và găng tay bảo hộ. Cắm trại qua đêm ở Hồ Núi Bàu đốt lửa nướng gà ngon tuyệt vời!",
    visitMonth: "Tháng 10/2026",
    helpfulCount: 39,
    createdAt: "2026-10-18T14:20:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-hl-2",
    destinationId: "ham-lon",
    authorName: "Nguyễn Thùy Linh",
    rating: 5,
    comment:
      "Chỉ cách Hà Nội hơn 40km mà không khí trong lành như Đà Lạt! Nhóm mình cắm trại ở rừng thông ven hồ, thuê trọn bộ lều bạt bếp nướng ngay chân núi giá rất rẻ. Sáng hôm sau sang Hồ Đồng Đò chèo SUP nước xanh ngắt cực chill. Chi phí cả chuyến 2 ngày 1 đêm chỉ hết hơn 500k/người mà vui hết nấc.",
    visitMonth: "Tháng 09/2026",
    helpfulCount: 31,
    createdAt: "2026-09-25T17:10:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-ss-1",
    destinationId: "sam-son",
    authorName: "Nguyễn Hoàng Nam",
    rating: 5,
    comment:
      "Từ khi có cao tốc mới chạy từ Hà Nội về Sầm Sơn chỉ mất 2 tiếng rưỡi, quá nhanh và thuận tiện! Bãi biển sóng to tắm cực đã, tối ra Quảng Trường Biển xem biểu diễn nhạc nước siêu hoành tráng không thua gì các điểm du lịch quốc tế. Ăn hải sản ở Chợ Cột Đỏ tươi ngon và giá rất hợp lý.",
    visitMonth: "Tháng 06/2026",
    helpfulCount: 45,
    createdAt: "2026-06-20T15:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-ss-2",
    destinationId: "sam-son",
    authorName: "Phạm Bích Ngọc",
    rating: 5,
    comment:
      "Công viên nước Sun World Sầm Sơn mới mở chơi siêu vui, bể tạo sóng thần dập dềnh cực đã. Buổi sáng sớm dậy 5h30 ra bãi D ngắm bình minh và xem ngư dân kéo lưới mua được mớ tôm ghẹ nhảy tanh tách mang về khách sạn hấp ngon ngọt lịm. Đền Độc Cước và Hòn Trống Mái view nhìn ra biển rất đẹp và linh thiêng.",
    visitMonth: "Tháng 07/2026",
    helpfulCount: 38,
    createdAt: "2026-07-14T10:15:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-tc-1",
    destinationId: "tam-chuc",
    authorName: "Trịnh Văn Hùng",
    rating: 5,
    comment:
      "Chùa Tam Chúc thực sự quá nguy nga và hoành tráng! Ngồi du thuyền lướt trên hồ Lục Nhạc ngắm núi đá vôi bao quanh cảm giác thanh thản lạ kỳ. Leo gần 300 bậc đá lên Chùa Ngọc hơi mệt nhưng tầm nhìn bao quát toàn bộ vùng hồ và các điện thờ phía dưới đẹp sững sờ. Buffet chay ở Thủy Đình ngon và sạch sẽ.",
    visitMonth: "Tháng 03/2026",
    helpfulCount: 48,
    createdAt: "2026-03-24T14:15:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-tc-2",
    destinationId: "tam-chuc",
    authorName: "Mai Tuyết Lan",
    rating: 5,
    comment:
      "Kết hợp đi Tam Chúc với Chùa Địa Tạng Phi Lai Tự là quyết định cực kỳ sáng suốt. Địa Tạng Phi Lai Tự đẹp tĩnh mịch với sân sỏi trắng tựa như ở Kyoto, chụp góc nào cũng an yên. Chiều về ghé ăn bánh cuốn chả Phủ Lý và mua 2 niêu cá kho làng Vũ Đại đem về ai ăn cũng tấm tắc khen.",
    visitMonth: "Tháng 10/2026",
    helpfulCount: 36,
    createdAt: "2026-10-12T16:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-bt-1",
    destinationId: "bat-trang",
    authorName: "Hoàng Minh Đức",
    rating: 5,
    comment:
      "Kiến trúc Bảo tàng Gốm Bát Tràng 7 bàn xoay bên ngoài chụp góc nào cũng như ở trời Âu! Trải nghiệm tự tay vuốt đất sét trên bàn xoay vui tuyệt vời, có nghệ nhân hướng dẫn tận tình. Món canh măng mực ở mâm cỗ làng cổ ngon xuất sắc, măng tước mảnh như sợi chỉ ăn ngọt thanh đậm đà. Đi xe buýt 47A từ Long Biên qua rất tiện.",
    visitMonth: "Tháng 10/2026",
    helpfulCount: 46,
    createdAt: "2026-10-15T11:20:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-bt-2",
    destinationId: "bat-trang",
    authorName: "Đỗ Thanh Thảo",
    rating: 5,
    comment:
      "Đi bộ trong những con ngõ cổ hẹp lát gạch Bát Tràng với tường phơi than cảm giác như ngược dòng thời gian về mấy trăm năm trước. Chợ gốm bạt ngàn đồ đẹp giá rẻ hơn mua trong nội thành Hà Nội rất nhiều. Chiều sang Ecopark đạp xe ngắm đàn thiên nga bơi lội, kết hợp chuyến đi cuối tuần 2 ngày 1 đêm hoàn hảo cho cả gia đình.",
    visitMonth: "Tháng 09/2026",
    helpfulCount: 37,
    createdAt: "2026-09-28T16:40:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-eg-1",
    destinationId: "eo-gio",
    authorName: "Phạm Minh Khôi",
    rating: 5,
    comment:
      "Con đường đi bộ ven biển ở Eo Gió đẹp thực sự ngỡ ngàng, nước biển xanh màu ngọc bích nhìn thấu đáy tựa như đảo Jeju! Mình đi vào tầm 16h30 nắng xiên hàng rào đỏ trắng lên ảnh tuyệt đẹp. Nhớ giữ chặt mũ nón vì gió lốc ở eo biển cực kỳ mạnh.",
    visitMonth: "Tháng 05/2026",
    helpfulCount: 47,
    createdAt: "2026-05-18T10:15:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-eg-2",
    destinationId: "eo-gio",
    authorName: "Lê Thị Thảo My",
    rating: 5,
    comment:
      "Đặt combo cano đi Bãi Kỳ Co rồi về lặn ngắm san hô Bãi Dứa và ăn hải sản ở làng chài Nhơn Lý siêu ngon và đáng tiền. Tượng Phật đôi ở Tịnh xá Ngọc Hoà ngay kế bên Eo Gió rất uy nghiêm và thanh tịnh. Trưa về trung tâm ăn bánh xèo tôm nhảy giòn rụm ngon quên lối về!",
    visitMonth: "Tháng 07/2026",
    helpfulCount: 38,
    createdAt: "2026-07-22T15:30:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-nt-1",
    destinationId: "nha-trang",
    authorName: "Vũ Hoàng Long",
    rating: 5,
    comment:
      "Vịnh Nha Trang biển đẹp xuất sắc, nước ở Đảo Hòn Mun trong vắt nhìn thấy cả đàn cá bơi lội dưới chân và rạn san hô ngũ sắc! Trải nghiệm ngâm bùn khoáng nóng ở Hòn Tằm ngắm trọn vịnh biển cực kỳ thư giãn và sảng khoái.",
    visitMonth: "Tháng 06/2026",
    helpfulCount: 52,
    createdAt: "2026-06-19T14:20:00.000Z",
    verifiedTraveler: true,
  },
  {
    id: "rev-nt-2",
    destinationId: "nha-trang",
    authorName: "Đặng Minh Phương",
    rating: 5,
    comment:
      "Đi cáp treo vượt biển sang VinWonders Hòn Tre chơi cả ngày không biết chán, show diễn Tata Show buổi tối đầu tư ánh sáng 3D mapping siêu mãn nhãn. Tối về bờ kè Tháp Bà ăn ốc hương trứng muối và ghé nem nướng Đặng Văn Quyên ngon tuyệt cú mèo!",
    visitMonth: "Tháng 07/2026",
    helpfulCount: 44,
    createdAt: "2026-07-25T18:45:00.000Z",
    verifiedTraveler: true,
  },
];

const STORAGE_KEY = "smart_trip_destination_reviews";

// In-memory cache for fast access & testing
let runtimeReviews: DestinationReview[] = [...SEED_REVIEWS];

function loadReviewsFromStorage(): DestinationReview[] {
  if (typeof window === "undefined") {
    return runtimeReviews;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REVIEWS));
      return [...SEED_REVIEWS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...SEED_REVIEWS];
  } catch {
    return runtimeReviews;
  }
}

function saveReviewsToStorage(reviews: DestinationReview[]): void {
  runtimeReviews = reviews;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch {
      // Safe fallback if localStorage quota exceeded
    }
  }
}

/**
 * Resets in-memory reviews to seed state (useful in tests).
 */
export function resetReviewsForTesting(): void {
  runtimeReviews = [...SEED_REVIEWS];
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

/**
 * Normalizes destination keys for flexible matching (e.g. 'da-nang' vs 'Đà Nẵng')
 */
export function normalizeDestinationId(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Retrieves all reviews for a destination.
 */
export function getDestinationReviews(destinationId: string): DestinationReview[] {
  const allReviews = loadReviewsFromStorage();
  const normalizedKey = normalizeDestinationId(destinationId);

  return allReviews.filter((r) => {
    const rKey = normalizeDestinationId(r.destinationId);
    return rKey.includes(normalizedKey) || normalizedKey.includes(rKey);
  });
}

/**
 * Calculates rating summary (average score, total count, star breakdown).
 */
export function getDestinationRatingSummary(
  destinationId: string
): DestinationRatingSummary {
  const reviews = getDestinationReviews(destinationId);

  if (reviews.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const review of reviews) {
    const r = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[r] = (breakdown[r] || 0) + 1;
    sum += review.rating;
  }

  const averageRating = Number((sum / reviews.length).toFixed(1));

  return {
    averageRating,
    totalReviews: reviews.length,
    breakdown,
  };
}

/**
 * Adds a new review submitted by a traveler.
 */
export function addDestinationReview(
  destinationId: string,
  input: {
    authorName: string;
    authorAvatar?: string;
    rating: number;
    comment: string;
    visitMonth?: string;
    verifiedTraveler?: boolean;
  }
): DestinationReview {
  const allReviews = loadReviewsFromStorage();

  const newReview: DestinationReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    destinationId: normalizeDestinationId(destinationId),
    authorName: input.authorName.trim() || "Du khách ẩn danh",
    authorAvatar: input.authorAvatar,
    rating: Math.min(5, Math.max(1, input.rating)),
    comment: input.comment.trim(),
    visitMonth: input.visitMonth || "Tháng gần đây",
    helpfulCount: 0,
    createdAt: new Date().toISOString(),
    verifiedTraveler: input.verifiedTraveler ?? true,
  };

  const updated = [newReview, ...allReviews];
  saveReviewsToStorage(updated);

  return newReview;
}

/**
 * Increments the helpful count for a specific review.
 */
export function markReviewHelpful(reviewId: string): boolean {
  const allReviews = loadReviewsFromStorage();
  const index = allReviews.findIndex((r) => r.id === reviewId);
  if (index === -1) {
    return false;
  }

  allReviews[index] = {
    ...allReviews[index],
    helpfulCount: allReviews[index].helpfulCount + 1,
  };

  saveReviewsToStorage([...allReviews]);
  return true;
}

