import fs from "fs";
import path from "path";
import { SEED_SCAM_DATABASE } from "../../data/seedScamDatabase";

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

const IS_VERCEL = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_DIR = IS_VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "trustpact_store.json");

// In-memory global fallback to survive serverless read-only restrictions
declare global {
  // eslint-disable-next-line no-var
  var __trustpact_memory_store: DBStore | undefined;
}

function getDefaultData(): DBStore {
  return {
    pacts: {
      "4": {
        id: "4",
        onChainId: 4,
        txHash: "0xed2752b20b3e0764c5f4ee3d2192376c345ad2fda649b14534cef408210e97f6",
        buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
        seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
        broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
        amount: "6",
        brokerFeeBps: 150,
        duration: 172800,
        startTime: Math.floor(Date.now() / 1000) - 900,
        status: 0,
        updatedAt: Date.now(),
      },
      "1": {
        id: "1",
        onChainId: 1,
        txHash: "0xf8d5803029a3ea235975786f34b22cd95b5ce28950f237ac724f682c37c35047",
        buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
        seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
        broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
        amount: "5",
        brokerFeeBps: 150,
        duration: 86400,
        startTime: Math.floor(Date.now() / 1000) - 3600,
        status: 1,
        updatedAt: Date.now() - 1800000,
      },
      "2": {
        id: "2",
        onChainId: 2,
        txHash: "0xd5fe068de27d8f7777952fd28f77f2867af6feddeb8e07916810e2e0e13524e7",
        buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
        seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
        broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
        amount: "3",
        brokerFeeBps: 150,
        duration: 86400,
        startTime: Math.floor(Date.now() / 1000) - 2400,
        status: 2,
        updatedAt: Date.now() - 1200000,
      },
      "3": {
        id: "3",
        onChainId: 3,
        txHash: "0x523202e9d8ce3ba5bfa3b1ade75f4aa5fd7a6894720bb8e46716c33ea2fe151d",
        buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
        seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
        broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
        amount: "4",
        brokerFeeBps: 150,
        duration: 86400,
        startTime: Math.floor(Date.now() / 1000) - 1800,
        status: 1,
        updatedAt: Date.now() - 600000,
      },
      "101": {
        id: "101",
        onChainId: 4,
        txHash: "0xed2752b20b3e0764c5f4ee3d2192376c345ad2fda649b14534cef408210e97f6",
        buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
        seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
        broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
        amount: "6",
        brokerFeeBps: 150,
        duration: 86400,
        startTime: Math.floor(Date.now() / 1000) - 1800,
        status: 0,
        updatedAt: Date.now(),
      },
    },
    messages: {
      "4": [
        {
          id: "msg-4-0",
          pactId: "4",
          sender: "0xEe86802fA1e1098797c2980D9E1D73175f35Dd22",
          role: "system",
          senderName: "Hệ Thống UniversalEscrow (Avalanche Fuji)",
          text: "Hợp đồng ký quỹ #4 đã khóa an toàn 6.00 USDC vào Két Sắt on-chain (Tx: 0xed2752b2...0e97f6). GDTG Nguyễn Nam đã phong tỏa hạn mức cọc bảo chứng Aave V3.",
          timestamp: "10:14",
          createdAt: Date.now() - 1800000,
        },
        {
          id: "msg-4-1",
          pactId: "4",
          sender: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
          role: "buyer",
          senderName: "Lê Minh Tuấn (Bên Mua)",
          text: "Tôi đã nạp đủ USDC vào Két Sắt Smart Contract. Mời Bên Bán tiến hành bàn giao tài sản số.",
          timestamp: "10:15",
          createdAt: Date.now() - 1700000,
        },
        {
          id: "msg-4-2",
          pactId: "4",
          sender: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
          role: "seller",
          senderName: "Hoàng Minh (Bên Bán)",
          text: "Đã chuyển giao thông tin tài khoản và gửi chứng từ bàn giao lên phòng ký quỹ để Bên Mua và GDTG đối soát.",
          timestamp: "10:22",
          isProof: true,
          proofUrl: "https://testnet.snowtrace.io/tx/0xed2752b20b3e0764c5f4ee3d2192376c345ad2fda649b14534cef408210e97f6",
          createdAt: Date.now() - 1200000,
        },
        {
          id: "msg-4-3",
          pactId: "4",
          sender: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
          role: "broker",
          senderName: "Nguyễn Nam (GDTG Broker)",
          text: "GDTG Nguyễn Nam đã tiếp nhận đối soát. Sẵn sàng phê duyệt giải ngân 2 bước ngay khi Bên Mua kiểm tra xác nhận.",
          timestamp: "10:25",
          createdAt: Date.now() - 900000,
        },
      ],
      "101": [
        {
          id: "msg-0",
          pactId: "101",
          sender: "0xEe86802fA1e1098797c2980D9E1D73175f35Dd22",
          role: "system",
          senderName: "Hệ Thống UniversalEscrow (Avalanche Fuji)",
          text: "Hợp đồng ký quỹ #101 (liên kết Kèo #4 trên Fuji) đã khóa an toàn 6.00 USDC vào Két Sắt on-chain. GDTG đã phong tỏa hạn mức cọc bảo chứng.",
          timestamp: "10:14",
          createdAt: Date.now() - 1800000,
        },
        {
          id: "msg-1",
          pactId: "101",
          sender: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
          role: "buyer",
          senderName: "Lê Minh Tuấn (Bên Mua)",
          text: "Tôi đã nạp đủ 6.00 USDC vào Két Sắt Smart Contract. Mời Bên Bán tiến hành bàn giao tài sản số.",
          timestamp: "10:15",
          createdAt: Date.now() - 1700000,
        },
        {
          id: "msg-2",
          pactId: "101",
          sender: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
          role: "seller",
          senderName: "Hoàng Minh (Bên Bán)",
          text: "Đã chuyển giao thông tin tài khoản và gửi chứng từ bàn giao lên phòng ký quỹ để Bên Mua và GDTG đối soát.",
          timestamp: "10:22",
          isProof: true,
          proofUrl: "https://testnet.snowtrace.io/tx/0xed2752b20b3e0764c5f4ee3d2192376c345ad2fda649b14534cef408210e97f6",
          createdAt: Date.now() - 1200000,
        },
        {
          id: "msg-3",
          pactId: "101",
          sender: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
          role: "broker",
          senderName: "Nguyễn Nam (GDTG Broker)",
          text: "GDTG Nguyễn Nam đã tiếp nhận đối soát. Sẵn sàng phê duyệt giải ngân ngay khi Bên Mua kiểm tra xác nhận.",
          timestamp: "10:25",
          createdAt: Date.now() - 900000,
        },
      ],
    },
    handovers: {
      "4": {
        pactId: "4",
        assetTitle: "Bàn giao tài sản số & tài khoản OTC theo thỏa thuận",
        proofUrl: "https://testnet.snowtrace.io/tx/0xed2752b20b3e0764c5f4ee3d2192376c345ad2fda649b14534cef408210e97f6",
        notes: "Đã bàn giao đầy đủ quyền sở hữu tài sản cho Bên Mua qua kênh bảo mật.",
        isHandedOver: true,
        handedOverAt: "10:22",
        updatedAt: Date.now() - 1200000,
      },
      "101": {
        pactId: "101",
        assetTitle: "Bàn giao tài sản số & tài khoản OTC theo thỏa thuận",
        proofUrl: "https://testnet.snowtrace.io/tx/0xed2752b20b3e0764c5f4ee3d2192376c345ad2fda649b14534cef408210e97f6",
        notes: "Đã bàn giao đầy đủ quyền sở hữu tài sản cho Bên Mua qua kênh bảo mật.",
        isHandedOver: true,
        handedOverAt: "10:22",
        updatedAt: Date.now() - 1200000,
      },
    },
    scams: SEED_SCAM_DATABASE.map((s, idx) => ({
      id: `scam-seed-${idx + 1}`,
      identifier: s.target,
      bankName: s.type === "bank" ? s.bankName : undefined,
      type:
        s.type === "bank"
          ? "Tài khoản ngân hàng"
          : s.type === "telegram"
          ? "Username Telegram"
          : s.type === "phone"
          ? "Số điện thoại / Ví điện tử"
          : "Địa chỉ ví Web3",
      reason: `${s.description} [Xác thực bởi: ${s.verifiedBy}]`,
      victimLoss: s.amountLoss,
      reportsCount: s.flagsCount,
      isVerified: s.status === "VERIFIED",
      evidenceUrl: s.evidenceIpfs,
      timestamp: "2026-11-18 20:00",
    })),
  };
}

export function readDB(): DBStore {
  if (globalThis.__trustpact_memory_store) {
    return globalThis.__trustpact_memory_store;
  }

  try {
    if (!fs.existsSync(DB_DIR)) {
      try {
        fs.mkdirSync(DB_DIR, { recursive: true });
      } catch {}
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getDefaultData();
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      } catch {}
      globalThis.__trustpact_memory_store = initial;
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    globalThis.__trustpact_memory_store = parsed;
    return parsed;
  } catch (err) {
    console.warn("Using in-memory store for TrustPact DB (serverless safe mode):", err);
    const initial = getDefaultData();
    globalThis.__trustpact_memory_store = initial;
    return initial;
  }
}

export function writeDB(data: DBStore): boolean {
  globalThis.__trustpact_memory_store = data;
  try {
    if (!fs.existsSync(DB_DIR)) {
      try {
        fs.mkdirSync(DB_DIR, { recursive: true });
      } catch {}
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.warn("Filesystem write skipped in serverless environment; persisted in-memory:", err);
    return true;
  }
}
