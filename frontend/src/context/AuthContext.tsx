"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAccount, useDisconnect } from "wagmi";

export type UserRole = "BUYER" | "SELLER" | "BROKER" | "ADMIN";

export interface UserProfile {
  id: string; // Unique System ID e.g. "TP-1001" or "TP-84920"
  username: string; // Unique username e.g. "tuan_buyer"
  name: string; // Display name e.g. "Lê Minh Tuấn"
  role: UserRole;
  walletAddress: `0x${string}`;
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
}

export const PRESET_ACCOUNTS: UserProfile[] = [
  {
    id: "TP-1001",
    username: "tuan_buyer",
    name: "Lê Minh Tuấn",
    role: "BUYER",
    walletAddress: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
    email: "tuan.le@gmail.com",
    telegram: "@tuan_buyer",
    zalo: "0909112233",
    facebook: "facebook.com/tuan.le.crypto",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
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
    name: "Hoàng Minh (OTC Custodian)",
    role: "SELLER",
    walletAddress: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
    email: "hoangminh.otc@gmail.com",
    telegram: "@hoangminh_otc",
    zalo: "0988776655",
    facebook: "facebook.com/hoangminh.otc",
    avatarUrl: "/images/avatar-hoang.jpg",
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
    name: "Nguyễn Nam (Giám Định Viên)",
    role: "BROKER",
    walletAddress: "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
    email: "nam.escrow@trustpact.io",
    telegram: "@nam_escrow_official",
    zalo: "0912345678",
    facebook: "facebook.com/nam.escrow.official",
    avatarUrl: "/images/avatar-nam.jpg",
    sbtId: "#TP-30F1",
    successRate: 100,
    completedDeals: 128,
    balanceUsdc: 5000,
    registeredAt: "2023-08-04",
    hasCustomUsername: true,
  },
];

