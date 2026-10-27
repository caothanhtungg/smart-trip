# Đặc tả thiết kế: AI Trợ lý du lịch thông minh (AI Travel Assistant)

**Ngày:** 2026-10-27  
**Nhánh:** `feature/ai-travel-assistant`  
**Mục tiêu:** Cung cấp Trợ lý AI du lịch thông minh tích hợp nút nổi góc màn hình trong chuyến đi (`/trips/[id]`), cho phép hỏi đáp điểm đến, homestay, nhà xe, dự toán chi phí, và tương tác trực tiếp 1-click với Bản đồ tương tác, Lịch trình và Chi phí chuyến đi.

---

## 1. Bối cảnh & Mục tiêu người dùng

Người dùng khi đi du lịch theo nhóm thường gặp khó khăn:
- Không biết nên ở homestay nào đẹp, giá phải chăng, gần các điểm tham quan.
- Cần tìm nhà xe uy tín từ nơi khởi hành đến điểm đến kèm giá vé tham khảo.
- Cần ước tính chi phí cho chuyến đi và muốn đưa ngay địa điểm vào lịch trình/chi tiêu mà không phải gõ lại thủ công.
- Muốn xem ngay địa điểm đó nằm ở vị trí nào trên bản đồ để tối ưu cung đường.

**Giải pháp:**
Trợ lý AI thông minh hiển thị dưới dạng nút nổi thông minh (*Floating Smart Button*) ở góc màn hình của mọi trang chi tiết chuyến đi, kết nối trực tiếp với Bản đồ Leaflet, Lịch trình (`ItineraryItem`) và Chi tiêu (`Expense`).

---

## 2. Trải nghiệm người dùng (UX/UI Specification)

### 2.1. Nút nổi thông minh (Floating AI Trigger)
- **Vị trí:** Cố định góc dưới bên phải (`fixed bottom-6 right-6 z-40`).
- **Hình thức:** Nút tròn nổi hoặc viên thuốc bo tròn mềm mại (`rounded-full`), màu chủ đạo Baltic Blue (`#184E77`), viền phát sáng nhẹ Mint/Lime (`#D9ED92`), icon `Sparkles` của Lucide React.
- **Micro-interaction:** Khi di chuột có hiệu ứng bay nhẹ (`transform: translateY(-2px)`), khi có tin nhắn mới hoặc mở lần đầu có badge gợi ý nhanh.

### 2.2. Bảng hội thoại Trợ lý (AI Assistant Drawer / Panel)
- **Kích thước:** Chiều rộng 380px - 440px trên Desktop/Tablet, full-screen hoặc bottom sheet trên Mobile.
- **Header:**
  - Tiêu đề: "Trợ lý du lịch Smart Trip"
  - Phụ đề hiển thị theo ngữ cảnh: "Đang hỗ trợ chuyến đi [Tên chuyến đi - Điểm đến]"
  - Nút thu nhỏ / đóng (`X`).
- **Gợi ý nhanh (Prompt Chips):**
  - "🏡 Gợi ý homestay uy tín"
  - "🚌 Tìm nhà xe & giá vé"
  - "🍜 Địa điểm ăn uống đặc sản"
  - "💰 Dự toán chi phí chuyến đi"
- **Nội dung tin nhắn (Chat Flow):**
  - Tin nhắn người dùng: Nền xanh nhạt, căn phải.
  - Tin nhắn AI: Nền trắng thẻ nổi viền `#DDEBD0`, icon trợ lý, câu trả lời tự nhiên định dạng Markdown.
- **Thẻ địa điểm gợi ý (AISuggestionCard):**
  Mỗi khi AI đề xuất địa điểm, homestay, nhà xe, bên dưới câu trả lời sẽ xuất hiện các thẻ trực quan:
  - Tên địa điểm / nhà xe + Badge phân loại (`Homestay`, `Nhà xe`, `Ăn uống`, `Điểm tham quan`).
  - Mức giá dự kiến chuẩn VND (ví dụ: `250.000 ₫ - 450.000 ₫`).
  - Địa chỉ hoặc vị trí ước tính.
  - Bộ ba nút hành động nhanh:
    1. **"Xem trên bản đồ"** (Icon `MapPin`): Tự động định vị và zoom bản đồ đến tọa độ `[lat, lng]`.
    2. **"Thêm vào lịch trình"** (Icon `CalendarPlus`): Đưa địa điểm vào lịch trình chuyến đi kèm tọa độ.
    3. **"Thêm vào chi phí"** (Icon `Receipt`): Tạo khoản chi dự kiến vào danh sách chi tiêu.
