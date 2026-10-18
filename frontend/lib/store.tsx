"use client";
import React, { createContext, useContext, useState } from "react";
export type UserRole = "buyer" | "seller" | "broker";
export interface Broker {
  id: string;
  name: string;
  address: string;
  badge: string;
  tokenId: string;
  category: string;
  stakedAmount: number;
  maxLimit: number;
  activeAllocated: number;
  rating: number;
  completedDeals: number;
  totalVolume: number;
  tipsReceived: number;
  responseTime: string;
  isBlacklisted?: boolean;
}
export interface ScamReport {
  id: string;
  idType: "PHONE" | "BANK_ACCOUNT" | "WALLET" | "TELEGRAM";
  identifier: string;
  victimNote: string;
  evidenceIPFS: string;
  timestamp: string;
  reporter: string;
  reportCount: number;
  isVerified: boolean;
}
export interface Deal {
  id: string;
  title: string;
  category: string;
  amount: number;
  brokerFeeBps: number;
  durationHours: number;
  buyerAddress: string;
  sellerAddress: string;
  brokerId: string;
  brokerName: string;
  status: "LOCKED" | "COMPLETED" | "CANCELLED" | "SLASHED";
  createdAt: string;
  deliveryConfirmed: boolean;
  rated: boolean;
  enableAaveYield: boolean;
  txHash: string;
  settlementSplit?: { buyer: number; seller: number };
}
export interface ChatMessage {
  id: string;
  dealId: string;
  sender: "buyer" | "seller" | "broker" | "system";
  senderName: string;
  text: string;
  time: string;
  image?: string;
  txHash?: string;
}
export interface StakingHistoryItem {
  id: string;
  type: "STAKE" | "UNSTAKE" | "YIELD_CLAIM" | "SLASH";
  amount: number;
  yieldEarned?: number;
  timestamp: string;
  txHash: string;
}
interface StoreContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  walletBalances: Record<UserRole, number>;
  brokers: Broker[];
  scamReports: ScamReport[];
  deals: Deal[];
  stakingHistory: StakingHistoryItem[];
  addScamReport: (report: Omit<ScamReport, "id" | "timestamp" | "reporter" | "reportCount" | "isVerified">) => void;
  createDeal: (data: {
    title: string;
    category: string;
    amount: number;
    sellerAddress: string;
    brokerId: string;
    durationHours?: number;
    enableAaveYield?: boolean;
  }) => string;
  getDeal: (id: string) => Deal | undefined;
  getMessagesForDeal: (dealId: string) => ChatMessage[];
  sendMessage: (dealId: string, text: string, image?: string) => void;
  confirmSellerDelivery: (dealId: string) => void;
  buyerDirectRelease: (dealId: string) => void;
  brokerRelease: (dealId: string) => void;
  brokerRefund: (dealId: string) => void;
  brokerMediateSettle: (dealId: string, refundToBuyer: number, payoutToSeller: number) => void;
  slashCorruptBroker: (dealId: string, compensation: number) => void;
  rateAndTip: (dealId: string, stars: number, tipAmount: number) => void;
  stakeInsurance: (brokerId: string, amount: number) => void;
  unstakeInsurance: (brokerId: string, amount: number) => boolean;
}
const INITIAL_BROKERS: Broker[] = [
  {
    id: "broker-nam",
    name: "Nguyễn Nam (Master Auditor)",
    address: "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
    badge: "Master Auditor • Tier 4",
    tokenId: "889A",
    category: "Tài Sản Số, Game VIP & OTC",
    stakedAmount: 5000,
    maxLimit: 6000,
    activeAllocated: 1350,
    rating: 4.98,
    completedDeals: 128,
    totalVolume: 284500,
    tipsReceived: 645,
    responseTime: "< 2 phút",
  },
  {
    id: "broker-linh",
    name: "Trần Hoàng Linh (OTC Desk)",
    address: "0x72A9104cE55B89d112Bc49Fa08cD22E45F9b331C",
    badge: "Institutional Desk • Tier 5",
    tokenId: "331C",
    category: "Thanh Khoản Ngoại Hối & P2P OTC",
    stakedAmount: 12500,
    maxLimit: 15000,
    activeAllocated: 4200,
    rating: 5.0,
    completedDeals: 342,
    totalVolume: 890000,
    tipsReceived: 1820,
    responseTime: "< 1 phút",
  },
  {
    id: "broker-khoa",
    name: "Lê Minh Khoa (DevSecOps)",
    address: "0x94D8231aB12C44e778Fa12Bc90eA33C81D2e774F",
    badge: "Smart Contract Verifier • Tier 3",
    tokenId: "774F",
    category: "Mã Nguồn, SaaS & Domain Web3",
    stakedAmount: 3000,
    maxLimit: 3600,
    activeAllocated: 600,
    rating: 4.94,
    completedDeals: 89,
    totalVolume: 142000,
    tipsReceived: 390,
    responseTime: "< 5 phút",
  },
];
const INITIAL_SCAM_REPORTS: ScamReport[] = [
  {
    id: "scam-1",
    idType: "BANK_ACCOUNT",
    identifier: "1903889922101",
    victimNote: "Giả mạo trung gian uy tín bằng ảnh Photoshop biên lai Techcombank, chiếm đoạt 15,000,000 VNĐ giao dịch mua bán tài khoản game rồi chặn Telegram.",
    evidenceIPFS: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    timestamp: "18/10/2026 09:15",
    reporter: "0x41B2...991A",
    reportCount: 7,
    isVerified: true,
  },
  {
    id: "scam-2",
    idType: "PHONE",
    identifier: "0987654321",
    victimNote: "Mạo danh nhân viên hỗ trợ sàn OTC gửi link phishing yêu cầu ký lệnh SetApprovalForAll rút cạn USDT trong ví người dùng.",
    evidenceIPFS: "ipfs://QmZtMD2qtWBS7Y6Yv4zF89aBcDeFgHiJkLmNoPqRsTuVwX",
    timestamp: "17/10/2026 21:40",
    reporter: "0x88C1...220E",
    reportCount: 4,
    isVerified: true,
  },
  {
    id: "scam-3",
    idType: "WALLET",
    identifier: "0xDeadBeef0000111122223333444455556666Scam",
    victimNote: "Ví chuyên phát tán token giả mạo Airdrop và lừa đảo P2P chuyển khoản chứng từ ngân hàng chỉnh sửa HTML.",
    evidenceIPFS: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    timestamp: "16/10/2026 14:22",
    reporter: "0x19F0...773B",
    reportCount: 12,
    isVerified: true,
  },
  {
    id: "scam-4",
    idType: "TELEGRAM",
    identifier: "@otc_vn_fake_admin",
    victimNote: "Clone y hệt username của GDTG Nguyễn Nam (thay chữ l bằng chữ I hoa) để lừa người mua nạp tiền vào ví cá nhân.",
    evidenceIPFS: "ipfs://QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX",
    timestamp: "15/10/2026 18:05",
    reporter: "0x30F1...889A",
    reportCount: 9,
    isVerified: true,
  },
];
const INITIAL_DEALS: Deal[] = [
  {
    id: "101",
    title: "Chuyển nhượng tài khoản Liên Quân Mobile VIP Full Skin Tuyệt Sắc",
    category: "Tài Sản Kỹ Thuật Số & Trò Chơi",
    amount: 1000,
    brokerFeeBps: 150,
    durationHours: 72,
    buyerAddress: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
    sellerAddress: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
    brokerId: "broker-nam",
    brokerName: "Nguyễn Nam (Master Auditor)",
    status: "LOCKED",
    createdAt: "18/10/2026 10:20",
    deliveryConfirmed: true,
    rated: false,
    enableAaveYield: true,
    txHash: "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
  },
  {
    id: "102",
    title: "Thanh toán OTC Lô 4,200 USDT sang Vietcombank Doanh Nghiệp",
    category: "Thương Mại & Ngoại Hối OTC",
    amount: 4200,
    brokerFeeBps: 100,
    durationHours: 24,
    buyerAddress: "0x55E1a2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D78890",
    sellerAddress: "0x91D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B04412",
    brokerId: "broker-linh",
    brokerName: "Trần Hoàng Linh (OTC Desk)",
    status: "LOCKED",
    createdAt: "18/10/2026 11:05",
    deliveryConfirmed: false,
    rated: false,
    enableAaveYield: true,
    txHash: "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
  },
  {
    id: "100",
    title: "Bàn giao Full Source Code SaaS AI CRM + Tên miền .io",
    category: "Mã Nguồn & Dịch Vụ Công Nghệ",
    amount: 2500,
    brokerFeeBps: 150,
    durationHours: 48,
    buyerAddress: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
    sellerAddress: "0x67F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D45501",
    brokerId: "broker-khoa",
    brokerName: "Lê Minh Khoa (DevSecOps)",
    status: "COMPLETED",
    createdAt: "17/10/2026 15:40",
    deliveryConfirmed: true,
    rated: true,
    enableAaveYield: true,
    txHash: "0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d",
  },
];
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    dealId: "101",
    sender: "system",
    senderName: "UniversalEscrow.sol (Fuji C-Chain)",
    text: "🔒 Đã khóa thành công 1,000 USDC từ Bên Mua vào Két Sắt Ký Quỹ #101. Nguồn vốn đã được điều phối sinh lãi trong Aave V3 Pool (5.20% APY). Hạn mức bảo chứng 1,000 USDC của GDTG Nguyễn Nam đã được kích hoạt.",
    time: "10:20",
    txHash: "0x9f8e...9f8e",
  },
  {
    id: "msg-2",
    dealId: "101",
    sender: "buyer",
    senderName: "Bên Mua (Minh • 0x1A2b...0001)",
    text: "Mình đã nạp đủ 1,000 USDC vào hợp đồng ký quỹ. Nhờ bạn Hùng bàn giao thông tin đăng nhập Garena trắng thông tin và nhờ anh Nam GDTG kiểm tra lịch sử bảo mật giúp mình nhé!",
    time: "10:21",
  },
  {
    id: "msg-3",
    dealId: "101",
    sender: "seller",
    senderName: "Bên Bán (Hùng • 0x89C3...0002)",
    text: "Đã thấy tiền khóa trên Smart Contract! Mình vừa gửi thông tin tài khoản + mã OTP thay đổi SĐT/Email sang cho anh Nam GDTG và đính kèm biên bản bàn giao trên IPFS.",
    time: "10:24",
  },
  {
    id: "msg-4",
    dealId: "101",
    sender: "broker",
    senderName: "GDTG Nguyễn Nam (Master Auditor)",
    text: "✅ Đã kiểm định xong: Tài khoản đúng 100% mô tả, không dính liên kết phụ và đã đổi sang SĐT/Email gốc của Bên Mua (Minh). Minh vào xác nhận hoặc mình có thể bấm Phê Duyệt Giải Ngân 0.8s ngay bây giờ.",
    time: "10:28",
  },
];
const INITIAL_STAKING_HISTORY: StakingHistoryItem[] = [
  {
    id: "stk-1",
    type: "STAKE",
    amount: 3500,
    timestamp: "10/10/2026 08:30",
    txHash: "0x81a2...39c1",
  },
  {
    id: "stk-2",
    type: "STAKE",
    amount: 1500,
    timestamp: "14/10/2026 16:15",
    txHash: "0x44f9...10b8",
  },
  {
    id: "stk-3",
    type: "YIELD_CLAIM",
    amount: 0,
    yieldEarned: 18.64,
    timestamp: "18/10/2026 09:00",
    txHash: "0x92c4...77e2",
  },
];
const StoreContext = createContext<StoreContextType | undefined>(undefined);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("broker");
  const [walletBalances, setWalletBalances] = useState<Record<UserRole, number>>({
    buyer: 14500,
    seller: 3280,
    broker: 8450,
  });
  const [brokers, setBrokers] = useState<Broker[]>(INITIAL_BROKERS);
  const [scamReports, setScamReports] = useState<ScamReport[]>(INITIAL_SCAM_REPORTS);
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [stakingHistory, setStakingHistory] = useState<StakingHistoryItem[]>(INITIAL_STAKING_HISTORY);
  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  const addScamReport: StoreContextType["addScamReport"] = (newReport) => {
    const item: ScamReport = {
      ...newReport,
      id: `scam-${Date.now()}`,
      timestamp: `18/10/2026 ${nowTime()}`,
      reporter: role === "buyer" ? "0x1A2b...0001" : role === "seller" ? "0x89C3...0002" : "0x30F1...889A",
      reportCount: 1,
      isVerified: true,
    };
    setScamReports((prev) => [item, ...prev]);
  };
  const createDeal: StoreContextType["createDeal"] = ({
    title,
    category,
    amount,
    sellerAddress,
    brokerId,
    durationHours = 72,
    enableAaveYield = true,
  }) => {
    const newId = String(100 + deals.length + 2);
    const chosenBroker = brokers.find((b) => b.id === brokerId) || brokers[0];
    const mockTx = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    const newDeal: Deal = {
      id: newId,
      title,
      category,
      amount,
      brokerFeeBps: 150,
      durationHours,
      buyerAddress: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
      sellerAddress,
      brokerId: chosenBroker.id,
      brokerName: chosenBroker.name,
      status: "LOCKED",
      createdAt: `18/10/2026 ${nowTime()}`,
      deliveryConfirmed: false,
      rated: false,
      enableAaveYield,
      txHash: mockTx,
    };
    setDeals((prev) => [newDeal, ...prev]);
    setWalletBalances((prev) => ({
      ...prev,
      buyer: Math.max(0, prev.buyer - amount),
    }));
    setBrokers((prev) =>
      prev.map((b) =>
        b.id === chosenBroker.id
          ? { ...b, activeAllocated: b.activeAllocated + amount }
          : b
      )
    );
    const sysMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      dealId: newId,
      sender: "system",
      senderName: "UniversalEscrow.sol (Fuji C-Chain)",
      text: `🔒 Hợp đồng ký quỹ #${newId} đã khởi tạo. Phong tỏa thành công ${amount.toLocaleString()} USDC từ Bên Mua. Đã cấp phát hạn mức bảo chứng từ GDTG ${chosenBroker.name}.`,
      time: nowTime(),
      txHash: mockTx,
    };
    setMessages((prev) => [...prev, sysMsg]);
    return newId;
  };
  const getDeal = (id: string) => deals.find((d) => d.id === id);
  const getMessagesForDeal = (dealId: string) =>
    messages.filter((m) => m.dealId === dealId);
  const sendMessage = (dealId: string, text: string, image?: string) => {
    const senderNames: Record<UserRole, string> = {
      buyer: "Bên Mua (Minh • 0x1A2b...0001)",
      seller: "Bên Bán (Hùng • 0x89C3...0002)",
      broker: "GDTG Nguyễn Nam (Master Auditor)",
    };
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      dealId,
      sender: role,
      senderName: senderNames[role],
      text,
      time: nowTime(),
      image,
    };
    setMessages((prev) => [...prev, msg]);
  };
  const confirmSellerDelivery = (dealId: string) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, deliveryConfirmed: true } : d))
    );
    const sysMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      dealId,
      sender: "system",
      senderName: "UniversalEscrow.sol",
      text: "📦 Bên Bán đã xác nhận hoàn tất bàn giao tài sản kèm bằng chứng IPFS. Đang chờ Bên Mua nghiệm thu hoặc GDTG phê duyệt giải ngân.",
      time: nowTime(),
    };
    setMessages((prev) => [...prev, sysMsg]);
  };
  const executeReleaseState = (dealId: string, triggeredBy: string) => {
    const target = deals.find((d) => d.id === dealId);
    if (!target || target.status !== "LOCKED") return;
    const protocolFee = +(target.amount * 0.003).toFixed(2);
    const brokerFee = +(target.amount * 0.015).toFixed(2);
    const netSeller = +(target.amount - protocolFee - brokerFee).toFixed(2);
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? { ...d, status: "COMPLETED", deliveryConfirmed: true }
          : d
      )
    );
    setWalletBalances((prev) => ({
      ...prev,
      seller: +(prev.seller + netSeller).toFixed(2),
      broker: +(prev.broker + brokerFee).toFixed(2),
    }));
    setBrokers((prev) =>
      prev.map((b) =>
        b.id === target.brokerId
          ? {
              ...b,
              activeAllocated: Math.max(0, b.activeAllocated - target.amount),
              completedDeals: b.completedDeals + 1,
              totalVolume: b.totalVolume + target.amount,
            }
          : b
      )
    );
    const sysMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      dealId,
      sender: "system",
      senderName: "Avalanche Snowman Consensus (0.8s)",
      text: `⚡ QUYẾT TOÁN TỨC THÌ THÀNH CÔNG (${triggeredBy}): Đã chuyển ${netSeller.toLocaleString()} USDC về ví Bên Bán, ${brokerFee} USDC phí giám định cho GDTG và ${protocolFee} USDC về Treasury. Hạn mức cọc đã được giải phóng!`,
      time: nowTime(),
      txHash: "0x88f1...08s0",
    };
    setMessages((prev) => [...prev, sysMsg]);
  };
  const brokerRelease = (dealId: string) => {
    executeReleaseState(dealId, "brokerRelease()");
  };
  const buyerDirectRelease = (dealId: string) => {
    executeReleaseState(dealId, "buyerConfirmDelivery()");
  };
  const brokerRefund = (dealId: string) => {
    const target = deals.find((d) => d.id === dealId);
    if (!target || target.status !== "LOCKED") return;
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, status: "CANCELLED" } : d))
    );
    setWalletBalances((prev) => ({
      ...prev,
      buyer: +(prev.buyer + target.amount).toFixed(2),
    }));
    setBrokers((prev) =>
      prev.map((b) =>
        b.id === target.brokerId
          ? { ...b, activeAllocated: Math.max(0, b.activeAllocated - target.amount) }
          : b
      )
    );
    const sysMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      dealId,
      sender: "system",
      senderName: "UniversalEscrow.sol",
      text: `↩️ HOÀN QUỸ BẢO TOÀN 100%: Đã hoàn trả nguyên vẹn ${target.amount.toLocaleString()} USDC về ví Bên Mua và giải phóng hạn mức bảo chứng.`,
      time: nowTime(),
      txHash: "0x55a9...ref0",
    };
    setMessages((prev) => [...prev, sysMsg]);
  };
  const brokerMediateSettle = (dealId: string, refundToBuyer: number, payoutToSeller: number) => {
    const target = deals.find((d) => d.id === dealId);
    if (!target || target.status !== "LOCKED") return;
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              status: "COMPLETED",
              settlementSplit: { buyer: refundToBuyer, seller: payoutToSeller },
            }
          : d
      )
    );
    setWalletBalances((prev) => ({
      ...prev,
      buyer: +(prev.buyer + refundToBuyer).toFixed(2),
      seller: +(prev.seller + payoutToSeller).toFixed(2),
    }));
    setBrokers((prev) =>
      prev.map((b) =>
        b.id === target.brokerId
          ? {
              ...b,
              activeAllocated: Math.max(0, b.activeAllocated - target.amount),
              completedDeals: b.completedDeals + 1,
            }
          : b
      )
    );
    const sysMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      dealId,
      sender: "system",
      senderName: "UniversalEscrow.sol • brokerSettle()",
      text: `⚖️ PHÁN QUYẾT HÒA GIẢI ĐỒNG THUẬN: Hoàn trả ${refundToBuyer.toLocaleString()} USDC cho Bên Mua và giải ngân ${payoutToSeller.toLocaleString()} USDC cho Bên Bán.`,
      time: nowTime(),
      txHash: "0x71b3...set0",
    };
    setMessages((prev) => [...prev, sysMsg]);
  };
  const slashCorruptBroker = (dealId: string, compensation: number) => {
    const target = deals.find((d) => d.id === dealId);
    if (!target || target.status !== "LOCKED") return;
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, status: "SLASHED" } : d))
    );
    setWalletBalances((prev) => ({
      ...prev,
      buyer: +(prev.buyer + target.amount + compensation).toFixed(2),
    }));
    setBrokers((prev) =>
      prev.map((b) => {
        if (b.id !== target.brokerId) return b;
        const newStake = Math.max(0, b.stakedAmount - compensation);
        return {
          ...b,
          stakedAmount: newStake,
          maxLimit: Math.floor(newStake * 1.2),
          activeAllocated: Math.max(0, b.activeAllocated - target.amount),
          isBlacklisted: true,
        };
      })
    );
    const sysMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      dealId,
      sender: "system",
      senderName: "StakedBrokerRegistry.sol • SLASHING ENGINE",
      text: `🚨 CHÉM CỌC TRỪNG PHẠT (ECONOMIC SLASHING): Đã hoàn trả 100% gốc (${target.amount.toLocaleString()} USDC) + trích trực tiếp ${compensation.toLocaleString()} USDC từ cọc Aave V3 của GDTG đền bù cho Bên Mua!`,
      time: nowTime(),
      txHash: "0x99sl...ash1",
    };
    setMessages((prev) => [...prev, sysMsg]);
  };
  const rateAndTip = (dealId: string, stars: number, tipAmount: number) => {
    const target = deals.find((d) => d.id === dealId);
    if (!target) return;
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, rated: true } : d))
    );
    if (tipAmount > 0) {
      setWalletBalances((prev) => ({
        ...prev,
        buyer: Math.max(0, +(prev.buyer - tipAmount).toFixed(2)),
        broker: +(prev.broker + tipAmount).toFixed(2),
      }));
    }
    setBrokers((prev) =>
      prev.map((b) =>
        b.id === target.brokerId
          ? {
              ...b,
              tipsReceived: b.tipsReceived + tipAmount,
            }
          : b
      )
    );
    const sysMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      dealId,
      sender: "system",
      senderName: "TrustPassportSBT.sol (ERC-721 Soulbound)",
      text: `⭐ ĐÁNH GIÁ ON-CHAIN: Bên Mua đã chấm ${stars}/5 sao và gửi thưởng Tip +${tipAmount} USDC trực tiếp vào hồ sơ Soulbound Token của ${target.brokerName}.`,
      time: nowTime(),
    };
    setMessages((prev) => [...prev, sysMsg]);
  };
  const stakeInsurance = (brokerId: string, amount: number) => {
    setBrokers((prev) =>
      prev.map((b) => {
        if (b.id !== brokerId) return b;
        const nextStake = b.stakedAmount + amount;
        return {
          ...b,
          stakedAmount: nextStake,
          maxLimit: Math.round(nextStake * 1.2),
          isBlacklisted: false,
        };
      })
    );
    setWalletBalances((prev) => ({
      ...prev,
      broker: Math.max(0, +(prev.broker - amount).toFixed(2)),
    }));
    setStakingHistory((prev) => [
      {
        id: `stk-${Date.now()}`,
        type: "STAKE",
        amount,
        timestamp: `18/10/2026 ${nowTime()}`,
        txHash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
      },
      ...prev,
    ]);
  };
  const unstakeInsurance = (brokerId: string, amount: number): boolean => {
    const broker = brokers.find((b) => b.id === brokerId);
    if (!broker) return false;
    const newStake = broker.stakedAmount - amount;
    const newMaxQuota = newStake * 1.2;
    if (newStake < broker.activeAllocated || newMaxQuota < broker.activeAllocated) {
      return false;
    }
    const accruedYieldBonus = +(amount * 0.008).toFixed(2);
    setBrokers((prev) =>
      prev.map((b) => {
        if (b.id !== brokerId) return b;
        return {
          ...b,
          stakedAmount: newStake,
          maxLimit: Math.round(newMaxQuota),
        };
      })
    );
    setWalletBalances((prev) => ({
      ...prev,
      broker: +(prev.broker + amount + accruedYieldBonus).toFixed(2),
    }));
    setStakingHistory((prev) => [
      {
        id: `stk-${Date.now()}`,
        type: "UNSTAKE",
        amount,
        yieldEarned: accruedYieldBonus,
        timestamp: `18/10/2026 ${nowTime()}`,
        txHash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
      },
      ...prev,
    ]);
    return true;
  };
  return (
    <StoreContext.Provider
      value={{
        role,
        setRole,
        walletBalances,
        brokers,
        scamReports,
        deals,
        stakingHistory,
        addScamReport,
        createDeal,
        getDeal,
        getMessagesForDeal,
        sendMessage,
        confirmSellerDelivery,
        buyerDirectRelease,
        brokerRelease,
        brokerRefund,
        brokerMediateSettle,
        slashCorruptBroker,
        rateAndTip,
        stakeInsurance,
        unstakeInsurance,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}
