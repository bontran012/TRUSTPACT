import fs from "fs";
import path from "path";

export interface DBMessage {
  id: string;
  pactId: string;
  sender: string;
  role: "buyer" | "seller" | "broker" | "admin" | "system";
  senderName: string;
  text: string;
  timestamp: string;
  isProof?: boolean;
  proofUrl?: string;
  createdAt: number;
}

export interface DBHandover {
  pactId: string;
  assetTitle: string;
  proofUrl: string;
  notes: string;
  isHandedOver: boolean;
  handedOverAt?: string;
  updatedAt: number;
}

export interface DBPact {
  id: string;
  onChainId?: number;
  txHash?: string;
  buyer: string;
  seller: string;
  broker: string;
  amount: string; // USDC
  brokerFeeBps: number;
  duration: number; // seconds
  startTime: number;
  status: number; // 0: Active, 1: Completed, 2: Cancelled, 3: Disputed
  disputeReason?: string;
  updatedAt: number;
}

export interface DBScamReport {
  id: string;
  identifier: string; // STK, username, address
  bankName?: string;
  type: string;
  reason: string;
  victimLoss: string;
  reportsCount: number;
  isVerified: boolean;
  evidenceUrl?: string;
  timestamp: string;
}

interface DBStore {
  pacts: Record<string, DBPact>;
  messages: Record<string, DBMessage[]>;
  handovers: Record<string, DBHandover>;
  scams: DBScamReport[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "trustpact_store.json");

function getDefaultData(): DBStore {
  return {
    pacts: {
      "101": {
        id: "101",
        onChainId: 101,
        txHash: "0xb3e0586f61a2dc5c1055528f0939e2fbdce38ad0e44b1928019a84f00101",
        buyer: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
        seller: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
        broker: "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
        amount: "1000",
        brokerFeeBps: 150,
        duration: 86400,
        startTime: Math.floor(Date.now() / 1000) - 1800,
        status: 0,
        updatedAt: Date.now(),
      },
    },
    messages: {
      "101": [
        {
          id: "msg-0",
          pactId: "101",
          sender: "0xb3e0586F61a2dC5C1055528f0939E2fbDcE38Ad0",
          role: "system",
          senderName: "Hệ Thống UniversalEscrow (Avalanche Fuji)",
          text: "Hợp đồng ký quỹ #101 đã khóa an toàn 1,000.00 USDC vào Két Sắt on-chain. GDTG đã phong tỏa hạn mức cọc bảo chứng.",
          timestamp: "10:14",
          createdAt: Date.now() - 1800000,
        },
        {
          id: "msg-1",
          pactId: "101",
          sender: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
          role: "buyer",
          senderName: "Lê Minh Tuấn (Bên Mua)",
          text: "Tôi đã nạp đủ 1,000 USDC vào Két Sắt Smart Contract. Mời Bên Bán tiến hành bàn giao tài sản số.",
          timestamp: "10:15",
          createdAt: Date.now() - 1700000,
        },
        {
          id: "msg-2",
          pactId: "101",
          sender: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
          role: "seller",
          senderName: "Hoàng Minh (Bên Bán)",
          text: "Đã chuyển giao thông tin tài khoản và gửi chứng từ bàn giao lên phòng ký quỹ để Bên Mua và GDTG đối soát.",
          timestamp: "10:22",
          isProof: true,
          proofUrl: "https://testnet.snowtrace.io/tx/0x44b1928019a84f",
          createdAt: Date.now() - 1200000,
        },
        {
          id: "msg-3",
          pactId: "101",
          sender: "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
          role: "broker",
          senderName: "Nguyễn Nam (GDTG Broker)",
          text: "GDTG Nguyễn Nam đã tiếp nhận đối soát. Sẵn sàng phê duyệt giải ngân ngay khi Bên Mua kiểm tra xác nhận.",
          timestamp: "10:25",
          createdAt: Date.now() - 900000,
        },
      ],
    },
    handovers: {
      "101": {
        pactId: "101",
        assetTitle: "Bàn giao tài sản số & tài khoản OTC theo thỏa thuận",
        proofUrl: "https://testnet.snowtrace.io/tx/0x44b1928019a84f",
        notes: "Đã bàn giao đầy đủ quyền sở hữu tài sản cho Bên Mua qua kênh bảo mật.",
        isHandedOver: true,
        handedOverAt: "10:22",
        updatedAt: Date.now() - 1200000,
      },
    },
    scams: [
      {
        id: "scam-1",
        identifier: "1903889922101",
        bankName: "Techcombank",
        type: "Tài khoản ngân hàng",
        reason: "Giả mạo GDTG Telegram trung gian chiếm đoạt 1,200 USDC giao dịch P2P",
        victimLoss: "1,200 USDC (~30.5 Triệu VNĐ)",
        reportsCount: 5,
        isVerified: true,
        timestamp: "2026-10-18 14:22",
      },
      {
        id: "scam-2",
        identifier: "0451000399482",
        bankName: "Vietcombank",
        type: "Tài khoản ngân hàng",
        reason: "Nhận cọc mua USDT rồi cắt đứt liên lạc, chặn Telegram nạn nhân",
        victimLoss: "500 USDC (~12.7 Triệu VNĐ)",
        reportsCount: 3,
        isVerified: true,
        timestamp: "2026-10-19 09:15",
      },
      {
        id: "scam-3",
        identifier: "@hoangminh_otc_fake",
        type: "Username Telegram",
        reason: "Fake nick GDTG Hoàng Minh (thay chữ l bằng chữ I hoa) để lừa nhận cọc",
        victimLoss: "2,500 USDC (~63.5 Triệu VNĐ)",
        reportsCount: 8,
        isVerified: true,
        timestamp: "2026-10-20 16:40",
      },
      {
        id: "scam-4",
        identifier: "0x71C836000000000000000000000000000000BEEF",
        type: "Địa chỉ ví Web3",
        reason: "Địa chỉ ví phát tán mã độc Phishing Drainer qua bot Telegram giả",
        victimLoss: "14,800 USDC",
        reportsCount: 12,
        isVerified: true,
        timestamp: "2026-10-21 11:05",
      },
    ],
  };
}

export function readDB(): DBStore {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getDefaultData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Lỗi đọc cơ sở dữ liệu TrustPact Store:", err);
    return getDefaultData();
  }
}

export function writeDB(data: DBStore): boolean {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Lỗi ghi cơ sở dữ liệu TrustPact Store:", err);
    return false;
  }
}
