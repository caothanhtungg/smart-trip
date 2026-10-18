# Kế hoạch triển khai Giai đoạn 2D.2 — Chia theo món & Phụ phí VAT/Dịch vụ (Itemized Split & Surcharges)

> **Dự án:** Smart Trip & Expense Planner (Release 1)  
> **Tài liệu:** Kế hoạch kỹ thuật & Đặc tả thuật toán Giai đoạn 2D.2  
> **Trạng thái:** ⏳ **ĐÃ HOÀN THIỆN RÀ SOÁT & ĐỒNG THUẬN THIẾT KẾ — CHỜ DUYỆT ĐỂ TRIỂN KHAI**  
> **Căn cứ pháp lý & kỹ thuật:** UC31, ERD (`expense_items`, `expense_item_members`, `expense_shares`), Sơ đồ tuần tự SD1 (`sodothietke/release1-sequence.md`), Thiết kế Stitch `chia_theo_m_n_l_t_3n2`, Quyết định đã duyệt ngày 18/10/2026 về Phụ phí VAT & Phí dịch vụ.

---

## 1. Tổng quan mục tiêu và phạm vi Giai đoạn 2D.2

### 1.1 Mục tiêu chính
Giai đoạn 2D.2 hoàn thiện tính năng **Chia tiền theo từng món (Itemized Split)** kết hợp với **Phụ phí VAT / Phí dịch vụ** cho phân hệ Chi tiêu của ứng dụng Smart Trip:
1. **Thuật toán phân bổ theo món (`computeItemizedShares`):** Tự động chia chi phí của từng món ăn cho đúng những người tham gia tiêu thụ món đó, xử lý triệt để phần dư 1 đồng toán học theo thứ tự `joinOrder` độc lập trên từng món.
2. **Dòng phụ phí VAT & Phí dịch vụ:** Phụ phí chung của hóa đơn được chia đều cho tất cả những người có ít nhất một món trong hóa đơn.
3. **Bất biến số học tuyệt đối:** $\sum \text{expense\_shares.amount} \equiv \text{expenses.amount}$, tiền luôn là số nguyên VND an toàn.
4. **Giao diện ma trận món ăn (`chia_theo_m_n_l_t_3n2`):** Trực quan hóa danh sách món ăn, checkbox ma trận người dùng, cột preview ảnh chứng từ hóa đơn, khối tóm tắt số tiền mỗi người phải trả kèm đối soát tổng tiền tức thời.

### 1.2 Ranh giới phạm vi (Scope Boundaries)
- **Trong phạm vi 2D.2:**
  - Chia theo từng món ăn với ma trận tích chọn thành viên.
  - Phụ phí VAT / phí dịch vụ là một dòng phụ phí riêng, chia đều cho những người có ít nhất một món trong hóa đơn.
  - Kiểm tra đối soát tổng các món + phụ phí phải khớp 100% với số tiền hóa đơn (`expenses.amount`).
  - Giao diện 2 cột chuẩn Stitch: cột trái preview ảnh hóa đơn (UC32), cột phải ma trận món và thẻ tóm tắt tạm tính mỗi người.
  - Xử lý in-session state để người dùng có thể tạo khoản chi chia theo món trong phiên hiện tại.
- **Nằm ngoài phạm vi 2D.2 (Tuyệt đối không làm):**
  - Không quét hóa đơn OCR tự động bằng AI (chỉ hiển thị ảnh người dùng đã đính kèm).
  - Không tự động phân bổ phần trăm phức tạp ngoài mô hình chia đều từng món.
  - Không triển khai backend/API PostgreSQL thật (giữ nguyên cấu trúc in-session/mock adapter của Phase 2).
  - Không làm phân hệ quyết toán/công nợ (chuyển sang 2D.3).

---

## 2. Thuật toán `computeItemizedShares` trong `src/lib/money/split.ts`

### 2.1 Cấu trúc đầu vào và nguyên tắc thuật toán

Hàm `computeItemizedShares` nhận vào:
1. `totalAmount: number`: Tổng số tiền của hóa đơn (integer VND an toàn, $> 0$).
2. `items: ItemizedExpenseItemInput[]`: Danh sách các món ăn trong hóa đơn (**bắt buộc không rỗng**, ít nhất 1 món). Mỗi món gồm:
   - `id: string`: Mã định danh món (phải duy nhất trong cùng một lời gọi, không trùng lặp).
   - `name: string`: Tên món (tối đa 200 ký tự).
   - `amount: number`: Thành tiền của món (số nguyên VND $> 0$).
   - `assignedMemberIds: string[]`: Danh sách ID các thành viên tham gia món này (không trùng lặp nội bộ, tối thiểu 1 người; mỗi ID phải thuộc danh sách `participants`).
3. `surcharge: ItemizedSurchargeInput | null`: Dòng phụ phí VAT / Phí dịch vụ:
   - `amount: number`: Số tiền phụ phí (số nguyên VND $\ge 0$). Khi `null` tương đương `amount = 0`.
   - `name?: string`: Tên hiển thị (mặc định: "Thuế & phí dịch vụ").
