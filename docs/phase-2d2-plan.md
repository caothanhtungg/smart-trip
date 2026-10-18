# Kế hoạch triển khai Giai đoạn 2D.2 — Chia theo món & Phụ phí VAT/Dịch vụ (Itemized Split & Surcharges)

> **Dự án:** Smart Trip & Expense Planner (Release 1)  
> **Tài liệu:** Kế hoạch kỹ thuật & Đặc tả thuật toán Giai đoạn 2D.2  
> **Trạng thái:** ✅ **ĐÃ PHÊ DUYỆT BỞI NGƯỜI DÙNG (Ngày 18/10/2026)** — Sẵn sàng triển khai mã nguồn  
> **Căn cứ pháp lý & kỹ thuật:** UC31, ERD (`expense_items`, `expense_item_members`, `expense_shares`), Sơ đồ tuần tự SD1 (`sodothietke/release1-sequence.md`), Thiết kế Stitch `chia_theo_m_n_l_t_3n2`, Quyết định đã duyệt ngày 18/10/2026 về Phụ phí VAT & Phí dịch vụ.

---

## 1. Tổng quan mục tiêu và phạm vi Giai đoạn 2D.2

### 1.1 Mục tiêu chính
Giai đoạn 2D.2 hoàn thiện tính năng **Chia tiền theo từng món (Itemized Split)** kết hợp với **Phụ phí VAT / Phí dịch vụ** cho phân hệ Chi tiêu của ứng dụng Smart Trip:
1. **Thuật toán phân bổ theo món (`computeItemizedShares`):** Tự động chia chi phí của từng món ăn cho đúng những người tham gia tiêu thụ món đó, xử lý triệt để phần dư 1 đồng toán học theo thứ tự `joinOrder` độc lập trên từng món.
2. **Dòng phụ phí VAT & Phí dịch vụ:** Phụ phí chung của hóa đơn được chia đều cho tất cả những người tham gia hóa đơn.
3. **Bất biến số học tuyệt đối:** $\sum \text{expense\_shares.amount} \equiv \text{expenses.amount}$, tiền luôn là số nguyên VND an toàn.
4. **Giao diện ma trận món ăn (`chia_theo_m_n_l_t_3n2`):** Trực quan hóa danh sách món ăn, checkbox ma trận người dùng, cột preview ảnh chứng từ hóa đơn, khối tóm tắt số tiền mỗi người phải trả kèm đối soát tổng tiền tức thời.

### 1.2 Ranh giới phạm vi (Scope Boundaries)
- **Trong phạm vi 2D.2:**
  - Chia theo từng món ăn với ma trận tích chọn thành viên.
  - Phụ phí VAT / phí dịch vụ là một dòng phụ phí riêng, chia đều cho những người tham gia hóa đơn.
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
2. `items: ItemizedExpenseItemInput[]`: Danh sách các món ăn trong hóa đơn. Mỗi món gồm:
   - `id: string`: Mã định danh món (hoặc client temporary key).
   - `name: string`: Tên món (tối đa 200 ký tự).
   - `amount: number`: Thành tiền của món (số nguyên VND $> 0$).
   - `assignedMemberIds: string[]`: Danh sách ID các thành viên tham gia món này (không trùng lặp, tối thiểu 1 người).
3. `surcharge: ItemizedSurchargeInput | null`: Dòng phụ phí VAT / Phí dịch vụ:
   - `amount: number`: Số tiền phụ phí (số nguyên VND $\ge 0$).
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

### 2.2 Quy tắc phân bổ từng món ăn (Quy tắc R4 áp dụng cục bộ)
Đối với mỗi món ăn $k$ có số tiền $A_k$ và danh sách người tham gia $P_k$ ($n_k = |P_k| \ge 1$):
1. Sắp xếp các thành viên trong $P_k$ theo thứ tự `joinOrder` tăng dần.
2. Áp dụng quy tắc chia đều có phần dư R4:
   $$\text{Base}_k = \lfloor A_k / n_k \rfloor, \quad \text{Remainder}_k = A_k - (\text{Base}_k \times n_k)$$
