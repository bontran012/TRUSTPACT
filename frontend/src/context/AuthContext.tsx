"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useDisconnect } from "wagmi";

export type UserRole = "BUYER" | "SELLER" | "BROKER" | "ADMIN";

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  walletAddress?: `0x${string}`;
  email?: string;
  telegram?: string;
  zalo?: string;
  facebook?: string;
  avatarUrl: string;
  sbtId?: string;
  successRate?: number;
  completedDeals?: number;
  balanceUsdc: number;
  registeredAt?: string;
  hasCustomUsername?: boolean;
  isWalletLinked?: boolean;
  authProvider?: "wallet" | "gmail" | "preset";
}

export const PRESET_ACCOUNTS: UserProfile[] = [
  {
    id: "TP-1001",
    username: "tuan_buyer",
    name: "Lê Minh Tuấn",
    role: "BUYER",
    walletAddress: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
    email: "tuan.le@gmail.com",
    telegram: "@tuan_buyer",
    zalo: "0909112233",
    facebook: "facebook.com/tuan.le.crypto",
    avatarUrl: "",
    sbtId: "#TP-1001",
    successRate: 100,
    completedDeals: 18,
    balanceUsdc: 5000,
    registeredAt: "2024-01-15",
    hasCustomUsername: true,
  },
  {
    id: "TP-2002",
    username: "hoangminh_otc",
    name: "Hoàng Minh (Đối tác OTC)",
    role: "SELLER",
    walletAddress: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
    email: "hoangminh.otc@gmail.com",
    telegram: "@hoangminh_otc",
    zalo: "0988776655",
    facebook: "facebook.com/hoangminh.otc",
    avatarUrl: "",
    sbtId: "#TP-2002",
    successRate: 99.4,
    completedDeals: 142,
    balanceUsdc: 12450,
    registeredAt: "2023-11-20",
    hasCustomUsername: true,
  },
  {
    id: "TP-3003",
    username: "nam_broker",
    name: "Nguyễn Nam (GDTG)",
    role: "BROKER",
    walletAddress: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    email: "nam.escrow@trustpact.io",
    telegram: "@nam_escrow_official",
    zalo: "0912345678",
    facebook: "facebook.com/nam.escrow.official",
    avatarUrl: "",
    sbtId: "#TP-1",
    successRate: 100,
    completedDeals: 130,
    balanceUsdc: 5000,
    registeredAt: "2023-08-04",
    hasCustomUsername: true,
  },
  {
    id: "TP-3004",
    username: "trantuan_broker",
    name: "Trần Tuấn (GDTG Mã nguồn)",
    role: "BROKER",
    walletAddress: "0x44B1492bC78E12a899Ad34De91eF11B12E7a889B",
    email: "trantuan.escrow@trustpact.io",
    telegram: "@trantuan_escrow",
    zalo: "0933445566",
    facebook: "facebook.com/trantuan.dev",
    avatarUrl: "",
    sbtId: "#TP-44B1",
    successRate: 100,
    completedDeals: 215,
    balanceUsdc: 15000,
    registeredAt: "2023-05-12",
    hasCustomUsername: true,
  },
  {
    id: "TP-3005",
    username: "anhthu_broker",
    name: "Đặng Anh Thư (GDTG Tài sản số)",
    role: "BROKER",
    walletAddress: "0x77D1492bC78E12a899Ad34De91eF11B12E7a889C",
    email: "anhthu.escrow@trustpact.io",
    telegram: "@anhthu_pact",
    zalo: "0944556677",
    facebook: "facebook.com/anhthu.broker",
    avatarUrl: "",
    sbtId: "#TP-77D1",
    successRate: 98.8,
    completedDeals: 42,
    balanceUsdc: 2500,
    registeredAt: "2024-02-18",
    hasCustomUsername: true,
  },
  {
    id: "TP-9999",
    username: "super_admin",
    name: "Quản trị viên hệ thống",
    role: "ADMIN",
    walletAddress: "0xe85eE178537fa93392d82114A33f6B204Ea7c6aE",
    email: "admin@trustpact.io",
    telegram: "@TrustPact_Sentinel_bot",
    zalo: "0900009999",
    facebook: "facebook.com/trustpact.official",
    avatarUrl: "",
    sbtId: "#TP-ADMIN",
    successRate: 100,
    completedDeals: 999,
    balanceUsdc: 50000,
    registeredAt: "2023-01-01",
    hasCustomUsername: true,
  },
];