4. `participants: ParticipantWithJoinOrder[]`: Danh sách tất cả thành viên của chuyến đi có thể tham gia hóa đơn, kèm `joinOrder`.

```typescript
export interface ItemizedExpenseItemInput {
  id: string;
  name: string;
  amount: number;
  assignedMemberIds: string[];
}

export interface ItemizedSurchargeInput {
  name?: string;
  amount: number;
}

export interface ParticipantWithJoinOrder {
  id: string;
  joinOrder: number;
}

export interface ItemizedShareResult {
  memberId: string;
  itemsAmount: number;     // Tổng tiền các món đã tham gia
  surchargeAmount: number; // Phần phụ phí VAT/dịch vụ phải chịu
  totalAmount: number;     // itemsAmount + surchargeAmount
  itemDetails: {
    itemId: string;
    amount: number;
    hasRemainderExtra: boolean;
  }[];
}
```

### 2.2 Điều kiện ném lỗi của `computeItemizedShares`

Hàm phải ném lỗi rõ ràng (không im lặng) trong tất cả các trường hợp sau:

| # | Điều kiện vi phạm | Thông điệp lỗi (ví dụ) |
|:---:|---|---|
| E1 | `items` rỗng (`items.length === 0`) | `"Chia theo món bắt buộc có ít nhất 1 món"` |
| E2 | Tồn tại `item.id` trùng lặp trong cùng mảng `items` | `"Món có id trùng lặp: '<id>'"` |
| E3 | `item.assignedMemberIds` chứa ID không thuộc `participants` | `"Thành viên '<id>' không hợp lệ hoặc không thuộc chuyến đi"` |
| E4 | `item.assignedMemberIds` chứa ID trùng lặp trong cùng một món | `"Món '<tên>' có thành viên được gán trùng: '<id>'"` |
| E5 | $\sum A_k + \text{Surcharge} \neq \text{totalAmount}$ | `"Tổng các món và phụ phí (X ₫) không khớp với tổng hóa đơn (Y ₫), lệch Z ₫"` |

> **Ghi chú E3:** ID không hợp lệ bao gồm cả thành viên đã rời nhóm (`status = "LEFT"`) — validation phải lọc danh sách `participants` chỉ chứa thành viên còn hoạt động trước khi gọi hàm này.

### 2.3 Quy tắc phân bổ từng món ăn (Quy tắc R4 áp dụng cục bộ)
Đối với mỗi món ăn $k$ có số tiền $A_k$ và danh sách người tham gia $P_k$ ($n_k = |P_k| \ge 1$):
1. Sắp xếp các thành viên trong $P_k$ theo thứ tự `joinOrder` tăng dần.
   - **Xử lý khi thành viên có cùng `joinOrder` (Deterministic Tie-breaker):** Nếu có các thành viên có cùng `joinOrder` (dữ liệu mock hoặc lỗi dữ liệu), sử dụng `id` sắp xếp theo thứ tự mã ký tự tăng dần (`a.id < b.id ? -1 : a.id > b.id ? 1 : 0`), tương tự như cơ chế tie-break đã chuẩn hóa tại `simplify.ts`. Đồng thời, tầng validation từ chối dữ liệu nếu phát hiện các thành viên trong chuyến đi có cùng `joinOrder`. Điều này bảo đảm thuật toán 100% tất định (deterministic), không phụ thuộc vào thứ tự ban đầu của mảng `items` hay `assignedMemberIds`.
2. Áp dụng quy tắc chia đều có phần dư R4:
   $$\text{Base}_k = \lfloor A_k / n_k \rfloor, \quad \text{Remainder}_k = A_k - (\text{Base}_k \times n_k)$$
3. $\text{Remainder}_k$ thành viên có thứ tự ưu tiên cao nhất (`joinOrder` nhỏ nhất, tie-break theo `id`) nhận thêm 1 đồng: $\text{Share}_{k, i} = \text{Base}_k + 1$. Các thành viên còn lại nhận $\text{Share}_{k, i} = \text{Base}_k$.
4. Bất biến cục bộ cho từng món:
   $$\sum_{i \in P_k} \text{Share}_{k, i} = A_k$$

### 2.4 Phân bổ dòng "Thuế & phí dịch vụ" (Surcharge)

#### Định nghĩa "Người tham gia hóa đơn":
- **Khái niệm:** Một người được xem là *người tham gia hóa đơn* khi và chỉ khi người đó **được gán ít nhất một món ăn trong hóa đơn** ($|\{k \mid i \in P_k\}| \ge 1$).
- **Lý do:** Nếu một thành viên không ăn bất kỳ món nào trong bữa ăn này, việc bắt họ chịu VAT của bữa đó là phi lý và gây tranh cãi thực tế.
- Tập hợp người tham gia hóa đơn: $P_{\text{bill}} = \bigcup_{k} P_k$.
- **Không có ngoại lệ "hóa đơn chỉ toàn phụ phí":** Do chia theo món bắt buộc có ít nhất 1 món (E1), $P_{\text{bill}}$ luôn được xác định từ người có ít nhất một món, không cần fallback.
- **Quy tắc phân bổ phụ phí:**
  - Giả sử số người tham gia hóa đơn là $n_{\text{bill}} = |P_{\text{bill}}|$.
  - Sắp xếp $P_{\text{bill}}$ theo `joinOrder` tăng dần (áp dụng cùng tie-break `id` nếu trùng `joinOrder`).
  - Áp dụng quy tắc chia đều R4:
    $$\text{Base}_{\text{sur}} = \lfloor \text{Surcharge} / n_{\text{bill}} \rfloor, \quad \text{Remainder}_{\text{sur}} = \text{Surcharge} - (\text{Base}_{\text{sur}} \times n_{\text{bill}})$$
  - $\text{Remainder}_{\text{sur}}$ thành viên đầu tiên theo thứ tự ưu tiên nhận thêm 1 đồng.
  - Bất biến phụ phí:
    $$\sum_{i \in P_{\text{bill}}} \text{SurchargeShare}_i = \text{Surcharge}$$

