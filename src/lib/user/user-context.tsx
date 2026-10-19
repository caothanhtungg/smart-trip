"use client";

import * as React from "react";
import {
  UserProfile,
  UpdateProfileFormData,
  UpdateBankFormData,
  ProfileValidationErrors,
  BankValidationErrors,
  NotificationItem,
} from "@/types/user";
import { validateProfileForm, validateBankForm, normalizeAccountHolderName } from "./validation";
import { findBankByBin } from "@/lib/mock/banks";
import { MOCK_MEMBER_BANK_INFO } from "@/lib/mock/settlement";

const INITIAL_PROFILE: UserProfile = {
  id: "usr-current",
  fullName: "Nguyễn Phương Lan",
  displayName: "Lan",
  email: "lan.tran98@gmail.com",
  phoneNumber: "0912 345 678",
  avatarUrl: null,
  bankInfo: {
    bankBin: "970407",
    bankName: "Techcombank",
    accountNumber: "19036542890011",
    accountHolder: "NGUYEN PHUONG LAN",
    branch: "Hội sở chính - Hà Nội",
  },
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Yêu cầu nhận diện thành viên",
    description: "Bảo Minh muốn nhận diện vào thành viên Minh Béo trong chuyến 'Phú Quốc cùng team'",
    timestamp: "10 phút trước",
    isRead: false,
    type: "CLAIM",
    linkUrl: "/trips/trip-phuquoc-team/members",
  },
  {
    id: "notif-2",
    title: "Nhắc nợ chi phí",
    description: "Tuấn Huy đã gửi nhắc nợ khoản 'Bánh ướt lòng gà Long' (212.000 ₫)",
    timestamp: "1 giờ trước",
    isRead: false,
    type: "PAYMENT",
    linkUrl: "/trips/trip-dalat-3n2d/settlement",
  },
  {
    id: "notif-3",
    title: "Chốt sổ công nợ",
    description: "Chuyến đi 'Đà Lạt 3N2Đ' đã chuyển sang giai đoạn quyết toán công nợ",
    timestamp: "Hôm qua",
    isRead: true,
    type: "SETTLEMENT",
    linkUrl: "/trips/trip-dalat-3n2d/settlement",
  },
];

interface UserProfileContextValue {
  profile: UserProfile;
  updateProfile: (data: UpdateProfileFormData) => Promise<{
    success: boolean;
    errors?: ProfileValidationErrors;
  }>;
  updateBankInfo: (data: UpdateBankFormData) => Promise<{
    success: boolean;
    errors?: BankValidationErrors;
  }>;
  removeBankInfo: () => void;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

const UserProfileContext = React.createContext<UserProfileContextValue | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<UserProfile>(INITIAL_PROFILE);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Đồng bộ bankInfo vào MOCK_MEMBER_BANK_INFO cho member m1 (Lan)
  React.useEffect(() => {
    if (profile.bankInfo) {
      MOCK_MEMBER_BANK_INFO["m1"] = {
        bankName: profile.bankInfo.bankName,
        bankBin: profile.bankInfo.bankBin,
        accountNumber: profile.bankInfo.accountNumber,
        accountHolder: profile.bankInfo.accountHolder,
      };
    } else {
      delete MOCK_MEMBER_BANK_INFO["m1"];
    }
  }, [profile.bankInfo]);

  const updateProfile = async (
    data: UpdateProfileFormData
  ): Promise<{ success: boolean; errors?: ProfileValidationErrors }> => {
    const validation = validateProfileForm(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    setProfile((prev) => ({
      ...prev,
      fullName: data.fullName.trim(),
      displayName: data.displayName.trim(),
      phoneNumber: data.phoneNumber ? data.phoneNumber.trim() : undefined,
    }));

    return { success: true };
  };

  const updateBankInfo = async (
    data: UpdateBankFormData
  ): Promise<{ success: boolean; errors?: BankValidationErrors }> => {
    const validation = validateBankForm(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const bank = findBankByBin(data.bankBin);
    const bankName = bank ? bank.shortName : data.bankName;
    const normalizedHolder = normalizeAccountHolderName(data.accountHolder);

    setProfile((prev) => ({
      ...prev,
      bankInfo: {
        bankBin: data.bankBin,
        bankName,
        accountNumber: data.accountNumber.trim(),
        accountHolder: normalizedHolder,
        branch: data.branch ? data.branch.trim() : undefined,
      },
    }));

    return { success: true };
  };

  const removeBankInfo = () => {
    setProfile((prev) => ({
      ...prev,
      bankInfo: null,
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        updateProfile,
        updateBankInfo,
        removeBankInfo,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextValue {
  const context = React.useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
