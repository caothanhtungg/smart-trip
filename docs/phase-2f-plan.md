# KẾ HOẠCH TRIỂN KHAI GIAI ĐOẠN 2F: QUẢN LÝ THÀNH VIÊN, LỜI MỜI & NHẬN DIỆN DANH TÍNH (MEMBER MANAGEMENT, INVITATIONS & IDENTITY CLAIM)

> **Tài liệu lập kế hoạch kỹ thuật cho Giai đoạn 2F**  
> Căn cứ vào: `PROJECT_CONTEXT.md`, `docs/ENGINEERING_STANDARDS.md`, `docs/DEFINITION_OF_DONE.md`, `docs/AI_IMPLEMENTATION_WORKFLOW.md`, `sodothietke/release1-usecase.drawio` (UC04, UC05, UC07, UC21, UC26, UC28, UC30, UC33, UC34), `sodothietke/release1-erd.dbml` (`trip_members`, `member_claims`), `sodothietke/release1-sequence.md` (SD5), và các thiết kế Google Stitch:
> - `stitch_smart_trip_dashboard_design/qu_n_l_th_nh_vi_n_l_t_3n2` (Quản lý thành viên)
> - `stitch_smart_trip_dashboard_design/l_i_m_i_tham_gia_l_t_3n2` (Xem trước lời mời)
> - `stitch_smart_trip_dashboard_design/b_n_l_ai_trong_chuy_n_i_n_y` (Xác nhận danh tính thành viên chưa có tài khoản)

---

## 1. PHẠM VI VÀ CÁC ROUTE

### 1.1. Phạm vi chức năng trong Release 1
1. **Quản lý thành viên chuyến đi (`/trips/[id]/members`)**:
   - Thay thế toàn bộ placeholder `TripTabPlaceholder` bằng giao diện danh sách và quản trị thành viên đầy đủ theo thiết kế Stitch.
   - Thống kê tổng quan: Số lượng thành viên tham gia, vai trò, tổng tiền đã chi của nhóm.
   - Bảng danh sách thành viên (Member Ledger Table):
     - Cột: Thành viên (Avatar, Tên, Email/Ghi chú), Vai trò (Trưởng nhóm / Thành viên), Trạng thái (Đã xác thực / Chưa có tài khoản / Đang chờ liên kết / Đã rời nhóm), Đã chi (VND), Công nợ tạm tính (VND), Thao tác (`more_vert`).
   - Lọc và tìm kiếm nhanh: Bộ lọc chips ("Tất cả", "Đã có tài khoản", "Chưa có tài khoản") và ô tìm kiếm theo tên/email.
   - Thao tác Trưởng nhóm:
     - Tạo thành viên chưa có tài khoản qua modal chuẩn (`TripAddGuestModal`).
     - Chỉnh sửa tên hiển thị của thành viên chưa có tài khoản (`TripEditGuestModal`).
     - Xóa thành viên (`TripRemoveMemberModal`) kèm kiểm tra ràng buộc công nợ.
     - Duyệt / Từ chối yêu cầu liên kết danh tính ngay trên banner nổi bật đầu trang.
   - Thao tác Thành viên:
     - Rời chuyến đi (`TripLeaveTripModal`) kèm kiểm tra ràng buộc công nợ và vai trò.
     - Mời thêm bạn bè qua modal chia sẻ mã mời / QR.

2. **Xem trước lời mời tham gia (Public Invitation Preview Route)**:
   - Route công khai: `/join/[code]` (hoặc `/trips/join/[code]`), cho phép người nhận link hoặc quét mã QR xem trước thông tin tối thiểu mà chưa cần đăng nhập.
   - Tuân thủ nghiêm ngặt **Quy tắc R19**: Chỉ hiển thị thông tin tối thiểu (Tên chuyến, Điểm đến, Thời gian, Thông tin Trưởng nhóm, Danh sách avatar các thành viên đã tham gia).
   - **Bảo mật dữ liệu riêng tư**: Tuyệt đối **KHÔNG** để lộ lịch trình, danh sách chi tiêu, bảng công nợ, số tài khoản ngân hàng hoặc số dư cá nhân trên màn hình xem trước.
   - Xử lý các trạng thái biên của mã mời:
     - Mã hợp lệ: Hiển thị thẻ xem trước và nút "Tham gia chuyến đi".
     - Mã không tồn tại hoặc sai định dạng: Hiển thị màn hình 404 / Báo lỗi mã không hợp lệ kèm nút quay về trang chủ.
     - Chuyến đi đã lưu trữ / kết thúc: Hiển thị thông báo chuyến đi đã đóng.

