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
  password?: string;
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
  authProvider?: "wallet" | "gmail" | "email" | "preset";
}

export const PRESET_ACCOUNTS: UserProfile[] = [];

function sanitizeStoredUser(user: UserProfile): UserProfile {
  return {
    ...user,
    avatarUrl: "",
    email: undefined,
    password: undefined,
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
  loginWithEmail: (email: string, password: string) => { success: boolean; error?: string; user?: UserProfile };
  registerWithEmail: (email: string, password: string, name?: string) => { success: boolean; error?: string; user?: UserProfile };
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
  loginWithEmail: () => ({ success: false }),
  registerWithEmail: () => ({ success: false }),
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
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
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
            const realWalletsOnly = parsed.filter(
              (u: any) => u.walletAddress && u.walletAddress.startsWith("0x") && u.authProvider !== "preset"
            );
            setRegisteredUsers(realWalletsOnly.map(sanitizeStoredUser));
          }
        }
        const savedSession = localStorage.getItem("trustpact_user_session");
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          // Purge legacy mock or email sessions to enforce 100% pure Web3 wallet UX
          if (
            parsed &&
            (parsed.email === "nguoidung@gmail.com" ||
              parsed.authProvider === "gmail" ||
              parsed.authProvider === "email" ||
              parsed.authProvider === "preset" ||
              !parsed.walletAddress)
          ) {
            localStorage.removeItem("trustpact_user_session");
            setCurrentUser(null);
          } else if (parsed && parsed.walletAddress) {
            setCurrentUser(sanitizeStoredUser(parsed));
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore session from localStorage", e);
    } finally {
      isInitialized.current = true;
    }
  }, []);

  // Synchronize connected Web3 wallet (MetaMask / Core Wallet / etc.) with active user profile
  useEffect(() => {
    if (!isInitialized.current) return;
    if (isConnected && address) {
      if (
        !currentUser ||
        (currentUser.walletAddress &&
          currentUser.walletAddress.toLowerCase() !== address.toLowerCase())
      ) {
        loginWithWallet(address as `0x${string}`);
      }
    } else if (!isConnected && currentUser) {
      setCurrentUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("trustpact_user_session");
      }
    }
  }, [isConnected, address]);

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

  const loginWithPreset = (_presetId: string) => {
    // Deprecated: No mock presets allowed, authentication is 100% Web3 wallet based
  };

  const loginWithWallet = (walletAddr: `0x${string}`, name?: string, role: UserRole = "BUYER") => {
    const cleanAddr = walletAddr.toLowerCase();
    const existing = registeredUsers.find((u) =>
      Boolean(u.walletAddress && u.walletAddress.toLowerCase() === cleanAddr)
    );
    if (existing) {
      setCurrentUser(existing);
      setIsAuthModalOpen(false);
      setIsLinkWalletModalOpen(false);
      return;
    }

    const existingIds = registeredUsers.map((u) => u.id);
    const newId = generateUniqueUserId(existingIds);
    const shortAddr = `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}`;
    const newUser: UserProfile = {
      id: newId,
      username: `user_${walletAddr.slice(2, 8).toLowerCase()}`,
      name: name || `Thành viên ${shortAddr}`,
      role,
      walletAddress: walletAddr,
      telegram: `@user_${walletAddr.slice(2, 8).toLowerCase()}`,
      avatarUrl: "",
      sbtId: `#TP-${walletAddr.slice(2, 6).toUpperCase()}`,
      balanceUsdc: 2500,
      successRate: 100,
      completedDeals: 0,
      registeredAt: new Date().toISOString().split("T")[0],
      hasCustomUsername: false,
      isWalletLinked: true,
      authProvider: "wallet",
    };
    setRegisteredUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
    setIsLinkWalletModalOpen(false);
    setIsOnboardingModalOpen(false);
  };

  const loginWithEmail = useCallback(
    (emailInput: string, passwordInput: string) => {
      const cleanEmail = emailInput.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return { success: false, error: "Vui lòng nhập địa chỉ email hợp lệ" };
      }
      if (!passwordInput || passwordInput.length < 6) {
        return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };
      }

      const existing = registeredUsers.find(
        (u) => u.email && u.email.toLowerCase() === cleanEmail
      );

      if (!existing) {
        return { success: false, error: "Email này chưa được đăng ký. Vui lòng chuyển sang tab Đăng ký." };
      }

      if (existing.password && existing.password !== passwordInput) {
        return { success: false, error: "Mật khẩu không chính xác. Vui lòng thử lại." };
      }

      if (!existing.password) {
        existing.password = passwordInput;
      }

      setCurrentUser(existing);
      setIsAuthModalOpen(false);
      return { success: true, user: existing };
    },
    [registeredUsers]
  );

  const registerWithEmail = useCallback(
    (emailInput: string, passwordInput: string, customDisplayName?: string) => {
      const cleanEmail = emailInput.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return { success: false, error: "Vui lòng nhập địa chỉ email hợp lệ" };
      }
      if (!passwordInput || passwordInput.length < 6) {
        return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };
      }

      const existing = registeredUsers.find(
        (u) => u.email && u.email.toLowerCase() === cleanEmail
      );

      if (existing) {
        return { success: false, error: "Email này đã được đăng ký. Vui lòng chuyển sang tab Đăng nhập." };
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
        customDisplayName?.trim() ||
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
        password: passwordInput,
        telegram: `@${uniqueUsername}`,
        avatarUrl: "",
        balanceUsdc: 2500,
        registeredAt: new Date().toISOString().split("T")[0],
        hasCustomUsername: true,
        isWalletLinked: false,
        authProvider: "email",
      };

      setRegisteredUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      setIsAuthModalOpen(false);
      return { success: true, user: newUser };
    },
    [registeredUsers]
  );

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
        loginWithEmail,
        registerWithEmail,
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
