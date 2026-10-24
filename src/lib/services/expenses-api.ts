import {
  CreateExpenseFormData,
  ExpenseCategory,
  ExpenseItemData,
  ExpenseShare,
  ExpenseSurchargeData,
  SplitMethod,
  TripExpense,
} from "@/types/trip";
import { isUuid } from "@/lib/services/trips-api";
import { formatDateInputToIso } from "@/lib/view/expense-row";
import {
  CreateExpenseApiInput,
  UpdateExpenseApiInput,
} from "@/lib/validation/expense-api";

export class ExpensesApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    status = 500,
    code = "EXPENSES_API_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "ExpensesApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiExpenseShareDto {
  id: string;
  memberId: string;
  amount: number;
  member?: {
    id: string;
    displayName: string;
    status: "ACTIVE" | "LEFT";
  };
}

export interface ApiExpenseItemMemberDto {
  id: string;
  displayName?: string;
  status?: "ACTIVE" | "LEFT";
}

export interface ApiExpenseItemDto {
  id: string;
  name: string;
  amount: number;
  assignedMembers?: ApiExpenseItemMemberDto[];
  assignedMemberIds?: string[];
}

export interface ApiExpenseDto {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  surchargeAmount?: number | null;
  category: ExpenseCategory;
  paidByMemberId: string;
  paidBy?: {
    id: string;
    displayName: string;
    role: "HOST" | "MEMBER";
    status: "ACTIVE" | "LEFT";
  };
  createdByMemberId: string;
  createdBy?: {
    id: string;
    displayName: string;
  };
  splitMethod: SplitMethod;
  spentAt: string;
  receiptImageUrl?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  itineraryItemId?: string | null;
  itineraryItem?: {
    id: string;
    placeName: string;
    dayDate?: string;
  } | null;
  shares: ApiExpenseShareDto[];
  items?: ApiExpenseItemDto[];
}

export interface ExpensesApiClientOptions {
  customFetch?: typeof fetch;
  baseUrl?: string;
}

interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
}