3. **Nhận diện danh tính thành viên chưa có tài khoản (Identity Claim Flow)**:
   - Khi người dùng bấm "Tham gia chuyến đi" từ link mời:
     - Nếu chuyến đi có thành viên chưa có tài khoản còn trống (`user_id IS NULL` và `status = 'ACTIVE'`): Hiển thị giao diện "Bạn là ai trong chuyến đi này?" (theo Stitch `b_n_l_ai_trong_chuy_n_i_n_y`).
     - Người dùng có 2 lựa chọn:
       - **Lựa chọn A**: Chọn nhận diện một thành viên chưa có tài khoản có sẵn (ví dụ: "Có phải bạn là Thu Hà không?").
       - **Lựa chọn B**: "Tôi là người mới" (Tham gia với hồ sơ thành viên mới hoàn toàn).
   - Xử lý lựa chọn:
     - Nếu chọn "Tôi là người mới": Tham gia ngay với vai trò `MEMBER`, gán `join_order = max(joinOrder) + 1`, chuyển vào trang chuyến đi.
     - Nếu chọn nhận diện: Hệ thống tạo yêu cầu nhận diện (`MemberClaim`) với trạng thái `PENDING`. Hiển thị màn hình "Đang chờ Trưởng nhóm phê duyệt" (Waiting State).
   - Quyền hạn trong trạng thái chờ (Rule R1, R13): Người gửi yêu cầu **chưa xem được** dữ liệu chi tiết của chuyến đi cho đến khi Trưởng nhóm duyệt. Cho phép người gửi "Kiểm tra lại trạng thái" hoặc "Hủy yêu cầu" để chọn lại.
   - Trưởng nhóm duyệt yêu cầu:
     - Hiển thị banner cảnh báo nổi bật trên đầu trang Quản lý thành viên của Trưởng nhóm.
     - Nút "Duyệt liên kết": Gán `user_id` của người yêu cầu vào `trip_members`, giữ nguyên `join_order` và toàn bộ lịch sử chi tiêu/công nợ cũ; xóa thông tin ngân hàng tạm thời; tự động chuyển các yêu cầu `PENDING` khác của cùng vị trí sang `REJECTED` (Rule R13, R20).
     - Nút "Từ chối": Chuyển yêu cầu sang `REJECTED`, người dùng có thể tham gia lại như thành viên mới.

### 1.2. Các route trong hệ thống
| Route | Loại | Mô tả |
|---|---|---|
| `/trips/[id]/members` | Private (In-App) | Quản lý thành viên, danh sách, vai trò, công nợ và duyệt yêu cầu |
| `/join/[code]` | Public | Trang xem trước lời mời tham gia chuyến đi (tuân thủ R19) |
| `/join/[code]/claim` hoặc modal in-page | Public / In-Session | Luồng "Bạn là ai trong chuyến đi này?" và trạng thái chờ duyệt |

### 1.3. Ngoài phạm vi Release 1 (Tuyệt đối không đưa vào)
- Không chuyển nhượng quyền Trưởng nhóm (Host transfer).
- Không xác thực danh tính thật (CCCD, KYC, sinh trắc học, eKYC).
- Không gửi SMS, email tự động hay thông báo đẩy máy chủ (chỉ demo UI feedback).
- Không phân quyền tùy biến phức tạp ngoài 2 vai trò `HOST` và `MEMBER`.
- Không tích hợp cơ sở dữ liệu PostgreSQL thực tế trong phase này (duy trì session state).

---

## 2. CÁC USE CASE VÀ QUY TẮC NGHIỆP VỤ TƯƠNG ỨNG

### 2.1. Danh mục Use Case (`sodothietke/release1-usecase.drawio`)
- **UC04**: Mời thành viên tham gia (sao chép link, hiển thị mã mời, sinh mã QR trên client).
- **UC05**: Tham gia chuyến đi qua liên kết / mã mời.
- **UC07**: Trưởng nhóm xóa thành viên.
- **UC21**: Thành viên tự rời chuyến đi.
- **UC26**: Trưởng nhóm thêm thành viên chưa có tài khoản.
- **UC28**: Trưởng nhóm thu hồi / đổi mã mời.
- **UC30**: Trưởng nhóm duyệt liên kết thành viên ảo/chưa có tài khoản.
- **UC33**: Người mới chọn nhận mình là thành viên chưa có tài khoản.
- **UC34**: Hiển thị QR mời sinh trực tiếp trên trình duyệt.

