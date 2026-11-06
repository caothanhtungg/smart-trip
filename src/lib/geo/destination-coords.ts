/**
 * Dịch vụ xác định tọa độ trung tâm điểm đến và tọa độ mặc định của các danh lam thắng cảnh.
 * Đảm bảo bản đồ luôn luôn hiển thị đúng khu vực địa lý ngay cả khi người dùng chưa bật GPS
 * hoặc điểm dừng chưa kịp lưu tọa độ qua Geocoder.
 */

// Tọa độ trung tâm các tỉnh/thành phố du lịch phổ biến tại Việt Nam
export const KNOWN_DESTINATIONS: Record<string, [number, number]> = {
  'đà lạt': [11.9404, 108.4583],
  'da lat': [11.9404, 108.4583],
  'lâm đồng': [11.9404, 108.4583],
  'vườn quốc gia ba vì': [21.0811, 105.3769],
  'vuon quoc gia ba vi': [21.0811, 105.3769],
  'ba vì': [21.0811, 105.3769],
  'ba vi': [21.0811, 105.3769],
  'núi hàm lợn': [21.2981, 105.7836],
  'nui ham lon': [21.2981, 105.7836],
  'hàm lợn': [21.2981, 105.7836],
  'ham lon': [21.2981, 105.7836],
  'sóc sơn': [21.2897, 105.8183],
  'soc son': [21.2897, 105.8183],
  'bát tràng': [20.9765, 105.9168],
  'bat trang': [20.9765, 105.9168],
  'làng gốm bát tràng': [20.9765, 105.9168],
  'lang gom bat trang': [20.9765, 105.9168],
  'gia lâm': [20.9765, 105.9168],
  'gia lam': [20.9765, 105.9168],
  'hà nội': [21.0285, 105.8542],
  'ha noi': [21.0285, 105.8542],
  'hồ chí minh': [10.8231, 106.6297],
  'ho chi minh': [10.8231, 106.6297],
  'sài gòn': [10.8231, 106.6297],
  'sai gon': [10.8231, 106.6297],
  'bà nà hills': [15.9951, 107.9961],
  'ba na hills': [15.9951, 107.9961],
  'bà nà': [15.9951, 107.9961],
  'ba na': [15.9951, 107.9961],
  'đà nẵng': [16.0544, 108.2022],
  'da nang': [16.0544, 108.2022],
  'hội an': [15.8801, 108.338],
  'hoi an': [15.8801, 108.338],
  'nha trang': [12.2388, 109.1967],
  'khánh hòa': [12.2388, 109.1967],
  'phú quốc': [10.2899, 103.984],
  'phu quoc': [10.2899, 103.984],
  'kiên giang': [10.2899, 103.984],
  'côn đảo': [8.6836, 106.6094],
  'con dao': [8.6836, 106.6094],
  'vũng tàu': [10.346, 107.0843],
  'vung tau': [10.346, 107.0843],
  'huế': [16.4637, 107.5909],
  'hue': [16.4637, 107.5909],
  'sa pa': [22.3364, 103.8438],
  'sapa': [22.3364, 103.8438],
  'lào cai': [22.3364, 103.8438],
  'hạ long': [20.9505, 107.0734],
  'ha long': [20.9505, 107.0734],
  'quảng ninh': [20.9505, 107.0734],
  'ninh bình': [20.2506, 105.9745],
  'ninh binh': [20.2506, 105.9745],
  'eo gió': [13.8861, 109.2931],
  'eo gio': [13.8861, 109.2931],
  'kỳ co': [13.8542, 109.3036],
  'ky co': [13.8542, 109.3036],
  'quy nhơn': [13.782, 109.2197],
  'quy nhon': [13.782, 109.2197],
  'mũi né': [10.9486, 108.2961],
  'mui ne': [10.9486, 108.2961],
  'phan thiết': [10.9258, 108.0989],
  'phan thiet': [10.9258, 108.0989],
  'cần thơ': [10.0452, 105.7469],
  'can tho': [10.0452, 105.7469],
  'hà giang': [22.8233, 104.9839],
  'ha giang': [22.8233, 104.9839],
  'mộc châu': [20.8441, 104.6469],
  'moc chau': [20.8441, 104.6469],
  'mai châu': [20.6582, 105.0833],
  'mai chau': [20.6582, 105.0833],
  'hòa bình': [20.8172, 105.3376],
  'hoa binh': [20.8172, 105.3376],
  'núi bà đen': [11.3739, 106.1742],
  'nui ba den': [11.3739, 106.1742],
  'tây ninh': [11.3103, 106.0983],
  'tay ninh': [11.3103, 106.0983],
  'tam đảo': [21.4563, 105.6438],
  'tam dao': [21.4563, 105.6438],
  'vĩnh phúc': [21.3609, 105.5478],
  'vinh phuc': [21.3609, 105.5478],
  'sầm sơn': [19.7408, 105.9056],
  'sam son': [19.7408, 105.9056],
  'thanh hóa': [19.8075, 105.7764],
  'thanh hoa': [19.8075, 105.7764],
  'chùa tam chúc': [20.5786, 105.8012],
  'tam chúc': [20.5786, 105.8012],
  'chua tam chuc': [20.5786, 105.8012],
  'tam chuc': [20.5786, 105.8012],
  'hà nam': [20.5451, 105.9122],
  'ha nam': [20.5451, 105.9122],
};