### 2.5 Kết quả trả về (Chỉ gồm người có ít nhất 1 món)
Mảng `ItemizedShareResult[]` **chỉ chứa các thành viên có ít nhất một món được gán**. Những thành viên trong `participants` không có món nào **không được tạo dòng kết quả**, tránh tạo các `expense_shares` không cần thiết với `amount = 0` trong DB.

### 2.6 Bất biến tổng và xử lý chênh lệch (Reconciliation)
1. **Bất biến tổng:**
   $$\sum_{i \in P_{\text{bill}}} \text{totalAmount}_i = \sum_k A_k + \text{Surcharge} = \text{totalAmount}$$
2. **Quy tắc xử lý khi tổng các món + phụ phí $\neq$ tổng số tiền hóa đơn:**
   - **Chặn lưu tuyệt đối:** Giao diện vô hiệu hóa nút "Lưu" / "Xong", hiển thị cảnh báo lỗi bằng tiếng Việt rõ ràng với số tiền chênh lệch cụ thể.
   - Chỉ cho phép lưu khi độ lệch bằng đúng 0 đồng (`difference === 0`).

---

## 3. Hạn chế đã biết cần ghi rõ trong tài liệu và giao diện

### 3.1 Bản chất hạn chế
Theo quyết định nghiệp vụ đã được phê duyệt cho Release 1:  
> *"VAT và phí dịch vụ là một dòng phụ phí riêng, chia đều cho những người tham gia hóa đơn."*

Cách tính này mang lại lợi thế:
- Cực kỳ minh bạch, dễ hiểu đối với tất cả thành viên trong nhóm.
- Tránh được các phép tính nhân tỷ lệ phần trăm thập phân phức tạp gây ra nhiều phần dư khó kiểm soát.

Tuy nhiên, tồn tại **hạn chế đã biết (Known Limitation):**
> **"Người ăn ít vẫn chịu phụ phí bằng người ăn nhiều."**  
> *Ví dụ cụ thể:* Bạn A chỉ uống 1 chai nước ngọt 30.000 ₫, bạn B ăn lẩu và uống bia hết 400.000 ₫. Khi hóa đơn có 100.000 ₫ tiền thuế VAT & phục vụ chia đều cho 4 người (mỗi người 25.000 ₫), bạn A phải trả thêm 25.000 ₫ tiền thuế (tương đương 83% tiền nước của mình), trong khi bạn B cũng chỉ trả 25.000 ₫ tiền thuế (chỉ bằng 6.25% tiền ăn của mình).

### 3.2 Thể hiện trên giao diện và tài liệu
1. **Trong tài liệu đặc tả & Release Notes:** Ghi rõ hạn chế này thuộc phạm vi mô hình đơn giản hóa của Release 1.
2. **Trên giao diện người dùng (`chia_theo_m_n_l_t_3n2`):**
   - Đặt dòng ghi chú giải thích minh bạch ngay dưới thẻ tổng kết tạm tính (giống thiết kế Stitch):  
     `• Công thức: Giá món chia số người dùng + Thuế/Phí chia đều những người tham gia hóa đơn.`
   - Có tooltip hoặc icon trợ giúp bên cạnh dòng "Thuế & phí dịch vụ":  
     *"Phụ phí được chia đều cho tất cả thành viên tham gia hóa đơn để đơn giản và minh bạch."*

---

## 4. Vấn đề dòng giảm giá (Discount / Khuyến mãi)

### 4.1 Bối cảnh và Ràng buộc ERD
Trong mô hình ERD hiện tại (`sodothietke/release1-erd.dbml`):
- `expenses.amount integer [not null, note: 'đồng VND, CHECK > 0 (R3)']`
- `expense_shares.amount integer [not null, note: 'phần của người này, CHECK >= 0']`
- `expense_items.amount integer [not null, note: 'thành tiền của món']`

### 4.2 Quyết định
> ✅ **ĐÃ DUYỆT CHỌN PHƯƠNG ÁN B** (Ngày 18/10/2026): Chưa hỗ trợ dòng giảm giá âm trong Release 1 để giữ nguyên vẹn cấu trúc ERD (`expense_items.amount > 0` và `expense_shares.amount >= 0`). Nếu có voucher/khuyến mãi, người dùng tự trừ trước vào tổng tiền hoặc giá các món ăn. Phương án A (sửa ERD) chuyển vào backlog của Release 2.