### 2.2. Các quy tắc nghiệp vụ bắt buộc (`sodothietke/release1-sequence.md` & `PROJECT_CONTEXT.md`)
- **Rule R1**: Người chưa được duyệt liên kết không được xem dữ liệu nội bộ chuyến đi.
- **Rule R2**: Mỗi chuyến đi có duy nhất 1 Trưởng nhóm (`role = 'HOST'`). Trưởng nhóm không thể tự rời chuyến đi nếu còn các thành viên khác.
- **Rule R4**: Thứ tự tham gia `join_order` là số nguyên tăng dần duy nhất, được bảo toàn vĩnh viễn khi liên kết tài khoản để thuật toán chia tiền phần dư luôn xác định.
- **Rule R6**: Ràng buộc công nợ khi xóa thành viên hoặc rời chuyến:
  - Nếu thành viên có số dư công nợ khác 0 (`netBalance !== 0`), hệ thống **chặn** thao tác rời chuyến hoặc xóa thành viên, yêu cầu tất toán công nợ trước.
  - Nếu thành viên đã có lịch sử tài chính (từng chi tiêu hoặc có phần chia), hệ thống **không xóa vĩnh viễn** khỏi database, chỉ cập nhật trạng thái `status = 'LEFT'`.
  - Nếu thành viên chưa có bất kỳ giao dịch tài chính nào (`spentAmount === 0` và không có khoản chia), cho phép xóa hoàn toàn khỏi danh sách phiên.
- **Rule R11**: Thành viên chưa có tài khoản có `user_id = NULL` trong `trip_members`. Trưởng nhóm có thể nhập hộ khoản chi và phần chia.
- **Rule R13**: Khi Trưởng nhóm duyệt yêu cầu nhận diện:
  - Gán `user_id` tài khoản người nhận vào dòng `trip_members` tương ứng.
  - Chuyển `isNoAccount` từ `true` thành `false`.
  - Giữ nguyên toàn bộ lịch sử chi tiêu, các khoản chia và `join_order`.
  - Xóa thông tin tài khoản ngân hàng tạm `bank_*` nếu có.
- **Rule R14**: Mã mời gồm 10–12 ký tự chữ/số, tối đa 1 dấu gạch nối (tối đa 13 ký tự). Đổi mã mời sẽ vô hiệu hóa mã cũ.
- **Rule R19**: Màn hình xem trước lời mời chỉ trả thông tin cơ bản: Tên chuyến đi, điểm đến, ngày đi - ngày về, tên Trưởng nhóm, danh sách tên và avatar thành viên đang hoạt động. Không trả lịch trình, danh sách chi tiêu, bảng công nợ hay STK ngân hàng.
- **Rule R20**: Mỗi tài khoản chỉ được có tối đa 1 yêu cầu `PENDING` trong một chuyến đi. Khi một yêu cầu được Trưởng nhóm duyệt, tất cả các yêu cầu `PENDING` khác nhắm vào cùng thành viên chưa có tài khoản đó sẽ tự động chuyển sang `REJECTED`.
- **Quy chuẩn từ ngữ UI (`PROJECT_CONTEXT.md`)**:
  - Dùng **"Trưởng nhóm"** (không dùng "Host", "Chủ nhóm", "Thủ quỹ").
  - Dùng **"Chưa có tài khoản"** (không dùng "Ảo", "Thành viên ảo", "Khách").
  - Dùng **"Mã mời"** (không dùng "PIN").
  - Trạng thái chuyến đi: "Đang lên kế hoạch" (ACTIVE), "Đang thanh toán" (SETTLING), "Đã hoàn tất" (COMPLETED).

---

## 3. DANH SÁCH FILE DỰ KIẾN TẠO / SỬA

