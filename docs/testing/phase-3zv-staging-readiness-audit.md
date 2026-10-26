# BÁO CÁO ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG CỦA RELEASE 1 TRÊN STAGING
## Phase 3ZV — Release 1 Staging Readiness Audit

> **Thời điểm thực hiện audit:** 2026-10-25T15:36:00+07:00  
> **Môi trường đánh giá:** Staging (`https://staging.tungcloud.online`)  
> **Nhánh mục tiêu:** `staging/release-1-preview`  
> **HEAD Commit đã triển khai:** `cb554e6` (`cb554e61a82cf81cd0872eb2d615f14444fc25c4`)  
> **Trạng thái triển khai Vercel:** Ready  
> **Ranh giới an toàn:** Hoàn toàn chỉ đọc (Read-only audit); tuyệt đối không thao tác dữ liệu Production (`fzdaasbckmnndqzqopex`); không chạy migration, seed hay lệnh ghi dữ liệu.

---

## 1. Trạng thái Git và Deployment

### 1.1. Định danh Commit và Nhánh
- **Nhánh hiện tại:** `staging/release-1-preview` (trùng khớp chính xác nhánh Staging mục tiêu).
- **Commit HEAD đã push:**
  ```text
  cb554e6 fix(trips): enable real invite lookup, Google avatar support and join flow
  ```
- **Remote Git:** `origin` -> `https://github.com/caothanhtungg/smart-trip.git`
- **Đối chiếu SHA:**
  - Local HEAD: `cb554e61a82cf81cd0872eb2d615f14444fc25c4`
  - Remote `origin refs/heads/staging/release-1-preview`: `cb554e61a82cf81cd0872eb2d615f14444fc25c4`
  - Khớp chính xác 100%.

### 1.2. Phân biệt thay đổi đã commit và chưa commit trong Working Tree
- **Các thay đổi đã commit vào `cb554e6` (đã lên Staging):**
  1. `next.config.ts`: Khai báo `images.remotePatterns` cho `*.googleusercontent.com`.
  2. `src/components/ui/avatar.tsx`: Bổ sung `unoptimized` và fallback `onError` về `initials`.
  3. `src/components/trips/invite-code-modal.tsx`: Tra cứu API thật `GET /api/invites/[code]`, preview an toàn Rule R19, tích hợp modal tham gia `TripClaimIdentityModal`.
  4. `src/components/trips/invite-code-modal.test.ts`: Bộ 10 unit tests cho luồng tra cứu và tham gia mã mời.
- **Các thay đổi chưa commit (được bảo toàn tại Working Tree local):**
  - *Modified unstaged (3 files):* `PROJECT_CONTEXT.md`, `docs/phase-3-backend-plan.md`, `sodothietke/release1-erd.dbml` (tài liệu kiến trúc/ERD).
  - *Untracked (4 thư mục/tập tin):* `docs/erd-changes-proposal.md`, `docs/release-1-staging-runbook.md`, `docs/testing/`, `scripts/` (tài liệu runbook, báo cáo testing và scripts Gate 4A/smoke).
  - *Staged:* 0 files (không có thay đổi nào đang trong index).

---

## 2. Kết quả kiểm tra chất lượng kỹ thuật (Quality Gates)

Toàn bộ các lệnh kiểm tra kỹ thuật offline đã được chạy trực tiếp trong phiên audit hiện hành với kết quả như sau:

| STT | Lệnh kiểm tra | Thời điểm thực hiện (ISO 8601) | Kết quả | Chi tiết kết quả |
| :---: | :--- | :---: | :---: | :--- |
| 1 | `npx tsc --noEmit` | `2026-10-25T15:35:06+07:00` → `15:35:10` | **PASS (Exit 0)** | 0 lỗi kiểu dữ liệu TypeScript toàn dự án. |
| 2 | `npm test` | `2026-10-25T15:35:17+07:00` → `15:35:24` | **PASS (Exit 0)** | **76/76 test files passed** (100%), **1,131/1,131 tests passed** (0 failed, 0 skipped). Bao gồm property-based tests 2,000 ca chia tiền và 1,000 ca tối ưu hóa công nợ. |
| 3 | `npm run lint` | `2026-10-25T15:35:31+07:00` → `15:35:43` | **PASS (Exit 0)** | 0 errors. Có 4 warnings không chặn build nằm trong các scripts offline (`gate-4a-orchestrator.ts`, `smoke-runner.ts`). |
| 4 | `git diff --check` | `2026-10-25T15:35:55+07:00` | **PASS (Exit 0)** | 0 lỗi whitespace, trailing space hoặc newline. |

---

## 3. Checklist chức năng nghiệp vụ Release 1