// Helper to generate a unique 5-digit system ID
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
  isOnboardingModalOpen: boolean;
  setIsOnboardingModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoggedIn: false,
  registeredUsers: [],
  loginWithPreset: () => {},
  loginWithWallet: () => {},
  registerOrUpdateUser: () => ({ success: false }),
  checkUsernameAvailability: () => ({ available: false }),
  searchUsers: () => [],
  findUserByQuery: () => null,
  updateProfile: () => {},
  logout: () => {},
  isAuthModalOpen: false,
  setIsAuthModalOpen: () => {},
  isOnboardingModalOpen: false,
  setIsOnboardingModalOpen: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Load registered users registry from localStorage, fallback to PRESET_ACCOUNTS
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("trustpact_registered_users");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {}
      }
    }
    return PRESET_ACCOUNTS;
  });

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("trustpact_user_session");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    // Default preset for demo if not logged in
    return PRESET_ACCOUNTS[0];
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Sync registered users to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("trustpact_registered_users", JSON.stringify(registeredUsers));
    }
  }, [registeredUsers]);

  // Sync currentUser session to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (currentUser) {
        localStorage.setItem("trustpact_user_session", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("trustpact_user_session");
      }
    }
  }, [currentUser]);

  // When real Web3 wallet connects:
  // If registered before, log in as that user.
  // If new, prompt onboarding modal so they can choose a unique username and get an auto-generated ID.
  useEffect(() => {
    if (isConnected && address) {
      const existing = registeredUsers.find(
        (u) => u.walletAddress.toLowerCase() === address.toLowerCase()
      );

      if (existing) {
        setCurrentUser(existing);
      } else {
        // Create pending profile without custom username yet
        const existingIds = registeredUsers.map((u) => u.id);
        const autoGeneratedId = generateUniqueUserId(existingIds);
        const tempUser: UserProfile = {
          id: autoGeneratedId,
          username: `user_${address.slice(2, 8).toLowerCase()}`,
          name: `Thành viên ${address.slice(0, 6)}...${address.slice(-4)}`,
          role: "BUYER",
          walletAddress: address as `0x${string}`,
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
          balanceUsdc: 2500,
          registeredAt: new Date().toISOString().split("T")[0],
          hasCustomUsername: false,
        };
        setCurrentUser(tempUser);
        // Prompt them to set their unique username & finish profile
        setIsOnboardingModalOpen(true);
      }
    }
  }, [isConnected, address]);

  // Check username availability
  const checkUsernameAvailability = useCallback(
    (usernameInput: string, excludeUserId?: string) => {
      const clean = usernameInput.trim().replace(/^@/, "").toLowerCase();
      if (!clean) {
        return { available: false, error: "User không được để trống" };
      }
      if (clean.length < 3) {
        return { available: false, error: "User phải có ít nhất 3 ký tự" };
      }
      if (clean.length > 20) {
        return { available: false, error: "User không được vượt quá 20 ký tự" };
      }
      if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
        return { available: false, error: "User chỉ được chứa chữ cái, chữ số và dấu gạch dưới (_)" };
      }

      const isTaken = registeredUsers.some((u) => {
        if (excludeUserId && u.id === excludeUserId) return false;
        return u.username.toLowerCase() === clean;
      });

      if (isTaken) {
        return { available: false, error: "User này đã có người sử dụng!" };
      }
      return { available: true };
    },
    [registeredUsers]
  );

  // Register or complete user profile with a unique username and auto-generated ID
  const registerOrUpdateUser = useCallback(
    (profileData: Partial<UserProfile> & { username: string }) => {
      const check = checkUsernameAvailability(profileData.username, currentUser?.id);
      if (!check.available) {
        return { success: false, error: check.error };
      }

      const cleanUsername = profileData.username.trim().replace(/^@/, "").toLowerCase();
      const existingIds = registeredUsers.map((u) => u.id);
      const assignedId = currentUser?.id && currentUser.id.startsWith("TP-")
        ? currentUser.id
        : generateUniqueUserId(existingIds);

      const finalProfile: UserProfile = {
        id: assignedId,
        username: cleanUsername,
        name: profileData.name || currentUser?.name || cleanUsername,
        role: profileData.role || currentUser?.role || "BUYER",
        walletAddress: (profileData.walletAddress || currentUser?.walletAddress || (address as `0x${string}`) || "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001") as `0x${string}`,
        email: profileData.email || currentUser?.email || "",
        telegram: profileData.telegram || currentUser?.telegram || `@${cleanUsername}`,
        zalo: profileData.zalo !== undefined ? profileData.zalo : currentUser?.zalo || "",
        facebook: profileData.facebook !== undefined ? profileData.facebook : currentUser?.facebook || "",
        avatarUrl: profileData.avatarUrl || currentUser?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        sbtId: currentUser?.sbtId || `#${assignedId}`,
        successRate: currentUser?.successRate ?? 100,
        completedDeals: currentUser?.completedDeals ?? 0,
        balanceUsdc: currentUser?.balanceUsdc ?? 2500,
        registeredAt: currentUser?.registeredAt || new Date().toISOString().split("T")[0],
        hasCustomUsername: true,
      };

      // Upsert in registeredUsers
      setRegisteredUsers((prev) => {
        const index = prev.findIndex(
          (u) =>
            u.id === finalProfile.id ||
            u.walletAddress.toLowerCase() === finalProfile.walletAddress.toLowerCase()
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

  // Search users by query (username, ID, name, wallet, zalo, facebook, telegram)
  const searchUsers = useCallback(
    (query: string): UserProfile[] => {
      const q = query.trim().replace(/^@/, "").toLowerCase();
      if (!q) return registeredUsers;
      return registeredUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.walletAddress.toLowerCase().includes(q) ||
          (u.zalo && u.zalo.toLowerCase().includes(q)) ||
          (u.facebook && u.facebook.toLowerCase().includes(q)) ||
          (u.telegram && u.telegram.toLowerCase().includes(q))
      );
    },
    [registeredUsers]
  );

  // Find exact user by query
  const findUserByQuery = useCallback(
    (query: string): UserProfile | null => {
      const q = query.trim().replace(/^@/, "").toLowerCase();
      if (!q) return null;
      return (
        registeredUsers.find(
          (u) =>
            u.username.toLowerCase() === q ||
            u.id.toLowerCase() === q ||
            u.walletAddress.toLowerCase() === q ||
            (u.zalo && u.zalo.replace(/\s+/g, "").toLowerCase() === q.replace(/\s+/g, "")) ||
            (u.facebook && u.facebook.toLowerCase().includes(q)) ||
            (u.telegram && u.telegram.toLowerCase().replace(/^@/, "") === q)
        ) || null
      );
    },
    [registeredUsers]
  );

  const loginWithPreset = (presetId: string) => {
    const found = registeredUsers.find((p) => p.id === presetId) || PRESET_ACCOUNTS.find((p) => p.id === presetId);
    if (found) {
      setCurrentUser(found);
      setIsAuthModalOpen(false);
      setIsOnboardingModalOpen(false);
    }
  };

  const loginWithWallet = (walletAddr: `0x${string}`, name?: string, role: UserRole = "BUYER") => {
    const existing = registeredUsers.find(
      (u) => u.walletAddress.toLowerCase() === walletAddr.toLowerCase()
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
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      balanceUsdc: 2500,
      registeredAt: new Date().toISOString().split("T")[0],
      hasCustomUsername: false,
    };
    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
    setIsOnboardingModalOpen(true);
  };

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
        registerOrUpdateUser,
        checkUsernameAvailability,
        searchUsers,
        findUserByQuery,
        updateProfile,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
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