### 3.1. Types & Models (`src/types/`)
- `src/types/trip.ts`:
  - Mở rộng `TripMember`: Thêm các trường `email?: string | null`, `note?: string | null`, `bankBin?: string | null`, `bankAccountNo?: string | null`, `bankAccountName?: string | null`.
  - Bổ sung interface `MemberClaim`:
    ```typescript
    export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";

    export interface MemberClaim {
      id: string;
      tripId: string;
      placeholderMemberId: string; // ID thành viên chưa có tài khoản
      placeholderMemberName: string;
      userId: string;
      userName: string;
      userEmail: string;
      userAvatarUrl?: string | null;
      status: ClaimStatus;
      createdAt: string; // ISO datetime
      decidedAt?: string | null;
      decidedByMemberId?: string | null;
    }
    ```
  - Bổ sung interface form: `CreateGuestMemberFormData`, `EditGuestMemberFormData`.
  - Bổ sung interface xem trước lời mời: `TripInvitePreviewData`.

### 3.2. Validation & Domain Logic (`src/lib/members/`)
- `src/lib/members/validation.ts`:
  - `validateGuestMemberForm(formData: CreateGuestMemberFormData, existingMembers: TripMember[])`: Kiểm tra tên không rỗng, không quá 100 ký tự, không trùng tên với thành viên đang hoạt động trong chuyến.
  - `canRemoveMember(member: TripMember, netBalance: number, tripStatus: TripStatus)`: Kiểm tra điều kiện xóa (chặn nếu `netBalance !== 0` hoặc chuyến đi ở trạng thái `SETTLING`/`COMPLETED`).
  - `canLeaveTrip(member: TripMember, isHost: boolean, netBalance: number, tripStatus: TripStatus)`: Kiểm tra điều kiện rời chuyến (chặn nếu là Trưởng nhóm hoặc `netBalance !== 0`).
  - `canClaimMember(placeholder: TripMember, existingClaims: MemberClaim[], userId: string)`: Kiểm tra tính hợp lệ của yêu cầu nhận diện (phải là thành viên chưa có tài khoản, chưa có yêu cầu pending khác của cùng user).
- `src/lib/members/validation.test.ts`:
  - Bộ kiểm thử unit test cho toàn bộ các hàm kiểm tra nghiệp vụ trên.

### 3.3. Dữ liệu Mock & Seeding (`src/lib/mock/`)
- `src/lib/mock/claims.ts`: Tạo dữ liệu mẫu các yêu cầu liên kết danh tính cho chuyến đi Đà Lạt 3N2Đ (khớp kịch bản Stitch để Trưởng nhóm thấy ngay 1 yêu cầu đang chờ duyệt).
- `src/lib/mock/trips.ts`: Đảm bảo chuyến đi mẫu Đà Lạt 3N2Đ và Phú Quốc có đầy đủ thành viên đã có tài khoản và thành viên chưa có tài khoản (`Thu Hà` hoặc `Nam`).

### 3.4. Session Context (`src/components/trips/detail/`)
- `src/components/trips/detail/trip-session-context.tsx`:
  - Mở rộng state:
    - `sessionMembers: TripMember[]` (quản lý danh sách thành viên trong session).
    - `sessionClaims: MemberClaim[]` (quản lý danh sách yêu cầu nhận diện).
    - `sessionInviteCode: string` (hỗ trợ đổi/tạo lại mã mời).
  - Mở rộng handlers:
    - `handleAddGuestMember(formData: CreateGuestMemberFormData)`: Thêm thành viên chưa có tài khoản.
    - `handleEditGuestMember(id: string, formData: EditGuestMemberFormData)`: Đổi tên hiển thị.
    - `handleRemoveMember(id: string)`: Xóa hoặc chuyển trạng thái thành viên sang `LEFT`.
    - `handleLeaveTrip(id: string)`: Thành viên rời nhóm.
    - `handleApproveClaim(claimId: string)`: Trưởng nhóm duyệt liên kết danh tính.
    - `handleRejectClaim(claimId: string)`: Trưởng nhóm từ chối liên kết danh tính.
    - `handleResetInviteCode()`: Đổi mã mời mới (UC28).
  - Cập nhật các phép tính phụ thuộc: `sessionTotalSpent`, `calculateMemberBalances`, `previewTransfers` để đồng bộ theo `sessionMembers`.