---

## 5. Phương án nhập số tiền tổng hóa đơn — Đã chốt Phương án (a)

> ✅ **QUYẾT ĐỊNH CHÍNH THỨC:** Người dùng đã phê duyệt chọn **Phương án (a)**: Người dùng nhập tổng số tiền hóa đơn trước ở form chính. Bước chia món chi tiết hóa các món và phụ phí để đối soát.

### 5.1 Luồng nghiệp vụ Phương án (a)
1. **Nhập tổng trước:** Người dùng nhập tổng tiền hóa đơn (`totalAmount`) ở màn hình/bước 1 của form thêm khoản chi.
2. **Chi tiết hóa từng món:** Ở bước 2 (chia theo món), người dùng nhập tên món, số tiền từng món, tích chọn người tham gia và nhập phụ phí VAT / dịch vụ (nếu có).
3. **Đối soát số học thời gian thực:**
   - Hệ thống hiển thị chip đối soát trực quan: `Đã phân bổ / Tổng hóa đơn`.
   - Tổng các món cộng phụ phí phải bằng **chính xác 100%** `totalAmount`.
4. **Chặn hoàn tất khi có sai lệch:**
   - Nếu chênh lệch khác 0 ₫ ($\sum \text{món} + \text{phụ phí} \neq \text{totalAmount}$), nút hoàn tất ("Xong" / "Lưu") bị vô hiệu hóa (disabled).
   - Hiển thị thông báo lỗi bằng tiếng Việt chỉ rõ số tiền lệch cụ thể (ví dụ: *"Tổng các món và phụ phí đang lệch +15.000 ₫ so với tổng hóa đơn"*).

### 5.2 Cơ sở lựa chọn Phương án (a) và loại bỏ Phương án (b)
- **Bảo toàn nguồn gốc sự thật (Single Source of Truth):** Trong mô hình ERD, `expenses.amount` là dữ liệu gốc độc lập (`CHECK > 0`). Chi tiết món (`expense_items`) và phần chia (`expense_shares`) là dữ liệu phân bổ dẫn xuất.
- **Phát hiện lỗi nhập liệu tức thì:** Phương án (b) tự động tính tổng có nguy cơ che giấu việc người dùng nhập thiếu món hoặc gõ nhầm giá tiền một món ăn trên hóa đơn giấy so với tổng tiền thực trả.
- **Tính nhất quán với giao diện Stitch:** Khớp hoàn toàn với bản thiết kế `chia_theo_m_n_l_t_3n2` vốn đã có thanh đối soát số tiền đã phân bổ.

---

## 6. Giao diện bước chia theo món — Thiết kế điều hướng đã chốt

### 6.1 Vấn đề "modal chồng modal"
Hiện tại, luồng đang mở `TripItemizedSplitModal` từ bên trong `TripExpenseFormModal`, tạo ra hiện tượng modal chồng modal:
- Về mặt UX: gây mất phương hướng cho người dùng (không rõ đang ở tầng nào).
- Về mặt kỹ thuật: quản lý z-index phức tạp, khó xử lý nút Back/ESC nhất quán.
- Khuyến nghị của các design system lớn: **không bao giờ chồng modal lên modal**.

### 6.2 Giải pháp đã được phê duyệt: Giải pháp A (Multi-step Modal)

> ✅ **QUYẾT ĐỊNH CHÍNH THỨC:** Người dùng đã phê duyệt chọn **Giải pháp A (Multi-step Modal)**: Chuyển đổi nội dung trong cùng `TripExpenseFormModal`, không mở modal thứ hai chồng lên modal đầu.

**Cơ chế hoạt động:**
- Hộp thoại `TripExpenseFormModal` được tổ chức lại theo mô hình Stepper / Wizard 2 bước trong cùng một modal duy nhất:
  - **Bước 1 — Thông tin chung:** Form chính (số tiền hóa đơn, tên khoản chi, danh mục, người trả tiền, ngày chi, ghi chú, và lựa chọn phương thức chia: Chia đều hoặc Chia theo món).
  - **Bước 2 — Chi tiết món ăn (chỉ kích hoạt khi chọn "Chia theo món"):** Thay thế nội dung bên trong modal bằng ma trận chia theo món (`chia_theo_m_n_l_t_3n2`), không mở thêm modal mới.
- **Thanh tiêu đề (Header):**
  - Hiển thị breadcrumb rõ ràng: `"Thêm khoản chi > Chia theo món"`.
  - Có nút `← Quay lại` ở góc trên để người dùng trở về Bước 1 bất cứ lúc nào.
- **Bảo toàn dữ liệu (State Preservation):**
  - Giữ nguyên 100% dữ liệu đã nhập ở Bước 1 khi chuyển sang Bước 2 và khi bấm `← Quay lại` về Bước 1. Người dùng có thể điều chỉnh lại tổng số tiền hoặc người trả tiền mà không bị mất danh sách món ăn đã nhập ở Bước 2.
