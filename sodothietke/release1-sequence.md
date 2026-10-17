# Release 1 - Sơ đồ tuần tự (Sequence Diagram)

Cách xem: dán từng khối `mermaid` vào https://mermaid.live (xem, sửa, xuất PNG/SVG). GitHub cũng tự vẽ các khối này khi bạn mở file `.md` trong repo.

Quy ước tên: **UI** = giao diện Next.js trên trình duyệt, **API** = Route Handler phía server, **DB** = PostgreSQL. Mã R1-R18 là quy tắc nghiệp vụ, UC là use case.

---

## SD1. Thêm khoản chi và chia tiền (UC11, UC12, UC31)

```mermaid
sequenceDiagram
    autonumber
    actor U as Thành viên / Host
    participant UI as Giao diện
    participant API as API
    participant SP as SplitService
    participant DB as PostgreSQL

    U->>UI: Nhập tên, số tiền, danh mục, người trả, cách chia
    UI->>UI: Kiểm tra sơ bộ (số tiền nguyên dương, có người chia)
    UI->>API: POST /trips/{id}/expenses
    API->>API: Xác thực phiên đăng nhập

    alt Chưa đăng nhập
        API-->>UI: 401
    else Đã đăng nhập
        API->>DB: Lấy thành viên của tôi + danh sách thành viên ACTIVE của chuyến
        DB-->>API: me, members (theo join_order)

        alt Không phải thành viên ACTIVE (R1)
            API-->>UI: 403
        else Người trả không hợp lệ (R18)
            Note over API: Member chỉ được chọn chính mình làm người trả.<br/>Host được chọn bất kỳ ai (nhập hộ thành viên ảo, R12).
            API-->>UI: 403
        else Hợp lệ
            API->>SP: computeShares(amount, method, participants, items)
            Note over SP: EQUAL: chia đều, phần dư chia 1 đồng/người theo join_order (R4).<br/>ITEMIZED: chia từng món cho người ăn món đó, rồi cộng theo người.
            SP-->>API: shares[]
            API->>API: Kiểm tra SUM(shares) = amount (R3, R4)

            alt Tổng phần chia lệch
                API-->>UI: 422 Dữ liệu chia tiền không khớp
            else Khớp
                API->>DB: BEGIN
                API->>DB: SELECT status FROM trips WHERE id = ... FOR SHARE
                DB-->>API: status

                alt Chuyến đã chốt sổ (R7)
                    API->>DB: ROLLBACK
                    API-->>UI: 409 Sổ đã khóa
                else status = ACTIVE
                    API->>DB: INSERT expenses (created_by = tôi)
                    opt split_method = ITEMIZED
                        API->>DB: INSERT expense_items, expense_item_members
                    end
                    API->>DB: INSERT expense_shares
                    API->>DB: COMMIT
                    API-->>UI: 201 khoản chi + phần chia
                    UI-->>U: Cập nhật danh sách chi tiêu và số dư
                end
            end
        end
    end
```

Điểm cần nhớ: việc kiểm tra "chuyến đã chốt sổ chưa" nằm **trong transaction** với `FOR SHARE`. Nếu Host đang chốt sổ cùng lúc (SD2 dùng `FOR UPDATE` trên cùng dòng), một trong hai sẽ phải chờ, nên không thể có khoản chi lọt vào sau khi sổ đã tính xong.

---

## SD2. Chốt sổ và rút gọn nợ (UC15, UC16)

```mermaid
sequenceDiagram
    autonumber
    actor H as Host
    participant UI as Giao diện
    participant API as API
    participant SS as SettlementService
    participant DB as PostgreSQL

    H->>UI: Bấm "Chốt sổ công nợ"
    UI-->>H: Hộp xác nhận "Chốt xong sẽ không sửa được khoản chi"
    H->>UI: Xác nhận
    UI->>API: POST /trips/{id}/settlement
    API->>DB: BEGIN
    API->>DB: SELECT trips WHERE id = ... FOR UPDATE
    DB-->>API: trip, status

    alt Người gọi không phải Host (R2)
        API->>DB: ROLLBACK
        API-->>UI: 403
    else Chuyến không còn ACTIVE
        API->>DB: ROLLBACK
        API-->>UI: 409
    else Hợp lệ
        API->>DB: SUM(expenses.amount) GROUP BY paid_by_member_id
        API->>DB: SUM(expense_shares.amount) GROUP BY member_id
        DB-->>API: paid[], owed[]
        API->>SS: simplify(paid, owed)
        Note over SS: net = paid - owed cho từng người.<br/>Phải có SUM(net) = 0, nếu không là lỗi dữ liệu.<br/>Ghép người nợ nhiều nhất với người được nhận nhiều nhất, lặp lại.

        alt SUM(net) khác 0
            SS-->>API: lỗi bất biến
            API->>DB: ROLLBACK
            API-->>UI: 500 (ghi log Sentry)
        else Mọi người đều net = 0
            SS-->>API: không có khoản chuyển
            API->>DB: UPDATE trips SET status = COMPLETED
            API->>DB: COMMIT
            API-->>UI: 200 Không ai nợ ai
        else Có khoản cần chuyển
            SS-->>API: transfers[] (from, to, amount)
            API->>DB: INSERT settlements (status = ACTIVE)
            API->>DB: INSERT settlement_transfers (status = UNPAID)
            API->>DB: UPDATE trips SET status = SETTLING
            API->>DB: COMMIT
            API-->>UI: 201 bảng công nợ
            UI-->>H: Hiển thị "ai trả ai bao nhiêu"
        end
    end
```