### 3.5. Components Quản lý thành viên (`src/components/trips/members/`)
- `src/components/trips/members/trip-members-view.tsx`: Component tổng hợp trang Quản lý thành viên.
- `src/components/trips/members/trip-members-header.tsx`: Header, breadcrumb, tiêu đề, nút "+ Mời thêm bạn bè" và "+ Thêm thành viên chưa có tài khoản".
- `src/components/trips/members/trip-pending-claims-banner.tsx`: Banner nổi bật hiển thị các yêu cầu liên kết đang chờ duyệt kèm so sánh tài khoản -> thành viên chưa có tài khoản, nút Duyệt / Từ chối.
- `src/components/trips/members/trip-members-table.tsx`: Bảng kê khai thành viên (Member Ledger Table) với bộ lọc, tìm kiếm, avatar, vai trò, trạng thái, số tiền đã chi, công nợ tạm tính, menu thao tác.
- `src/components/trips/members/trip-add-guest-modal.tsx`: Modal thêm thành viên chưa có tài khoản.
- `src/components/trips/members/trip-edit-guest-modal.tsx`: Modal đổi tên thành viên chưa có tài khoản.
- `src/components/trips/members/trip-remove-member-modal.tsx`: Modal xác nhận xóa thành viên (có cảnh báo công nợ).
- `src/components/trips/members/trip-leave-trip-modal.tsx`: Modal xác nhận rời chuyến đi.
- `src/components/trips/members/trip-member-help-card.tsx`: Card giải thích "Thành viên chưa có tài khoản là gì?" ở chân trang theo thiết kế Stitch.

### 3.6. Pages & Public Preview (`src/app/`)
- `src/app/(app)/trips/[id]/members/page.tsx`: Thay thế `TripTabPlaceholder` bằng `TripMembersView`.
- `src/app/(public)/join/[code]/page.tsx`: Trang xem trước lời mời tham gia chuyến đi (tuân thủ R19).
- `src/app/(public)/join/[code]/claim-modal.tsx`: Modal / Giao diện "Bạn là ai trong chuyến đi này?" (Lựa chọn nhận diện vs Người mới) và giao diện Chờ phê duyệt (Waiting State).

---

## 4. MÔ HÌNH DỮ LIỆU VÀ CÁCH TÍCH HỢP SESSION STATE

### 4.1. Quan hệ thực thể ERD (`sodothietke/release1-erd.dbml`)
```
users (1) <------- (0..1) trip_members (N) <------- (1) trips
                             |
                             | (placeholder_member_id)
                             v
                       member_claims (N)
                             ^
                             | (user_id)
users (1) --------------------+
```
- Khi thành viên chưa có tài khoản: `trip_members.user_id = NULL`, `isNoAccount = true`.
- Khi người dùng gửi yêu cầu nhận diện: Thêm bản ghi vào `member_claims` với `placeholder_member_id` trỏ tới thành viên chưa có tài khoản, `user_id` là người gửi, `status = 'PENDING'`.
- Khi Trưởng nhóm duyệt (`UC30`):
  1. Cập nhật `trip_members.user_id = claim.user_id`.
  2. Cập nhật `trip_members.isNoAccount = false`.
  3. Cập nhật `member_claims.status = 'APPROVED'`, `decided_at = now()`, `decided_by_member_id = host.id`.
  4. Mọi yêu cầu `PENDING` khác của cùng `placeholder_member_id` được chuyển thành `REJECTED`.

### 4.2. Luồng đồng bộ Session State trong `TripSessionProvider`
1. Khi thêm thành viên chưa có tài khoản:
   - Sinh ID mới `mem-guest-${Date.now()}`.
   - Gán `role = 'MEMBER'`, `status = 'ACTIVE'`, `isNoAccount = true`.
   - `joinOrder = Math.max(...sessionMembers.map(m => m.joinOrder), 0) + 1`.
   - Cập nhật `sessionMembers`.
2. Khi xóa thành viên:
   - Kiểm tra `netBalance`: Nếu khác 0, hiển thị thông báo lỗi chặn xóa.
   - Kiểm tra lịch sử chi tiêu: Nếu có chi tiêu hoặc phần chia, cập nhật `status = 'LEFT'`. Nếu không có lịch sử tài chính, lọc bỏ khỏi mảng.
3. Khi duyệt yêu cầu nhận diện:
   - Cập nhật dòng thành viên tương ứng trong `sessionMembers`: gán `userId`, đặt `isNoAccount = false`.
   - Cập nhật `sessionClaims`: Đổi trạng thái sang `APPROVED`, tự động từ chối các claim pending trùng lặp.
   - Hiển thị toast thành công: "Đã duyệt liên kết tài khoản cho [Tên] thành công."

