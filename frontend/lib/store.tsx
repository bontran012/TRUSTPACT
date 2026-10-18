"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "buyer" | "seller" | "broker";

export interface Broker {
  id: string;
  name: string;
  avatar: string;
  badge: string;
  category: string;
  address: string;
  stakedAmount: number; // in USDC
  maxLimit: number; // 120% of stakedAmount
  completedDeals: number;
  successRate: number;
  rating: number;
  ratingCount: number;
  tipsReceived: number;
}

export interface ChatMessage {
  id: string;
  dealId: string;
  sender: "system" | "buyer" | "seller" | "broker";
  senderName: string;
  text: string;
  image?: string;
  time: string;
}

export interface EscrowDeal {
  id: string;
  title: string;
  category: string;
  amount: number; // in USDC
  brokerFeeBps: number; // default 150 (1.5%)
  buyerAddress: string;
  sellerAddress: string;
  brokerId: string;
  brokerName: string;
  status: "LOCKED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  deliveryConfirmed: boolean;
  rated: boolean;
  ratingStars?: number;
  tipAmount?: number;
}

export interface ScamReport {
  id: string;
  idType: "PHONE" | "BANK_ACCOUNT" | "WALLET";
  identifier: string;
  victimNote: string;
  evidenceIPFS: string;
  timestamp: string;
  isVerified: boolean;
  reporter: string;
}

interface StoreContextType {
  role: UserRole;
  setRole: (r: UserRole) => void;
  brokers: Broker[];
  deals: EscrowDeal[];
  messages: ChatMessage[];
  scamReports: ScamReport[];
  createDeal: (data: {
    title: string;
    category: string;
    amount: number;
    sellerAddress: string;
    brokerId: string;
  }) => string;
  getDeal: (id: string) => EscrowDeal | undefined;
  getMessagesForDeal: (dealId: string) => ChatMessage[];
  sendMessage: (dealId: string, text: string, image?: string) => void;
  brokerRelease: (dealId: string) => void;
  brokerRefund: (dealId: string) => void;
  rateAndTip: (dealId: string, stars: number, tipAmount: number) => void;
  stakeInsurance: (brokerId: string, amount: number) => void;
  unstakeInsurance: (brokerId: string, amount: number) => boolean;
  addScamReport: (report: Omit<ScamReport, "id" | "timestamp" | "isVerified" | "reporter">) => void;
}

const initialBrokers: Broker[] = [
  {
    id: "broker-nam",
    name: "Nguyễn Nam (Giám Định Tài Sản Số)",
    avatar: "/images/avatar-nam.jpg",
    badge: "Chứng Chỉ SBT Cấp 4 (Master Auditor)",
    category: "Tài Sản Kỹ Thuật Số & Trò Chơi",
    address: "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
    stakedAmount: 5000,
    maxLimit: 6000, // 5000 * 1.2
    completedDeals: 128,
    successRate: 100,
    rating: 4.9,
    ratingCount: 128,
    tipsReceived: 84.5,
  },
  {
    id: "broker-hoang",
    name: "Hoàng Minh (Thương Nhân Bảo Chứng OTC)",
    avatar: "/images/avatar-hoang.jpg",
    badge: "Chứng Chỉ SBT Cấp 3 (Senior Custodian)",
    category: "Thương Mại & Ngoại Hối OTC",
    address: "0x7B1244CC7e9F5a66b9A882c13d81bFeD561844CC",
    stakedAmount: 3000,
    maxLimit: 3600, // 3000 * 1.2
    completedDeals: 94,
    successRate: 100,
    rating: 4.8,
    ratingCount: 94,
    tipsReceived: 42.0,
  },
  {
    id: "broker-tuan",
    name: "Trần Tuấn (Kiểm Định Mã Nguồn & Bản Quyền)",
    avatar: "/images/avatar-tuan.jpg",
    badge: "Chứng Chỉ SBT Cấp 2 (Security Auditor)",
    category: "Mã Nguồn & Dịch Vụ Công Nghệ",
    address: "0x91F490E1a37c02c6Ef57B18A58Ac9748b8cD90E1",
    stakedAmount: 1000,
    maxLimit: 1200, // 1000 * 1.2
    completedDeals: 46,
    successRate: 100,
    rating: 5.0,
    ratingCount: 46,
    tipsReceived: 25.0,
  },
];