---

## SD3. Thanh toán, tạo QR và xác nhận (UC19, UC18, UC20)

```mermaid
sequenceDiagram
    autonumber
    actor D as Người nợ
    actor R as Người nhận
    participant UI as Giao diện
    participant API as API
    participant DB as PostgreSQL
    participant VQ as img.vietqr.io

    D->>UI: Mở bảng công nợ, bấm "Thanh toán" một khoản
    UI->>API: GET /transfers/{id}/payment-info
    API->>DB: Lấy transfer và STK người nhận
    DB-->>API: transfer, bank_bin, bank_account_no
    Note over API,DB: STK = users.bank_* nếu có tài khoản,<br/>ngược lại = trip_members.bank_* (Host nhập hộ).

    alt Người gọi không phải người nợ hoặc Host (R9)
        API-->>UI: 403
    else Người nhận chưa có STK (R17)
        API-->>UI: hasQr = false
        UI-->>D: "Người nhận chưa cập nhật STK. Trả tiền mặt hoặc nhắc họ cập nhật"
    else Có STK
        API->>API: Tạo Quick Link: bankBin, STK, amount, addInfo
        API-->>UI: qrUrl + STK + tên người nhận
        UI->>VQ: Tải ảnh QR
        VQ-->>UI: Ảnh mã VietQR
        UI-->>D: Hiện QR, số tài khoản, số tiền
    end

    D->>D: Quét QR bằng app ngân hàng, chuyển tiền (ngoài hệ thống, R10)
    D->>UI: Bấm "Tôi đã thanh toán", chọn chuyển khoản hoặc tiền mặt
    UI->>API: POST /transfers/{id}/mark-paid
    API->>DB: UPDATE transfer SET status = PAID WHERE id = ... AND status = UNPAID
    DB-->>API: số dòng bị đổi

    alt 0 dòng (đã đổi trạng thái trước đó)
        API-->>UI: 409
    else 1 dòng
        API-->>UI: 200
        UI-->>D: Trạng thái "Đã thanh toán, chờ xác nhận"
    end

    R->>UI: Mở bảng công nợ, thấy khoản "Đã thanh toán"
    R->>UI: Bấm "Xác nhận đã nhận"
    UI->>API: POST /transfers/{id}/confirm
    API->>DB: UPDATE transfer SET status = COMPLETED WHERE id = ... AND status = PAID
    API->>DB: Đếm transfer chưa COMPLETED của settlement

    opt Không còn khoản nào chưa hoàn tất
        API->>DB: UPDATE trips SET status = COMPLETED
    end
    API-->>UI: 200
    UI-->>R: Trạng thái "Đã hoàn tất"
```

Ghi chú: người nhận là thành viên không tài khoản thì Host bấm xác nhận thay (R12). Người nợ là thành viên không tài khoản thì Host bấm "Tôi đã thanh toán" thay.

---

## SD4. Mở lại sổ công nợ (UC22)

```mermaid
sequenceDiagram
    autonumber
    actor H as Host
    participant UI as Giao diện
    participant API as API
    participant DB as PostgreSQL

    H->>UI: Bấm "Mở lại sổ"
    UI->>API: POST /trips/{id}/settlement/reopen
    API->>DB: BEGIN
    API->>DB: SELECT trips WHERE id = ... FOR UPDATE
    API->>DB: Đếm transfer của settlement ACTIVE có status khác UNPAID
    DB-->>API: số khoản đã có người đánh dấu

    alt Người gọi không phải Host
        API->>DB: ROLLBACK
        API-->>UI: 403
    else Đã có người đánh dấu thanh toán (R7)
        API->>DB: ROLLBACK
        API-->>UI: 409 Không thể mở lại
    else Chưa ai thanh toán
        API->>DB: UPDATE settlements SET status = CANCELLED, cancelled_at = now()
        API->>DB: UPDATE trips SET status = ACTIVE
        API->>DB: COMMIT
        API-->>UI: 200
        UI-->>H: Sổ đã mở, sửa khoản chi được
    end
```