---

## 5. MA TRẬN QUYỀN THAO TÁC (PERMISSION MATRIX)

| Hành động | Trưởng nhóm (HOST) | Thành viên (MEMBER) | Khách mở link xem trước | Ghi chú & Ràng buộc |
|---|:---:|:---:|:---:|---|
| **Xem danh sách thành viên** | Toàn quyền | Toàn quyền | Không (Chỉ xem preview) | Khách chỉ xem tối đa tên & avatar |
| **Thêm thành viên chưa có TK** | Cho phép | Không | Không | Chỉ khi chuyến ở trạng thái `ACTIVE` |
| **Sửa tên thành viên chưa có TK** | Cho phép | Không | Không | Trưởng nhóm quản lý hộ |
| **Xóa thành viên** | Cho phép | Không | Không | Chặn nếu `netBalance !== 0` hoặc trạng thái không phải `ACTIVE` |
| **Tự rời chuyến đi** | Không (phải là thành viên thường) | Cho phép | Không | Chặn nếu `netBalance !== 0` hoặc trạng thái không phải `ACTIVE` |
| **Đổi / Tạo lại mã mời** | Cho phép | Không | Không | UC28: Thu hồi mã cũ |
| **Mở modal mời / QR** | Cho phép | Cho phép | Không | Cả nhóm có thể chia sẻ mã mời |
| **Xem banner yêu cầu liên kết** | Cho phép | Không | Không | Chỉ Trưởng nhóm có quyền duyệt |
| **Duyệt / Từ chối liên kết** | Cho phép | Không | Không | UC30 (Rule R13, R20) |
| **Gửi yêu cầu nhận diện** | Không áp dụng | Không áp dụng | Cho phép (sau đăng nhập) | UC33: Tối đa 1 yêu cầu pending/chuyến |
| **Tham gia như người mới** | Không áp dụng | Không áp dụng | Cho phép (sau đăng nhập) | UC05 |

### Ma trận theo trạng thái chuyến đi:
| Trạng thái chuyến đi | Thêm/Xóa thành viên | Duyệt nhận diện danh tính | Rời chuyến | Xem danh sách & công nợ |
|---|:---:|:---:|:---:|:---:|
| **Đang lên kế hoạch (`ACTIVE`)** | Cho phép | Cho phép | Cho phép (khi nợ = 0) | Cho phép (công nợ tạm tính) |
| **Đang thanh toán (`SETTLING`)** | **Bị khóa** | **Bị khóa** | **Bị khóa** | Cho phép (bảng chốt sổ) |
| **Đã hoàn tất (`COMPLETED`)** | **Bị khóa** | **Bị khóa** | **Bị khóa** | Cho phép (lịch sử hoàn tất) |

---

## 6. KỊCH BẢN TEST VÀ TIÊU CHÍ NGHIỆM THU

### 6.1. Unit Test (`src/lib/members/validation.test.ts`)
1. **Kiểm tra form thêm thành viên chưa có tài khoản**:
   - Trả về lỗi khi tên rỗng hoặc chỉ chứa khoảng trắng.
   - Trả về lỗi khi tên vượt quá 100 ký tự.
   - Trả về lỗi khi tên trùng với một thành viên đang hoạt động trong chuyến đi.
   - Hợp lệ khi tên đúng chuẩn và ghi chú tùy chọn hợp lệ.
2. **Kiểm tra điều kiện xóa thành viên (`canRemoveMember`)**:
   - Chặn xóa nếu thành viên có `netBalance > 0` (đang được nợ tiền).
   - Chặn xóa nếu thành viên có `netBalance < 0` (đang nợ tiền người khác).
   - Chặn xóa nếu chuyến đi đang ở trạng thái `SETTLING` hoặc `COMPLETED`.
   - Cho phép xóa khi `netBalance === 0` và chuyến đi `ACTIVE`.
3. **Kiểm tra điều kiện rời chuyến đi (`canLeaveTrip`)**:
   - Chặn rời nhóm nếu người thực hiện là Trưởng nhóm (`HOST`).
   - Chặn rời nhóm nếu số dư công nợ `netBalance !== 0`.
   - Chặn rời nhóm nếu chuyến đi đang `SETTLING` hoặc `COMPLETED`.
   - Cho phép rời nhóm khi là `MEMBER`, `netBalance === 0` và chuyến đi `ACTIVE`.