interface ApiErrorEnvelope {
  success: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

/**
 * Phân tích phản hồi từ backend API, ném ExpensesApiError nếu request thất bại hoặc body sai định dạng.
 */
async function parseApiResponse<T>(res: Response): Promise<T> {
  let parsedBody: unknown;
  try {
    parsedBody = await res.json();
  } catch {
    throw new ExpensesApiError(
      `Không thể đọc dữ liệu phản hồi từ máy chủ (HTTP ${res.status}).`,
      res.status,
      "INVALID_RESPONSE"
    );
  }

  if (!res.ok) {
    const errorEnv = parsedBody as ApiErrorEnvelope;
    const message =
      errorEnv?.error?.message ||
      `Yêu cầu thất bại với mã lỗi HTTP ${res.status}.`;
    const code = errorEnv?.error?.code || `HTTP_${res.status}`;
    const details = errorEnv?.error?.details;
    throw new ExpensesApiError(message, res.status, code, details);
  }

  const successEnv = parsedBody as ApiSuccessEnvelope<T>;
  if (successEnv && typeof successEnv === "object" && "data" in successEnv) {
    return successEnv.data;
  }

  throw new ExpensesApiError(
    "Dữ liệu phản hồi từ máy chủ không đúng định dạng.",
    res.status,
    "MALFORMED_DATA"
  );
}

/**
 * Ánh xạ phản hồi DTO của Expense API thành TripExpense domain entity cho UI và tính toán số dư.
 * Bảo toàn UUID của expense, member, items, shares và integer VND.
 */
export function mapApiExpenseToDomain(dto: ApiExpenseDto): TripExpense {
  const shares: ExpenseShare[] = (dto.shares || []).map((s) => ({
    id: s.id,
    expenseId: dto.id,
    memberId: s.memberId,
    amount: s.amount,
  }));

  const items: ExpenseItemData[] | undefined = dto.items
    ? dto.items.map((it) => {
        const assignedMemberIds =
          it.assignedMemberIds ||
          (it.assignedMembers ? it.assignedMembers.map((m) => m.id) : []);
        return {
          id: it.id,
          name: it.name,
          amount: it.amount,
          assignedMemberIds,
        };
      })
    : undefined;

  const surcharge: ExpenseSurchargeData | null =
    dto.surchargeAmount && dto.surchargeAmount > 0
      ? {
          name: "Phụ phí / VAT",
          amount: dto.surchargeAmount,
        }
      : null;

  return {
    id: dto.id,
    tripId: dto.tripId,
    title: dto.title,
    amount: dto.amount,
    category: dto.category,
    paidByMemberId: dto.paidByMemberId,
    splitMethod: dto.splitMethod,
    spentAt: dto.spentAt,
    receiptImageUrl: dto.receiptImageUrl || undefined,
    note: dto.note || undefined,
    itineraryItemId: dto.itineraryItemId ?? (dto.itineraryItem?.id ?? null),
    locationName: dto.itineraryItem?.placeName || undefined,
    shares,
    items,
    surcharge,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

/**
 * Ánh xạ dữ liệu biểu mẫu CreateExpenseFormData sang payload chuẩn của POST /api/trips/[id]/expenses.
 * Không gửi các trường bị cấm hoặc trường server tự quyết định (tripId, createdByMemberId, role, userId).
 */
export function mapFormDataToCreateExpenseInput(
  formData: CreateExpenseFormData,
  extra?: { itineraryItemId?: string | null }
): CreateExpenseApiInput {
  const safeAmount = formData.amount || 0;
  const spentAt = formatDateInputToIso(formData.spentAtDate, formData.spentAtTime);

  const itineraryItemId =
    extra?.itineraryItemId !== undefined
      ? extra.itineraryItemId
      : formData.itineraryItemId !== undefined
      ? formData.itineraryItemId
      : null;

  const base = {
    title: formData.title.trim(),
    amount: safeAmount,
    category: formData.category,
    paidByMemberId: formData.paidByMemberId,
    spentAt,
    receiptImageUrl: formData.receiptImageUrl?.trim() || null,
    note: formData.note?.trim() || null,
    itineraryItemId: itineraryItemId && isUuid(itineraryItemId) ? itineraryItemId : null,
  };

  if (formData.splitMethod === "ITEMIZED") {
    const surchargeAmount =
      formData.surcharge && formData.surcharge.amount > 0
        ? formData.surcharge.amount
        : 0;

    return {
      ...base,
      splitMethod: "ITEMIZED" as const,
      surchargeAmount,
      items: (formData.items || []).map((it) => ({
        id: it.id && isUuid(it.id) ? it.id : undefined,
        name: it.name.trim(),
        amount: it.amount,
        assignedMemberIds: it.assignedMemberIds,
      })),
    };
  }

  return {
    ...base,
    splitMethod: "EQUAL" as const,
    participantMemberIds: formData.participantMemberIds,
  };
}

/**
 * Ánh xạ dữ liệu biểu mẫu CreateExpenseFormData sang payload chuẩn của PATCH /api/trips/[id]/expenses/[expenseId].
 */
export function mapFormDataToUpdateExpenseInput(
  formData: CreateExpenseFormData,
  extra?: { itineraryItemId?: string | null }
): UpdateExpenseApiInput {
  const safeAmount = formData.amount || 0;
  const spentAt = formatDateInputToIso(formData.spentAtDate, formData.spentAtTime);

  const itineraryItemId =
    extra?.itineraryItemId !== undefined
      ? extra.itineraryItemId
      : formData.itineraryItemId !== undefined
      ? formData.itineraryItemId
      : undefined;

  const base: UpdateExpenseApiInput = {
    title: formData.title.trim(),
    amount: safeAmount,
    category: formData.category,
    paidByMemberId: formData.paidByMemberId,
    spentAt,
    receiptImageUrl: formData.receiptImageUrl?.trim() || null,
    note: formData.note?.trim() || null,
    splitMethod: formData.splitMethod,
  };

  if (itineraryItemId !== undefined) {
    base.itineraryItemId =
      itineraryItemId && isUuid(itineraryItemId) ? itineraryItemId : null;
  }

  if (formData.splitMethod === "ITEMIZED") {
    base.surchargeAmount =
      formData.surcharge && formData.surcharge.amount > 0
        ? formData.surcharge.amount
        : 0;
    base.items = (formData.items || []).map((it) => ({
      id: it.id && isUuid(it.id) ? it.id : undefined,
      name: it.name.trim(),
      amount: it.amount,
      assignedMemberIds: it.assignedMemberIds,
    }));
  } else {
    base.participantMemberIds = formData.participantMemberIds;
  }

  return base;
}

/**
 * GET /api/trips/[id]/expenses
 * Lấy danh sách các khoản chi tiêu của một chuyến đi.
 */
export async function fetchTripExpenses(
  tripId: string,
  filters?: { category?: string; splitMethod?: string },
  options?: ExpensesApiClientOptions
): Promise<TripExpense[]> {
  if (!tripId || !isUuid(tripId)) {
    throw new ExpensesApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";

  const queryParams = new URLSearchParams();
  if (filters?.category && filters.category !== "ALL") {
    queryParams.set("category", filters.category);
  }
  if (filters?.splitMethod) {
    queryParams.set("splitMethod", filters.splitMethod);
  }

  const queryString = queryParams.toString();
  const url = `${baseUrl}/api/trips/${tripId}/expenses${
    queryString ? `?${queryString}` : ""
  }`;

  const res = await fetchFn(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
  });

  const dtos = await parseApiResponse<ApiExpenseDto[]>(res);
  return dtos.map(mapApiExpenseToDomain);
}

/**
 * POST /api/trips/[id]/expenses
 * Tạo mới một khoản chi tiêu trong chuyến đi.
 */
export async function createExpense(
  tripId: string,
  input: CreateExpenseApiInput | CreateExpenseFormData,
  options?: ExpensesApiClientOptions
): Promise<TripExpense> {
  if (!tripId || !isUuid(tripId)) {
    throw new ExpensesApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";

  // Nếu input là CreateExpenseFormData, chuyển đổi sang CreateExpenseApiInput
  const payload: CreateExpenseApiInput =
    "spentAtDate" in input ? mapFormDataToCreateExpenseInput(input) : input;

  const res = await fetchFn(`${baseUrl}/api/trips/${tripId}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });

  const dto = await parseApiResponse<ApiExpenseDto>(res);
  return mapApiExpenseToDomain(dto);
}

/**
 * PATCH /api/trips/[id]/expenses/[expenseId]
 * Cập nhật một khoản chi tiêu trong chuyến đi.
 */
export async function updateExpense(
  tripId: string,
  expenseId: string,
  input: UpdateExpenseApiInput | CreateExpenseFormData,
  options?: ExpensesApiClientOptions
): Promise<TripExpense> {
  if (!tripId || !isUuid(tripId)) {
    throw new ExpensesApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  if (!expenseId || !isUuid(expenseId)) {
    throw new ExpensesApiError(
      "Mã khoản chi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_EXPENSE_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";

  const payload: UpdateExpenseApiInput =
    "spentAtDate" in input ? mapFormDataToUpdateExpenseInput(input) : input;

  const res = await fetchFn(
    `${baseUrl}/api/trips/${tripId}/expenses/${expenseId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    }
  );

  const dto = await parseApiResponse<ApiExpenseDto>(res);
  return mapApiExpenseToDomain(dto);
}

/**
 * DELETE /api/trips/[id]/expenses/[expenseId]
 * Xóa một khoản chi tiêu khỏi chuyến đi.
 */
export async function deleteExpense(
  tripId: string,
  expenseId: string,
  options?: ExpensesApiClientOptions
): Promise<{ id: string }> {
  if (!tripId || !isUuid(tripId)) {
    throw new ExpensesApiError(
      "Mã chuyến đi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_TRIP_ID"
    );
  }

  if (!expenseId || !isUuid(expenseId)) {
    throw new ExpensesApiError(
      "Mã khoản chi không hợp lệ (yêu cầu UUID).",
      400,
      "INVALID_EXPENSE_ID"
    );
  }

  const fetchFn = options?.customFetch || fetch;
  const baseUrl = options?.baseUrl || "";

  const res = await fetchFn(
    `${baseUrl}/api/trips/${tripId}/expenses/${expenseId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
      credentials: "same-origin",
    }
  );

  const result = await parseApiResponse<{ id: string }>(res);
  return result;
}