3. $\text{Remainder}_k$ thành viên có `joinOrder` nhỏ nhất nhận thêm 1 đồng: $\text{Share}_{k, i} = \text{Base}_k + 1$. Các thành viên còn lại nhận $\text{Share}_{k, i} = \text{Base}_k$.
4. Bất biến cục bộ cho từng món:
   $$\sum_{i \in P_k} \text{Share}_{k, i} = A_k$$

### 2.3 Phân bổ dòng "Thuế & phí dịch vụ" (Surcharge)

#### Định nghĩa rõ "Người tham gia hóa đơn":
- **Khái niệm:** Một người được xem là *người tham gia hóa đơn* khi và chỉ khi người đó **được gán ít nhất một món ăn trong hóa đơn** ($|\{k \mid i \in P_k\}| \ge 1$).
- **Lý do định nghĩa:**
  - Nếu một thành viên trong chuyến đi không ăn bất kỳ món nào trong bữa ăn này (0 món, 0 ₫ tiền món), việc bắt họ chịu tiền thuế VAT hoặc phí phục vụ của bữa ăn đó là phi lý và gây tranh cãi công nợ thực tế.
  - Tập hợp người tham gia hóa đơn $P_{\text{bill}} = \bigcup_{k} P_k$.
- **Trường hợp ngoại lệ (Hóa đơn chỉ toàn phụ phí):** Nếu hóa đơn không có món ăn nào mà chỉ có dòng phụ phí (trường hợp hiếm gặp), $P_{\text{bill}}$ sẽ lấy toàn bộ danh sách thành viên được chọn tham gia hóa đơn.
- **Quy tắc phân bổ phụ phí:**
  - Giả sử số người tham gia hóa đơn là $n_{\text{bill}} = |P_{\text{bill}}|$.
  - Nếu $n_{\text{bill}} = 0$ và $\text{Surcharge} > 0 \implies$ Lỗi validation (không thể chia phụ phí khi không có ai tham gia).
  - Sắp xếp $P_{\text{bill}}$ theo `joinOrder` tăng dần.
  - Áp dụng quy tắc chia đều R4:
    $$\text{Base}_{\text{sur}} = \lfloor \text{Surcharge} / n_{\text{bill}} \rfloor, \quad \text{Remainder}_{\text{sur}} = \text{Surcharge} - (\text{Base}_{\text{sur}} \times n_{\text{bill}})$$
  - $\text{Remainder}_{\text{sur}}$ thành viên đầu tiên theo `joinOrder` nhận thêm 1 đồng.
  - Bất biến phụ phí:
    $$\sum_{i \in P_{\text{bill}}} \text{SurchargeShare}_i = \text{Surcharge}$$

### 2.4 Bất biến tổng và xử lý chênh lệch (Reconciliation)
1. **Bất biến tổng:**
   $$\sum_{i \in P_{\text{bill}}} \text{totalAmount}_i = \sum_k A_k + \text{Surcharge} = \text{totalAmount}$$
2. **Quy tắc xử lý khi tổng các món + phụ phí $\neq$ tổng số tiền hóa đơn:**
   - **Chặn lưu tuyệt đối:** Giao diện vô hiệu hóa nút "Lưu" / "Xong", hiển thị cảnh báo lỗi bằng tiếng Việt rõ ràng với số tiền chênh lệch cụ thể.
   - **Ví dụ hiển thị:**
     - Nếu tổng món (1.000.000 ₫) + VAT (130.000 ₫) = 1.130.000 ₫, nhưng tổng hóa đơn là 1.060.000 ₫:  
       *“Tổng các món và phụ phí (1.130.000 ₫) đang lớn hơn số tiền hóa đơn (1.060.000 ₫) là 70.000 ₫. Vui lòng điều chỉnh lại.”*
     - Nếu còn thiếu tiền:  
       *“Tổng các món và phụ phí (950.000 ₫) đang nhỏ hơn số tiền hóa đơn (1.060.000 ₫) là 110.000 ₫. Vui lòng kiểm tra lại các món.”*
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