4. **Kiểm tra quy tắc nhận diện danh tính (`canClaimMember`)**:
   - Chặn nhận diện nếu thành viên mục tiêu đã có tài khoản (`isNoAccount === false` hoặc `user_id !== null`).
   - Chặn nhận diện nếu người dùng đã có 1 yêu cầu trạng thái `PENDING` trong chuyến này (Rule R20).
   - Hợp lệ khi thành viên mục tiêu là chưa có tài khoản và chưa có yêu cầu pending của user.

### 6.2. Kịch bản Browser QA & Kiểm tra trực quan
1. **Quản lý thành viên (`/trips/trip-dalat-3n2d/members`)**:
   - Kiểm tra hiển thị bảng danh sách 5 thành viên (Trưởng nhóm Lan Nguyễn, các thành viên Tuấn Huy, Quang Minh, Thanh Quang và thành viên chưa có tài khoản Thu Hà).
   - Kiểm tra chip lọc: "Tất cả (5)", "Đã có tài khoản (4)", "Chưa có tài khoản (1)".
   - Kiểm tra ô tìm kiếm: Gõ tên lọc đúng hàng tương ứng.
   - Kiểm tra banner yêu cầu liên kết: Hiển thị yêu cầu mẫu của người mới muốn nhận là "Thu Hà", có nút Duyệt và Từ chối.
   - Thử bấm "Duyệt liên kết": Banner biến mất, dòng của Thu Hà chuyển sang trạng thái đã có tài khoản, hiển thị toast thành công.
   - Thử bấm "+ Thêm thành viên chưa có tài khoản": Modal mở ra, nhập tên "Bác Hùng", lưu thành công và xuất hiện ngay trên bảng.
   - Thử xóa thành viên có số dư: Hệ thống hiển thị cảnh báo không thể xóa do còn công nợ.
2. **Màn hình xem trước lời mời (`/join/DL3N2D-TRIP99`)**:
   - Mở màn hình với mã mời chuẩn: Thẻ xem trước hiển thị đẹp mắt với gradient, tên "Đà Lạt 3N2Đ", điểm đến, ngày đi - về, tên Trưởng nhóm, danh sách avatar.
   - Kiểm tra bảo mật (Rule R19): Không có tab chi tiêu, không hiển thị số tiền hay lịch trình chi tiết.
   - Thử nhập mã không tồn tại `/join/MA-KHONG-CO`: Hiển thị giao diện báo lỗi mã không hợp lệ, không crash trang.
   - Bấm nút "Tham gia chuyến đi": Mở modal "Bạn là ai trong chuyến đi này?".
3. **Modal "Bạn là ai trong chuyến đi này?"**:
   - Hiển thị 2 lựa chọn: Thành viên chưa có tài khoản ("Thu Hà") và "Tôi là người mới".
   - Chọn nhận "Thu Hà" và bấm gửi: Chuyển sang giao diện Chờ Trưởng nhóm duyệt (Waiting State).
   - Chọn "Tôi là người mới": Tham gia thành công và chuyển thẳng vào chuyến đi.
4. **Responsive & Trạng thái**:
   - Kiểm tra hiển thị trên Desktop (1440px), Tablet (768px), Mobile (375px).
   - Bảng cuộn ngang mượt mà trên mobile, không bị vỡ layout.

---

## 7. CÁC RỦI RO VÀ PHỤ THUỘC

1. **Rủi ro tính toán công nợ khi thay đổi danh sách thành viên**:
   - *Phân tích*: Khi thêm hoặc xóa thành viên, mảng `sessionMembers` thay đổi có thể ảnh hưởng đến các hàm `calculateMemberBalances` và phân bổ phần dư `computeEqualShares`.
   - *Giải pháp*: Chỉ cho phép xóa thành viên khi `netBalance === 0`. Đối với thành viên mới được thêm, họ có `joinOrder` lớn nhất và ban đầu có số dư bằng 0 nên không làm sai lệch các khoản chi tiêu đã chốt trước đó.
2. **Rủi ro lộ thông tin riêng tư qua route xem trước**:
   - *Phân tích*: Nếu tái sử dụng component header của trip detail, các trường nhạy cảm như ngân sách hay chi tiêu có thể bị lộ.
   - *Giải pháp*: Viết component `TripInvitePreviewCard` riêng biệt độc lập, chỉ truyền vào các trường công khai theo đúng Rule R19.