const initialDeals: EscrowDeal[] = [
  {
    id: "101",
    title: "Chuyển giao quyền sở hữu tài khoản Liên Quân Mobile VIP Full Tướng",
    category: "Tài Sản Kỹ Thuật Số & Trò Chơi",
    amount: 100,
    brokerFeeBps: 150,
    buyerAddress: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
    sellerAddress: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
    brokerId: "broker-nam",
    brokerName: "Nguyễn Nam (Thẩm Định Tài Sản Số)",
    status: "LOCKED",
    createdAt: "18/10/2026 00:15",
    deliveryConfirmed: true,
    rated: false,
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: "m-1",
    dealId: "101",
    sender: "system",
    senderName: "Hệ Thống Giao Thức",
    text: "Hợp đồng ký quỹ #101 đã khởi tạo trên mạng Avalanche Fuji C-Chain. Kho ký quỹ đang chờ tiếp nhận tài sản.",
    time: "00:15",
  },
  {
    id: "m-2",
    dealId: "101",
    sender: "system",
    senderName: "Avalanche C-Chain",
    text: "Xác thực on-chain hoàn tất (0.8s): Kho ký quỹ UniversalEscrow đã khóa an toàn 100.00 USDC.",
    time: "00:16",
  },
  {
    id: "m-3",
    dealId: "101",
    sender: "broker",
    senderName: "Nguyễn Nam (Bên Trung Gian)",
    text: "Xin chào các bên tham gia. Tôi phụ trách thẩm định và giám sát hợp đồng này. Toàn bộ giá trị giao dịch đã được bảo lưu an toàn trong Hợp đồng Thông minh. Bên Bán vui lòng tiến hành bàn giao thông tin và chứng từ hợp lệ cho Bên Mua.",
    time: "00:17",
  },
  {
    id: "m-4",
    dealId: "101",
    sender: "seller",
    senderName: "Hùng (Bên Bán)",
    text: "Tôi đã bàn giao đầy đủ chứng từ sở hữu và mã kích hoạt cho Bên Mua. Đề nghị Bên Mua đối soát và phản hồi.",
    time: "00:18",
  },
  {
    id: "m-5",
    dealId: "101",
    sender: "buyer",
    senderName: "Minh (Bên Mua)",
    text: "Tôi đã kiểm tra tính toàn vẹn của tài sản và cập nhật thông tin bảo mật thành công. Kính đề nghị Bên Trung Gian phê duyệt giải ngân cho Bên Bán.",
    time: "00:20",
  },
];