- **Lợi ích kỹ thuật:**
  - Z-index luôn phẳng ở mức 1 lớp duy nhất; phím ESC đóng modal an toàn.
  - Phù hợp hoàn hảo với kiến trúc state in-session hiện tại của ứng dụng, tránh phải quản lý nhiều cổng portal đè lên nhau.

### 6.4 Dòng "Thuế & phí dịch vụ" — Chỉ đọc, không có checkbox từng người

Dòng "Thuế & phí dịch vụ" trong ma trận **phải là dòng chỉ đọc**:
- **Không có ô tích checkbox cho từng thành viên** (vì luật phân bổ cố định: chia đều cho người có ít nhất 1 món — không thể tuỳ chỉnh).
- Hiển thị nhãn mô tả cố định ngay dưới dòng: *"Chia đều cho những người có ít nhất một món"*.
- Mỗi cột thành viên hiển thị số tiền phụ phí phần của họ (tính toán tự động, không sửa được).
- Thiết kế trực quan phân biệt rõ: nền màu nhạt hơn hoặc icon khóa để báo hiệu đây là dòng tự động.

---

## 7. Kiểu dữ liệu và Danh mục File tạo/sửa

Tuân thủ nghiêm ngặt các quy tắc mã nguồn tại `PROJECT_CONTEXT.md` Mục 14:
- (a) Không mã màu hex, dùng Tailwind tokens chuẩn (`cerulean`, `yale-blue`, `hover-row`, `divider-hairline`, v.v.).
- (b) Mọi thuật ngữ giao diện khai báo tập trung trong `src/lib/labels.ts`.
- (c) Không viết cứng vai trò (`isHost` truyền từ session/context).
- (d) Tách biệt dữ liệu mẫu qua lớp `src/lib/data/*`.
- (e) Tiền luôn là số nguyên an toàn VND (`Number.isSafeInteger`, $\ge 0$).
- (f) Unit test Vitest đặt cạnh mã nguồn (`*.test.ts`).

### 7.1 Các kiểu dữ liệu bổ sung (`src/types/trip.ts`)
```typescript
/**
 * Chi tiết một món ăn trong khoản chi chia theo món (khớp ERD expense_items)
 */
export interface ExpenseItemData {
  id: string;
  name: string;
  amount: number; // Integer VND > 0
  assignedMemberIds: string[]; // Khớp quan hệ expense_item_members
}

/**
 * Phụ phí VAT / Phí dịch vụ đi kèm hóa đơn
 */
export interface ExpenseSurchargeData {
  name: string;
  amount: number; // Integer VND >= 0
}

/**
 * Dữ liệu form tạo khoản chi chia theo món
 */
export interface CreateItemizedExpenseFormData extends CreateExpenseFormData {
  splitMethod: "ITEMIZED";
  items: ExpenseItemData[];
  surcharge: ExpenseSurchargeData | null;
}
```

### 7.2 Danh mục file tạo mới hoặc sửa đổi

| STT | File | Hành động | Mục đích |
|:---:|---|:---:|---|
| 1 | `src/types/trip.ts` | Sửa | Khai báo các type cho `ExpenseItemData`, `ExpenseSurchargeData`, `CreateItemizedExpenseFormData`. |
| 2 | `src/lib/money/split.ts` | Sửa | Bổ sung hàm `computeItemizedShares` và helper tính toán phần chia món. |
| 3 | `src/lib/money/split.test.ts` | Sửa | Bổ sung bộ unit test và property-based test cho `computeItemizedShares`. |
| 4 | `src/lib/validation/itemized-expense.ts` | Tạo mới | Validate danh sách món: tên không rỗng, giá $> 0$, ít nhất 1 người/món, phụ phí $\ge 0$, và đối soát tổng khớp 100% với `totalAmount`. |
| 5 | `src/lib/validation/itemized-expense.test.ts` | Tạo mới | Bộ unit test kiểm thử toàn diện các điều kiện hợp lệ và lỗi của form chia món. |
| 6 | `src/lib/labels.ts` | Sửa | Bổ sung các nhãn tiếng Việt cho chia theo món, phụ phí VAT, lỗi chênh lệch, công thức phân bổ. |
| 7 | `src/components/trips/expenses/trip-itemized-split-modal.tsx` | Sửa | Refactor từ modal riêng sang multi-step bên trong `TripExpenseFormModal`; dòng VAT chỉ đọc không checkbox. |
| 8 | `src/components/trips/expenses/trip-expense-form-modal.tsx` | Sửa | Tích hợp stepper Bước 1/Bước 2, không mở modal mới. |
| 9 | `src/lib/data/trips.ts` | Sửa | Cập nhật hàm mock lưu khoản chi hỗ trợ lưu `items` và `surcharge` vào session data. |

---

## 8. Kế hoạch kiểm thử (Test Matrix)

### 8.1 Unit Test cho `computeItemizedShares` (`src/lib/money/split.test.ts`)