3. **Mô phỏng 2 vai trò (Trưởng nhóm vs Người xin nhận diện) trong môi trường Client Session**:
   - *Phân tích*: Không có backend và authentication thật để tự động nhận diện 2 tài khoản khác nhau.
   - *Giải pháp*: Thiết kế cơ chế chuyển đổi góc nhìn người dùng thử nghiệm (Testing View Switcher) hoặc tham số truy vấn demo để kiểm thử trọn vẹn cả 2 đầu của luồng duyệt mà không cần đăng nhập thật.

---

## 8. CÁC CÂU HỎI NGHIỆP VỤ CẦN DUYỆT (DESIGN DECISIONS)

Kính đề nghị người dùng xem xét và phê duyệt 4 quyết định thiết kế bên dưới trước khi bắt đầu triển khai code:

### Q1 — Định dạng đường dẫn cho màn hình xem trước lời mời (Public Preview Route)
- **Phương án 1 (Khuyến nghị)**: Dùng route `/join/[code]` (ví dụ: `/join/DL3N2D-TRIP99`). Đường dẫn ngắn gọn, trực quan, đúng chuẩn liên kết mời tham gia chuyến đi, nằm trong nhóm `src/app/(public)`.
- **Phương án 2**: Dùng route `/trips/join/[code]`.
- *Đề xuất*: Chọn **Phương án 1**.

### Q2 — Cơ chế demo luồng Nhận diện danh tính giữa 2 vai trò
Vì hiện tại hệ thống chưa có OAuth và backend thật:
- **Phương án 1 (Khuyến nghị)**:
  - Mặc định khi vào `/trips/[id]/members`: Người dùng đang ở vai trò Trưởng nhóm (Lan Nguyễn), thấy sẵn 1 yêu cầu pending (từ người dùng mới muốn nhận danh tính thành viên chưa có tài khoản) để kiểm thử thao tác "Duyệt / Từ chối".
  - Khi mở `/join/[code]`: Người dùng đóng vai trò khách mới mở link mời, bấm "Tham gia" sẽ mở modal "Bạn là ai trong chuyến đi này?" để trải nghiệm luồng gửi yêu cầu hoặc tham gia như người mới.
- **Phương án 2**: Cung cấp thêm 1 nút chuyển đổi vai trò nhanh trên thanh công cụ demo ("Xem với tư cách: Trưởng nhóm / Khách mời").
- *Đề xuất*: Chọn **Phương án 1** (tự nhiên, không làm rác giao diện chính thức).

### Q3 — Xử lý xóa thành viên có lịch sử tài chính nhưng số dư bằng 0 (`netBalance === 0`)
- **Phương án 1 (Khuyến nghị theo ERD Rule R6)**:
  - Nếu thành viên đã từng chi tiền hoặc nhận phần chia, nhưng hiện tại đã đối soát hết (`netBalance === 0`): Khi bấm xóa, hệ thống không xóa cứng mà chuyển `status = 'LEFT'`, hiển thị nhãn "Đã rời nhóm" trong bảng để lịch sử chia tiền cũ không bị mất dữ liệu.
  - Nếu thành viên chưa có bất kỳ giao dịch nào: Cho phép xóa hoàn toàn khỏi danh sách.
- **Phương án 2**: Chỉ cho phép xóa thành viên hoàn toàn chưa có giao dịch; thành viên đã có giao dịch thì nút "Xóa" bị vô hiệu hóa với ghi chú "Không thể xóa thành viên đã có lịch sử chi tiêu".
- *Đề xuất*: Chọn **Phương án 1**.

### Q4 — Trưởng nhóm rời chuyến đi hoặc đổi quyền Trưởng nhóm
- **Quy tắc ERD Rule R2**: Mỗi chuyến đi có đúng 1 Trưởng nhóm (`HOST`).
- **Phương án 1 (Khuyến nghị)**: Trong Release 1, Trưởng nhóm không thể tự rời chuyến đi (nút "Rời chuyến" bị ẩn hoặc vô hiệu hóa đối với Trưởng nhóm kèm giải thích: "Trưởng nhóm không thể rời chuyến đi"). Tính năng chuyển nhượng Trưởng nhóm thuộc phạm vi Release sau.
- *Đề xuất*: Chọn **Phương án 1**.