Tiêu chí đánh giá:
- **PASS (VERIFIED VIA LIVE STAGING + AUTOMATED TESTS):** Đã kiểm thử tự động đạt 100% và đã được người dùng thực hiện kiểm thử thành công trên Staging `https://staging.tungcloud.online`.
- **PASS (AUTOMATED & CATALOG VERIFIED):** Đã kiểm thử tự động đạt 100% và đối chiếu catalog/schema cơ sở dữ liệu thành công.
- **NEEDS MANUAL VERIFICATION:** Code và unit/API test tự động đã hoàn chỉnh và PASS, nhưng cần bước thao tác xác nhận trực quan cuối cùng của người dùng trên môi trường Staging.
- **FAIL:** Phát hiện lỗi hoặc không đạt tiêu chí.
- **NOT TESTED:** Chưa được kiểm thử ở bất kỳ hình thức nào.

| STT | Phân hệ chức năng | Trạng thái | Bằng chứng kỹ thuật & Thực tế | Bước tiếp theo |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Đăng ký, đăng nhập, đăng xuất & Session** | **PASS** | - Google OAuth + Better Auth hoạt động bình thường trên Staging.<br />- Acc 1 và Acc 2 đăng nhập thành công, tạo session hợp lệ.<br />- Automated tests: `src/lib/auth/session.test.ts` (8/8 tests pass). | Duy trì cấu hình Google OAuth Client ID hiện tại. |
| 2 | **Tạo, xem, cập nhật chuyến đi & Quản lý thành viên** | **PASS** | - Chuyến đi `sapa` được tạo thành công bởi Acc 1 trên Staging.<br />- Giao diện danh sách `/trips` và trang chi tiết `/trips/[id]` hiển thị mượt mà.<br />- Automated tests: `trips/route.test.ts` (13 tests), `trips/[id]/route.test.ts` (42 tests), `members/route.test.ts` (19 tests), `trip-members-integration.test.ts` (26 tests). Tổng: 100 tests pass. | Sẵn sàng cho nghiệp thu. |
| 3 | **Tra cứu mã mời, tham gia chuyến đi & Xử lý mã lỗi** | **PASS** | - Đã kiểm thử trực tiếp trên Staging sau commit `cb554e6`: Acc 2 nhập mã `KGDSPB-CY9U2A`, modal tra cứu API thật trả về chuyến đi `sapa`, avatar Google hiển thị chuẩn xác và tham gia thành công.<br />- Khóa dòng nguyên tử `FOR UPDATE` chống race condition.<br />- Automated tests: `invite-code-modal.test.ts` (10 tests), `trip-join-flow.test.ts` (16 tests), `invites/[code]/route.test.ts` (9 tests), `join/route.test.ts` (13 tests). Tổng: 48 tests pass. | Đã hoàn thành mục tiêu Phase 3ZU-JOIN. |
| 4 | **Tạo khoản chi, xác thực số tiền & Thuật toán phân chia chi phí** | **PASS** | - Người dùng đã tạo khoản chi thành công trên Staging.<br />- Thuật toán chia đều bảo toàn tổng tiền (Zero-sum invariant) qua 2,000 ca kiểm thử ngẫu nhiên.<br />- Thuật toán tối ưu công nợ (Simplify debt) thỏa mãn 5 tính chất bất biến qua 1,000 ca kiểm thử.<br />- Automated tests: `split.test.ts` (26 tests), `simplify.test.ts` (8 tests), `expense.test.ts` (26 tests), `itemized-expense.test.ts` (14 tests), `expenses/route.test.ts` (22 tests). Tổng: 96 tests pass. | Kiểm tra thêm trường hợp phụ phí VAT/Service fee nếu cần. |
| 5 | **Tải, truy cập & Bảo vệ ảnh hóa đơn (Receipts)** | **PASS** | - Người dùng đã tải ảnh hóa đơn thành công trên Staging.<br />- Bucket Supabase Storage `trip-receipts` ở chế độ Private.<br />- Kiểm tra Magic Bytes chống giả mạo định dạng, giới hạn dung lượng 5MB.<br />- Đọc ảnh qua Route Proxy phân quyền server-side (`src/app/api/trips/[id]/receipts/[fileId]`).<br />- Automated tests: `receipts/route.test.ts` (17 tests), `storage/receipts.test.ts` (22 tests), `receipts-api.test.ts` (6 tests). Tổng: 45 tests pass. | Đảm bảo bucket tiếp tục giữ quyền Private. |
| 6 | **Yêu cầu nhận diện thành viên (Claims — UC33)** | **NEEDS MANUAL VERIFICATION** | - Code và luồng API backend đã hoàn chỉnh.<br />- Chặn claim trùng lặp bằng Partial Index `one_pending_claim`.<br />- Snapshot STK ngân hàng an toàn (`bank_claim_snapshots`).<br />- Automated tests: `claims/route.test.ts` (14 tests), `claims/[claimId]/decision/route.test.ts` (12 tests), `claim-db-errors.test.ts` (7 tests), `claim-api.test.ts` (10 tests). Tổng: 43 tests pass.<br />- *Thực tế Staging:* Chưa có phiên thử nghiệm thủ công người dùng thứ hai gửi claim và Trưởng nhóm duyệt claim trên Staging. | Chủ dự án thực hiện 1 ca thử nghiệm tạo placeholder guest -> claim -> approve trên Staging. |
| 7 | **Chốt sổ công nợ, Đối soát & Quét mã VietQR** | **NEEDS MANUAL VERIFICATION** | - Logic chốt sổ, tính toán công nợ và sinh mã VietQR đã được tự động hóa.<br />- Mã hóa STK bằng AES-256-GCM tại tầng ứng dụng (`bank-encryption.test.ts`).<br />- Chống xác nhận trùng lặp thanh toán (`settlement_transfers`).<br />- Automated tests: `settlement/route.test.ts` (15 tests), `reopen/route.test.ts` (7 tests), `transfers/.../route.test.ts` (31 tests), `trip-settlement-integration.test.ts` (16 tests), `vietqr.test.ts` (12 tests), `bank-encryption.test.ts` (22 tests). Tổng: 103 tests pass.<br />- *Thực tế Staging:* Chưa có ca chốt sổ chuyến đi thực tế trên Staging và dùng app ngân hàng thật quét mã VietQR. | Chủ dự án bấm "Chốt sổ" một chuyến đi test trên Staging và dùng app ngân hàng quét thử QR hiển thị. |
| 8 | **Phân quyền, RLS, Xử lý lỗi API & Rate Limiting** | **PASS (AUTOMATED & CATALOG VERIFIED)** | - RLS đã được bật trên toàn bộ các bảng nghiệp vụ (`relrowsecurity = true`).<br />- Rate limiting bằng PostgreSQL (`rate_limits`) bảo vệ endpoint tra cứu mã mời (10 req/phút) và gửi claim.<br />- Kiểm tra phân quyền đa người thuê (Cross-tenant): thành viên ngoài chuyến đi nhận 403 Forbidden hoặc 404 Not Found.<br />- Automated tests: `rate-limit.test.ts` (20 tests), `auth-guard.test.ts` (11 tests), `response.test.ts` (9 tests), và các test suite phân quyền API. | Duy trì cơ chế Rate Limit và RLS. |