### 4.2 Hai phương án xử lý

#### Phương án A: Cho phép dòng giảm giá là số âm và đề xuất sửa ERD / Schema
- **Mô tả:** Cho phép tạo món đặc biệt có loại `DISCOUNT` hoặc cho phép `expense_items.amount < 0`. Khi tính toán, dòng giảm giá được chia đều cho những người tham gia hóa đơn (tương tự như phụ phí nhưng mang dấu âm), trừ trực tiếp vào số tiền mỗi người phải trả.
- **Ưu điểm:**
  - Mô phỏng sát với hóa đơn thực tế ngoài đời (có voucher giảm giá 50k, giảm 10% đồ ăn,...).
  - Người dùng không cần tính nhẩm trừ tiền trước khi nhập.
- **Nhược điểm & Rủi ro lớn:**
  - **Phá vỡ ràng buộc DB:** Cần phải sửa đổi ERD và thêm các ràng buộc phức tạp để tránh trường hợp số tiền giảm giá lớn hơn tổng tiền món của một người, dẫn tới `expense_shares.amount < 0` (người đó được nhận lại tiền thay vì trả tiền, vi phạm ràng buộc CHECK $\ge 0$ của `expense_shares`).
  - **Phức tạp hóa thuật toán phân bổ:** Nếu giảm giá nhiều hơn tiền món của một người ăn ít, phần dư âm đó sẽ phân bổ tiếp cho ai? Điều này dẫn đến nguy cơ sai lệch số dư ròng trong hệ thống.
  - **Vi phạm nguyên tắc Phase 2:** Không tự ý sửa đổi ERD khi chưa có quyết định chính thức từ người dùng.

#### Phương án B: Chưa hỗ trợ dòng giảm giá trong Release 1 (ĐỀ XUẤT)
- **Mô tả:** Trong Release 1, hệ thống chỉ hỗ trợ các món ăn có số tiền nguyên dương ($> 0$) và dòng phụ phí VAT/dịch vụ ($\ge 0$). Nếu hóa đơn có giảm giá / voucher:
  - Người dùng nhập số tiền thực trả cuối cùng của hóa đơn vào `expenses.amount`.
  - Đối với từng món, người dùng nhập giá sau khi đã trừ khuyến mãi (hoặc chia đều khoản giảm giá vào các món).
  - Nút "+ Thêm VAT / Giảm giá" trong giao diện Stitch được chuẩn hóa thành "+ Thêm thuế & phí dịch vụ".
- **Ưu điểm:**
  - **Tuyệt đối an toàn:** Tuân thủ 100% ràng buộc của ERD hiện hành, không cần sửa đổi bảng `expense_items` hay `expense_shares`.
  - Giữ nguyên vẹn tính đúng đắn của thuật toán chia tiền R4 và bất biến tài chính không âm.
  - Giảm thiểu độ phức tạp và rủi ro lỗi trong đợt triển khai này.
- **Nhược điểm:** Người dùng phải tự quy đổi giá món sau giảm giá nếu có voucher tổng.

### 4.3 Đề xuất chính thức
> **Khuyến nghị chọn Phương án B cho Release 1.**  
> Đưa việc hỗ trợ dòng giảm giá (Phương án A) vào danh mục tính năng xem xét cho Release 2 kèm nghiên cứu thuật toán phân bổ giảm giá theo tỷ lệ (proportional discount allocation). **Hiện tại KHÔNG sửa ERD, chờ người dùng đưa ra quyết định cuối cùng.**

---

## 5. Kiểu dữ liệu và Danh mục File tạo/sửa

