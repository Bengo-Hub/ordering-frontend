export type UserRole = "customer" | "rider" | "staff" | "admin" | "superadmin";

export type Permission =
  | "orders:view"
  | "orders:manage"
  | "profile:update"
  | "preferences:update"
  | "loyalty:view"
  | "loyalty:redeem"
  | "notifications:manage"
  | "riders:onboard"
  | "staff:invite"
  | "admin:manage";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  roles: UserRole[];
  permissions: Permission[];
  avatarUrl?: string | null;
  loyaltyPoints: number;
  availableCoupons: number;
  defaultLocationLabel?: string | null;
  twoFactorEnabled: boolean;
  backupCodesEnabled: boolean;
  preferences: {
    theme: "light" | "dark" | "system";
    notifications: NotificationPreferences;
    language: "en" | "sw";
  };
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  session: SessionTokens;
  user: UserProfile;
}

export interface ProfileUpdateInput {
  fullName?: string;
  phone?: string;
  avatarUrl?: string | null;
}

export interface PreferencesUpdateInput {
  theme?: "light" | "dark" | "system";
  notifications?: NotificationPreferences;
  language?: "en" | "sw";
}

export interface SecurityUpdateInput {
  enableTwoFactor?: boolean;
  disableTwoFactor?: boolean;
}

export interface OrderSummary {
  id: string;
  status: "pending" | "preparing" | "enroute" | "delivered" | "cancelled";
  total: number;
  placedAt: string;
  eta?: string;
}