---

## SD5. Tham gia chuyến qua link/QR và nhận diện thành viên ảo (UC05, UC33, UC30, UC34)

```mermaid
sequenceDiagram
    autonumber
    actor N as Người mới
    actor H as Host
    participant UI as Giao diện
    participant API as API
    participant DB as PostgreSQL

    N->>UI: Mở link mời hoặc quét QR mời
    UI->>API: GET /invites/{code}/preview
    API->>DB: Tìm chuyến theo invite_code, lấy Host và thành viên ACTIVE
    DB-->>API: trip, host, members

    alt Mã không tồn tại hoặc đã bị thu hồi (R14)
        API-->>UI: 404
        UI-->>N: Mã mời không hợp lệ
    else Chuyến đã lưu trữ (R15)
        API-->>UI: 410
        UI-->>N: Chuyến đã đóng
    else Hợp lệ
        Note over API: Chỉ trả tên chuyến, điểm đến, ngày đi và về, tên Host, tên và avatar thành viên (R19).<br/>Không trả lịch trình, chi tiêu, STK. Giới hạn số lần gọi theo IP để chống dò mã.
        API-->>UI: Dữ liệu thẻ xem trước
        UI-->>N: Thẻ xem trước và nút Tham gia
        N->>UI: Bấm Tham gia

        opt Chưa đăng nhập
            UI-->>N: Chuyển sang đăng nhập Google (UC01), xong quay lại link mời
        end

        UI->>API: GET /invites/{code}/claimable
        API->>DB: Người này đã là thành viên chưa, và thành viên ảo nào còn trống
        DB-->>API: isMember, placeholders (user_id IS NULL, ACTIVE)

        alt Đã là thành viên
            UI-->>N: Chuyển thẳng vào chuyến
        else Chưa là thành viên
            opt Có thành viên ảo còn trống
                UI-->>N: Có phải bạn là tên thành viên ảo mà Host đã thêm trước đó, kèm lựa chọn Tôi là người mới
            end

            alt Người mới chọn Tôi là tên thành viên ảo (UC33)
                N->>UI: Chọn đúng tên của mình
                UI->>API: POST /invites/{code}/claims
                API->>DB: INSERT member_claims PENDING
                Note over API,DB: Kiểm tra thành viên ảo còn trống và người này chưa có yêu cầu PENDING nào (R20).
                API-->>UI: 201
                UI-->>N: Đã gửi yêu cầu, chờ Host duyệt. Chưa xem được dữ liệu chuyến (R1)

                H->>UI: Mở chuyến, thấy yêu cầu liên kết đang chờ
                H->>UI: Bấm Duyệt hoặc Từ chối (UC30)
                UI->>API: POST /claims/{id}/decision
                API->>DB: BEGIN, SELECT claim và thành viên ảo FOR UPDATE

                alt Người gọi không phải Host
                    API->>DB: ROLLBACK
                    API-->>UI: 403
                else Thành viên ảo đã được liên kết với người khác
                    API->>DB: ROLLBACK
                    API-->>UI: 409
                else Host từ chối
                    API->>DB: UPDATE member_claims SET status = REJECTED
                    API->>DB: COMMIT
                    API-->>UI: 200
                    UI-->>N: Host chưa xác nhận bạn là người này. Bạn có thể tham gia như thành viên mới
                else Host duyệt
                    API->>DB: UPDATE trip_members SET user_id, xóa bank_* của thành viên ảo
                    API->>DB: UPDATE member_claims SET status = APPROVED
                    API->>DB: Các yêu cầu PENDING khác của cùng thành viên ảo chuyển sang REJECTED
                    API->>DB: COMMIT
                    API-->>UI: 200
                    UI-->>N: Vào chuyến với đúng tên cũ, lịch sử khoản chi và join_order giữ nguyên
                end
            else Người mới chọn Tôi là người mới
                UI->>API: POST /invites/{code}/join
                API->>DB: INSERT trip_members (join_order = lớn nhất + 1, role MEMBER)
                API-->>UI: 201
                UI-->>N: Vào chuyến
            end
        end
    end
```

**Vì sao bắt buộc Host duyệt, không cho tự động liên kết:** thành viên ảo có thể đang được nợ tiền hoặc đang đứng tên người nhận. Nếu ai có link cũng tự nhận được "Nam" thì họ nhận luôn khoản tiền của Nam. Bước duyệt chặn việc đó.