// Tọa độ các địa danh/thắng cảnh nổi tiếng hay gặp
export const KNOWN_LANDMARKS: Record<string, [number, number]> = {
  // Núi Bà Đen & Tây Ninh
  'núi bà đen': [11.3739, 106.1742],
  'nui ba den': [11.3739, 106.1742],
  'đỉnh núi bà đen': [11.3739, 106.1742],
  'tượng phật bà tây bổ đà sơn': [11.3739, 106.1742],
  'tây bổ đà sơn': [11.3739, 106.1742],
  'ga bà đen': [11.3621, 106.1912],
  'chùa bà đen': [11.3688, 106.1835],
  'linh sơn tiên thạch tự': [11.3688, 106.1835],
  'hồ dầu tiếng': [11.3850, 106.2550],
  'tòa thánh tây ninh': [11.2856, 106.1368],

  // Tam Đảo & Vĩnh Phúc
  'quảng trường tam đảo': [21.4563, 105.6438],
  'quang truong tam dao': [21.4563, 105.6438],
  'nhà thờ đá tam đảo': [21.4571, 105.6432],
  'nha tho da tam dao': [21.4571, 105.6432],
  'thác bạc tam đảo': [21.4542, 105.6441],
  'thac bac tam dao': [21.4542, 105.6441],
  'đền bà chúa thượng ngàn': [21.4593, 105.6435],
  'den ba chua thuong ngan': [21.4593, 105.6435],
  'cổng trời tam đảo': [21.4578, 105.6416],
  'cong troi tam dao': [21.4578, 105.6416],
  'quán gió tam đảo': [21.4578, 105.6416],
  'quan gio tam dao': [21.4578, 105.6416],
  'thiền viện trúc lâm tây thiên': [21.4675, 105.5881],
  'thien vien truc lam tay thien': [21.4675, 105.5881],
  'tây thiên': [21.4675, 105.5881],
  'tay thien': [21.4675, 105.5881],
  'hồ xạ hương': [21.4395, 105.6022],

  // Vườn Quốc gia Ba Vì & Hà Nội
  'vườn quốc gia ba vì': [21.0811, 105.3769],
  'vuon quoc gia ba vi': [21.0811, 105.3769],
  'nhà kính xương rồng': [21.0736, 105.3672],
  'nha kinh xuong rong': [21.0736, 105.3672],
  'đồi thông cốt 400': [21.0736, 105.3672],
  'doi thong cot 400': [21.0736, 105.3672],
  'nhà thờ cổ ba vì': [21.0645, 105.3621],
  'nha tho co ba vi': [21.0645, 105.3621],
  'cốt 1100': [21.0598, 105.3638],
  'cot 1100': [21.0598, 105.3638],
  'đền thượng ba vì': [21.0581, 105.3667],
  'den thuong ba vi': [21.0581, 105.3667],
  'đỉnh tản viên': [21.0581, 105.3667],
  'dinh tan vien': [21.0581, 105.3667],
  'đền thờ bác hồ ba vì': [21.0589, 105.3586],
  'den tho bac ho ba vi': [21.0589, 105.3586],
  'đỉnh vua': [21.0589, 105.3586],
  'dinh vua': [21.0589, 105.3586],

  // Núi Hàm Lợn & Sóc Sơn
  'núi hàm lợn': [21.2981, 105.7836],
  'nui ham lon': [21.2981, 105.7836],
  'đỉnh núi hàm lợn': [21.2981, 105.7836],
  'hồ núi bàu': [21.3108, 105.7925],
  'ho nui bau': [21.3108, 105.7925],
  'hồ hàm lợn': [21.3108, 105.7925],
  'ho ham lon': [21.3108, 105.7925],
  'hồ đồng đò': [21.3094, 105.7642],
  'ho dong do': [21.3094, 105.7642],
  'đập hồ đồng đò': [21.3094, 105.7642],
  'việt phủ thành chương': [21.2889, 105.7764],
  'viet phu thanh chuong': [21.2889, 105.7764],
  'đền gióng sóc sơn': [21.2897, 105.8183],
  'den giong soc son': [21.2897, 105.8183],
  'chùa non nước': [21.2897, 105.8183],
  'chua non nuoc': [21.2897, 105.8183],

  // Sầm Sơn & Thanh Hóa
  'bãi biển sầm sơn': [19.7408, 105.9056],
  'bai bien sam son': [19.7408, 105.9056],
  'quảng trường biển sầm sơn': [19.7469, 105.9083],
  'quang truong bien sam son': [19.7469, 105.9083],
  'đền độc cước': [19.7292, 105.9001],
  'den doc cuoc': [19.7292, 105.9001],
  'hòn trống mái sầm sơn': [19.7241, 105.8938],
  'hon trong mai sam son': [19.7241, 105.8938],
  'hòn trống mái': [19.7241, 105.8938],
  'hon trong mai': [19.7241, 105.8938],
  'đền cô tiên': [19.7247, 105.8864],
  'den co tien': [19.7247, 105.8864],
  'công viên sun world sầm sơn': [19.7547, 105.8931],
  'sun world sầm sơn': [19.7547, 105.8931],
  'flc sầm sơn': [19.7611, 105.9158],
  'flc sam son': [19.7611, 105.9158],
  'chợ cột đỏ': [19.7385, 105.9012],
  'cho cot do': [19.7385, 105.9012],

  // Chùa Tam Chúc & Hà Nam
  'chùa tam chúc': [20.5786, 105.8012],
  'nhà khách thủy đình': [20.5562, 105.8115],
  'cổng tam quan nội': [20.5731, 105.8038],
  'điện tam thế': [20.5786, 105.8012],
  'vườn cột kinh': [20.5786, 105.8012],
  'chùa ngọc tam chúc': [20.5815, 105.7997],
  'chùa ngọc': [20.5815, 105.7997],
  'chùa bà đanh': [20.5594, 105.8542],
  'chùa địa tạng phi lai': [20.4911, 105.9839],
  'địa tạng phi lai tự': [20.4911, 105.9839],
  'kẽm trống': [20.4503, 105.9083],
  'đền trần thương': [20.5833, 106.0667],
  'làng vũ đại': [20.5186, 106.0522],

  // Vịnh Nha Trang & Khánh Hòa
  'bãi biển nha trang': [12.2388, 109.1967],
  'bai bien nha trang': [12.2388, 109.1967],
  'tháp trầm hương': [12.2388, 109.1967],
  'thap tram huong': [12.2388, 109.1967],
  'quảng trường 2/4': [12.2388, 109.1967],
  'quang truong 2/4': [12.2388, 109.1967],
  'bến tàu du lịch nha trang': [12.2014, 109.2147],
  'ben tau du lich nha trang': [12.2014, 109.2147],
  'cảng vĩnh trường': [12.2014, 109.2147],
  'cang vinh truong': [12.2014, 109.2147],
  'vinwonders nha trang': [12.2167, 109.2417],
  'vinpearl nha trang': [12.2167, 109.2417],
  'vinpearl harbour': [12.2167, 109.2417],
  'đảo hòn tre': [12.2167, 109.2417],
  'dao hon tre': [12.2167, 109.2417],
  'hòn tre': [12.2167, 109.2417],
  'hon tre': [12.2167, 109.2417],
  'đảo hòn mun': [12.1681, 109.3019],
  'dao hon mun': [12.1681, 109.3019],
  'hòn mun': [12.1681, 109.3019],
  'hon mun': [12.1681, 109.3019],
  'đảo hòn tằm': [12.1764, 109.2422],
  'dao hon tam': [12.1764, 109.2422],
  'hòn tằm': [12.1764, 109.2422],
  'hon tam': [12.1764, 109.2422],
  'viện hải dương học nha trang': [12.2069, 109.2147],
  'viện hải dương học': [12.2069, 109.2147],
  'vien hai duong hoc': [12.2069, 109.2147],
  'tháp bà ponagar': [12.2654, 109.1956],
  'thap ba ponagar': [12.2654, 109.1956],
  'ponagar': [12.2654, 109.1956],
  'hòn chồng nha trang': [12.2719, 109.2057],
  'hòn chồng': [12.2719, 109.2057],
  'hon chong': [12.2719, 109.2057],
  'chùa long sơn': [12.2505, 109.1802],
  'chua long son': [12.2505, 109.1802],

  // Eo Gió & Quy Nhơn, Bình Định
  'con đường đi bộ ven biển eo gió': [13.8856, 109.2942],
  'con duong di bo ven bien eo gio': [13.8856, 109.2942],
  'con đường ven biển eo gió': [13.8856, 109.2942],
  'khu du lịch eo gió': [13.8861, 109.2931],
  'khu du lich eo gio': [13.8861, 109.2931],
  'eo gió': [13.8861, 109.2931],
  'eo gio': [13.8861, 109.2931],
  'tịnh xá ngọc hoà': [13.8858, 109.2913],
  'tinh xa ngoc hoa': [13.8858, 109.2913],
  'ky co beach': [13.8542, 109.3036],
  'bãi biển kỳ co': [13.8542, 109.3036],
  'bai bien ky co': [13.8542, 109.3036],
  'kỳ co': [13.8542, 109.3036],
  'ky co': [13.8542, 109.3036],
  'flc luxury resort quy nhon': [13.8967, 109.2869],
  'flc quy nhơn': [13.8967, 109.2869],
  'flc quy nhon': [13.8967, 109.2869],
  'đồi cát phương mai': [13.8478, 109.2675],
  'doi cat phuong mai': [13.8478, 109.2675],
  'tháp đôi': [13.7914, 109.2125],
  'thap doi': [13.7914, 109.2125],
  'bãi trứng - khu du lịch ghềnh ráng': [13.7486, 109.2319],
  'bãi trứng': [13.7486, 109.2319],
  'bai trung': [13.7486, 109.2319],
  'bãi hoàng hậu': [13.7486, 109.2319],
  'ghềnh ráng': [13.7486, 109.2319],
  'ghenh rang': [13.7486, 109.2319],

  // Làng gốm Bát Tràng & Gia Lâm
  'làng gốm bát tràng': [20.9765, 105.9168],
  'lang gom bat trang': [20.9765, 105.9168],
  'trung tâm tinh hoa làng nghề việt': [20.9721, 105.9154],
  'trung tam tinh hoa lang nghe viet': [20.9721, 105.9154],
  'bảo tàng gốm bát tràng': [20.9721, 105.9154],
  'bao tang gom bat trang': [20.9721, 105.9154],
  'chợ gốm bát tràng': [20.9759, 105.9125],
  'cho gom bat trang': [20.9759, 105.9125],
  'làng cổ bát tràng': [20.9762, 105.9108],
  'lang co bat trang': [20.9762, 105.9108],
  'nhà cổ vạn vân': [20.9762, 105.9108],
  'nha co van van': [20.9762, 105.9108],
  'đình bát tràng': [20.9766, 105.9097],
  'dinh bat trang': [20.9766, 105.9097],
  'lò bầu cổ': [20.9748, 105.9136],
  'lo bau co': [20.9748, 105.9136],
  'ecopark': [20.9602, 105.9328],
  'vinhomes ocean park': [20.9935, 105.9461],

  // Mai Châu & Hòa Bình
  'bản lác': [20.6517, 105.0754],
  'ban lac': [20.6517, 105.0754],
  'bản pom coọng': [20.6545, 105.0759],
  'pom coong': [20.6545, 105.0759],
  'đèo thung khe': [20.6619, 105.1436],
  'thung khe': [20.6619, 105.1436],
  'đèo đá trắng': [20.6619, 105.1436],
  'đá trắng': [20.6619, 105.1436],
  'hang chiều': [20.6534, 105.0845],
  'hang chieu': [20.6534, 105.0845],
  'ba khan': [20.7326, 105.1118],

  // Mũi Né & Phan Thiết
  'bàu trắng': [11.0667, 108.4264],
  'bau trang': [11.0667, 108.4264],
  'đồi cát bay': [10.9486, 108.2961],
  'đồi cát đỏ': [10.9486, 108.2961],
  'suối tiên': [10.9519, 108.2575],
  'suoi tien': [10.9519, 108.2575],
  'làng chài mũi né': [10.9353, 108.2856],
  'lang chai mui ne': [10.9353, 108.2856],
  'hải đăng kê gà': [10.6975, 107.9917],
  'hai dang ke ga': [10.6975, 107.9917],
  'tháp po sah inư': [10.9358, 108.1656],
  'po sah inu': [10.9358, 108.1656],

  // Côn Đảo
  'cầu tàu 914': [8.6836, 106.6094],
  'cau tau 914': [8.6836, 106.6094],
  'nghĩa trang hàng dương': [8.6917, 106.6150],
  'hang duong': [8.6917, 106.6150],
  'mộ cô sáu': [8.6917, 106.6150],
  'bãi đầm trầu': [8.7381, 106.6214],
  'dam trau': [8.7381, 106.6214],
  'hòn bảy cạnh': [8.6681, 106.6875],
  'hon bay canh': [8.6681, 106.6875],
  'bãi nhát': [8.6453, 106.5786],
  'bai nhat': [8.6453, 106.5786],
  'chùa núi một': [8.6719, 106.5975],
  'chua nui mot': [8.6719, 106.5975],
  'nhà tù côn đảo': [8.6839, 106.6067],
  'nha tu con dao': [8.6839, 106.6067],

  // Đà Lạt
  'hồ xuân hương': [11.9366, 108.4452],
  'ho xuan huong': [11.9366, 108.4452],
  'thung lũng tình yêu': [11.9806, 108.4503],
  'thung lung tinh yeu': [11.9806, 108.4503],
  'quảng trường lâm viên': [11.9364, 108.4451],
  'quang truong lam vien': [11.9364, 108.4451],
  'chợ đà lạt': [11.9427, 108.4373],
  'cho da lat': [11.9427, 108.4373],
  'đỉnh langbiang': [12.0447, 108.4372],
  'langbiang': [12.0447, 108.4372],
  'dinh bảo đại': [11.9298, 108.4299],
  'dinh bao dai': [11.9298, 108.4299],
  'vườn hoa đà lạt': [11.9507, 108.4516],
  'vuon hoa da lat': [11.9507, 108.4516],
  'ga đà lạt': [11.9416, 108.4552],
  'ga da lat': [11.9416, 108.4552],
  'chùa linh phước': [11.9442, 108.4975],
  'chua linh phuoc': [11.9442, 108.4975],
  'thác datanla': [11.9029, 108.4485],
  'thac datanla': [11.9029, 108.4485],
  'thác prenn': [11.8767, 108.4447],
  'thac prenn': [11.8767, 108.4447],
  'hồ tuyền lâm': [11.895, 108.4344],
  'ho tuyen lam': [11.895, 108.4344],
  'đường hầm điêu khắc': [11.8844, 108.4144],
  'duong ham dieu khac': [11.8844, 108.4144],

  // Hà Nội
  'hồ gươm': [21.0287, 105.8523],
  'ho guom': [21.0287, 105.8523],
  'hồ hoàn kiếm': [21.0287, 105.8523],
  'ho hoan kiem': [21.0287, 105.8523],
  'lăng bác': [21.0369, 105.8347],
  'lang bac': [21.0369, 105.8347],
  'văn miếu': [21.0293, 105.836],
  'van mieu': [21.0293, 105.836],
  'phố cổ hà nội': [21.0345, 105.851],
  'pho co': [21.0345, 105.851],
  'hồ tây': [21.0558, 105.8202],
  'ho tay': [21.0558, 105.8202],

  // Bà Nà Hills
  'cầu vàng': [15.9951, 107.9961],
  'cau vang': [15.9951, 107.9961],
  'golden bridge': [15.9951, 107.9961],
  'làng pháp': [15.9975, 107.9881],
  'lang phap': [15.9975, 107.9881],
  'lâu đài mặt trăng': [15.9962, 107.9855],
  'chùa linh ứng bà nà': [15.9942, 107.9936],

  // Đà Nẵng
  'cầu rồng': [16.0611, 108.2272],
  'cau rong': [16.0611, 108.2272],
  'bà nà hills': [15.9989, 107.9946],
  'ba na hills': [15.9989, 107.9946],
  'ngũ hành sơn': [16.0041, 108.2635],
  'ngu hanh son': [16.0041, 108.2635],
  'bán đảo sơn trà': [16.1158, 108.2718],
  'ban dao son tra': [16.1158, 108.2718],
  'bãi biển mỹ khê': [16.0613, 108.2464],
  'my khe': [16.0613, 108.2464],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Lấy tọa độ trung tâm theo tên điểm đến của chuyến đi
 * Mặc định trả về Đà Lạt nếu điểm đến có nhắc tới Đà Lạt/Lâm Đồng, hoặc fallback Đà Lạt / Việt Nam.
 */
export function getDestinationCoordinates(
  destinationName?: string | null
): [number, number] {
  if (!destinationName || !destinationName.trim()) {
    return [11.9404, 108.4583]; // Mặc định Đà Lạt
  }

  const raw = destinationName.toLowerCase().trim();
  const normalized = normalizeText(destinationName);

  for (const [key, coords] of Object.entries(KNOWN_DESTINATIONS)) {
    if (raw.includes(key) || normalized.includes(normalizeText(key))) {
      return coords;
    }
  }

  // Tọa độ trung tâm mặc định (Đà Lạt)
  return [11.9404, 108.4583];
}

/**
 * Giải quyết tọa độ cho một điểm dừng:
 * 1. Nếu đã có sẵn latitude/longitude hoặc lat/lng thì dùng ngay.
 * 2. Nếu chưa có, đối soát theo tên địa danh nổi tiếng (Hồ Xuân Hương, Thung Lũng Tình Yêu,...)
 * 3. Nếu vẫn không khớp, trả về null.
 */
export function resolveItemCoordinates(
  item: {
    latitude?: number | null;
    longitude?: number | null;
    lat?: number | null;
    lng?: number | null;
    placeName?: string;
    address?: string | null;
  },
  destination?: string | null
): [number, number] | null {
  if (item.latitude != null && item.longitude != null) {
    return [item.latitude, item.longitude];
  }
  if (item.lat != null && item.lng != null) {
    return [item.lat, item.lng];
  }

  // Đối soát danh thắng nổi tiếng
  const name = item.placeName || '';
  const addr = item.address || '';
  // Kept for API compatibility with callers that provide a trip destination.
  void destination;
  const fullText = `${name} ${addr}`.toLowerCase();
  const normText = normalizeText(fullText);

  for (const [landmark, coords] of Object.entries(KNOWN_LANDMARKS)) {
    if (fullText.includes(landmark) || normText.includes(normalizeText(landmark))) {
      return coords;
    }
  }

  return null;
}