Tuân thủ nghiêm ngặt các quy tắc mã nguồn tại `PROJECT_CONTEXT.md` Mục 14:
- (a) Không mã màu hex, dùng Tailwind tokens chuẩn (`cerulean`, `yale-blue`, `hover-row`, `divider-hairline`, v.v.).
- (b) Mọi thuật ngữ giao diện khai báo tập trung trong `src/lib/labels.ts`.
- (c) Không viết cứng vai trò (`isHost` truyền từ session/context).
- (d) Tách biệt dữ liệu mẫu qua lớp `src/lib/data/*`.
- (e) Tiền luôn là số nguyên an toàn VND (`Number.isSafeInteger`, $\ge 0$).
- (f) Unit test Vitest đặt cạnh mã nguồn (`*.test.ts`).

### 5.1 Các kiểu dữ liệu bổ sung (`src/types/trip.ts`)
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

### 5.2 Danh mục file tạo mới hoặc sửa đổi

| STT | File | Hành động | Mục đích |
|:---:|---|:---:|---|
| 1 | `src/types/trip.ts` | Sửa | Khai báo các type cho `ExpenseItemData`, `ExpenseSurchargeData`, `CreateItemizedExpenseFormData`. |
| 2 | `src/lib/money/split.ts` | Sửa | Bổ sung hàm `computeItemizedShares` và helper tính toán phần chia món. |
| 3 | `src/lib/money/split.test.ts` | Sửa | Bổ sung bộ unit test và property-based test cho `computeItemizedShares`. |
| 4 | `src/lib/validation/itemized-expense.ts` | Tạo mới | Validate danh sách món: tên không rỗng, giá $> 0$, ít nhất 1 người/món, phụ phí $\ge 0$, và đối soát tổng khớp 100% với `totalAmount`. |
| 5 | `src/lib/validation/itemized-expense.test.ts` | Tạo mới | Bộ unit test kiểm thử toàn diện các điều kiện hợp lệ và lỗi của form chia món. |
| 6 | `src/lib/labels.ts` | Sửa | Bổ sung các nhãn tiếng Việt cho chia theo món, phụ phí VAT, lỗi chênh lệch, công thức phân bổ. |
| 7 | `src/components/trips/expenses/trip-itemized-split-modal.tsx` | Tạo mới | Modal ma trận chia theo món 2 cột chuẩn Stitch `chia_theo_m_n_l_t_3n2` (preview hóa đơn cột trái, bảng ma trận + thẻ tóm tắt cột phải). |
| 8 | `src/components/trips/expenses/trip-expense-form-modal.tsx` | Sửa | Tích hợp lựa chọn cách chia "Chia theo món" (khi chọn "Chia theo từng món", mở tiếp modal ma trận 2D.2 hoặc nhúng liền mạch). |
| 9 | `src/lib/data/trips.ts` | Sửa | Cập nhật hàm mock lưu khoản chi hỗ trợ lưu `items` và `surcharge` vào session data. |

---

## 6. Kế hoạch kiểm thử (Test Matrix)

### 6.1 Unit Test cho `computeItemizedShares` (`src/lib/money/split.test.ts`)
1. **Ca 1 (Hóa đơn 3 món tiêu chuẩn, không phụ phí):**
   - Món 1: 300.000 ₫ (gán A, B) $\to$ mỗi người 150.000 ₫.
   - Món 2: 200.000 ₫ (gán B, C) $\to$ mỗi người 100.000 ₫.
   - Món 3: 100.000 ₫ (gán C) $\to$ C chịu 100.000 ₫.
   - Kết quả: A: 150k, B: 250k, C: 200k. Tổng: 600.000 ₫ $\equiv$ 600.000 ₫.
2. **Ca 2 (1 món gán cho đúng 1 người):**
   - Món 1: 150.000 ₫ gán cho B $\to$ B chịu trọn 150.000 ₫.