1. **Ca 1 (Hóa đơn 3 món tiêu chuẩn, không phụ phí):**
   - Món 1: 300.000 ₫ (gán A, B) → mỗi người 150.000 ₫.
   - Món 2: 200.000 ₫ (gán B, C) → mỗi người 100.000 ₫.
   - Món 3: 100.000 ₫ (gán C) → C chịu 100.000 ₫.
   - Kết quả: A: 150k, B: 250k, C: 200k. Tổng: 600.000 ₫ $\equiv$ 600.000 ₫.
   - **Xác nhận**: D và E (không có món) không xuất hiện trong mảng kết quả.

2. **Ca 2 (1 món gán cho đúng 1 người):**
   - Món 1: 150.000 ₫ gán cho B → B chịu trọn 150.000 ₫.

3. **Ca 3 (1 món gán cho tất cả thành viên):**
   - Món 1: 500.000 ₫ gán cho cả 5 người → mỗi người 100.000 ₫.

4. **Ca 4 (Phần dư 1 đồng ở từng món theo `joinOrder`):**
   - Món 100.000 ₫ chia 3 người (joinOrder 1, 2, 3) → Người 1: 33.334 ₫, Người 2: 33.333 ₫, Người 3: 33.333 ₫.

5. **Ca 5 (Phụ phí VAT/dịch vụ không chia hết cho người tham gia):**
   - Hóa đơn 1.000.000 ₫ tiền món + 100.000 ₫ VAT = 1.100.000 ₫. 3 người tham gia → VAT mỗi người: Người 1: 33.334 ₫, Người 2: 33.333 ₫, Người 3: 33.333 ₫.

6. **Ca 6 (Thành viên không ăn món nào không xuất hiện trong kết quả):**
   - Nhóm có 5 người A, B, C, D, E. Chỉ A, B, C ăn các món. Phụ phí VAT 60.000 ₫ → chỉ chia cho A, B, C (mỗi người 20.000 ₫). Mảng kết quả **chỉ gồm 3 phần tử** (A, B, C); D và E **không có phần tử nào** trong mảng trả về.

7. **Ca 7 (Phụ phí 0 ₫ — không tạo ra lỗi):**
   - Hóa đơn 300.000 ₫ tiền món, phụ phí `{ amount: 0 }` → phân bổ đúng 300.000 ₫ cho người có món; `surchargeAmount = 0` cho tất cả.

8. **Ca 8 (Phụ phí `null` — tương đương 0 ₫):**
   - `surcharge = null` → kết quả giống hệt Ca 7; không ném lỗi.

9. **Ca 9 (ID gán trùng trong một món — ném lỗi E4):**
   - Món "Phở bò" với `assignedMemberIds: ["member-a", "member-a"]` → ném lỗi E4.

10. **Ca 10 (Thành viên LEFT hoặc ID không tồn tại — ném lỗi E3):**
    - `assignedMemberIds` chứa ID của thành viên đã rời nhóm (`status = "LEFT"`) hoặc ID hoàn toàn không có trong `participants` → ném lỗi E3.

11. **Ca 11 (Danh sách món rỗng — ném lỗi E1):**
    - `items = []` → ném lỗi E1 ngay lập tức.

12. **Ca 12 (ID món trùng lặp — ném lỗi E2):**
    - Hai phần tử trong `items` có cùng `id` → ném lỗi E2.

13. **Ca 13 (Xáo thứ tự mảng `items` không làm thay đổi kết quả — Tính tất định tuyệt đối):**
    - Đảo thứ tự mảng `items` (ví dụ từ Món 1→2→3 sang 3→2→1) hoặc đảo thứ tự ID trong `assignedMemberIds` **tuyệt đối không làm thay đổi** tổng phần chi phí (`totalAmount`), tiền món (`itemsAmount`), và tiền phụ phí (`surchargeAmount`) của từng thành viên.
    - **Cơ sở toán học:**
      - Phần dư ở từng món $k$ được phân bổ hoàn toàn dựa trên `joinOrder` (kèm tie-break theo mã ký tự `id`) của các thành viên trong món đó; phần dư của phụ phí cũng được phân bổ độc lập theo `joinOrder` trong $P_{\text{bill}}$.
      - Vì phép cộng là giao hoán ($A + B = B + A$), tổng phần chia của mỗi thành viên là tổng các phần chia độc lập của từng món. Do đó, việc đảo thứ tự mảng `items` hoàn toàn không làm dịch chuyển phần dư 1 ₫ sang người khác. Người nhận phần dư ở từng món và phụ phí giữ nguyên 100% tất định.
    - **Kiểm thử tie-breaker:** Khi hai thành viên có cùng `joinOrder`, hệ thống dùng `id` (mã ký tự ASCII tăng dần) làm tiêu chí phụ xác định, bảo đảm kết quả độc lập tuyệt đối với thứ tự mảng đầu vào.

14. **Ca 14 (Tổng phần chia từng món bằng tiền món — bất biến cục bộ):**
    - Với mỗi món $k$: $\sum_{i \in P_k} \text{Share}_{k, i} = A_k$.

15. **Ca 15 (Các phần phụ phí chênh nhau tối đa 1 đồng):**
    - Kiểm tra: $\max(\text{SurchargeShare}_i) - \min(\text{SurchargeShare}_i) \le 1$ với tất cả $i \in P_{\text{bill}}$.

