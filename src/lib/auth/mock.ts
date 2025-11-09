import type {
  AuthResponse,
  NotificationPreferences,
  OrderSummary,
  PreferencesUpdateInput,
  ProfileUpdateInput,
  SecurityUpdateInput,
  SessionTokens,
  UserProfile,
  UserRole,
} from "./types";

const MOCK_USER_ID = "demo-user-id";

const defaultPreferences: NotificationPreferences = {
  email: true,
  sms: false,
  push: true,
};

const deriveRoles = (primaryRole: UserRole): UserRole[] => {
  switch (primaryRole) {
    case "superadmin":
      return ["superadmin", "admin", "staff"];
    case "admin":
      return ["admin", "staff"];
    default:
      return [primaryRole];
  }
};

const aggregatePermissions = (roles: UserRole[]): ReturnType<typeof mockPermissionsForRole> => {
  const permissionSet = new Set<string>();
  roles.forEach((role) => {
    mockPermissionsForRole(role).forEach((permission) => permissionSet.add(permission));
  });
  return Array.from(permissionSet) as ReturnType<typeof mockPermissionsForRole>;
};

const baseUser = (primaryRole: UserRole, email: string, fullName: string): UserProfile => {
  const roles = deriveRoles(primaryRole);
  return {
    id: MOCK_USER_ID,
    email,
    fullName,
    phone: "+254 700 000 000",
    roles,
    permissions: aggregatePermissions(roles),
    avatarUrl: null,
    loyaltyPoints: roles.includes("customer") ? 1250 : 0,
    availableCoupons: roles.includes("customer") ? 3 : 0,
    defaultLocationLabel: "Busia Township",
    twoFactorEnabled: false,
    backupCodesEnabled: false,
    preferences: {
      theme: "system",
      notifications: defaultPreferences,
      language: "en",
    },
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

function issueSession(): SessionTokens {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 45); // 45 minutes
  return {
    accessToken: "demo-access-token",
    refreshToken: "demo-refresh-token",
    expiresAt: expiresAt.toISOString(),
  };
}

function mockPermissionsForRole(role: UserRole) {
  switch (role) {
    case "superadmin":
    case "admin":
      return [
        "orders:view",
        "orders:manage",
        "profile:update",
        "preferences:update",
        "loyalty:view",
        "loyalty:redeem",
        "notifications:manage",
        "riders:onboard",
        "staff:invite",
        "admin:manage",
      ];
    case "staff":
      return ["orders:view", "orders:manage", "profile:update", "preferences:update", "notifications:manage"];
    case "rider":
      return ["orders:view", "profile:update", "preferences:update"];
    case "customer":
    default:
      return ["orders:view", "profile:update", "preferences:update", "loyalty:view", "loyalty:redeem"];
  }
}

export function mockLogin(role: UserRole, email: string, fullName: string): AuthResponse {
  return {
    session: issueSession(),
    user: baseUser(role, email, fullName),
  };
}

export function mockProfileUpdate(user: UserProfile, input: ProfileUpdateInput): UserProfile {
  return {
    ...user,
    ...input,
    updatedAt: new Date().toISOString(),
  };
}

export function mockPreferencesUpdate(user: UserProfile, input: PreferencesUpdateInput): UserProfile {
  return {
    ...user,
    preferences: {
      ...user.preferences,
      ...("theme" in input ? { theme: input.theme ?? user.preferences.theme } : {}),
      ...("notifications" in input ? { notifications: { ...user.preferences.notifications, ...input.notifications } } : {}),
      ...("language" in input ? { language: input.language ?? user.preferences.language } : {}),
    },
    updatedAt: new Date().toISOString(),
  };
}

export function mockSecurityUpdate(user: UserProfile, input: SecurityUpdateInput): UserProfile {
  if (input.enableTwoFactor) {
    return { ...user, twoFactorEnabled: true, backupCodesEnabled: true, updatedAt: new Date().toISOString() };
  }
  if (input.disableTwoFactor) {
    return { ...user, twoFactorEnabled: false, backupCodesEnabled: false, updatedAt: new Date().toISOString() };
  }
  return user;
}

export function mockOrders(): OrderSummary[] {
  const now = new Date();
  return [
    {
      id: "ORD-001",
      status: "delivered",
      total: 1450,
      placedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      eta: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 35).toISOString(),
    },
    {
      id: "ORD-002",
      status: "enroute",
      total: 1950,
      placedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
      eta: new Date(now.getTime() + 1000 * 60 * 12).toISOString(),
    },
  ];
}