3. **Ca 3 (1 món gán cho tất cả thành viên):**
   - Món 1: 500.000 ₫ gán cho cả 5 người $\to$ mỗi người 100.000 ₫.
4. **Ca 4 (Phần dư 1 đồng ở từng món theo `joinOrder`):**
   - Món 100.000 ₫ chia 3 người (joinOrder 1, 2, 3) $\to$ Người 1: 33.334 ₫, Người 2: 33.333 ₫, Người 3: 33.333 ₫.
5. **Ca 5 (Phụ phí VAT/dịch vụ không chia hết cho người tham gia):**
   - Hóa đơn 1.000.000 ₫ tiền món + 100.000 ₫ VAT = 1.100.000 ₫. 3 người tham gia $\to$ VAT mỗi người: Người 1: 33.334 ₫, Người 2: 33.333 ₫, Người 3: 33.333 ₫.
6. **Ca 6 (Thành viên không ăn món nào không bị tính VAT):**
   - Nhóm có 5 người A, B, C, D, E. Chỉ A, B, C ăn các món. Phụ phí VAT 60.000 ₫ $\to$ chỉ chia cho A, B, C (mỗi người 20.000 ₫), D và E nhận 0 ₫.
7. **Ca 7 (Property-based test: 1.000 bộ hóa đơn ngẫu nhiên với Mulberry32 PRNG):**
   - Sinh ngẫu nhiên từ 1 đến 10 món với số tiền từ 1.000 ₫ đến 50.000.000 ₫.
   - Gán ngẫu nhiên cho từ 1 đến 8 thành viên.
   - Sinh ngẫu nhiên phụ phí từ 0 đến 5.000.000 ₫.
   - Kiểm tra bất biến: $\sum \text{shares.totalAmount} \equiv \text{totalAmount}$ và mọi phần chia đều là số nguyên an toàn $\ge 0$.

### 6.2 Unit Test cho Validation Form (`src/lib/validation/itemized-expense.test.ts`)
1. **Ca 8 (Chặn khi tổng các món + phụ phí lệch số tiền hóa đơn):**
   - Tổng hóa đơn: 1.000.000 ₫. Tổng món + VAT: 1.050.000 ₫ $\to$ Lỗi: thông báo chênh lệch 50.000 ₫.
2. **Ca 9 (Món ăn không có ai nhận):**
   - Món "Lẩu gà" có `assignedMemberIds: []` $\to$ Báo lỗi: *"Món 'Lẩu gà' chưa có thành viên nào nhận."*
3. **Ca 10 (Người gán không hợp lệ):**
   - Gán món cho thành viên có trạng thái `LEFT` hoặc ID không tồn tại $\to$ Báo lỗi từ chối.
4. **Ca 11 (Tên món rỗng hoặc quá 200 ký tự):**
   - Báo lỗi validation tương ứng.
5. **Ca 12 (Số tiền món $\le 0$ hoặc không phải số nguyên an toàn):**
   - Báo lỗi số tiền không hợp lệ.

---

## 7. Kế hoạch kiểm tra giao diện (Visual & Responsive QA)

Thực hiện kiểm thử hiển thị trên 3 kích thước màn hình theo tài liệu thiết kế Stitch:

### 7.1 Desktop (1280px)
- Bố cục 2 cột hoàn chỉnh (Cột trái 4 cols ~ 33.3%, Cột phải 8 cols ~ 66.6%).
- Cột trái: Card xem trước ảnh hóa đơn đính kèm sticky theo màn hình, nút "Phóng to hóa đơn" mở Lightbox, thẻ đối soát "Khớp x mục chi tiêu".
- Cột phải: Bảng ma trận cuộn ngang êm ái nếu nhiều thành viên, checkbox 24x24px bo góc với hiệu ứng checked màu `cerulean`, hàng "Thuế & phí dịch vụ" nổi bật với icon `%`.
- Thẻ tổng kết tạm tính 5 cột avatar gọn gàng, chip trạng thái xanh lá hiển thị đối soát 100% khớp.