16. **Ca 16 (Tổng hóa đơn vượt `MAX_MONEY_VND` — bị chặn):**
    - `totalAmount > MAX_MONEY_VND` (hằng số an toàn đã định nghĩa) → ném lỗi `assertSafeIntegerAmount`.

17. **Ca 17 (Property-based test: 1.000 bộ hóa đơn ngẫu nhiên với Mulberry32 PRNG):**
    - Sinh ngẫu nhiên từ 1 đến 10 món với số tiền từ 1.000 ₫ đến 50.000.000 ₫.
    - Gán ngẫu nhiên cho từ 1 đến 8 thành viên.
    - Sinh ngẫu nhiên phụ phí từ 0 đến 5.000.000 ₫.
    - Kiểm tra bất biến: $\sum \text{shares.totalAmount} \equiv \text{totalAmount}$ và mọi phần chia đều là số nguyên an toàn $\ge 0$.

### 8.2 Unit Test cho Validation Form (`src/lib/validation/itemized-expense.test.ts`)

1. **Ca V1 (Chặn khi tổng các món + phụ phí lệch số tiền hóa đơn):**
   - Tổng hóa đơn: 1.000.000 ₫. Tổng món + VAT: 1.050.000 ₫ → Lỗi: thông báo chênh lệch 50.000 ₫.

2. **Ca V2 (Món ăn không có ai nhận):**
   - Món "Lẩu gà" có `assignedMemberIds: []` → Báo lỗi: *"Món 'Lẩu gà' chưa có thành viên nào nhận."*

3. **Ca V3 (Thành viên LEFT trong `assignedMemberIds`):**
   - Gán món cho thành viên có `status: "LEFT"` → Báo lỗi từ chối (không hợp lệ).

4. **Ca V4 (ID thành viên không tồn tại trong danh sách chuyến đi):**
   - `assignedMemberIds` chứa ID hoàn toàn không có trong `tripMembers` → Báo lỗi từ chối.

5. **Ca V5 (Tên món rỗng hoặc quá 200 ký tự):**
   - Báo lỗi validation tương ứng.

6. **Ca V6 (Số tiền món $\le 0$ hoặc không phải số nguyên an toàn):**
   - Báo lỗi số tiền không hợp lệ.

7. **Ca V7 (Phụ phí `null` — hợp lệ, không báo lỗi):**
   - `surcharge = null` → validation pass.

8. **Ca V8 (Phụ phí 0 ₫ — hợp lệ, không báo lỗi):**
   - `surcharge = { amount: 0 }` → validation pass.

---

## 9. Kế hoạch kiểm tra giao diện (Visual & Responsive QA)

Thực hiện kiểm thử hiển thị trên 3 kích thước màn hình theo tài liệu thiết kế Stitch:

### 9.1 Desktop (1280px)
- Bố cục 2 cột hoàn chỉnh (Cột trái 4 cols ~ 33.3%, Cột phải 8 cols ~ 66.6%).
- Cột trái: Card xem trước ảnh hóa đơn đính kèm sticky theo màn hình, nút "Phóng to hóa đơn" mở Lightbox, thẻ đối soát "Khớp x mục chi tiêu".
- Cột phải: Bảng ma trận cuộn ngang êm ái nếu nhiều thành viên, checkbox 24x24px bo góc với hiệu ứng checked màu `cerulean`, hàng "Thuế & phí dịch vụ" nổi bật với icon `%` và nhãn "Chia đều cho những người có ít nhất một món" — **không có ô tích**.
- Thẻ tổng kết tạm tính 5 cột avatar gọn gàng, chip trạng thái xanh lá hiển thị đối soát 100% khớp.

### 9.2 Tablet (768px)
- Chuyển bố cục sang 1 cột xếp chồng (Ảnh hóa đơn ở trên dạng thu gọn / accordion, bảng ma trận bên dưới).
- Bảng ma trận cho phép cuộn ngang (horizontal scroll) mượt mà không vỡ layout, cố định (sticky) cột tên món đầu tiên.
- Các nút bấm giữ chiều cao tối thiểu 44px.

### 9.3 Mobile (375px)
- Giao diện thân thiện cảm ứng: checkbox vùng chạm tối thiểu 44x44px.
- Cột tên món hiển thị tên và giá gọn gàng; các cột thành viên hiển thị avatar chữ cái nhỏ gọn.
- Thẻ tạm tính chuyển thành lưới 2 cột hoặc danh sách dọc hiển thị số tiền rõ ràng bằng font `tabular-nums`.
- Nút "Hủy" và nút "Xong" ghim ở chân màn hình, dễ thao tác bằng một tay.

---

## 10. Tiêu chí hoàn thành (Definition of Done - DoD)