**Các quy tắc đi kèm SD5**

| # | Quy tắc | |
|---|---|---|
| R13 | Người mới có thể yêu cầu liên kết với một thành viên ảo (UC33). Chỉ khi Host duyệt (UC30) mới gán `user_id`; lịch sử, `join_order` giữ nguyên. Chưa duyệt thì người đó chưa xem được dữ liệu chuyến. Bị từ chối thì tham gia như thành viên mới | Sửa |
| R19 | Người có mã mời hợp lệ chỉ xem được thẻ xem trước (tên chuyến, điểm đến, ngày, tên Host, tên và avatar thành viên). Không thấy lịch trình, chi tiêu, STK. Mã mời đủ dài và ngẫu nhiên, giới hạn số lần thử theo IP | Mới |
| R20 | Mỗi tài khoản tối đa 1 yêu cầu PENDING mỗi chuyến. Một thành viên ảo chỉ liên kết được với 1 tài khoản; khi một yêu cầu được duyệt, các yêu cầu PENDING khác của cùng thành viên ảo tự bị từ chối | Mới |

**QR mời (UC34):** sinh ngay trên trình duyệt từ link mời bằng thư viện QR (ví dụ `qrcode`), không gọi dịch vụ ngoài và không cần API riêng, nên không có sơ đồ tuần tự.

---

## Thuật toán và test cần viết (phần tiền, sai một đồng cũng là lỗi)

**Chia đều có phần dư (R4)**

```ts
// Trả về phần của từng người, theo đúng thứ tự join_order truyền vào
function splitEqual(amount: number, memberIds: string[]): Map<string, number> {
  const n = memberIds.length;
  const base = Math.floor(amount / n);
  const remainder = amount - base * n;           // 0 <= remainder < n
  const result = new Map<string, number>();
  memberIds.forEach((id, i) => result.set(id, base + (i < remainder ? 1 : 0)));
  return result;                                  // tổng luôn bằng amount
}
```

**Rút gọn nợ (greedy, gần tối ưu)**

```ts
function simplify(net: Map<string, number>) {     // net = đã trả - phải chịu
  const creditors = [...net].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const debtors   = [...net].filter(([, v]) => v < 0).map(([id, v]) => [id, -v] as [string, number])
                            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const transfers: { from: string; to: string; amount: number }[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i][1], creditors[j][1]);
    transfers.push({ from: debtors[i][0], to: creditors[j][0], amount: pay });
    debtors[i][1] -= pay; creditors[j][1] -= pay;
    if (debtors[i][1] === 0) i++;
    if (creditors[j][1] === 0) j++;
  }
  return transfers;
}
```

Cách này có tối đa (số người có số dư khác 0) - 1 giao dịch. Tìm số giao dịch nhỏ nhất tuyệt đối là bài toán NP-khó, nên khi bảo vệ hãy nói rõ bạn dùng heuristic và lý do.

**Danh sách test tối thiểu (Vitest)**

| # | Test | Kỳ vọng |
|---|---|---|
| 1 | Chia 100.000 cho 3 người | 33.334 / 33.333 / 33.333, tổng 100.000 |
| 2 | Chia 1 đồng cho 3 người | 1 / 0 / 0 |
| 3 | Chia theo món: món X gán 2 người, món Y gán 1 người | Tổng phần chia = tổng hóa đơn |
| 4 | Ba người, mỗi người ứng một khoản khác nhau | SUM(net) = 0, số giao dịch tối đa 2 |
| 5 | Mọi người trả đúng phần của mình | Không có giao dịch nào |
| 6 | Chạy simplify 2 lần với cùng dữ liệu | Kết quả giống hệt (xác định) |

---

## Quyết định mới cần bạn xác nhận

| # | Nội dung |
|---|---|
| R18 (đề xuất) | Member chỉ được ghi khoản chi mà **chính mình** là người trả. Host được ghi hộ cho bất kỳ ai. Quy tắc này ngăn việc A nhập khoản chi giả "B đã trả" |
| VietQR | Quick Link dựng ảnh QR trên máy chủ của vietqr.io, nên **số tài khoản và số tiền được gửi sang bên thứ ba**. Với đồ án và beta kín thì chấp nhận được, nhưng cần ghi trong Chính sách bảo mật. Tài liệu VietQR cũng nói dự án chính thức cần tạo template riêng tại my.vietqr.io. Cách thay thế sau này: tự sinh QR trên server theo chuẩn VietQR/EMVCo bằng thư viện, không gửi dữ liệu ra ngoài |