### 7.2 Tablet (768px)
- Chuyển bố cục sang 1 cột xếp chồng (Ảnh hóa đơn ở trên dạng thu gọn / accordion, bảng ma trận bên dưới).
- Bảng ma trận cho phép cuộn ngang (horizontal scroll) mượt mà không vỡ layout, cố định (sticky) cột tên món đầu tiên.
- Các nút bấm giữ chiều cao tối thiểu 44px.

### 7.3 Mobile (375px)
- Giao diện thân thiện cảm ứng: checkbox vùng chạm tối thiểu 44x44px.
- Cột tên món hiển thị tên và giá gọn gàng; các cột thành viên hiển thị avatar chữ cái nhỏ gọn.
- Thẻ tạm tính chuyển thành lưới 2 cột hoặc danh sách dọc hiển thị số tiền rõ ràng bằng font `tabular-nums`.
- Nút "Hủy" và nút "Xong" ghim ở chân màn hình, dễ thao tác bằng một tay.

---

## 8. Tiêu chí hoàn thành (Definition of Done - DoD)

1. [ ] **Đặc tả thuật toán:** Hàm `computeItemizedShares` được triển khai tại `src/lib/money/split.ts` đáp ứng đúng quy tắc R4 và chia đều phụ phí VAT/dịch vụ cho người tham gia hóa đơn.
2. [ ] **Bất biến số học:** 100% tổng tiền phân bổ khớp chính xác với `totalAmount`, không có sai số thập phân.
3. [ ] **Validation chặt chẽ:** Form chia món chặn lưu nếu tổng món + phụ phí khác tổng hóa đơn, hoặc có món chưa ai nhận.
4. [ ] **Giao diện chuẩn Stitch:** Khớp thiết kế `chia_theo_m_n_l_t_3n2`, hỗ trợ responsive 1280px, 768px, 375px.
5. [ ] **Không mã màu hex:** 100% màu dùng token chuẩn của hệ thống trong `globals.css` / Tailwind.
6. [ ] **Thuật ngữ chuẩn:** Dùng nhãn từ `src/lib/labels.ts`, hiển thị đúng "Trưởng nhóm", "Chưa có tài khoản".
7. [ ] **Chất lượng mã nguồn:**
   - `npm run lint` đạt 0 errors, 0 warnings.
   - `npm test` pass 100% (bao gồm 1.000 test ngẫu nhiên có seed cố định).
   - `npm run build` biên dịch thành công 100%.

---

## 9. Các quyết định chính thức đã được người dùng phê duyệt (Ngày 18/10/2026)

1. **Xử lý Dòng giảm giá (Mục 4):**
   - ✅ **ĐÃ DUYỆT CHỌN PHƯƠNG ÁN B:** Chưa hỗ trợ dòng giảm giá âm trong Release 1 để giữ nguyên vẹn cấu trúc ERD (`expense_items.amount > 0` và `expense_shares.amount >= 0`), đảm bảo an toàn tuyệt đối cho tính toán tài chính. Nếu có voucher/khuyến mãi, người dùng tự trừ trước vào tổng tiền hoặc giá các món ăn. Phương án A (sửa ERD) chuyển vào backlog của Release 2.
2. **Định nghĩa Người tham gia hóa đơn chịu VAT / Phí dịch vụ (Mục 2.3):**
   - ✅ **ĐÃ DUYỆT ĐỊNH NGHĨA:** *"Chỉ những thành viên có ít nhất 1 món trong hóa đơn mới cùng chia sẻ dòng Thuế & phí dịch vụ"*. Thành viên thuộc chuyến đi nhưng không tham gia ăn/uống món nào trong hóa đơn đó (0 món) thì không chịu phụ phí VAT của hóa đơn đó.