1. [ ] **Đặc tả thuật toán:** Hàm `computeItemizedShares` được triển khai tại `src/lib/money/split.ts` đáp ứng đúng quy tắc R4 và chia đều phụ phí VAT/dịch vụ cho người tham gia hóa đơn. Ném lỗi rõ ràng cho tất cả 5 điều kiện vi phạm (E1–E5).
2. [ ] **Bất biến số học:** 100% tổng tiền phân bổ khớp chính xác với `totalAmount`, không có sai số thập phân. Không tạo dòng kết quả cho thành viên không có món.
3. [ ] **Validation chặt chẽ:** Form chia món chặn lưu nếu tổng món + phụ phí khác tổng hóa đơn, hoặc có món chưa ai nhận, hoặc gán thành viên LEFT/không hợp lệ.
4. [ ] **Giao diện chuẩn Stitch:** Khớp thiết kế `chia_theo_m_n_l_t_3n2`, multi-step modal (không chồng modal), hỗ trợ responsive 1280px, 768px, 375px. Dòng VAT chỉ đọc, không có checkbox từng người.
5. [ ] **Không mã màu hex:** 100% màu dùng token chuẩn của hệ thống trong `globals.css` / Tailwind.
6. [ ] **Thuật ngữ chuẩn:** Dùng nhãn từ `src/lib/labels.ts`, hiển thị đúng "Trưởng nhóm", "Chưa có tài khoản".
7. [ ] **Chất lượng mã nguồn:**
   - `npm run lint` đạt 0 errors, 0 warnings.
   - `npm test` pass 100% (bao gồm 1.000 test ngẫu nhiên có seed cố định).
   - `npm run build` biên dịch thành công 100%.

---

## 11. Các quyết định chính thức đã được người dùng phê duyệt

1. **Xử lý Dòng giảm giá (Mục 4):**
   - ✅ **ĐÃ DUYỆT CHỌN PHƯƠNG ÁN B (18/10/2026):** Chưa hỗ trợ dòng giảm giá âm trong Release 1 để giữ nguyên vẹn cấu trúc ERD (`expense_items.amount > 0` và `expense_shares.amount >= 0`), đảm bảo an toàn tuyệt đối cho tính toán tài chính. Nếu có voucher/khuyến mãi, người dùng tự trừ trước vào tổng tiền hoặc giá các món ăn. Phương án A (sửa ERD) chuyển vào backlog của Release 2.
2. **Định nghĩa Người tham gia hóa đơn chịu VAT / Phí dịch vụ (Mục 2.4):**
   - ✅ **ĐÃ DUYỆT ĐỊNH NGHĨA (18/10/2026):** *"Chỉ những thành viên có ít nhất 1 món trong hóa đơn mới cùng chia sẻ dòng Thuế & phí dịch vụ"*. Thành viên thuộc chuyến đi nhưng không tham gia ăn/uống món nào trong hóa đơn đó (0 món) thì không chịu phụ phí VAT của hóa đơn đó.
3. **Cách nhập số tiền tổng hóa đơn (Mục 5):**
   - ✅ **ĐÃ DUYỆT CHỌN PHƯƠNG ÁN (a) (19/10/2026):** Người dùng nhập tổng số tiền hóa đơn trước ở form chính. Tổng các món ăn cộng phụ phí VAT/dịch vụ phải bằng chính xác 100% `totalAmount`. Nếu chênh lệch khác 0 ₫, hệ thống chặn hoàn tất (khóa nút lưu) và hiển thị số tiền lệch cụ thể kèm chip đối soát.
4. **Điều hướng bước chia theo món (Mục 6):**
   - ✅ **ĐÃ DUYỆT CHỌN GIẢI PHÁP A (19/10/2026):** Multi-step modal — chuyển đổi nội dung ngay trong cùng `TripExpenseFormModal`, không mở modal thứ hai chồng lên modal đầu. Dữ liệu Bước 1 (số tiền, danh mục, người trả, ngày...) được giữ nguyên vẹn khi người dùng chuyển qua lại giữa Bước 1 và Bước 2.

## 12. Tình trạng các điểm quyết định thiết kế

Tất cả các phương án thiết kế cốt lõi cho Giai đoạn 2D.2 đã được người dùng phê duyệt và đồng thuận đầy đủ:

| # | Vấn đề thiết kế | Phương án đã duyệt | Trạng thái |
|:---:|---|---|:---:|
| 1 | Xử lý dòng giảm giá âm (Mục 4) | Phương án B: Chưa hỗ trợ giảm giá âm trong Release 1 để giữ nguyên ERD | ✅ Đã duyệt |
| 2 | Người chịu phụ phí VAT / dịch vụ (Mục 2.4) | Chỉ thành viên có ít nhất 1 món mới cùng chia sẻ VAT | ✅ Đã duyệt |
| 3 | Cách nhập số tiền tổng hóa đơn (Mục 5) | Phương án (a): Người dùng nhập tổng trước, đối soát bằng 0 ₫ mới cho lưu | ✅ Đã duyệt |
| 4 | Điều hướng bước chia món (Mục 6) | Giải pháp A: Multi-step modal trong cùng `TripExpenseFormModal` | ✅ Đã duyệt |

> **Kết luận:** Hiện tại không còn câu hỏi hoặc phương án thiết kế nào còn mở cho Giai đoạn 2D.2. Kế hoạch kỹ thuật đã hoàn thiện và sẵn sàng để chuyển sang bước triển khai mã nguồn khi người dùng cho phép.
