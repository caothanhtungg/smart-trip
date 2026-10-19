"use client";

import * as React from "react";
import {
  Search,
  MoreVertical,
  Star,
  ShieldCheck,
  Check,
  Hourglass,
  Edit2,
  Trash2,
  LogOut,
  User,
} from "lucide-react";
import { TripMember, MemberClaim, TripExpense } from "@/types/trip";
import { calculateMemberBalances } from "@/lib/money/settlement";
import { isPlaceholderMember } from "@/lib/members/validation";
import { formatMoney } from "@/lib/money/format";

type FilterTab = "ALL" | "ACCOUNT" | "GUEST" | "LEFT";

interface TripMembersTableProps {
  members: TripMember[];
  claims: MemberClaim[];
  expenses: TripExpense[];
  isHost: boolean;
  currentMemberId: string;
  isTripActive: boolean;
  onOpenEditGuest: (member: TripMember) => void;
  onOpenRemoveMember: (member: TripMember) => void;
  onOpenLeaveTrip: (member: TripMember) => void;
}

export function TripMembersTable({
  members,
  claims,
  expenses,
  isHost,
  currentMemberId,
  isTripActive,
  onOpenEditGuest,
  onOpenRemoveMember,
  onOpenLeaveTrip,
}: TripMembersTableProps) {
  const [filterTab, setFilterTab] = React.useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeMenuMemberId, setActiveMenuMemberId] = React.useState<string | null>(null);

  // Close popover when clicking outside
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-member-menu]")) {
        setActiveMenuMemberId(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // Tính toán công nợ và số tiền chi của từng thành viên
  const balancesResult = React.useMemo(() => {
    return calculateMemberBalances(members, expenses);
  }, [members, expenses]);

  const memberNetMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const b of balancesResult.balances) {
      map.set(b.memberId, b.netAmount);
    }
    return map;
  }, [balancesResult]);

  // Map tổng tiền đã chi của từng thành viên
  const memberSpentMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const m of members) {
      map.set(m.id, m.spentAmount ?? 0);
    }
    for (const exp of expenses) {
      const current = map.get(exp.paidByMemberId) || 0;
      map.set(exp.paidByMemberId, current + exp.amount);
    }
    return map;
  }, [members, expenses]);

  // Tổng tiền cả nhóm đã chi
  const totalGroupSpent = React.useMemo(() => {
    return expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [expenses]);

  // Bộ đếm theo phân loại
  const registeredCount = members.filter(
    (m) => !isPlaceholderMember(m) && m.status === "ACTIVE"
  ).length;
  const guestCount = members.filter(
    (m) => isPlaceholderMember(m) && m.status === "ACTIVE"
  ).length;
  const leftCount = members.filter((m) => m.status === "LEFT").length;

  // Lọc và tìm kiếm
  const filteredMembers = React.useMemo(() => {
    return members.filter((m) => {
      // Lọc theo tab
      if (filterTab === "ACCOUNT" && (isPlaceholderMember(m) || m.status !== "ACTIVE")) return false;
      if (filterTab === "GUEST" && (!isPlaceholderMember(m) || m.status !== "ACTIVE")) return false;
      if (filterTab === "LEFT" && m.status !== "LEFT") return false;

      // Tìm kiếm theo tên / email
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchEmail = m.email?.toLowerCase().includes(q) || false;
        const matchNote = m.note?.toLowerCase().includes(q) || false;
        return matchName || matchEmail || matchNote;
      }

      return true;
    });
  }, [members, filterTab, searchQuery]);

  return (
    <section className="w-full bg-surface-card rounded-2xl p-5 sm:p-6 shadow-[0_6px_20px_rgba(24,78,119,0.08)] flex flex-col gap-5 border border-divider-border">
      {/* Table Header: Title & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-yale-blue">Danh sách thành viên chuyến đi</h3>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Quản lý vai trò, trạng thái tài khoản và công nợ tạm tính của từng người
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Quick Filter Chips */}
          <div className="flex items-center bg-bg-canvas p-1 rounded-xl text-xs font-semibold text-text-muted border border-divider-border overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterTab("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                filterTab === "ALL"
                  ? "bg-surface-card text-yale-blue shadow-xs font-bold"
                  : "hover:text-yale-blue"
              }`}
            >
              Tất cả ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("ACCOUNT")}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                filterTab === "ACCOUNT"
                  ? "bg-surface-card text-yale-blue shadow-xs font-bold"
                  : "hover:text-yale-blue"
              }`}
            >
              Đã có tài khoản ({registeredCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("GUEST")}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                filterTab === "GUEST"
                  ? "bg-surface-card text-yale-blue shadow-xs font-bold"
                  : "hover:text-yale-blue"
              }`}
            >
              Chưa có tài khoản ({guestCount})
            </button>
            {leftCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterTab("LEFT")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  filterTab === "LEFT"
                    ? "bg-surface-card text-yale-blue shadow-xs font-bold"
                    : "hover:text-yale-blue"
                }`}
              >
                Đã rời nhóm ({leftCount})
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, email..."
              className="w-full h-10 pl-9 pr-3 text-sm bg-surface-card rounded-xl text-on-surface border border-divider-border focus:outline-none focus:ring-2 focus:ring-cerulean/30 placeholder:text-text-muted transition-all"
            />
          </div>
        </div>
      </div>

      {/* Member Ledger Table */}
      <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="h-11 uppercase text-[12px] font-semibold tracking-wider text-text-muted border-b-[1.5px] border-divider-border">
              <th className="py-2.5 px-3">Thành viên</th>
              <th className="py-2.5 px-3">Vai trò</th>
              <th className="py-2.5 px-3">Trạng thái</th>
              <th className="py-2.5 px-3 text-right">Đã chi</th>
              <th className="py-2.5 px-3 text-right">Công nợ tạm tính</th>
              <th className="py-2.5 px-3 text-center w-16">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider-border text-sm">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-muted">
                  Không tìm thấy thành viên nào phù hợp với điều kiện tìm kiếm.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const isGuest = isPlaceholderMember(member);
                const isCurrent = member.id === currentMemberId || !!member.isCurrentUser;
                const isHostMember = member.role === "HOST" || !!member.isHost;
                const hasPendingClaim = claims.some(
                  (c) => c.placeholderMemberId === member.id && c.status === "PENDING"
                );
                const net = memberNetMap.get(member.id) || 0;
                const spent = memberSpentMap.get(member.id) || 0;

                const avatarLetter = member.name.charAt(0).toUpperCase();

                return (
                  <tr
                    key={member.id}
                    className={`h-16 transition-colors hover:bg-hover-row ${
                      hasPendingClaim ? "bg-functional-warning-bg/15" : ""
                    }`}
                  >
                    {/* Thành viên (Avatar, Tên, Email/Ghi chú) */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {isGuest ? (
                          <div className="w-10 h-10 rounded-full bg-surface-container-low text-yale-blue font-bold flex items-center justify-center shrink-0 border border-dashed border-ocean-mist">
                            <span>{avatarLetter}</span>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-mint-green text-yale-blue font-bold flex items-center justify-center shrink-0 shadow-xs">
                            <span>{avatarLetter}</span>
                          </div>
                        )}

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-yale-blue">
                              {member.name} {isCurrent && <span className="font-normal text-xs text-text-muted">(Bạn)</span>}
                            </span>
                            {isHostMember && (
                              <span title="Trưởng nhóm" className="inline-flex">
                                <Star className="w-4 h-4 text-tropical-teal fill-tropical-teal shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-text-muted truncate max-w-[240px]">
                            {member.email || member.note || (isGuest ? "Được Trưởng nhóm thêm để chia tiền" : "Thành viên")}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Vai trò */}
                    <td className="py-3 px-3">
                      {isHostMember ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-yale-blue">
                          <ShieldCheck className="w-3.5 h-3.5 text-cerulean" />
                          <span>Trưởng nhóm</span>
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant font-medium">Thành viên</span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-3">
                      {member.status === "LEFT" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-text-muted">
                          <LogOut className="w-3 h-3" />
                          <span>Đã rời nhóm</span>
                        </span>
                      ) : hasPendingClaim ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-functional-warning-bg text-functional-warning border border-functional-warning/20">
                          <Hourglass className="w-3 h-3 animate-spin" style={{ animationDuration: "6s" }} />
                          <span>Đang chờ liên kết</span>
                        </span>
                      ) : isGuest ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-dashed border-ocean-mist bg-emerald/10 text-cerulean">
                          <User className="w-3 h-3" />
                          <span>Chưa có tài khoản</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald/15 text-yale-blue">
                          <Check className="w-3 h-3 text-functional-positive stroke-[3]" />
                          <span>Đã tham gia</span>
                        </span>
                      )}
                    </td>

                    {/* Đã chi */}
                    <td className="py-3 px-3 text-right font-semibold text-yale-blue tabular-nums">
                      {formatMoney(spent)}
                    </td>

                    {/* Công nợ tạm tính */}
                    <td className="py-3 px-3 text-right tabular-nums">
                      {net > 0 ? (
                        <span className="font-semibold text-functional-positive bg-emerald/10 px-2.5 py-1 rounded-md">
                          +{formatMoney(net)}
                        </span>
                      ) : net < 0 ? (
                        <span className="font-semibold text-functional-negative bg-error-container/40 px-2.5 py-1 rounded-md">
                          -{formatMoney(Math.abs(net))}
                        </span>
                      ) : (
                        <span className="font-semibold text-text-muted px-2.5 py-1">0 ₫</span>
                      )}
                    </td>

                    {/* Thao tác (Dropdown) */}
                    <td className="py-3 px-3 text-center relative" data-member-menu>
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuMemberId(
                              activeMenuMemberId === member.id ? null : member.id
                            )
                          }
                          className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-text-muted hover:text-yale-blue transition-colors mx-auto"
                          title="Tùy chọn"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuMemberId === member.id && (
                          <div className="absolute right-0 top-8 z-30 w-48 bg-surface-card rounded-xl shadow-[0_8px_24px_rgba(24,78,119,0.15)] py-1.5 border border-divider-border animate-in fade-in zoom-in-95 duration-100">
                            {/* Option: Chỉnh sửa tên nếu là thành viên chưa có tài khoản */}
                            {isHost && isGuest && isTripActive && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuMemberId(null);
                                  onOpenEditGuest(member);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-cerulean hover:bg-hover-row transition-colors text-left"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-cerulean" />
                                <span>Chỉnh sửa tên</span>
                              </button>
                            )}

                            {/* Option: Xóa thành viên nếu là Trưởng nhóm (và không phải chính Trưởng nhóm) */}
                            {isHost && !isHostMember && isTripActive && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuMemberId(null);
                                  onOpenRemoveMember(member);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-functional-negative hover:bg-red-50 transition-colors text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-functional-negative" />
                                <span>Xóa thành viên</span>
                              </button>
                            )}

                            {/* Option: Tự rời chuyến đi nếu là thành viên thường đang đăng nhập */}
                            {isCurrent && !isHostMember && isTripActive && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuMemberId(null);
                                  onOpenLeaveTrip(member);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-functional-negative hover:bg-red-50 transition-colors text-left"
                              >
                                <LogOut className="w-3.5 h-3.5 text-functional-negative" />
                                <span>Rời chuyến đi</span>
                              </button>
                            )}

                            {/* Nếu là Trưởng nhóm xem chính mình */}
                            {isCurrent && isHostMember && (
                              <div className="px-3.5 py-2 text-xs text-text-muted italic">
                                Trưởng nhóm chuyến đi
                              </div>
                            )}

                            {/* Trường hợp chuyến đã chốt hoặc kết thúc */}
                            {!isTripActive && (
                              <div className="px-3.5 py-2 text-xs text-text-muted italic">
                                Chuyến đi đã khóa danh sách
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Summary Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-text-muted border-t border-divider-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-ocean-mist shrink-0" />
          <span>
            Bạn đang tham gia với vai trò{" "}
            <strong className="text-yale-blue font-semibold">
              {isHost ? "Trưởng nhóm" : "Thành viên"}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>
            Tổng tiền đã chi cả nhóm:{" "}
            <strong className="text-yale-blue text-sm font-semibold tabular-nums">
              {formatMoney(totalGroupSpent)}
            </strong>
          </span>
        </div>
      </div>
    </section>
  );
}
