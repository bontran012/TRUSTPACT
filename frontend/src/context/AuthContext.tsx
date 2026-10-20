"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";

export type UserRole = "BUYER" | "SELLER" | "BROKER" | "ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  walletAddress: `0x${string}`;
  email?: string;
  telegram?: string;
  avatarUrl: string;
  sbtId?: string;
  successRate?: number;
  completedDeals?: number;
  balanceUsdc: number;
}

export const PRESET_ACCOUNTS: UserProfile[] = [
  {
    id: "buyer-tuan",
    name: "Lê Minh Tuấn",
    role: "BUYER",
    walletAddress: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
    email: "tuan.le@gmail.com",
    telegram: "@tuan_buyer",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    sbtId: "#TP-1001",
    successRate: 100,
    completedDeals: 18,
    balanceUsdc: 5000,
  },
  {
    id: "seller-hoang",
    name: "Hoàng Minh (OTC Custodian)",
    role: "SELLER",
    walletAddress: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
    email: "hoangminh.otc@gmail.com",
    telegram: "@hoangminh_otc",
    avatarUrl: "/images/avatar-hoang.jpg",
    sbtId: "#TP-2002",
    successRate: 99.4,
    completedDeals: 142,
    balanceUsdc: 12450,
  },
  {
    id: "broker-nam",
    name: "Nguyễn Nam (Giám Định Viên)",
    role: "BROKER",
    walletAddress: "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
    email: "nam.escrow@trustpact.io",
    telegram: "@nam_escrow_official",
    avatarUrl: "/images/avatar-nam.jpg",
    sbtId: "#TP-30F1",
    successRate: 100,
    completedDeals: 128,
    balanceUsdc: 5000,
  },
];

interface AuthContextType {
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  loginWithPreset: (presetId: string) => void;
  loginWithWallet: (address: `0x${string}`, name?: string, role?: UserRole) => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoggedIn: false,
  loginWithPreset: () => {},
  loginWithWallet: () => {},
  updateProfile: () => {},
  logout: () => {},
  isAuthModalOpen: false,
  setIsAuthModalOpen: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

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

  // Sync to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("trustpact_user_session", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("trustpact_user_session");
    }
  }, [currentUser]);

  // When real Web3 wallet connects, update walletAddress if user is logged in
  useEffect(() => {
    if (isConnected && address) {
      setCurrentUser((prev) => {
        if (!prev) {
          return {
            id: `wallet-${address.slice(2, 8)}`,
            name: `Thành viên ${address.slice(2, 6)}`,
            role: "BUYER",
            walletAddress: address as `0x${string}`,
            avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
            balanceUsdc: 1000,
          };
        }
        return {
          ...prev,
          walletAddress: address as `0x${string}`,
        };
      });
    }
  }, [isConnected, address]);

  const loginWithPreset = (presetId: string) => {
    const found = PRESET_ACCOUNTS.find((p) => p.id === presetId);
    if (found) {
      setCurrentUser(found);
      setIsAuthModalOpen(false);
    }
  };

  const loginWithWallet = (walletAddr: `0x${string}`, name?: string, role: UserRole = "BUYER") => {
    const newUser: UserProfile = {
      id: `user-${walletAddr.slice(2, 8)}`,
      name: name || `Thành viên ${walletAddr.slice(0, 6)}`,
      role,
      walletAddress: walletAddr,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      balanceUsdc: 2500,
    };
    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const logout = () => {
    setCurrentUser(null);
    disconnect();
    localStorage.removeItem("trustpact_user_session");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn: !!currentUser,
        loginWithPreset,
        loginWithWallet,
        updateProfile,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