function sanitizeStoredUser(user: UserProfile): UserProfile {
  const presetMatch = PRESET_ACCOUNTS.find((p) => p.id === user.id);
  return {
    ...user,
    name: presetMatch ? presetMatch.name : user.name,
    avatarUrl: "",
  };
}

export function generateUniqueUserId(existingIds: string[] = []): string {
  let newId = "";
  let attempts = 0;
  do {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    newId = `TP-${randomDigits}`;
    attempts++;
  } while (existingIds.includes(newId) && attempts < 100);
  return newId;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  registeredUsers: UserProfile[];
  loginWithPreset: (presetId: string) => void;
  loginWithWallet: (address: `0x${string}`, name?: string, role?: UserRole) => void;
  loginWithGmail: (email: string, displayName?: string) => { success: boolean; error?: string; user?: UserProfile };
  linkWalletToUser: (walletAddress: `0x${string}`) => { success: boolean; error?: string; user?: UserProfile };
  registerOrUpdateUser: (profile: Partial<UserProfile> & { username: string }) => {
    success: boolean;
    error?: string;
  };
  checkUsernameAvailability: (
    username: string,
    excludeUserId?: string
  ) => { available: boolean; error?: string };
  searchUsers: (query: string) => UserProfile[];
  findUserByQuery: (query: string) => UserProfile | null;
  updateProfile: (updated: Partial<UserProfile>) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isLinkWalletModalOpen: boolean;
  setIsLinkWalletModalOpen: (open: boolean) => void;
  isOnboardingModalOpen: boolean;
  setIsOnboardingModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoggedIn: false,
  registeredUsers: [],
  loginWithPreset: () => {},
  loginWithWallet: () => {},
  loginWithGmail: () => ({ success: false }),
  linkWalletToUser: () => ({ success: false }),
  registerOrUpdateUser: () => ({ success: false }),
  checkUsernameAvailability: () => ({ available: false }),
  searchUsers: () => [],
  findUserByQuery: () => null,
  updateProfile: () => {},
  logout: () => {},
  isAuthModalOpen: false,
  setIsAuthModalOpen: () => {},
  isLinkWalletModalOpen: false,
  setIsLinkWalletModalOpen: () => {},
  isOnboardingModalOpen: false,
  setIsOnboardingModalOpen: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(PRESET_ACCOUNTS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const isInitialized = useRef(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLinkWalletModalOpen, setIsLinkWalletModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Restore session from localStorage on client mount (prevents Next.js SSR hydration mismatch)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedUsers = localStorage.getItem("trustpact_registered_users");
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRegisteredUsers(parsed.map(sanitizeStoredUser));
          }
        }
        const savedSession = localStorage.getItem("trustpact_user_session");
        if (savedSession) {
          setCurrentUser(sanitizeStoredUser(JSON.parse(savedSession)));
        }
      }
    } catch (e) {
      console.error("Failed to restore session from localStorage", e);
    } finally {
      isInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isInitialized.current) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("trustpact_registered_users", JSON.stringify(registeredUsers));
    }
  }, [registeredUsers]);

  useEffect(() => {
    if (!isInitialized.current) return;
    if (typeof window !== "undefined") {
      if (currentUser) {
        localStorage.setItem("trustpact_user_session", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("trustpact_user_session");
      }
    }
  }, [currentUser]);

  const checkUsernameAvailability = useCallback(
    (usernameInput: string, excludeUserId?: string) => {
      const clean = usernameInput.trim().replace(/^@/, "").toLowerCase();
      if (!clean) {
        return { available: false, error: "Tên định danh không được để trống" };
      }
      if (clean.length < 3) {
        return { available: false, error: "Tên định danh phải có ít nhất 3 ký tự" };
      }
      if (clean.length > 20) {
        return { available: false, error: "Tên định danh không vượt quá 20 ký tự" };
      }
      if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
        return { available: false, error: "Chỉ cho phép chữ cái, chữ số và dấu gạch dưới (_)" };
      }

      const isTaken = registeredUsers.some((u) => {
        if (excludeUserId && u.id === excludeUserId) return false;
        return u.username.toLowerCase() === clean;
      });

      if (isTaken) {
        return { available: false, error: "Tên định danh này đã được sử dụng" };
      }
      return { available: true };
    },
    [registeredUsers]
  );

  const registerOrUpdateUser = useCallback(
    (profileData: Partial<UserProfile> & { username: string }) => {
      const check = checkUsernameAvailability(profileData.username, currentUser?.id);
      if (!check.available) {
        return { success: false, error: check.error };
      }

      const cleanUsername = profileData.username.trim().replace(/^@/, "").toLowerCase();
      const existingIds = registeredUsers.map((u) => u.id);
      const assignedId =
        currentUser?.id && currentUser.id.startsWith("TP-")
          ? currentUser.id
          : generateUniqueUserId(existingIds);

      const finalProfile: UserProfile = {
        id: assignedId,
        username: cleanUsername,
        name: profileData.name || currentUser?.name || cleanUsername,
        role: profileData.role || currentUser?.role || "BUYER",
        walletAddress: (profileData.walletAddress ||
          currentUser?.walletAddress ||
          (address as `0x${string}`) ||
          "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001") as `0x${string}`,
        email: profileData.email || currentUser?.email || "",
        telegram: profileData.telegram || currentUser?.telegram || `@${cleanUsername}`,
        zalo: profileData.zalo !== undefined ? profileData.zalo : currentUser?.zalo || "",
        facebook: profileData.facebook !== undefined ? profileData.facebook : currentUser?.facebook || "",
        avatarUrl: "",
        sbtId: currentUser?.sbtId || `#${assignedId}`,
        successRate: currentUser?.successRate ?? 100,
        completedDeals: currentUser?.completedDeals ?? 0,
        balanceUsdc: currentUser?.balanceUsdc ?? 2500,
        registeredAt: currentUser?.registeredAt || new Date().toISOString().split("T")[0],
        hasCustomUsername: true,
      };

      setRegisteredUsers((prev) => {
        const index = prev.findIndex(
          (u) =>
            u.id === finalProfile.id ||
            Boolean(
              u.walletAddress &&
                finalProfile.walletAddress &&
                u.walletAddress.toLowerCase() === finalProfile.walletAddress.toLowerCase()
            )
        );
        if (index >= 0) {
          const next = [...prev];
          next[index] = finalProfile;
          return next;
        }
        return [...prev, finalProfile];
      });

      setCurrentUser(finalProfile);
      setIsOnboardingModalOpen(false);
      return { success: true };
    },
    [checkUsernameAvailability, currentUser, registeredUsers, address]
  );

  const searchUsers = useCallback(
    (query: string): UserProfile[] => {
      const q = query.trim().replace(/^@/, "").toLowerCase();
      if (!q) return registeredUsers;
      return registeredUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          Boolean(u.walletAddress && u.walletAddress.toLowerCase().includes(q)) ||
          (u.zalo && u.zalo.toLowerCase().includes(q)) ||
          (u.facebook && u.facebook.toLowerCase().includes(q)) ||
          (u.telegram && u.telegram.toLowerCase().includes(q))
      );
    },
    [registeredUsers]
  );

  const findUserByQuery = useCallback(
    (query: string): UserProfile | null => {
      const q = query.trim().replace(/^@/, "").toLowerCase();
      if (!q) return null;
      return (
        registeredUsers.find(
          (u) =>
            u.username.toLowerCase() === q ||
            u.id.toLowerCase() === q ||
            Boolean(u.walletAddress && u.walletAddress.toLowerCase() === q) ||
            (u.zalo && u.zalo.replace(/\s+/g, "").toLowerCase() === q.replace(/\s+/g, "")) ||
            (u.facebook && u.facebook.toLowerCase().includes(q)) ||
            (u.telegram && u.telegram.toLowerCase().replace(/^@/, "") === q)
        ) || null
      );
    },
    [registeredUsers]
  );

  const loginWithPreset = (presetId: string) => {
    const found =
      registeredUsers.find((p) => p.id === presetId) ||
      PRESET_ACCOUNTS.find((p) => p.id === presetId);
    if (found) {
      setCurrentUser(found);
      setIsAuthModalOpen(false);
      setIsOnboardingModalOpen(false);
    }
  };

  const loginWithWallet = (walletAddr: `0x${string}`, name?: string, role: UserRole = "BUYER") => {
    const existing = registeredUsers.find((u) =>
      Boolean(u.walletAddress && u.walletAddress.toLowerCase() === walletAddr.toLowerCase())
    );
    if (existing) {
      setCurrentUser(existing);
      setIsAuthModalOpen(false);
      return;
    }

    const existingIds = registeredUsers.map((u) => u.id);
    const newId = generateUniqueUserId(existingIds);
    const newUser: UserProfile = {
      id: newId,
      username: `user_${walletAddr.slice(2, 8).toLowerCase()}`,
      name: name || `Thành viên ${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}`,
      role,
      walletAddress: walletAddr,
      avatarUrl: "",
      balanceUsdc: 2500,
      registeredAt: new Date().toISOString().split("T")[0],
      hasCustomUsername: false,
    };
    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
    setIsOnboardingModalOpen(true);
  };

  const loginWithGmail = useCallback(
    (emailInput: string, customDisplayName?: string) => {
      const cleanEmail = emailInput.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return { success: false, error: "Vui lòng nhập địa chỉ email hợp lệ" };
      }

      const existing = registeredUsers.find(
        (u) => u.email && u.email.toLowerCase() === cleanEmail
      );

      if (existing) {
        setCurrentUser(existing);
        setIsAuthModalOpen(false);
        return { success: true, user: existing };
      }

      const rawHandle = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      let uniqueUsername = rawHandle;
      let counter = 1;
      while (registeredUsers.some((u) => u.username.toLowerCase() === uniqueUsername.toLowerCase())) {
        uniqueUsername = `${rawHandle}_${counter}`;
        counter++;
      }

      const existingIds = registeredUsers.map((u) => u.id);
      const newId = generateUniqueUserId(existingIds);
      const derivedName =
        customDisplayName ||
        cleanEmail
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const newUser: UserProfile = {
        id: newId,
        username: uniqueUsername,
        name: derivedName,
        role: "BUYER",
        email: cleanEmail,
        telegram: `@${uniqueUsername}`,
        avatarUrl: "",
        balanceUsdc: 2500,
        registeredAt: new Date().toISOString().split("T")[0],
        hasCustomUsername: true,
        isWalletLinked: false,
        authProvider: "gmail",
      };

      setRegisteredUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      setIsAuthModalOpen(false);
      return { success: true, user: newUser };
    },
    [registeredUsers]
  );

  const linkWalletToUser = useCallback(
    (newWalletAddress: `0x${string}`) => {
      if (!currentUser) return { success: false, error: "Chưa đăng nhập" };

      const updatedUser: UserProfile = {
        ...currentUser,
        walletAddress: newWalletAddress,
        isWalletLinked: true,
      };

      setCurrentUser(updatedUser);

      setRegisteredUsers((prev) => {
        const idx = prev.findIndex((u) => u.id === updatedUser.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedUser;
          return next;
        }
        return [...prev, updatedUser];
      });

      return { success: true, user: updatedUser };
    },
    [currentUser]
  );

  const updateProfile = (updated: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updated };
      setRegisteredUsers((all) => {
        const idx = all.findIndex((u) => u.id === merged.id);
        if (idx >= 0) {
          const next = [...all];
          next[idx] = merged;
          return next;
        }
        return [...all, merged];
      });
      return merged;
    });
  };

  const logout = () => {
    setCurrentUser(null);
    disconnect();
    if (typeof window !== "undefined") {
      localStorage.removeItem("trustpact_user_session");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn: !!currentUser,
        registeredUsers,
        loginWithPreset,
        loginWithWallet,
        loginWithGmail,
        linkWalletToUser,
        registerOrUpdateUser,
        checkUsernameAvailability,
        searchUsers,
        findUserByQuery,
        updateProfile,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isLinkWalletModalOpen,
        setIsLinkWalletModalOpen,
        isOnboardingModalOpen,
        setIsOnboardingModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