- **Thanh nhập liệu (Input Bar):**
  - Ô nhập câu hỏi với placeholder thân thiện: "Hỏi về homestay, nhà xe, ăn uống, chi phí..."
  - Nút gửi (Icon `Send`), vô hiệu hóa khi đang sinh câu trả lời.

---

## 3. Kiến trúc kỹ thuật & API

### 3.1. Domain Model & DTOs
File: `src/lib/types/ai-assistant.ts`
```ts
export type AISuggestionCategory = 'homestay' | 'transport' | 'food' | 'attraction' | 'other';

export interface AISuggestionItem {
  id: string;
  name: string;
  category: AISuggestionCategory;
  description: string;
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactInfo?: string;
}

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: AISuggestionItem[];
  timestamp: string;
}

export interface AIAssistantRequest {
  message: string;
  tripContext?: {
    id: string;
    title: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    memberCount?: number;
  };
}

export interface AIAssistantResponse {
  answer: string;
  suggestions: AISuggestionItem[];
}
```

### 3.2. AI Service & Resilient Engine
File: `src/lib/ai/travel-assistant-service.ts`
- **Chế độ có API Key (Google Gemini):**
  - Sử dụng REST API endpoint của Google Gemini (`gemini-1.5-flash` hoặc `gemini-2.5-flash`).
  - Định dạng System Prompt bắt buộc trả lời chuẩn xác bằng tiếng Việt, cung cấp giá VND và thông tin thực tế tại Việt Nam.
  - Phân tích và trích xuất JSON cấu trúc cho danh sách `suggestions`.
- **Chế độ Fallback thông minh (Local Knowledge Base):**
  - Tích hợp sẵn cơ sở tri thức chọn lọc cho các điểm du lịch nổi tiếng tại Việt Nam: Đà Lạt, Sa Pa, Hà Giang, Đà Nẵng, Hội An, Phú Quốc, Ninh Bình, Nha Trang, Vũng Tàu, Hà Nội, TP.HCM.
  - Nhận diện ý định câu hỏi bằng xử lý ngôn ngữ tự nhiên cơ bản (từ khóa: homestay/khách sạn, nhà xe/xe khách/vé xe, ăn uống/quán ăn/đặc sản, chi phí/dự toán).
  - Trả về danh sách gợi ý chính xác có tọa độ thực tế, số điện thoại nhà xe và giá vé niêm yết tham khảo.
  - Đảm bảo 100% test case offline chạy ổn định mà không phụ thuộc vào kết nối mạng hay API key.

### 3.3. Route Handler
File: `src/app/api/trips/[id]/ai-assistant/route.ts`
- Phương thức: `POST /api/trips/[id]/ai-assistant`
- Xác thực: Yêu cầu đăng nhập và là thành viên chuyến đi (`requireTripMembership`).
- Xử lý: Lấy ngữ cảnh chuyến đi từ database (tiêu đề, điểm đến, ngày bắt đầu/kết thúc, số lượng thành viên), gọi `generateTravelSuggestions`, trả về JSON kết quả.

### 3.4. Tương tác với Bản đồ Leaflet & Lịch trình
- Sử dụng CustomEvent `smart-trip:focus-map` mang thông tin `{ latitude, longitude, name }`.
- Component bản đồ `TripLeafletMap` lắng nghe sự kiện này: tự động flyTo/panTo tới vị trí và mở popup địa điểm.
- Nút "Thêm vào lịch trình" gọi API `POST /api/trips/[id]/itinerary` hoặc mở modal thêm lịch trình với dữ liệu điền sẵn.
- Nút "Thêm vào chi phí" mở modal tạo chi phí với tên địa điểm và số tiền ước tính điền sẵn.

---

## 4. Tiêu chuẩn thiết kế & Code
- Bảng màu: Tactile Organic Minimalism (`#184E77`, `#52B69A`, `#D9ED92`, `#F4F9EC`).
- Typography: Be Vietnam Pro, font size rõ ràng, line-height 1.5.
- Định dạng tiền tệ: Chuẩn VND có dấu chấm hàng nghìn và ký hiệu `₫` ở cuối (sử dụng hàm `formatVnd`).
- Icon: Lucide React (không dùng emoji làm icon chức năng).
- Testing: Kiểm thử Vitest cho Service, Engine Fallback, Validation, Route Handler và Component.
