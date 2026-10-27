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
  'hà nội': [21.0285, 105.8542],
  'ha noi': [21.0285, 105.8542],
  'hồ chí minh': [10.8231, 106.6297],
  'ho chi minh': [10.8231, 106.6297],
  'sài gòn': [10.8231, 106.6297],
  'sai gon': [10.8231, 106.6297],
  'đà nẵng': [16.0544, 108.2022],
  'da nang': [16.0544, 108.2022],
  'hội an': [15.8801, 108.338],
  'hoi an': [15.8801, 108.338],
  'nha trang': [12.2388, 109.1967],
  'khánh hòa': [12.2388, 109.1967],
  'phú quốc': [10.2899, 103.984],
  'phu quoc': [10.2899, 103.984],
  'kiên giang': [10.2899, 103.984],
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
  'quy nhơn': [13.782, 109.2197],
  'quy nhon': [13.782, 109.2197],
  'phan thiết': [10.9804, 108.2615],
  'phan thiet': [10.9804, 108.2615],
  'mũi né': [10.9333, 108.2833],
  'mui ne': [10.9333, 108.2833],
  'cần thơ': [10.0452, 105.7469],
  'can tho': [10.0452, 105.7469],
  'hà giang': [22.8233, 104.9839],
  'ha giang': [22.8233, 104.9839],
  'mộc châu': [20.8441, 104.6469],
  'moc chau': [20.8441, 104.6469],
};

// Tọa độ các địa danh/thắng cảnh nổi tiếng hay gặp
export const KNOWN_LANDMARKS: Record<string, [number, number]> = {
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
  const fullText = `${name} ${addr}`.toLowerCase();
  const normText = normalizeText(fullText);

  for (const [landmark, coords] of Object.entries(KNOWN_LANDMARKS)) {
    if (fullText.includes(landmark) || normText.includes(normalizeText(landmark))) {
      return coords;
    }
  }

  return null;
}