---

## 4. Rà soát cấu hình Staging & Runbook

Đối chiếu theo [docs/release-1-staging-runbook.md](file:///c:/Users/admin/Downloads/doanweb/docs/release-1-staging-runbook.md):

| Hạng mục cấu hình | Trạng thái | Đánh giá & Bằng chứng |
| :--- | :---: | :--- |
| **Supabase Staging Project Target** | **PASS** | Đã xác nhận sử dụng Project Ref `rwvptwjpfhtfkiwboexz`. Không có bất kỳ kết nối nào tới Production `fzdaasbckmnndqzqopex`. |
| **Prisma Migrations & Schema** | **PASS** | Database Staging đã được đồng bộ đầy đủ 16 bảng nghiệp vụ, cột mở rộng `start_time`/`end_time` của lịch trình và index `one_pending_claim`. |
| **Supabase Storage Bucket `trip-receipts`** | **PASS** | Đã được cấu hình ở chế độ Private. Upload và xem ảnh hóa đơn đã hoạt động thực tế trên Staging qua proxy an toàn. |
| **Google OAuth Staging Credentials** | **PASS** | Domain `https://staging.tungcloud.online` và callback `/api/auth/callback/google` đã được cấu hình trong Google Cloud Console. Đăng nhập thành công thực tế. |
| **Biến môi trường Hosting Vercel** | **PASS** | Ứng dụng kết nối database, Better Auth, Supabase Storage và AES key trơn tru, không phát sinh lỗi biến môi trường thiếu hay sai định dạng. |
| **Vercel Image Optimization** | **PASS** | Đã khai báo hostname `*.googleusercontent.com` tại commit `cb554e6`. Không còn lỗi `Invalid src prop` trên `next/image`. |

---

## 5. Phân loại rủi ro & Danh sách Blocker trước phát hành

### 5.1. Mức độ Critical (Chặn phát hành tuyệt đối): 0 hạng mục
- Không có lỗi crash ứng dụng, không có lỗi rò rỉ dữ liệu hoặc lộ secrets.
- 100% Type check, Linter và Test suite đều đạt chuẩn.

### 5.2. Mức độ High (Ảnh hưởng nghiêm trọng): 0 hạng mục
- Toàn bộ luồng cốt lõi (Đăng nhập, Tạo chuyến đi, Mời & Tham gia, Chi tiêu, Upload hóa đơn) đều đã hoạt động thực tế trên Staging.

### 5.3. Mức độ Medium (Cần hoàn tất kiểm thử trước khi mở rộng người dùng): 2 hạng mục
1. **Kiểm thử thực tế Chốt sổ công nợ (Settlement) & VietQR trên app ngân hàng thật:**
   - *Hiện trạng:* Logic tính toán toán học và sinh mã QR đã PASS 100% offline (103 tests), nhưng chưa có biên bản quét mã QR thực tế bằng 2 ứng dụng ngân hàng khác nhau trên màn hình Staging.
   - *Hành động đề xuất:* Người dùng tạo 1 khoản chi chia đôi giữa Acc 1 và Acc 2, bấm Chốt sổ, mở mã VietQR và dùng camera app ngân hàng quét xem có nhận diện đúng STK, ngân hàng và số tiền không (dừng ở màn hình kiểm tra thông tin, không chuyển tiền thật).
2. **Kiểm thử thực tế Luồng nhận diện thành viên (Claims — UC33):**
   - *Hiện trạng:* API và logic kiểm tra partial index đã PASS 100% offline (43 tests). Cần người dùng xác nhận giao diện thông báo của Trưởng nhóm khi nhận claim từ thành viên ảo.
   - *Hành động đề xuất:* Tạo 1 thành viên ảo (không tài khoản), dùng Acc 2 chọn claim và dùng Acc 1 phê duyệt trên Staging.

### 5.4. Mức độ Low (Vệ sinh mã nguồn & Tài liệu): 2 hạng mục
1. 4 warnings ESLint trong các scripts test offline (`scripts/gate-4a-orchestrator.ts`, `scripts/smoke-runner.ts`) — không ảnh hưởng tới code chạy production.
2. Các file tài liệu và runbook đang ở trạng thái modified/untracked trong working tree local — cần được gom thành một commit tài liệu riêng sau khi hoàn tất nghiệm thu.

---

## 6. Các hạng mục cần người dùng kiểm tra thủ công trước khi Go-Live

Để có biên bản nghiệm thu đầy đủ 100%, người dùng chỉ cần thực hiện 2 thao tác thủ công ngắn trên Staging:
1. **Kiểm tra VietQR:**
   - Trong chuyến đi `sapa` (đã có Acc 1 và Acc 2), tạo 1 khoản chi (ví dụ 100,000 VND).
   - Bấm nút **"Chốt sổ chuyến đi"**.
   - Ở phía tài khoản nợ tiền, bấm **"Thanh toán"** để mở mã VietQR.
   - Dùng app ngân hàng thật quét mã QR trên màn hình xem thông tin có tự điền chính xác STK và số tiền không.
2. **Kiểm tra Duyệt Claim (nếu sử dụng tính năng thành viên ảo):**
   - Trưởng nhóm thêm 1 thành viên ảo (ví dụ: "Bạn Nam").
   - Người dùng thứ 3 nhập mã mời, chọn "Nhận diện là Bạn Nam".
   - Trưởng nhóm vào tab Thành viên kiểm tra thông báo yêu cầu và bấm "Phê duyệt".

---

## 7. Kết luận

### ĐÁNH GIÁ: **READY FOR RELEASE REVIEW** (Sẵn sàng cho phiên họp nghiệm thu & duyệt phát hành Release 1)

**Lý do:**
1. Bản build hiện tại trên commit `cb554e6` tại `staging/release-1-preview` hoàn toàn ổn định, không có lỗi runtime trên Vercel.
2. Vấn đề cốt lõi về **tra cứu mã mời, tham gia chuyến đi** và **lỗi hiển thị avatar Google** đã được sửa triệt để và được người dùng xác nhận hoạt động bình thường trên Staging.
3. Toàn bộ 76 test files với **1,131 tests tự động** đạt tỷ lệ thành công 100%. TypeScript và Linter đều đạt chuẩn 0 lỗi.
4. Cơ sở dữ liệu Staging và Supabase Storage đảm bảo an toàn, không có rủi ro can thiệp nhầm vào Production.
5. Hai hạng mục còn lại (VietQR và Claims) là các xác nhận trải nghiệm thực tế trên thiết bị của người dùng, không phải lỗi kỹ thuật chặn phát hành (blocker).

> **Lưu ý quy trình:** Trạng thái *READY FOR RELEASE REVIEW* thể hiện ứng dụng đã đạt chất lượng kỹ thuật cao nhất trên Staging để trình Product Owner / Hội đồng nghiệm thu. Sau khi hoàn thành 2 bước kiểm tra thủ công ở Mục 6 và được ký duyệt, dự án có thể tiến hành lập kế hoạch triển khai Production có kiểm soát.