const initialScamReports: ScamReport[] = [
  {
    id: "scam-1",
    idType: "BANK_ACCOUNT",
    identifier: "1903889922101 (Techcombank)",
    victimNote: "Làm giả chứng từ giao dịch điện tử (Fake Bill) nhằm chiếm đoạt tài sản chuyển nhượng trị giá 2.500.000 VNĐ.",
    evidenceIPFS: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    timestamp: "17/10/2026 09:30",
    isVerified: true,
    reporter: "0x1A2B...44FF",
  },
  {
    id: "scam-2",
    idType: "PHONE",
    identifier: "0909999888",
    victimNote: "Giả mạo nhân sự quản trị của tổ chức trung gian uy tín để chiếm đoạt tiền đặt cọc.",
    evidenceIPFS: "ipfs://QmZtmD2qtWBS7f7mQyg6C7k21j61v836N0nK5i",
    timestamp: "16/10/2026 21:15",
    isVerified: true,
    reporter: "0x89C3...901E",
  },
  {
    id: "scam-3",
    idType: "WALLET",
    identifier: "0x39a17e36ba4a6b4d238ff944bacb478cbed5efca",
    victimNote: "Địa chỉ hợp đồng thông minh giả mạo website chính thức để lừa cấp quyền chuyển tiền (Phishing Approval).",
    evidenceIPFS: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    timestamp: "15/10/2026 14:02",
    isVerified: false,
    reporter: "0x44D1...771B",
  },
];

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("buyer");
  const [brokers, setBrokers] = useState<Broker[]>(initialBrokers);
  const [deals, setDeals] = useState<EscrowDeal[]>(initialDeals);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [scamReports, setScamReports] = useState<ScamReport[]>(initialScamReports);

  // Sync state with localStorage if available
  useEffect(() => {
    try {
      const savedDeals = localStorage.getItem("tp_deals");
      if (savedDeals) setDeals(JSON.parse(savedDeals));
      const savedMessages = localStorage.getItem("tp_messages");
      if (savedMessages) setMessages(JSON.parse(savedMessages));
      const savedBrokers = localStorage.getItem("tp_brokers");
      if (savedBrokers) {
        const parsed = JSON.parse(savedBrokers) as Broker[];
        const upgraded = parsed.map((b) => {
          if (b.id === "broker-nam") return { ...b, avatar: "/images/avatar-nam.jpg", badge: "Chứng Chỉ SBT Cấp 4 (Master Auditor)" };
          if (b.id === "broker-hoang") return { ...b, avatar: "/images/avatar-hoang.jpg", badge: "Chứng Chỉ SBT Cấp 3 (Senior Custodian)" };
          if (b.id === "broker-tuan") return { ...b, avatar: "/images/avatar-tuan.jpg", badge: "Chứng Chỉ SBT Cấp 2 (Security Auditor)" };
          return b;
        });
        setBrokers(upgraded);
      }
      const savedReports = localStorage.getItem("tp_scam");
      if (savedReports) setScamReports(JSON.parse(savedReports));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveToStorage = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore
    }
  };

  const createDeal = (data: {
    title: string;
    category: string;
    amount: number;
    sellerAddress: string;
    brokerId: string;
  }) => {
    const chosenBroker = brokers.find((b) => b.id === data.brokerId) || brokers[0];
    const newId = (Math.floor(100 + Math.random() * 900)).toString();

    const newDeal: EscrowDeal = {
      id: newId,
      title: data.title,
      category: data.category,
      amount: data.amount,
      brokerFeeBps: 150, // 1.5%
      buyerAddress: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
      sellerAddress: data.sellerAddress || "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
      brokerId: chosenBroker.id,
      brokerName: chosenBroker.name,
      status: "LOCKED",
      createdAt: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      deliveryConfirmed: false,
      rated: false,
    };

    const sysMsgs: ChatMessage[] = [
      {
        id: `sys-${Date.now()}-1`,
        dealId: newId,
        sender: "system",
        senderName: "Giao Thức TrustPact",
        text: `Hợp đồng ký quỹ #${newId} đối với danh mục tài sản [${data.title}] đã được thiết lập thành công.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: `sys-${Date.now()}-2`,
        dealId: newId,
        sender: "system",
        senderName: "Avalanche C-Chain",
        text: `Xác thực on-chain (0.8s): Kho ký quỹ UniversalEscrow đã phong tỏa an toàn ${data.amount.toLocaleString()} USDC. Hạn mức tài sản đảm bảo Aave V3 của ${chosenBroker.name} đã được liên kết bảo chứng.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: `sys-${Date.now()}-3`,
        dealId: newId,
        sender: "broker",
        senderName: chosenBroker.name,
        text: `Xin kính chào các bên tham gia giao dịch. Tôi tiếp nhận vai trò Bên Trung Gian giám sát hợp đồng #${newId}. Nguồn quỹ giao dịch đã được khóa an toàn tuyệt đối. Bên Bán có thể bắt đầu quy trình chuyển giao tài sản. Mọi tài liệu đối soát vui lòng lưu trữ trực tiếp trên kênh trao đổi này.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];

    const updatedDeals = [newDeal, ...deals];
    const updatedMessages = [...messages, ...sysMsgs];

    setDeals(updatedDeals);
    setMessages(updatedMessages);

    saveToStorage("tp_deals", updatedDeals);
    saveToStorage("tp_messages", updatedMessages);

    return newId;
  };

  const getDeal = (id: string) => {
    return deals.find((d) => d.id === id);
  };

  const getMessagesForDeal = (dealId: string) => {
    return messages.filter((m) => m.dealId === dealId);
  };

  const sendMessage = (dealId: string, text: string, image?: string) => {
    const roleNames: Record<UserRole, string> = {
      buyer: "Minh (Bên Mua)",
      seller: "Hùng (Bên Bán)",
      broker: "Nguyễn Nam (Bên Trung Gian)",
    };

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      dealId,
      sender: role,
      senderName: roleNames[role],
      text,
      image,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    saveToStorage("tp_messages", updated);
  };

  const brokerRelease = (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const protocolFee = +(deal.amount * 0.003).toFixed(2);
    const brokerFee = +(deal.amount * 0.015).toFixed(2);
    const netPayout = +(deal.amount - protocolFee - brokerFee).toFixed(2);

    const updatedDeals = deals.map((d) =>
      d.id === dealId ? { ...d, status: "COMPLETED" as const, deliveryConfirmed: true } : d
    );
    setDeals(updatedDeals);
    saveToStorage("tp_deals", updatedDeals);

    const sysMsg: ChatMessage = {
      id: `sys-rel-${Date.now()}`,
      dealId,
      sender: "system",
      senderName: "Avalanche C-Chain (0.8s Finality)",
      text: `⚡ XÁC NHẬN GIẢI NGÂN HOÀN TẤT: Bên Bán nhận ${netPayout} USDC, Phí dịch vụ Trung gian ${brokerFee} USDC, Phí giao thức ${protocolFee} USDC. Hợp đồng ký quỹ hoàn tất quy trình quyết toán an toàn.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMsgs = [...messages, sysMsg];
    setMessages(updatedMsgs);
    saveToStorage("tp_messages", updatedMsgs);

    // Update broker stats
    setBrokers((prev) => {
      const up = prev.map((b) =>
        b.id === deal.brokerId
          ? { ...b, completedDeals: b.completedDeals + 1 }
          : b
      );
      saveToStorage("tp_brokers", up);
      return up;
    });
  };

  const brokerRefund = (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const updatedDeals = deals.map((d) =>
      d.id === dealId ? { ...d, status: "CANCELLED" as const } : d
    );
    setDeals(updatedDeals);
    saveToStorage("tp_deals", updatedDeals);

    const sysMsg: ChatMessage = {
      id: `sys-ref-${Date.now()}`,
      dealId,
      sender: "system",
      senderName: "Avalanche C-Chain",
      text: `🔄 HOÀN TRẢ NGUỒN QUỸ THÀNH CÔNG: Bên Trung Gian đã thực hiện hoàn quỹ 100% (${deal.amount.toLocaleString()} USDC) từ Kho Ký Quỹ về ví Bên Mua. Hợp đồng được chấm dứt hợp lệ.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMsgs = [...messages, sysMsg];
    setMessages(updatedMsgs);
    saveToStorage("tp_messages", updatedMsgs);
  };

  const rateAndTip = (dealId: string, stars: number, tipAmount: number) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    // Mark deal as rated
    const updatedDeals = deals.map((d) =>
      d.id === dealId
        ? { ...d, rated: true, ratingStars: stars, tipAmount }
        : d
    );
    setDeals(updatedDeals);
    saveToStorage("tp_deals", updatedDeals);

    // Update broker profile
    setBrokers((prev) => {
      const up = prev.map((b) => {
        if (b.id === deal.brokerId) {
          const totalStars = b.rating * b.ratingCount + stars;
          const newCount = b.ratingCount + 1;
          const newRating = +(totalStars / newCount).toFixed(1);
          return {
            ...b,
            rating: newRating,
            ratingCount: newCount,
            tipsReceived: +(b.tipsReceived + tipAmount).toFixed(1),
          };
        }
        return b;
      });
      saveToStorage("tp_brokers", up);
      return up;
    });

    const sysMsg: ChatMessage = {
      id: `sys-tip-${Date.now()}`,
      dealId,
      sender: "system",
      senderName: "TrustPassport SBT",
      text: `⭐ CHỈ SỐ TÍN NHIỆM ON-CHAIN: Bên Mua ghi nhận đánh giá ${stars} Sao và chuyển khoản thưởng khích lệ ${tipAmount} USDC cho Bên Trung Gian. Dữ liệu đã được lưu trữ vĩnh viễn trên Soulbound Token của Bên Trung Gian!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMsgs = [...messages, sysMsg];
    setMessages(updatedMsgs);
    saveToStorage("tp_messages", updatedMsgs);
  };

  const stakeInsurance = (brokerId: string, amount: number) => {
    setBrokers((prev) => {
      const up = prev.map((b) => {
        if (b.id === brokerId) {
          const newStake = b.stakedAmount + amount;
          return {
            ...b,
            stakedAmount: newStake,
            maxLimit: Math.floor(newStake * 1.2),
          };
        }
        return b;
      });
      saveToStorage("tp_brokers", up);
      return up;
    });
  };

  const unstakeInsurance = (brokerId: string, amount: number) => {
    const broker = brokers.find((b) => b.id === brokerId);
    if (!broker || broker.stakedAmount < amount) return false;

    setBrokers((prev) => {
      const up = prev.map((b) => {
        if (b.id === brokerId) {
          const newStake = b.stakedAmount - amount;
          return {
            ...b,
            stakedAmount: newStake,
            maxLimit: Math.floor(newStake * 1.2),
          };
        }
        return b;
      });
      saveToStorage("tp_brokers", up);
      return up;
    });
    return true;
  };

  const addScamReport = (report: Omit<ScamReport, "id" | "timestamp" | "isVerified" | "reporter">) => {
    const newReport: ScamReport = {
      id: `scam-${Date.now()}`,
      ...report,
      timestamp: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isVerified: false,
      reporter: "0xVíBạn...F801",
    };
    const updated = [newReport, ...scamReports];
    setScamReports(updated);
    saveToStorage("tp_scam", updated);
  };

  return (
    <StoreContext.Provider
      value={{
        role,
        setRole,
        brokers,
        deals,
        messages,
        scamReports,
        createDeal,
        getDeal,
        getMessagesForDeal,
        sendMessage,
        brokerRelease,
        brokerRefund,
        rateAndTip,
        stakeInsurance,
        unstakeInsurance,
        addScamReport,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
