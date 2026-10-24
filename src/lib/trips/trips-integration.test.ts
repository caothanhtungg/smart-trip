import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchMyTrips,
  createTripApi,
  TripsApiError,
  mapApiTripToDomain,
  type ApiTripListItemDto,
  type ApiCreateTripResponseDto,
} from "@/lib/services/trips-api";
import { filterTrips, sortTrips } from "@/lib/trips/filter-sort";
import { toTripCardViews } from "@/lib/view/trip-card";
import { getOverallBalance } from "@/lib/trips/balance";
import { validateCreateTripForm } from "@/lib/trip-form-validation";
import { MOCK_TRIPS, getTripDetailById } from "@/lib/mock/trips";
import type { Trip } from "@/types/trip";

describe("Phase 3D-2C: Trips List & Create Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockDbTripUuid = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

  const sampleApiTripDto: ApiTripListItemDto = {
    id: mockDbTripUuid,
    name: "Hà Giang mùa hoa tam giác mạch",
    destination: "Hà Giang",
    startDate: "2026-10-25",
    endDate: "2026-10-28",
    budgetAmount: 15000000,
    status: "ACTIVE",
    inviteCode: "HG2026-HOA99",
    createdAt: "2026-10-18T10:00:00.000Z",
    updatedAt: "2026-10-19T14:30:00.000Z",
    memberCount: 1,
    myRole: "HOST",
    members: [
      {
        id: "member-host-uuid",
        userId: "user-host-uuid",
        name: "Nguyễn Văn A",
        displayName: "Nguyễn Văn A",
        role: "HOST",
        status: "ACTIVE",
        joinOrder: 1,
        avatarUrl: null,
        isCurrentUser: true,
        isHost: true,
      },
    ],
    userBalance: {
      type: "SETTLED",
      amount: 0,
    },
  };

  // =========================================================================
  // 1. Danh sách chuyến đi (Loading, Success, Empty, Network Error, 401, 500, Retry)
  // =========================================================================
  describe("1. Trips List Fetching & Error Classification", () => {
    it("1.1. Tải danh sách thành công: ánh xạ đúng dữ liệu từ API sang Domain model", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [sampleApiTripDto],
        }),
      });

      const trips = await fetchMyTrips(undefined, {
        customFetch: mockFetch as unknown as typeof fetch,
      });

      expect(trips).toHaveLength(1);
      expect(trips[0].id).toBe(mockDbTripUuid);
      expect(trips[0].name).toBe("Hà Giang mùa hoa tam giác mạch");
      expect(trips[0].status).toBe("ACTIVE");
      expect(trips[0].members[0].role).toBe("HOST");
      expect(trips[0].members[0].isCurrentUser).toBe(true);
    });

    it("1.2. Danh sách rỗng: trả về mảng rỗng [] rõ ràng, không coi là lỗi", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const trips = await fetchMyTrips(undefined, {
        customFetch: mockFetch as unknown as typeof fetch,
      });

      expect(trips).toEqual([]);
      expect(trips).toHaveLength(0);
    });

    it("1.3. Lỗi mạng (Network Error): ném TripsApiError với status 0, KHÔNG fallback sang MOCK_TRIPS", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

      let caughtError: unknown = null;
      try {
        await fetchMyTrips(undefined, {
          customFetch: mockFetch as unknown as typeof fetch,
        });
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(TripsApiError);
      const apiErr = caughtError as TripsApiError;
      expect(apiErr.status).toBe(0);
      expect(apiErr.code).toBe("NETWORK_ERROR");
      expect(apiErr.message).toContain("Failed to fetch");
    });

    it("1.4. Lỗi HTTP 401: ném TripsApiError với status 401 và code UNAUTHORIZED", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Bạn chưa đăng nhập hoặc phiên đã hết hạn.",
          },
        }),
      });

      let caughtError: unknown = null;
      try {
        await fetchMyTrips(undefined, {
          customFetch: mockFetch as unknown as typeof fetch,
        });
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(TripsApiError);
      const apiErr = caughtError as TripsApiError;
      expect(apiErr.status).toBe(401);
      expect(apiErr.code).toBe("UNAUTHORIZED");
      expect(apiErr.message).toBe("Bạn chưa đăng nhập hoặc phiên đã hết hạn.");
    });

    it("1.5. Lỗi HTTP 500 (Lỗi máy chủ): ném TripsApiError với status 500, KHÔNG biến thành mảng rỗng", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Đã xảy ra lỗi máy chủ nội bộ.",
          },
        }),
      });

      let caughtError: unknown = null;
      try {
        await fetchMyTrips(undefined, {
          customFetch: mockFetch as unknown as typeof fetch,
        });
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(TripsApiError);
      const apiErr = caughtError as TripsApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.message).toBe("Đã xảy ra lỗi máy chủ nội bộ.");
    });

    it("1.6. Cơ chế Thử lại (Retry): lần đầu thất bại, lần thứ hai thành công", async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 503,
            json: async () => ({
              success: false,
              error: { message: "Dịch vụ tạm thời không khả dụng." },
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: [sampleApiTripDto],
          }),
        };
      });

      // Lần 1: Thất bại
      await expect(
        fetchMyTrips(undefined, { customFetch: mockFetch as unknown as typeof fetch })
      ).rejects.toThrow("Dịch vụ tạm thời không khả dụng.");

      // Lần 2 (Retry): Thành công
      const retriedTrips = await fetchMyTrips(undefined, {
        customFetch: mockFetch as unknown as typeof fetch,
      });
      expect(retriedTrips).toHaveLength(1);
      expect(retriedTrips[0].id).toBe(mockDbTripUuid);
      expect(callCount).toBe(2);
    });
  });

  // =========================================================================
  // 2. Tạo chuyến đi (Payload, UUID thật, Chống Double-click, Thất bại không điều hướng)
  // =========================================================================
  describe("2. Create Trip Integration & Safety Guardrails", () => {
    const validFormData = {
      name: "Quy Nhơn 4N3Đ hè rực rỡ",
      destination: "Quy Nhơn, Bình Định",
      startDate: "2026-07-10",
      endDate: "2026-07-14",
      budgetAmount: 18000000,
    };

    it("2.1. Validate client-side: chặn submit khi form rỗng hoặc ngày không hợp lệ", () => {
      const invalidEmpty = validateCreateTripForm({
        name: "",
        destination: "",
        startDate: "",
        endDate: "",
        budgetAmount: null,
      });
      expect(invalidEmpty.isValid).toBe(false);
      expect(invalidEmpty.errors.name).toBeDefined();
      expect(invalidEmpty.errors.startDate).toBeDefined();
      expect(invalidEmpty.errors.endDate).toBeDefined();

      const invalidDateRange = validateCreateTripForm({
        name: "Hợp lệ",
        destination: "Đà Nẵng",
        startDate: "2026-08-20",
        endDate: "2026-08-10", // endDate trước startDate
        budgetAmount: null,
      });
      expect(invalidDateRange.isValid).toBe(false);
      expect(invalidDateRange.errors.endDate).toContain("Ngày về phải sau hoặc cùng ngày với ngày khởi hành");
    });

    it("2.2. Gửi đúng payload được POST /api/trips chấp nhận và TUYỆT ĐỐI KHÔNG gửi id, userId hay role từ client", async () => {
      let sentBody: Record<string, unknown> | null = null;
      const mockFetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        sentBody = JSON.parse(init.body as string);
        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              id: mockDbTripUuid,
              name: validFormData.name,
              destination: validFormData.destination,
              startDate: validFormData.startDate,
              endDate: validFormData.endDate,
              budgetAmount: validFormData.budgetAmount,
              status: "ACTIVE",
              inviteCode: "QN2026-HERUC",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              host: {
                memberId: "host-uuid-99",
                userId: "user-uuid-1",
                displayName: "Lan Nguyễn",
                role: "HOST",
              },
            },
          }),
        };
      });

      // Thử truyền các trường bậy (id, userId, role) để kiểm tra bộ lọc an toàn
      const dirtyInput = {
        ...validFormData,
        id: "fake-client-id",
        userId: "fake-user-id",
        role: "ADMIN",
        memberId: "fake-member-id",
      };

      const result = await createTripApi(dirtyInput as unknown as typeof validFormData, {
        customFetch: mockFetch as unknown as typeof fetch,
      });

      expect(sentBody).not.toBeNull();
      const payload = sentBody as Record<string, unknown> | null;
      // Các trường hợp lệ phải có mặt
      expect(payload?.name).toBe("Quy Nhơn 4N3Đ hè rực rỡ");
      expect(payload?.destination).toBe("Quy Nhơn, Bình Định");
      expect(payload?.startDate).toBe("2026-07-10");
      expect(payload?.endDate).toBe("2026-07-14");
      expect(payload?.budgetAmount).toBe(18000000);

      // Các trường tự khai báo quyền / ID client PHẢI BỊ LOẠI BỎ HOÀN TOÀN
      expect(sentBody).not.toHaveProperty("id");
      expect(sentBody).not.toHaveProperty("userId");
      expect(sentBody).not.toHaveProperty("role");
      expect(sentBody).not.toHaveProperty("memberId");

      // Trả về UUID thật từ database
      expect(result.dto.id).toBe(mockDbTripUuid);
      expect(result.trip.id).toBe(mockDbTripUuid);
      expect(result.trip.id).not.toMatch(/^trip-\d+$/); // Không phải trip-Date.now()
    });

    it("2.3. Tạo thành công trả về đúng UUID thật và ánh xạ Trưởng nhóm (Host) từ server", async () => {
      const serverResponseDto: ApiCreateTripResponseDto = {
        id: mockDbTripUuid,
        name: validFormData.name,
        destination: validFormData.destination,
        startDate: validFormData.startDate,
        endDate: validFormData.endDate,
        budgetAmount: validFormData.budgetAmount,
        status: "ACTIVE",
        inviteCode: "ABCDE-FGHKL",
        createdAt: "2026-10-21T01:00:00.000Z",
        updatedAt: "2026-10-21T01:00:00.000Z",
        host: {
          memberId: "real-host-member-uuid",
          userId: "real-host-user-uuid",
          displayName: "Nguyễn Phương Lan",
          role: "HOST",
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: serverResponseDto,
        }),
      });

      const { dto, trip } = await createTripApi(validFormData, {
        customFetch: mockFetch as unknown as typeof fetch,
      });

      expect(dto.id).toBe(mockDbTripUuid);
      expect(trip.id).toBe(mockDbTripUuid);
      expect(trip.members).toHaveLength(1);
      expect(trip.members[0].id).toBe("real-host-member-uuid");
      expect(trip.members[0].role).toBe("HOST");
      expect(trip.members[0].name).toBe("Nguyễn Phương Lan");
    });

    it("2.4. Tạo thất bại: ném lỗi, không sinh ID giả mạo, cho phép bắt lỗi để giữ form", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Khoảng thời gian chuyến đi vượt quá giới hạn tối đa 365 ngày.",
          },
        }),
      });

      let caughtError: unknown = null;
      try {
        await createTripApi(validFormData, {
          customFetch: mockFetch as unknown as typeof fetch,
        });
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(TripsApiError);
      const apiErr = caughtError as TripsApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.message).toBe("Khoảng thời gian chuyến đi vượt quá giới hạn tối đa 365 ngày.");
    });

    it("2.5. Bảo vệ chống double-click: cơ chế isSubmitting chỉ cho phép 1 request thực thi tại một thời điểm", async () => {
      let callCount = 0;
      let resolvePromise: (value: unknown) => void;
      const deferredPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        await deferredPromise;
        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              id: mockDbTripUuid,
              name: validFormData.name,
              destination: validFormData.destination,
              startDate: validFormData.startDate,
              endDate: validFormData.endDate,
              budgetAmount: validFormData.budgetAmount,
              status: "ACTIVE",
              inviteCode: "ABCDE-FGHKL",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              host: {
                memberId: "host-uuid",
                userId: "user-uuid",
                displayName: "Lan",
                role: "HOST",
              },
            },
          }),
        };
      });

      // Giả lập logic chống double-submit của component (isSubmitting flag)
      let isSubmitting = false;
      const safeSubmit = async () => {
        if (isSubmitting) return null;
        isSubmitting = true;
        try {
          return await createTripApi(validFormData, {
            customFetch: mockFetch as unknown as typeof fetch,
          });
        } finally {
          isSubmitting = false;
        }
      };

      // Gửi request lần 1 (đang in-flight)
      const p1 = safeSubmit();
      expect(isSubmitting).toBe(true);

      // Gửi request lần 2 ngay lập tức (double-click)
      const p2 = safeSubmit();

      // Kết quả của lần 2 bị chặn ngay lập tức
      const result2 = await p2;
      expect(result2).toBeNull();

      // Giải phóng request lần 1
      resolvePromise!(true);
      const result1 = await p1;

      expect(result1).not.toBeNull();
      expect(result1?.dto.id).toBe(mockDbTripUuid);
      // Chỉ duy nhất 1 request HTTP được gửi
      expect(callCount).toBe(1);
    });
  });

  // =========================================================================
  // 3. Bảo toàn các hàm thuần túy và Mock Fixtures
  // =========================================================================
  describe("3. Pure Filters, Sorting & View Models Compatibility", () => {
    it("3.1. Các hàm filterTrips và sortTrips hoạt động chính xác với cả dữ liệu thật và mock", () => {
      // Chuyển DTO thành Domain Trip
      const domainTrip = mapApiTripToDomain(sampleApiTripDto);

      const mixedList: Trip[] = [domainTrip, ...MOCK_TRIPS];

      // Lọc tab "active" (ACTIVE và SETTLING)
      const activeTrips = filterTrips(mixedList, "active");
      expect(activeTrips.length).toBeGreaterThanOrEqual(2);
      expect(activeTrips.some((t) => t.id === mockDbTripUuid)).toBe(true);

      // Sắp xếp "latest"
      const sortedLatest = sortTrips(mixedList, "latest");
      expect(sortedLatest).toHaveLength(4);

      // Sắp xếp "name"
      const sortedName = sortTrips(mixedList, "name");
      expect(sortedName).toHaveLength(4);
    });

    it("3.2. toTripCardViews tính đúng duration, gradient và memberCount cho trip UUID từ database", () => {
      const domainTrip = mapApiTripToDomain(sampleApiTripDto);
      const cardViews = toTripCardViews([domainTrip]);

      expect(cardViews).toHaveLength(1);
      const card = cardViews[0];
      expect(card.id).toBe(mockDbTripUuid);
      expect(card.name).toBe("Hà Giang mùa hoa tam giác mạch");
      expect(card.durationText).toBe("4 ngày 3 đêm");
      expect(card.memberCount).toBe(1);
      expect(card.cover).toBeDefined();
      expect(card.cover.from).toBeDefined();
    });

    it("3.3. getOverallBalance tính toán an toàn cho danh sách rỗng và danh sách chứa UUID", () => {
      const emptyBalance = getOverallBalance([]);
      expect(emptyBalance).toEqual({ toReceive: 0, toPay: 0, net: 0 });

      const domainTrip = mapApiTripToDomain(sampleApiTripDto);
      const balance = getOverallBalance([domainTrip]);
      expect(balance).toEqual({ toReceive: 0, toPay: 0, net: 0 });
    });

    it("3.4. getTripDetailById vẫn an toàn truy xuất dynamicTripDetails khi cần", () => {
      const nonExistent = getTripDetailById("non-existent-uuid");
      expect(nonExistent).toBeNull();

      const dalat = getTripDetailById("trip-dalat-3n2d");
      expect(dalat).not.toBeNull();
      expect(dalat?.name).toBe("Đà Lạt 3N2Đ");
    });
  });

  // =========================================================================
  // 4. Xác minh chuyên sâu Tab Chuyến đi Hoàn thành (Phase 3D-2C Review)
  // =========================================================================
  describe("4. Completed Trips Tab Deep Verification", () => {
    const completedTripDto: ApiTripListItemDto = {
      id: "comp-uuid-1122-3344",
      name: "Đà Nẵng - Hội An trọn gói",
      destination: "Đà Nẵng",
      startDate: "2026-06-01",
      endDate: "2026-06-05",
      budgetAmount: 12000000,
      status: "COMPLETED",
      inviteCode: "DN2026-HOIAN",
      createdAt: "2026-05-15T08:00:00.000Z",
      updatedAt: "2026-06-06T12:00:00.000Z",
      memberCount: 2,
      myRole: "HOST",
      members: [
        {
          id: "m-comp-1",
          userId: "user-comp-1",
          name: "Lan",
          displayName: "Lan",
          role: "HOST",
          status: "ACTIVE",
          joinOrder: 1,
          avatarUrl: null,
          isCurrentUser: true,
          isHost: true,
        },
      ],
      userBalance: {
        type: "SETTLED",
        amount: 0,
      },
    };

    it("4.1. fetchMyTrips() gọi đúng URL /api/trips không có tham số query tab", async () => {
      let requestedUrl = "";
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        requestedUrl = url;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: [sampleApiTripDto, completedTripDto],
          }),
        };
      });

      const trips = await fetchMyTrips(undefined, {
        customFetch: mockFetch as unknown as typeof fetch,
      });

      // Xác nhận URL được gọi chính xác là /api/trips
      expect(requestedUrl).toBe("/api/trips");
      expect(trips).toHaveLength(2);
      expect(trips.some((t) => t.status === "ACTIVE")).toBe(true);
      expect(trips.some((t) => t.status === "COMPLETED")).toBe(true);
    });

    it("4.2. Trip có trạng thái COMPLETED trong cơ sở dữ liệu thực sự xuất hiện trong tab Completed", () => {
      const activeTrip = mapApiTripToDomain(sampleApiTripDto); // status: ACTIVE
      const completedTrip = mapApiTripToDomain(completedTripDto); // status: COMPLETED

      const rawTrips = [activeTrip, completedTrip];
      const cardViews = toTripCardViews(rawTrips);

      // Tính toán badge counts theo logic trong trips/page.tsx
      const allCount = cardViews.length;
      const activeCount = cardViews.filter(
        (t) => t.status === "ACTIVE" || t.status === "SETTLING"
      ).length;
      const completedCount = cardViews.filter((t) => t.status === "COMPLETED").length;

      expect(allCount).toBe(2);
      expect(activeCount).toBe(1);
      expect(completedCount).toBe(1);

      // Khi người dùng chọn tab "completed"
      const completedTabTrips = filterTrips(cardViews, "completed");
      expect(completedTabTrips).toHaveLength(1);
      expect(completedTabTrips[0].id).toBe("comp-uuid-1122-3344");
      expect(completedTabTrips[0].status).toBe("COMPLETED");
      expect(completedTabTrips[0].name).toBe("Đà Nẵng - Hội An trọn gói");

      // Khi người dùng chọn tab "active"
      const activeTabTrips = filterTrips(cardViews, "active");
      expect(activeTabTrips).toHaveLength(1);
      expect(activeTabTrips[0].id).toBe(mockDbTripUuid);
      expect(activeTabTrips[0].status).toBe("ACTIVE");
      expect(activeTabTrips[0].id).not.toBe("comp-uuid-1122-3344");

      // Khi người dùng chọn tab "all"
      const allTabTrips = filterTrips(cardViews, "all");
      expect(allTabTrips).toHaveLength(2);
    });

    it("4.3. Khi không có chuyến đi COMPLETED nào, tab Completed trả về mảng rỗng [] mà không bị lỗi", () => {
      const activeTrip = mapApiTripToDomain(sampleApiTripDto); // status: ACTIVE
      const rawTrips = [activeTrip];
      const cardViews = toTripCardViews(rawTrips);

      const completedCount = cardViews.filter((t) => t.status === "COMPLETED").length;
      expect(completedCount).toBe(0);

      const completedTabTrips = filterTrips(cardViews, "completed");
      expect(completedTabTrips).toEqual([]);
      expect(completedTabTrips).toHaveLength(0);
    });

    it("4.4. Đảm bảo tính nhất quán dữ liệu giữa các tab: cùng đọc từ 1 nguồn duy nhất, không trùng id", () => {
      const activeTrip = mapApiTripToDomain(sampleApiTripDto);
      const completedTrip = mapApiTripToDomain(completedTripDto);

      const rawTrips = [activeTrip, completedTrip];
      const cardViews = toTripCardViews(rawTrips);

      const activeTrips = filterTrips(cardViews, "active");
      const completedTrips = filterTrips(cardViews, "completed");

      // Không có bất kỳ trip nào vừa ở tab Active vừa ở tab Completed
      const activeIds = new Set(activeTrips.map((t) => t.id));
      const hasIntersection = completedTrips.some((t) => activeIds.has(t.id));
      expect(hasIntersection).toBe(false);

      // Tổng số trip giữa hai tab phân rã hoàn toàn
      expect(activeTrips.length + completedTrips.length).toBe(cardViews.length);
    });
  });
});
