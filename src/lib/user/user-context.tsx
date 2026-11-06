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
import {
  fetchMyProfileApi,
  updateMyProfileApi,
  UserApiError,
  type CurrentUserProfileDto,
} from "@/lib/services/user-api";

const EMPTY_PROFILE: UserProfile = {
  id: "",
  fullName: "",
  displayName: "",
  email: "",
  avatarUrl: null,
  bankInfo: null,
};

const INITIAL_PROFILE = EMPTY_PROFILE;

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

interface UserProfileContextValue {
  profile: UserProfile;
  isLoading: boolean;
  profileError: string | null;
  refetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileFormData) => Promise<{
    success: boolean;
    errors?: ProfileValidationErrors;
    message?: string;
  }>;
  updateAvatar: (avatarUrl: string | null) => Promise<{
    success: boolean;
    message?: string;
  }>;
  updateBankInfo: (data: UpdateBankFormData) => Promise<{
    success: boolean;
    errors?: BankValidationErrors;
    message?: string;
  }>;
  removeBankInfo: () => Promise<{ success: boolean; message?: string }>;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

const UserProfileContext = React.createContext<UserProfileContextValue | undefined>(undefined);

function mapDtoToUserProfile(dto: CurrentUserProfileDto): UserProfile {
  const bank = dto.bankBin ? findBankByBin(dto.bankBin) : null;
  const bankName = bank ? bank.shortName : "Ngân hàng";

  return {
    id: dto.id,
    fullName: dto.name,
    displayName: dto.displayName || dto.name,
    email: dto.email,
    avatarUrl: dto.avatarUrl ?? null,
    bankInfo:
      dto.hasBankAccount && dto.bankBin
        ? {
            bankBin: dto.bankBin,
            bankName,
            accountNumber: dto.bankAccountMasked || "",
            accountHolder: dto.bankAccountName || "",
          }
        : null,
  };
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<UserProfile>(INITIAL_PROFILE);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Tải dữ liệu hồ sơ từ GET /api/me khi khởi chạy (hoặc reload)
  const refetchProfile = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setProfileError(null);
      const data = await fetchMyProfileApi();
      setProfile(mapDtoToUserProfile(data));
    } catch (err) {
      if (err instanceof UserApiError && err.status === 401) {
        setProfileError(null);
      } else if (err instanceof Error) {
        setProfileError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    fetchMyProfileApi()
      .then((data) => {
        if (!ignore) {
          setProfile(mapDtoToUserProfile(data));
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (err instanceof UserApiError && err.status === 401) {
            setProfileError(null);
          } else if (err instanceof Error) {
            setProfileError(err.message);
          }
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

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
  ): Promise<{ success: boolean; errors?: ProfileValidationErrors; message?: string }> => {
    const validation = validateProfileForm(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    try {
      const updatedDto = await updateMyProfileApi({
        name: data.fullName.trim(),
        displayName: data.displayName.trim(),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      });

      setProfile(mapDtoToUserProfile(updatedDto));
      return { success: true };
    } catch (err) {
      // Nếu API trả lỗi (hoặc offline mock fallback), nếu là lỗi validation server thì trả lỗi
      if (err instanceof UserApiError && err.status === 400) {
        return {
          success: false,
          message: err.message,
        };
      }
      // Khi offline / local mock: nếu không kết nối được server, cập nhật tạm state
      if (err instanceof UserApiError && err.status === 401) {
        setProfile((prev) => ({
          ...prev,
          fullName: data.fullName.trim(),
          displayName: data.displayName.trim(),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        }));
        return { success: true };
      }

      return {
        success: false,
        message: err instanceof Error ? err.message : "Cập nhật thông tin thất bại.",
      };
    }
  };

  const updateAvatar = async (
    avatarUrl: string | null
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const updatedDto = await updateMyProfileApi({
        avatarUrl,
      });
      setProfile(mapDtoToUserProfile(updatedDto));
      return { success: true };
    } catch (err) {
      if (err instanceof UserApiError && err.status === 401) {
        setProfile((prev) => ({
          ...prev,
          avatarUrl,
        }));
        return { success: true };
      }
      return {
        success: false,
        message: err instanceof Error ? err.message : "Cập nhật ảnh đại diện thất bại.",
      };
    }
  };

  const updateBankInfo = async (
    data: UpdateBankFormData
  ): Promise<{ success: boolean; errors?: BankValidationErrors; message?: string }> => {
    const validation = validateBankForm(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const normalizedHolder = normalizeAccountHolderName(data.accountHolder);

    try {
      const updatedDto = await updateMyProfileApi({
        bankBin: data.bankBin,
        bankAccountNo: data.accountNumber.trim(),
        bankAccountName: normalizedHolder,
      });

      setProfile(mapDtoToUserProfile(updatedDto));
      return { success: true };
    } catch (err) {
      if (err instanceof UserApiError && err.status === 400) {
        return {
          success: false,
          message: err.message,
        };
      }
      if (err instanceof UserApiError && err.status === 401) {
        const bank = findBankByBin(data.bankBin);
        const bankName = bank ? bank.shortName : data.bankName;
        setProfile((prev) => ({
          ...prev,
          bankInfo: {
            bankBin: data.bankBin,
            bankName,
            accountNumber: data.accountNumber.trim(),
            accountHolder: normalizedHolder,
          },
        }));
        return { success: true };
      }

      return {
        success: false,
        message: err instanceof Error ? err.message : "Cập nhật thông tin ngân hàng thất bại.",
      };
    }
  };

  const removeBankInfo = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const updatedDto = await updateMyProfileApi({
        bankBin: null,
        bankAccountNo: null,
        bankAccountName: null,
      });

      setProfile(mapDtoToUserProfile(updatedDto));
      return { success: true };
    } catch (err) {
      if (err instanceof UserApiError && err.status === 401) {
        setProfile((prev) => ({ ...prev, bankInfo: null }));
        return { success: true };
      }
      return {
        success: false,
        message: err instanceof Error ? err.message : "Gỡ thông tin tài khoản thất bại.",
      };
    }
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
        isLoading,
        profileError,
        refetchProfile,
        updateProfile,
        updateAvatar,
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
