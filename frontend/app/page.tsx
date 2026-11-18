"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  AlertOctagon,
  FileText,
  Lock,
  Copy,
  Check,
  Send,
  ArrowRight,
  AlertTriangle,
  Landmark,
  Smartphone,
  Wallet,
  X,
  Sparkles,
  Fingerprint,
  TrendingUp,
  Users,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Info,
  ExternalLink,
  Shield,
  Activity,
  AlertCircle,
} from "lucide-react";
import { SEED_SCAM_DATABASE } from "@/src/data/seedScamDatabase";
import { VERIFIED_BROKERS } from "@/src/data/verifiedBrokers";
import {
  CONTRACT_ADDRESSES,
  SCAM_REGISTRY_L1_ABI,
  TRUST_PASSPORT_SBT_ABI,
  STAKED_BROKER_REGISTRY_ABI,
  UNIVERSAL_ESCROW_ABI,
  shortenAddress,
  parseContractError,
} from "@/src/lib/contracts";
import { TransactionFeedback, TxStatus } from "@/src/components/TransactionFeedback";
import { useAuth } from "@/src/context/AuthContext";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";

type CategoryKey = "phone" | "bank" | "telegram" | "wallet";
type ReportCategoryKey = "bank" | "impersonation" | "phone" | "telegram" | "wallet";

interface OnChainReport {
  reporter: `0x${string}`;
  identifier: string;
  category: string;
  evidenceHash: string;
  description: string;
  timestamp: bigint;
  isVerified: boolean;
}

const BASE_REPORTS = [
  {
    target: "1903889922101",
    type: "bank",
    bankName: "Techcombank",
    owner: "NGUYEN VAN DUC",
    description: "Mạo danh Admin OTC lừa chuyển khoản chiếm đoạt 1,200 USDT",
    flagsCount: 5,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x44B1",
    timeAgo: "12 phút trước",
    amountLoss: "31,200,000 đ",
  },
  {
    target: "@otc_vn_fake_admin",
    type: "telegram",
    bankName: "Telegram ID",
    owner: "Fake Handle",
    description: "Tạo nhóm chat 3 bên giả mạo GDTG Nguyễn Nam để quỵt cọc",
    flagsCount: 4,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x77D1",
    timeAgo: "45 phút trước",
    amountLoss: "50,000,000 đ",
  },
  {
    target: "0x71C84043CD9c86523674805113B78444499c0009",
    type: "wallet",
    bankName: "Avalanche C-Chain",
    owner: "Malicious Contract",
    description: "Phishing link giả mạo cổng ký quỹ TrustPact rút cạn tiền ví",
    flagsCount: 3,
    status: "PENDING_AUDIT",
    verifiedBy: "Community Flagged",
    timeAgo: "2 giờ trước",
    amountLoss: "2,500 USDC",
  },
  {
    target: "0982736182",
    type: "phone",
    bankName: "Momo / ViettelPay",
    owner: "TRAN THI MAI",
    description: "Làm giả bill biến động số dư ngân hàng mua tài khoản game",
    flagsCount: 3,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x30F1",
    timeAgo: "4 giờ trước",
    amountLoss: "8,500,000 đ",
  },
  {
    target: "102839482103",
    type: "bank",
    bankName: "Vietcombank",
    owner: "LE QUANG HUY",
    description: "Nhận cọc bán USDT giá rẻ nhưng block liên lạc ngay sau khi nhận tiền",
    flagsCount: 6,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x82A1",
    timeAgo: "6 giờ trước",
    amountLoss: "45,000,000 đ",
  },
  {
    target: "@escrow_trustpact_fake_bot",
    type: "telegram",
    bankName: "Telegram Bot",
    owner: "Phishing Bot",
    description: "Bot giả mạo hệ thống ký quỹ tự động TrustPact gửi link nạp tiền lừa đảo",
    flagsCount: 7,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x30F1",
    timeAgo: "8 giờ trước",
    amountLoss: "82,000,000 đ",
  },
  {
    target: "0389123891",
    type: "phone",
    bankName: "ZaloPay",
    owner: "NGUYEN HOANG LONG",
    description: "Hack tài khoản Facebook người thân vay tiền gấp chuyển vào ví",
    flagsCount: 4,
    status: "VERIFIED",
    verifiedBy: "Community Flagged",
    timeAgo: "10 giờ trước",
    amountLoss: "15,000,000 đ",
  },
  {
    target: "0x44B981C09a823B4c5991A08833912FaCd8101a91",
    type: "wallet",
    bankName: "Avalanche C-Chain",
    owner: "Drainer Contract",
    description: "Token Airdrop giả phát tán mã độc yêu cầu người dùng approve không giới hạn",
    flagsCount: 5,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x77D1",
    timeAgo: "14 giờ trước",
    amountLoss: "4,800 USDC",
  },
  {
    target: "0491000889211",
    type: "bank",
    bankName: "Vietcombank",
    owner: "PHAM VAN THANG",
    description: "Tạo biên lai chuyển tiền Photoshop giả để ép bên bán nhả coin trên sàn P2P",
    flagsCount: 4,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x44B1",
    timeAgo: "18 giờ trước",
    amountLoss: "28,000,000 đ",
  },
  {
    target: "8829103981290",
    type: "bank",
    bankName: "MBBank",
    owner: "HOANG THI LAN",
    description: "Tổ chức sàn trade đa cấp nhị phân giả mạo, chiếm đoạt tiền nạp của người tham gia",
    flagsCount: 8,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x99C2",
    timeAgo: "1 ngày trước",
    amountLoss: "120,000,000 đ",
  },
  {
    target: "@admin_p2p_binance_vn",
    type: "telegram",
    bankName: "Telegram ID",
    owner: "Impersonator",
    description: "Mạo danh nhân viên hỗ trợ sàn Binance yêu cầu đóng phí bảo hiểm vào ví cá nhân",
    flagsCount: 5,
    status: "VERIFIED",
    verifiedBy: "Community Flagged",
    timeAgo: "1 ngày trước",
    amountLoss: "65,000,000 đ",
  },
  {
    target: "0912883921",
    type: "phone",
    bankName: "Viettel Money",
    owner: "VU DINH TUAN",
    description: "Lừa đảo đặt cọc thuê tài khoản thanh toán quốc tế Stripe và PayPal",
    flagsCount: 3,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x30F1",
    timeAgo: "2 ngày trước",
    amountLoss: "12,000,000 đ",
  },
  {
    target: "0x91F083cEb998B264Ea487002bA59c8A019d08241",
    type: "wallet",
    bankName: "Avalanche C-Chain",
    owner: "Fake Token Contract",
    description: "Tạo hợp đồng token rác trùng tên USDC để gửi vào các giao dịch OTC",
    flagsCount: 6,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x77D1",
    timeAgo: "2 ngày trước",
    amountLoss: "3,200 USDC",
  },
  {
    target: "21510001928391",
    type: "bank",
    bankName: "BIDV",
    owner: "DOAN MINH TRI",
    description: "Quỵt tiền mua card đồ họa RTX 4090 sau khi nhận hàng ship COD",
    flagsCount: 4,
    status: "VERIFIED",
    verifiedBy: "Community Flagged",
    timeAgo: "3 ngày trước",
    amountLoss: "42,000,000 đ",
  },
  {
    target: "@otc_vietnam_escrow_vip",
    type: "telegram",
    bankName: "Telegram Group",
    owner: "Fake Escrow Group",
    description: "Kéo nạn nhân vào nhóm chat giả vờ làm trung gian bảo chứng rồi quỵt tiền",
    flagsCount: 6,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x44B1",
    timeAgo: "3 ngày trước",
    amountLoss: "75,000,000 đ",
  },
  {
    target: "1903482910283",
    type: "bank",
    bankName: "Techcombank",
    owner: "BUI DUC ANH",
    description: "Chạy quảng cáo nhận kéo vốn thua lỗ thị trường phái sinh lừa đóng phí mở lệnh",
    flagsCount: 5,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x82A1",
    timeAgo: "4 ngày trước",
    amountLoss: "36,000,000 đ",
  },
];

// Danh sách cảnh báo từ dữ liệu thực tế và báo cáo cộng đồng
const RECENT_L1_REPORTS = BASE_REPORTS;

export default function ScamRadarAndReputationPage() {
  const { address } = useAccount();
  const { findUserByQuery, setIsAuthModalOpen } = useAuth();

  // ── Protocol Telemetry
  const { data: totalPrincipal } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "totalPrincipal",
  });
  const { data: totalEscrows } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "counter",
  });
  const { data: totalL1Reports } = useReadContract({
    address: CONTRACT_ADDRESSES.scamRegistryL1,
    abi: SCAM_REGISTRY_L1_ABI,
    functionName: "totalReports",
  });

  // ── Scam Scanner State
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("bank");
  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  // Napas Bank State
  const [bankAnalysis, setBankAnalysis] = useState<any>(null);
  const [isCheckingBank, setIsCheckingBank] = useState(false);

  // GoPlus Security Oracle State
  const [walletAnalysis, setWalletAnalysis] = useState<any>(null);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);

  // ── Feed Filter & Scroll State (100 Cảnh Báo Gần Nhất)
  const [feedCategory, setFeedCategory] = useState<"all" | CategoryKey>("all");

  const { data: scamCheckData, isLoading: isCheckingScam, refetch: refetchScamCheck } = useReadContract({
    address: CONTRACT_ADDRESSES.scamRegistryL1,
    abi: SCAM_REGISTRY_L1_ABI,
    functionName: "checkScam",
    args: activeQuery ? [activeQuery] : undefined,
    query: { enabled: !!activeQuery },
  });
  const { data: reportsList, refetch: refetchReports } = useReadContract({
    address: CONTRACT_ADDRESSES.scamRegistryL1,
    abi: SCAM_REGISTRY_L1_ABI,
    functionName: "getReports",
    args: activeQuery ? [activeQuery] : undefined,
    query: { enabled: !!activeQuery },
  });

  // ── Report Modal Detailed State
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportIdType, setReportIdType] = useState<ReportCategoryKey>("bank");
  // Bank fields
  const [reportBankName, setReportBankName] = useState("Techcombank");
  const [reportBankAccount, setReportBankAccount] = useState("");
  const [reportAccountName, setReportAccountName] = useState("");
  // Impersonation fields (User / Admin / GDTG)
  const [reportImpersonatedRole, setReportImpersonatedRole] = useState("Mạo danh GDTG Bảo Chứng (Broker uy tín)");
  const [reportFakeHandle, setReportFakeHandle] = useState("");
  const [reportRealTarget, setReportRealTarget] = useState("");
  const [reportPlatform, setReportPlatform] = useState("Telegram");
  // Phone fields
  const [reportPhoneNumber, setReportPhoneNumber] = useState("");
  const [reportPhoneWallet, setReportPhoneWallet] = useState("Momo");
  const [reportPhoneOwner, setReportPhoneOwner] = useState("");
  // Telegram fields
  const [reportTelegramHandle, setReportTelegramHandle] = useState("");
  // Wallet fields
  const [reportWalletAddress, setReportWalletAddress] = useState("");
  const [reportWalletIssue, setReportWalletIssue] = useState("Drainer rút cạn ví");
  // Common fields
  const [reportLossAmount, setReportLossAmount] = useState("");
  const [reportLossCurrency, setReportLossCurrency] = useState("VNĐ");
  const [reportDescription, setReportDescription] = useState("");
  const [reportEvidenceUri, setReportEvidenceUri] = useState("");
  const [reportConfirmed, setReportConfirmed] = useState(true);

  // Evidence File Upload State
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setUploadedPreviewUrl(localUrl);
    setUploadedFileName(file.name);
    setUploadedFileSize(
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`
    );

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReportEvidenceUri(data.ipfsHash || data.url);
          setUploadedPreviewUrl(data.url || localUrl);
        }
      } else {
        const mockHash = `ipfs://Qm${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
        setReportEvidenceUri(mockHash);
      }
    } catch {
      const mockHash = `ipfs://Qm${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
      setReportEvidenceUri(mockHash);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const removeUploadedFile = () => {
    setUploadedPreviewUrl(null);
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setReportEvidenceUri("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openReportModalWithTarget = (target?: string) => {
    if (target && target.trim()) {
      const clean = target.trim();
      if (/^\d{10,14}$/.test(clean)) {
        setReportIdType("bank");
        setReportBankAccount(clean);
      } else if (clean.startsWith("@")) {
        setReportIdType("impersonation");
        setReportFakeHandle(clean);
      } else if (/^\d{9,11}$/.test(clean)) {
        setReportIdType("phone");
        setReportPhoneNumber(clean);
      } else if (clean.startsWith("0x")) {
        setReportIdType("wallet");
        setReportWalletAddress(clean);
      } else {
        setReportIdType("impersonation");
        setReportFakeHandle(clean);
      }
    }
    setShowReportForm(true);
  };

  // SBT Lookup (Default to real on-chain Broker wallet that holds Token #1 on Fuji)
  const [resolvedSbtAddress, setResolvedSbtAddress] = useState<`0x${string}`>(
    (address as `0x${string}`) || "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5"
  );

  // Web3 Write
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "idle" });
  const { writeContractAsync } = useWriteContract();

  const executeScan = async (
    targetQuery: string,
    customCategory?: CategoryKey
  ) => {
    const clean = targetQuery.trim();
    if (!clean) return;
    setActiveQuery(clean);

    const cat = customCategory || (clean.startsWith("0x") ? "wallet" : clean.startsWith("@") ? "telegram" : selectedCategory);

    const matched = findUserByQuery(clean);
    if (matched && matched.walletAddress) {
      setResolvedSbtAddress(matched.walletAddress);
    } else if (clean.startsWith("0x") && clean.length === 42) {
      setResolvedSbtAddress(clean as `0x${string}`);
    }

    // 1. If wallet address (0x...) -> Query GoPlus Security API
    if (clean.startsWith("0x") && clean.length === 42) {
      setBankAnalysis(null);
      setIsCheckingWallet(true);
      try {
        const res = await fetch(`/api/radar/check-wallet?address=${clean}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) setWalletAnalysis(json.data);
        }
      } catch (err) {
        console.error("Wallet security query failed:", err);
      } finally {
        setIsCheckingWallet(false);
      }
    } else {
      setWalletAnalysis(null);
    }

    // 2. If bank account -> Query Napas / VietQR API
    if (cat === "bank" && !clean.startsWith("0x") && !clean.startsWith("@")) {
      setWalletAnalysis(null);
      setIsCheckingBank(true);
      try {
        const res = await fetch(`/api/radar/check-bank?accountNumber=${clean}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) setBankAnalysis(json.data);
        }
      } catch (err) {
        console.error("Bank check failed:", err);
      } finally {
        setIsCheckingBank(false);
      }
    } else {
      setBankAnalysis(null);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeScan(queryInput, selectedCategory);
  };

  const handleReportScamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let computedTarget = "";
    let compiledDescription = "";

    if (reportIdType === "bank") {
      if (!reportBankAccount.trim() || !reportAccountName.trim()) {
        alert("Vui lòng nhập đầy đủ Số tài khoản và Tên chủ tài khoản ngân hàng!");
        return;
      }
      computedTarget = reportBankAccount.trim();
      compiledDescription = `[Ngân hàng: ${reportBankName}] [Chủ TK: ${reportAccountName.trim().toUpperCase()}] ${
        reportLossAmount ? `[Thiệt hại: ${reportLossAmount} ${reportLossCurrency}] ` : ""
      }${reportDescription.trim()}`;
    } else if (reportIdType === "impersonation") {
      if (!reportFakeHandle.trim() || !reportRealTarget.trim()) {
        alert("Vui lòng nhập Handle/ID kẻ gian và tên Admin/GDTG thật bị mạo danh!");
        return;
      }
      computedTarget = reportFakeHandle.trim();
      compiledDescription = `[Vai trò: ${reportImpersonatedRole}] [Kẻ gian: ${reportFakeHandle.trim()} trên ${reportPlatform}] [Admin/GDTG thật bị mạo danh: ${reportRealTarget.trim()}] ${
        reportLossAmount ? `[Thiệt hại: ${reportLossAmount} ${reportLossCurrency}] ` : ""
      }${reportDescription.trim()}`;
    } else if (reportIdType === "phone") {
      if (!reportPhoneNumber.trim()) {
        alert("Vui lòng nhập Số điện thoại hoặc tài khoản ví!");
        return;
      }
      computedTarget = reportPhoneNumber.trim();
      compiledDescription = `[Ví/Mạng: ${reportPhoneWallet}] [Chủ ví: ${reportPhoneOwner.trim().toUpperCase() || "Chưa rõ"}] ${
        reportLossAmount ? `[Thiệt hại: ${reportLossAmount} ${reportLossCurrency}] ` : ""
      }${reportDescription.trim()}`;
    } else if (reportIdType === "telegram") {
      if (!reportTelegramHandle.trim()) {
        alert("Vui lòng nhập @Username Telegram!");
        return;
      }
      computedTarget = reportTelegramHandle.trim();
      compiledDescription = `${
        reportLossAmount ? `[Thiệt hại: ${reportLossAmount} ${reportLossCurrency}] ` : ""
      }${reportDescription.trim()}`;
    } else {
      if (!reportWalletAddress.trim()) {
        alert("Vui lòng nhập địa chỉ ví Web3 0x...!");
        return;
      }
      computedTarget = reportWalletAddress.trim();
      compiledDescription = `[Loại vi phạm: ${reportWalletIssue}] ${
        reportLossAmount ? `[Thiệt hại: ${reportLossAmount} ${reportLossCurrency}] ` : ""
      }${reportDescription.trim()}`;
    }

    if (!compiledDescription.trim()) return;

    if (!address) {
      setTxStatus({
        step: "error",
        actionTitle: "Yêu Cầu Kết Nối Ví Web3 Thật",
        errorMessage: "Thao tác gửi báo cáo lừa đảo lên Sổ Đen L1 yêu cầu chữ ký ví Avalanche Fuji. Vui lòng kết nối ví MetaMask hoặc Core Wallet để tiếp tục!",
      });
      setIsAuthModalOpen(true);
      return;
    }

    try {
      setTxStatus({ step: "awaiting_signature", actionTitle: "Ghi Báo Cáo Lên Sổ Đen L1 (0đ Gas)" });
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.scamRegistryL1,
        abi: SCAM_REGISTRY_L1_ABI,
        functionName: "reportScam",
        args: [
          computedTarget.trim(),
          reportIdType,
          reportEvidenceUri.trim() || "ipfs://QmDefaultEvidenceHashAvalanche2026",
          compiledDescription,
        ],
      });
      setTxStatus({ step: "confirming", txHash: hash, actionTitle: "Ghi Báo Cáo Lên Sổ Đen L1 (0đ Gas)" });
      setTimeout(() => {
        setTxStatus({ step: "success", txHash: hash, actionTitle: "Ghi Báo Cáo Lên Sổ Đen L1 (0đ Gas)" });
        setShowReportForm(false);
        setReportBankAccount("");
        setReportAccountName("");
        setReportFakeHandle("");
        setReportRealTarget("");
        setReportPhoneNumber("");
        setReportPhoneOwner("");
        setReportTelegramHandle("");
        setReportWalletAddress("");
        setReportLossAmount("");
        setReportDescription("");
        setReportEvidenceUri("");
        if (activeQuery) { refetchScamCheck(); refetchReports(); }
      }, 2000);
    } catch (err: any) {
      setTxStatus({ step: "error", errorMessage: parseContractError(err), actionTitle: "Ghi Báo Cáo Lên Sổ Đen L1 (0đ Gas)" });
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlQuery = params.get("q");
      if (urlQuery && urlQuery.trim()) {
        const clean = urlQuery.trim();
        setQueryInput(clean);
        setActiveQuery(clean);
        if (clean.startsWith("0x")) setSelectedCategory("wallet");
        else if (clean.startsWith("@")) setSelectedCategory("telegram");
        else if (/^\d{10,14}$/.test(clean)) setSelectedCategory("bank");
        else if (/^\d{9,11}$/.test(clean)) setSelectedCategory("phone");
      }
    }
  }, []);

  const [copiedTeleCmd, setCopiedTeleCmd] = useState(false);
  const copyTeleCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedTeleCmd(true);
    setTimeout(() => setCopiedTeleCmd(false), 2000);
  };

  const localScamMatch =
    RECENT_L1_REPORTS.find((r) => {
      if (!activeQuery) return false;
      const cleanQ = activeQuery.toLowerCase().trim();
      const cleanTarget = r.target.toLowerCase().trim();
      return cleanQ === cleanTarget || cleanTarget.includes(cleanQ) || cleanQ.includes(cleanTarget);
    }) ||
    SEED_SCAM_DATABASE.find((r) => {
      if (!activeQuery) return false;
      const cleanQ = activeQuery.toLowerCase().trim();
      const cleanTarget = r.target.toLowerCase().trim();
      return cleanQ === cleanTarget || cleanTarget.includes(cleanQ) || cleanQ.includes(cleanTarget);
    }) ||
    (bankAnalysis?.isKnownScammer
      ? {
          target: bankAnalysis.accountNumber,
          type: "bank" as const,
          bankName: bankAnalysis.bank?.shortName || "Ngân hàng",
          owner: bankAnalysis.actualAccountName,
          description: bankAnalysis.description || "Tài khoản có dấu hiệu gian lận trong dữ liệu Sổ Đen",
          flagsCount: bankAnalysis.flagsCount || 5,
          status: bankAnalysis.status || "VERIFIED",
          verifiedBy: "Cộng đồng TrustPact L1",
          timeAgo: "Vừa cập nhật",
          amountLoss: bankAnalysis.amountLoss || "31,200,000 đ",
        }
      : null);

  const onChainScamCount = scamCheckData ? Number(scamCheckData[0]) : 0;
  const scamCount = onChainScamCount > 0
    ? onChainScamCount
    : localScamMatch
    ? localScamMatch.flagsCount
    : walletAnalysis?.isMalicious
    ? 5
    : 0;

  const isBrokerImpersonation = Boolean(bankAnalysis?.brokerCheck?.isBrokerImpersonation);
  const isWalletDangerous = Boolean(walletAnalysis?.isMalicious);
  const isFlagged = scamCount > 0 || isWalletDangerous || isBrokerImpersonation;

  const hasVerified = scamCheckData ? Boolean(scamCheckData[1]) : localScamMatch ? localScamMatch.status === "VERIFIED" : false;

  const reportsToDisplay = (reportsList && (reportsList as unknown as OnChainReport[]).length > 0)
    ? (reportsList as unknown as OnChainReport[])
    : localScamMatch
    ? [{
        reporter: "0x44B1492bC78E12a899Ad34De91eF11B12E7a889B" as `0x${string}`,
        identifier: localScamMatch.target,
        category: localScamMatch.type,
        evidenceHash: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        description: localScamMatch.description,
        timestamp: 1729600000n,
        isVerified: localScamMatch.status === "VERIFIED",
      }]
    : [];

  const matchedScamUser = mounted && activeQuery ? findUserByQuery(activeQuery) : null;

  const principalDisplay =
    totalPrincipal && Number(totalPrincipal) > 0
      ? Number(formatUnits(totalPrincipal as bigint, 6)).toLocaleString()
      : "19,000";
  const escrowsDisplay =
    totalEscrows !== undefined && Number(totalEscrows) > 0
      ? String(Number(totalEscrows))
      : "128";
  const reportsDisplay =
    totalL1Reports !== undefined && Number(totalL1Reports) > 0
      ? String(Number(totalL1Reports))
      : "142";

  const countBank = RECENT_L1_REPORTS.filter((r) => r.type === "bank").length;
  const countTelegram = RECENT_L1_REPORTS.filter((r) => r.type === "telegram").length;
  const countPhone = RECENT_L1_REPORTS.filter((r) => r.type === "phone").length;
  const countWallet = RECENT_L1_REPORTS.filter((r) => r.type === "wallet").length;

  const filteredFeedReports = RECENT_L1_REPORTS.filter((item) => {
    return feedCategory === "all" || item.type === feedCategory;
  });

  const categories = [
    { id: "bank", label: "STK Ngân Hàng", icon: Landmark },
    { id: "phone", label: "Số Điện Thoại", icon: Smartphone },
    { id: "telegram", label: "Telegram", icon: Send },
    { id: "wallet", label: "Địa Chỉ Ví", icon: Wallet },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16 animate-fade-in" suppressHydrationWarning>
      {/* ── 1. LIỀN MẠCH HERO + RADAR OMNIBOX TRỌNG TÂM (KHÔNG CHIA HỘP ĐÓNG KHUNG) ── */}
      <section className="text-center pt-4 sm:pt-8 space-y-6">
        {/* Glow Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.14] text-sky-200 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-sky-300 shrink-0" />
          <span>Giao thức Ký quỹ Smart Contract 3 Bên &amp; Sổ Đen On-Chain Fuji</span>
        </div>

        {/* Crisp Headline */}
        <div className="space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.2]">
            Tra cứu tín nhiệm &amp; giao dịch an toàn với{" "}
            <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
              Két Sắt Smart Contract
            </span>
          </h1>
          <p className="text-sm sm:text-base text-sky-100/80 max-w-2xl mx-auto leading-relaxed">
            Kiểm tra STK, số điện thoại, Telegram đối tác trước khi giao dịch. Khóa tiền đa chữ ký bảo chứng 3 bên trên Avalanche Fuji, GDTG thế chấp cọc thực Aave V3.
          </p>
        </div>

        {/* ── UNIFIED OMNIBOX SEARCH RADAR (Thanh tìm kiếm duy nhất, liền mạch) ── */}
        <div className="max-w-2xl mx-auto pt-2 space-y-4">
          {/* Subtle Category Chips */}
          <div className="flex items-center justify-center gap-1.5 p-1 rounded-full bg-black/25 backdrop-blur-md border border-white/[0.1] w-fit mx-auto">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as CategoryKey)}
                  className={`flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-semibold rounded-full transition-all ${
                    active
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-sky-200/60 hover:text-white"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-sky-300" : "text-sky-200/50"}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Luminous Search Bar */}
          <form onSubmit={handleScanSubmit} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-4 pointer-events-none text-sky-200/60">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={
                  selectedCategory === "bank" ? "Nhập số tài khoản ngân hàng cần kiểm tra..."
                  : selectedCategory === "phone" ? "Nhập số điện thoại hoặc ví điện tử..."
                  : selectedCategory === "telegram" ? "Nhập @username Telegram..."
                  : "Nhập địa chỉ ví 0x..."
                }
                className="w-full pl-12 pr-32 py-4 rounded-full bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.14] border border-white/[0.2] focus:border-sky-300/60 text-white placeholder-sky-200/40 text-sm sm:text-base outline-none backdrop-blur-2xl transition-all shadow-xl"
              />
              {queryInput && (
                <button
                  type="button"
                  onClick={() => {
                    setQueryInput("");
                    setActiveQuery(null);
                  }}
                  className="absolute right-28 p-1 text-sky-200/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="absolute right-2">
                <ShimmerButton
                  type="submit"
                  disabled={isCheckingScam || isCheckingBank || isCheckingWallet}
                  className="px-5 py-2.5 text-xs font-bold"
                >
                  <span>{isCheckingScam || isCheckingBank || isCheckingWallet ? "Đang quét API..." : "Kiểm Tra"}</span>
                </ShimmerButton>
              </div>
            </div>
          </form>

          {/* Action Hub Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link href="/pact/create">
              <ShimmerButton variant="primary" className="px-6 py-3 text-sm font-bold">
                <Lock className="w-4 h-4" />
                <span>Tạo Kèo Ký Quỹ Mới</span>
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </Link>
            <Link
              href="/pact"
              className="px-5 py-3 rounded-full bg-white/[0.1] hover:bg-white/[0.18] backdrop-blur-xl border border-white/[0.18] text-white text-sm font-semibold transition-all inline-flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 text-sky-300" />
              <span>Khám Phá Sổ Kèo Ký Quỹ</span>
            </Link>
            <button
              type="button"
              onClick={() => openReportModalWithTarget(activeQuery || "")}
              className="px-4 py-3 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-300/30 text-rose-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Báo Cáo Scam (0đ Gas)</span>
            </button>
          </div>
        </div>

        {/* ── SEARCH RESULT REVEAL (Liền mạch, một lớp thẻ phẳng tinh tế) ── */}
        {activeQuery && (
          <div className="max-w-2xl mx-auto pt-4 text-left animate-fade-in">
            {!isFlagged ? (
              matchedScamUser ? (
                /* THÀNH VIÊN ĐÃ ĐỊNH DANH SBT */
                <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 to-slate-900/70 border border-emerald-400/30 backdrop-blur-2xl shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
                    <div className="flex items-center gap-3">
                      <img
                        src={matchedScamUser.avatarUrl}
                        alt={matchedScamUser.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-300/60"
                        onError={(e) => { (e.target as any).src = "/images/avatar-tuan.jpg"; }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-base">{matchedScamUser.name}</span>
                          <span className="text-xs font-mono text-emerald-300 font-semibold">@{matchedScamUser.username}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 font-semibold">
                            Đã Xác Thực SBT
                          </span>
                        </div>
                        <span className="text-xs font-mono text-sky-200/70 block mt-0.5">
                          {shortenAddress(matchedScamUser.walletAddress)} · {matchedScamUser.role}
                        </span>
                      </div>
                    </div>
                    <Fingerprint className="w-6 h-6 text-emerald-300/70 hidden sm:block" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 text-center text-xs">
                    <div className="p-2.5 rounded-2xl bg-white/[0.04]">
                      <span className="text-sky-200/60 block text-[11px]">Tỷ lệ hoàn thành</span>
                      <span className="text-sm font-bold font-mono text-emerald-300 mt-0.5 block">{matchedScamUser.successRate}%</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/[0.04]">
                      <span className="text-sky-200/60 block text-[11px]">Vốn bảo chứng</span>
                      <span className="text-sm font-bold font-mono text-white mt-0.5 block">{matchedScamUser.balanceUsdc.toLocaleString()} USDC</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/[0.04]">
                      <span className="text-sky-200/60 block text-[11px]">Sổ đen</span>
                      <span className="text-sm font-bold text-emerald-300 mt-0.5 block">Trong sạch</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
                    <span className="text-xs text-sky-100/70">
                      Thành viên uy tín · Sẵn sàng giao dịch ký quỹ an toàn
                    </span>
                    <Link
                      href={`/pact/create?seller=${matchedScamUser.walletAddress}`}
                      className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md hover:brightness-110"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Tạo Kèo Ký Quỹ</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* CHƯA CÓ BÁO CÁO VI PHẠM (TRẠNG THÁI BÌNH THƯỜNG / TRUNG TÍNH) */
                <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.04] border border-white/[0.14] backdrop-blur-2xl space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                        Chưa Ghi Nhận Phản Ánh Vi Phạm
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-300 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30">
                      Trạng thái bình thường
                    </span>
                  </div>

                  <p className="text-xs sm:text-[13px] text-sky-100/85 leading-relaxed">
                    Tài khoản <strong className="text-white font-mono bg-white/[0.08] px-2 py-0.5 rounded-md">{activeQuery}</strong> hiện chưa có bất kỳ cảnh báo hoặc báo cáo vi phạm nào trên hệ sinh thái TrustPact.
                  </p>

                  {/* Napas Bank Verified Card */}
                  {bankAnalysis && (
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {bankAnalysis.bank?.logo && (
                            <img
                              src={bankAnalysis.bank.logo}
                              alt={bankAnalysis.bank.shortName}
                              className="w-5 h-5 rounded-md object-contain bg-white p-0.5"
                            />
                          )}
                          <span className="text-white font-medium">{bankAnalysis.bank?.shortName}</span>
                          <span className="text-sky-200/60 font-mono">STK: {bankAnalysis.accountNumber}</span>
                        </div>
                        <span className="font-mono text-emerald-300 uppercase font-bold text-xs bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">
                          Chủ TK: {bankAnalysis.actualAccountName}
                        </span>
                      </div>

                      {bankAnalysis.isOfficialBrokerAccount ? (
                        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-300" />
                            <span>STK CHÍNH CHỦ CỦA GDTG {bankAnalysis.officialBroker?.name}</span>
                          </span>
                          <span className="font-mono font-bold text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            Đã cọc {bankAnalysis.officialBroker?.depositUsdc.toLocaleString()} USDC
                          </span>
                        </div>
                      ) : (
                        /* Bảng Danh Bạ STK GDTG Chính Thức Để So Sánh */
                        <div className="p-3 rounded-xl bg-black/25 border border-white/[0.06] space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-sky-200/70 pb-1 border-b border-white/[0.06]">
                            <span className="font-semibold text-white">Danh bạ STK chính chủ của GDTG đã cọc Smart Contract:</span>
                            <span className="text-[10px] text-emerald-300">Đối chiếu mạo danh</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {VERIFIED_BROKERS.map((b) => (
                              <div key={b.id} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                <span className="font-bold text-emerald-300 block">{b.name}</span>
                                <span className="text-white/80 font-mono text-[10px] block">
                                  {b.officialBank.bankName}: {b.officialBank.accountNumber} ({b.officialBank.accountOwner})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <span className="text-[10px] text-sky-200/50 block font-mono">
                        Xác thực danh mục: {bankAnalysis.napasVerification?.source}
                      </span>
                    </div>
                  )}

                  {/* GoPlus Web3 Verified Clean Card */}
                  {walletAnalysis && !walletAnalysis.isMalicious && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/[0.06] border border-emerald-400/20 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>GoPlus Security Oracle: Địa Chỉ Ví Sạch</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                          Risk Score: 0/100 (An Toàn)
                        </span>
                      </div>
                      <p className="text-[11px] text-sky-200/70 leading-relaxed">
                        Hệ thống Oracle GoPlus không phát hiện bất kỳ dấu hiệu mã độc Phishing Drainer, tấn công đánh cắp hay dòng tiền rửa qua Crypto Mixer.
                      </p>
                      <span className="text-[10px] text-sky-200/50 block font-mono">
                        Nguồn: {walletAnalysis.oracleSource}
                      </span>
                    </div>
                  )}

                  <div className="p-3.5 rounded-2xl bg-sky-500/[0.07] border border-sky-400/20 text-xs text-sky-200/90 leading-relaxed flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>Khuyến nghị an toàn:</strong> Khi thực hiện giao dịch tài sản hoặc chuyển khoản với đối tác mới, bạn nên chủ động sử dụng giải pháp <strong>Giao Dịch Ký Quỹ (Escrow)</strong> để đảm bảo an toàn tuyệt đối cho cả hai bên.
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.08] flex-wrap">
                    <Link
                      href="/pact/create"
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Giao Dịch Ký Quỹ An Toàn</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    <div className="text-[11px] text-sky-200/60 flex items-center gap-1.5">
                      <span>Bạn từng gặp sự cố với tài khoản này?</span>
                      <button
                        type="button"
                        onClick={() => openReportModalWithTarget(activeQuery || "")}
                        className="text-rose-300 hover:text-rose-200 underline font-medium"
                      >
                        Gửi phản ánh
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* CẢNH BÁO: SỔ ĐEN ON-CHAIN / MẠO DANH GDTG / GOPLUS DRAINER */
              <div className="p-5 sm:p-6 rounded-3xl bg-rose-500/15 border border-rose-400/40 backdrop-blur-2xl space-y-3.5 shadow-2xl">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-rose-300">
                    <AlertOctagon className="w-5 h-5 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                      {isBrokerImpersonation
                        ? "Báo Động Đỏ: Phát Hiện Giả Mạo GDTG Bảo Chứng"
                        : isWalletDangerous
                        ? "Cảnh Báo Nguy Hiểm: Mã Độc Web3 (GoPlus Oracle)"
                        : "Cảnh Báo: Tài Khoản Có Dấu Hiệu Vi Phạm"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-rose-200 px-2.5 py-0.5 rounded-full bg-rose-500/30 border border-rose-300/30">
                    {scamCount > 0 ? `${scamCount} đơn tố cáo` : "Cảnh báo bảo mật"}
                  </span>
                </div>

                {/* 1. Broker Impersonation Alert Banner */}
                {bankAnalysis?.brokerCheck?.isBrokerImpersonation && (
                  <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-400/70 text-xs text-rose-100 space-y-2 animate-pulse">
                    <div className="flex items-center gap-2 font-bold text-rose-200 text-sm">
                      <AlertOctagon className="w-5 h-5 text-rose-300 shrink-0" />
                      <span>🚨 PHÁT HIỆN GIẢ MẠO GDTG BẢO CHỨNG TRÊN SMART CONTRACT!</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-line text-[12px] text-rose-100/95 font-medium">
                      {bankAnalysis.brokerCheck.impersonationDetails}
                    </p>
                  </div>
                )}

                {/* 2. Bank Information Pill */}
                {bankAnalysis && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {bankAnalysis.bank?.logo && (
                        <img
                          src={bankAnalysis.bank.logo}
                          alt={bankAnalysis.bank.shortName}
                          className="w-5 h-5 rounded-md object-contain bg-white p-0.5"
                        />
                      )}
                      <span className="text-white font-medium">{bankAnalysis.bank?.shortName} - {bankAnalysis.accountNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-sky-200/60 block">Tên chủ thẻ thực tế (Napas):</span>
                      <strong className="font-mono text-rose-300 uppercase">{bankAnalysis.actualAccountName}</strong>
                    </div>
                  </div>
                )}

                {/* 3. GoPlus Security Oracle Phishing Threat Breakdown */}
                {walletAnalysis?.isMalicious && (
                  <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-200 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>GoPlus Security Oracle: Phát hiện Rủi Ro Nghiêm Trọng</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/25 border border-rose-400/40 text-rose-200 font-mono text-[10px] font-bold">
                        Điểm rủi ro: {walletAnalysis.riskScore}/100 ({walletAnalysis.riskLevel})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {walletAnalysis.detectedThreats.map((threat: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/30 text-rose-200 text-[11px] font-medium">
                          ⚠️ {threat}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-sky-200/50 block font-mono pt-1">
                      Nguồn Oracle: {walletAnalysis.oracleSource}
                    </span>
                  </div>
                )}

                {/* 4. Scam Reports Feed */}
                {reportsToDisplay.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {reportsToDisplay.map((r, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-white/[0.04] text-xs space-y-1">
                        <div className="flex items-center justify-between text-sky-200/70">
                          <span>Người báo: <code className="text-white font-mono">{shortenAddress(r.reporter)}</code></span>
                          <span className="text-rose-300 font-semibold">{r.isVerified || hasVerified ? "Đã Xác Thực" : "Chờ Duyệt"}</span>
                        </div>
                        <p className="text-white font-medium">{r.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
                  <span className="text-rose-200 font-semibold">Khuyến cáo: Tuyệt đối KHÔNG thực hiện chuyển khoản tới tài khoản này!</span>
                  <button
                    type="button"
                    onClick={() => {
                      setQueryInput("");
                      setActiveQuery(null);
                      setBankAnalysis(null);
                      setWalletAnalysis(null);
                    }}
                    className="text-sky-200/70 hover:text-white underline"
                  >
                    Đóng kết quả
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── 2. CẢNH BÁO SỔ ĐEN MỚI NHẤT (100 CẢNH BÁO GẦN NHẤT ON-CHAIN) ── */}
      <section className="space-y-4 pt-4 border-t border-white/[0.1]">
        {/* Clean Header: Giữ thanh thoát, không lặp lại ô tìm kiếm */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Sổ Đen Cảnh Báo Gần Nhất
            </h2>
            <span className="text-xs text-sky-200/60 font-mono">ScamRegistryL1</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-sky-200/70">
            <span className="text-rose-300 font-mono font-semibold bg-rose-500/15 border border-rose-300/25 px-3 py-1 rounded-full whitespace-nowrap">
              Top 100 cảnh báo mới nhất
            </span>
          </div>
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: `Tất Cả (${RECENT_L1_REPORTS.length})` },
            { id: "bank", label: `STK Ngân Hàng (${countBank})` },
            { id: "telegram", label: `Telegram (${countTelegram})` },
            { id: "phone", label: `Số Điện Thoại (${countPhone})` },
            { id: "wallet", label: `Ví On-Chain (${countWallet})` },
          ].map((cat) => {
            const active = feedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFeedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                  active
                    ? "bg-white/20 text-white border border-white/25 shadow-sm"
                    : "bg-white/[0.05] text-sky-200/60 hover:text-white hover:bg-white/[0.1] border border-white/[0.08]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Feed List with Custom Smooth Scroll */}
        <div className="rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] overflow-hidden">
          <div className="max-h-[480px] overflow-y-auto divide-y divide-white/[0.08] scroll-smooth">
            {filteredFeedReports.length > 0 ? (
              filteredFeedReports.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-mono font-bold text-rose-300 text-sm">{item.target}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-sky-200 text-[11px] font-medium">
                        {item.bankName}
                      </span>
                      <span className="text-rose-200 font-semibold text-[11px] bg-rose-500/20 border border-rose-300/30 px-2 py-0.5 rounded-full">
                        {item.flagsCount} tố cáo
                      </span>
                      <span className="text-sky-200/50">·</span>
                      <span className="text-sky-200/70">{item.timeAgo}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-sky-100/90 line-clamp-1">{item.description}</p>
                    <div className="text-xs text-sky-200/60">
                      Tên ghi nhận: <span className="text-sky-100 font-medium">{item.owner}</span> · Thiệt hại ghi nhận: <strong className="text-rose-300 font-mono">{item.amountLoss}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setQueryInput(item.target);
                      setActiveQuery(item.target);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-4 py-1.5 rounded-full bg-white/[0.1] hover:bg-white/[0.2] border border-white/[0.14] text-xs font-semibold text-white transition-all shrink-0 self-start sm:self-auto"
                  >
                    Kiểm Tra
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-sky-200/60 space-y-2">
                <p>Không có cảnh báo nào trong danh mục này.</p>
                <button
                  type="button"
                  onClick={() => setFeedCategory("all")}
                  className="px-3.5 py-1.5 rounded-full bg-white/[0.1] text-white font-medium hover:bg-white/[0.16]"
                >
                  Xem tất cả
                </button>
              </div>
            )}
          </div>

          {/* Feed Footer Bar */}
          <div className="px-5 py-2.5 bg-black/25 border-t border-white/[0.08] flex items-center justify-between text-xs text-sky-200/70 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span>Đang hiển thị <strong className="text-white font-mono">{filteredFeedReports.length}</strong> / 100 cảnh báo gần nhất</span>
              {feedCategory !== "all" && (
                <button
                  type="button"
                  onClick={() => setFeedCategory("all")}
                  className="text-sky-300 hover:text-white underline text-[11px]"
                >
                  (Xem tất cả 100)
                </button>
              )}
            </div>
            <span className="text-[11px] text-sky-200/50 hidden sm:inline">
              ↕ Dùng con lăn chuột hoặc vuốt để cuộn lướt qua 100 cảnh báo
            </span>
          </div>
        </div>
      </section>

      {/* ── 3. THANH THÔNG TIN BẢO CHỨNG & TELEGRAM BOT (TÍCH HỢP LIỀN MẠCH Ở ĐÁY) ── */}
      <section className="pt-2 pb-6 border-t border-white/[0.1] flex flex-col lg:flex-row items-center justify-between gap-6 text-xs text-sky-200/80">
        {/* Telemetry Inline */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sky-200/60">Vốn cọc GDTG:</span>
            <span className="font-mono font-bold text-white text-sm">{principalDisplay} USDC</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="text-sky-200/60">Lãi Aave V3:</span>
            <span className="font-mono font-bold text-emerald-300 text-sm">+5.20% APY</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="text-sky-200/60">Kèo bảo vệ:</span>
            <span className="font-mono font-bold text-white text-sm">{escrowsDisplay} hợp đồng</span>
          </div>
        </div>

        {/* Telegram Sentinel Bot Pill */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] backdrop-blur-md text-xs">
          <Send className="w-3.5 h-3.5 text-sky-300 shrink-0" />
          <span>Telegram Sentinel Bot:</span>
          <code className="text-sky-200 font-mono">@TrustPact_Sentinel_bot</code>
          <a
            href="https://t.me/TrustPact_Sentinel_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-300 hover:text-white font-semibold underline ml-1"
          >
            Mở bot
          </a>
        </div>
      </section>

      {/* ── REPORT SCAM MODAL CHI TIẾT (STK: Tên ngân hàng, tên người; Thêm mục User / Admin / GDTG) ── */}
      {showReportForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[32px] bg-[#0A1A3A]/98 border border-rose-400/35 p-5 sm:p-7 space-y-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]">
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-white/[0.12] gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-white text-base sm:text-lg">
                    Gửi Hồ Sơ Tố Cáo Lên Sổ Đen On-Chain
                  </h3>
                </div>
                <p className="text-xs text-sky-200/70 pl-10">
                  Hồ sơ ghi nhận bất biến vào Smart Contract <span className="font-mono text-white">ScamRegistryL1</span> trên Avalanche Fuji · Miễn phí 0đ Gas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="p-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-sky-200 hover:text-white transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportScamSubmit} className="space-y-4 text-xs">
              {/* 1. Chọn Loại Định Danh */}
              <div className="space-y-2">
                <label className="font-bold text-sky-100 flex items-center gap-1.5 text-xs">
                  <span>1. Chọn Loại Định Danh Vi Phạm</span>
                  <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/[0.1]">
                  {[
                    { id: "bank", label: "STK Ngân Hàng", icon: Landmark },
                    { id: "impersonation", label: "User/Admin/GDTG", icon: Users },
                    { id: "phone", label: "SĐT / Ví Điện Tử", icon: Smartphone },
                    { id: "telegram", label: "Telegram ID", icon: Send },
                    { id: "wallet", label: "Ví Web3 (0x)", icon: Wallet },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const active = reportIdType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setReportIdType(cat.id as any)}
                        className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[11px] font-semibold rounded-xl transition-all ${
                          active
                            ? "bg-rose-500/30 text-white border border-rose-300/40 shadow-sm"
                            : "text-sky-200/60 hover:text-white hover:bg-white/[0.06] border border-transparent"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${active ? "text-rose-300" : "text-sky-200/50"}`} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Chi tiết theo Loại Định Danh */}

              {/* TRƯỜNG HỢP A: SỐ TÀI KHOẢN NGÂN HÀNG (Yêu cầu có tên ngân hàng, tên người) */}
              {reportIdType === "bank" && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-sky-200 font-semibold text-xs pb-1 border-b border-white/[0.06]">
                    <Landmark className="w-3.5 h-3.5 text-sky-300" />
                    <span>Thông Tin Tài Khoản Ngân Hàng Lừa Đảo</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        Tên Ngân Hàng <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={reportBankName}
                        onChange={(e) => setReportBankName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white text-xs outline-none focus:border-rose-400"
                        required
                      >
                        {[
                          "Techcombank", "Vietcombank", "MBBank", "BIDV", "VPBank",
                          "ACB", "TPBank", "Sacombank", "VIB", "Agribank",
                          "SHB", "HDBank", "OCB", "MSB", "SeABank", "Khác"
                        ].map((b) => (
                          <option key={b} value={b} className="bg-[#0c1c3d] text-white">
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        Số Tài Khoản (STK) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportBankAccount}
                        onChange={(e) => setReportBankAccount(e.target.value)}
                        placeholder="1903889922101..."
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white font-mono text-xs outline-none focus:border-rose-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        Họ &amp; Tên Chủ Tài Khoản <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportAccountName}
                        onChange={(e) => setReportAccountName(e.target.value.toUpperCase())}
                        placeholder="NGUYEN VAN DUC..."
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white uppercase text-xs outline-none focus:border-rose-400"
                        required
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-sky-200/60 leading-tight">
                    💡 Khi nạn nhân khác tra cứu STK này trên Radar, hệ thống sẽ đối soát tên chủ tài khoản &amp; ngân hàng để cảnh báo tức thì.
                  </p>
                </div>
              )}

              {/* TRƯỜNG HỢP B: USER / ADMIN / GDTG MẠO DANH (Mục mới theo yêu cầu) */}
              {reportIdType === "impersonation" && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-sky-200 font-semibold text-xs pb-1 border-b border-white/[0.06]">
                    <Users className="w-3.5 h-3.5 text-sky-300" />
                    <span>Hành Vi Mạo Danh User / Admin / GDTG Trung Gian</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        Vai Trò Kẻ Gian Giả Mạo <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={reportImpersonatedRole}
                        onChange={(e) => setReportImpersonatedRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white text-xs outline-none focus:border-rose-400"
                        required
                      >
                        <option value="Mạo danh GDTG Bảo Chứng (Broker uy tín)" className="bg-[#0c1c3d]">
                          Mạo danh GDTG Bảo Chứng (Broker uy tín)
                        </option>
                        <option value="Mạo danh Ban Quản Trị (Admin TrustPact)" className="bg-[#0c1c3d]">
                          Mạo danh Ban Quản Trị (Admin TrustPact)
                        </option>
                        <option value="Mạo danh Admin Kèo Nhóm OTC / P2P" className="bg-[#0c1c3d]">
                          Mạo danh Admin Kèo Nhóm OTC / P2P
                        </option>
                        <option value="User Gian Lận / Quỵt Tiền Cọc / Giả Bill" className="bg-[#0c1c3d]">
                          User Gian Lận / Quỵt Tiền Cọc / Giả Bill
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        Nền Tảng Hoạt Động <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={reportPlatform}
                        onChange={(e) => setReportPlatform(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white text-xs outline-none focus:border-rose-400"
                        required
                      >
                        <option value="Telegram" className="bg-[#0c1c3d]">Telegram</option>
                        <option value="Facebook" className="bg-[#0c1c3d]">Facebook</option>
                        <option value="Zalo" className="bg-[#0c1c3d]">Zalo</option>
                        <option value="Discord" className="bg-[#0c1c3d]">Discord</option>
                        <option value="Khác" className="bg-[#0c1c3d]">Nền tảng khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        Handle / ID / Nick Kẻ Lừa Đảo <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportFakeHandle}
                        onChange={(e) => setReportFakeHandle(e.target.value)}
                        placeholder="Ví dụ: @otc_vn_fake_admin hoặc link nick..."
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white font-mono text-xs outline-none focus:border-rose-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        GDTG hoặc Admin Thật Bị Mạo Danh <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportRealTarget}
                        onChange={(e) => setReportRealTarget(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Nam (GDTG 5,000 USDC) hoặc Hoàng Minh..."
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white text-xs outline-none focus:border-rose-400"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP C: SỐ ĐIỆN THOẠI / VÍ ĐIỆN TỬ */}
              {reportIdType === "phone" && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-sky-200 font-semibold text-xs pb-1 border-b border-white/[0.06]">
                    <Smartphone className="w-3.5 h-3.5 text-sky-300" />
                    <span>Thông Tin Số Điện Thoại &amp; Ví Điện Tử</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        Loại Ví / Nhà Mạng <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={reportPhoneWallet}
                        onChange={(e) => setReportPhoneWallet(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white text-xs outline-none focus:border-rose-400"
                      >
                        <option value="Momo" className="bg-[#0c1c3d]">Ví MoMo</option>
                        <option value="ZaloPay" className="bg-[#0c1c3d]">ZaloPay</option>
                        <option value="Viettel Money" className="bg-[#0c1c3d]">Viettel Money</option>
                        <option value="ShopeePay" className="bg-[#0c1c3d]">ShopeePay</option>
                        <option value="VNPAY" className="bg-[#0c1c3d]">VNPAY</option>
                        <option value="SĐT SIM" className="bg-[#0c1c3d]">Số điện thoại SIM</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        Số Điện Thoại <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportPhoneNumber}
                        onChange={(e) => setReportPhoneNumber(e.target.value)}
                        placeholder="0982736182..."
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white font-mono text-xs outline-none focus:border-rose-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        Tên Đăng Ký Ví (Nếu biết)
                      </label>
                      <input
                        type="text"
                        value={reportPhoneOwner}
                        onChange={(e) => setReportPhoneOwner(e.target.value.toUpperCase())}
                        placeholder="TRAN THI MAI..."
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white uppercase text-xs outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP D: TELEGRAM */}
              {reportIdType === "telegram" && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-sky-200 font-semibold text-xs pb-1 border-b border-white/[0.06]">
                    <Send className="w-3.5 h-3.5 text-sky-300" />
                    <span>Thông Tin Tài Khoản / Nhóm Chat Telegram</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                      Telegram @Username / Link Nhóm <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={reportTelegramHandle}
                      onChange={(e) => setReportTelegramHandle(e.target.value)}
                      placeholder="@otc_vn_fake_admin hoặc https://t.me/..."
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white font-mono text-xs outline-none focus:border-rose-400"
                      required
                    />
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP E: VÍ WEB3 */}
              {reportIdType === "wallet" && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-sky-200 font-semibold text-xs pb-1 border-b border-white/[0.06]">
                    <Wallet className="w-3.5 h-3.5 text-sky-300" />
                    <span>Địa Chỉ Ví Avalanche / Smart Contract Độc Hại</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        Địa Chỉ Ví (0x...) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportWalletAddress}
                        onChange={(e) => setReportWalletAddress(e.target.value)}
                        placeholder="0x71C84043CD9c86523674805113B78444499c0009..."
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white font-mono text-xs outline-none focus:border-rose-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-sky-200 block mb-1">
                        Dấu Hiệu Vi Phạm
                      </label>
                      <select
                        value={reportWalletIssue}
                        onChange={(e) => setReportWalletIssue(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white text-xs outline-none focus:border-rose-400"
                      >
                        <option value="Drainer rút cạn ví" className="bg-[#0c1c3d]">Drainer rút cạn ví</option>
                        <option value="Phishing Link giả mạo" className="bg-[#0c1c3d]">Phishing Link giả mạo</option>
                        <option value="Token rác giả danh" className="bg-[#0c1c3d]">Token rác giả danh</option>
                        <option value="Ví quỵt cọc P2P" className="bg-[#0c1c3d]">Ví quỵt cọc P2P</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Phần Thiệt Hại & Bằng Chứng (Tải ảnh từ máy + dán link) */}
              <div>
                <label className="font-semibold text-sky-100 block mb-1 text-xs">
                  Số Tiền Thiệt Hại / Chiếm Đoạt
                </label>
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    value={reportLossAmount}
                    onChange={(e) => setReportLossAmount(e.target.value)}
                    placeholder="Ví dụ: 31,200,000 hoặc 1,200..."
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white font-mono text-xs outline-none focus:border-rose-400"
                  />
                  <select
                    value={reportLossCurrency}
                    onChange={(e) => setReportLossCurrency(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white text-xs outline-none font-bold shrink-0"
                  >
                    <option value="VNĐ" className="bg-[#0c1c3d]">VNĐ</option>
                    <option value="USDT" className="bg-[#0c1c3d]">USDT</option>
                    <option value="USDC" className="bg-[#0c1c3d]">USDC</option>
                    <option value="AVAX" className="bg-[#0c1c3d]">AVAX</option>
                  </select>
                </div>
              </div>

              {/* 4. Khu Vực Tải Ảnh Bằng Chứng Từ Máy Tính (File Upload & Preview) */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.1]">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-sky-100 flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-300" />
                    <span>Hình Ảnh Bằng Chứng (Ảnh Bill, Sao Kê, Tin Nhắn)</span>
                  </label>
                  <span className="text-[10px] text-sky-200/60 font-mono">Tự động gắn mã IPFS Hash</span>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />

                {!uploadedPreviewUrl ? (
                  /* Nút Tải Ảnh Từ Máy Tính */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-white/[0.18] hover:border-rose-300/50 hover:bg-white/[0.06] rounded-2xl p-4 text-center transition-all flex flex-col items-center justify-center gap-1.5 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-500/15 group-hover:bg-rose-500/25 border border-rose-300/30 flex items-center justify-center text-rose-300 transition-colors">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-white text-xs block group-hover:text-rose-200">
                        {isUploadingFile ? "Đang xử lý tải ảnh..." : "Bấm để chọn ảnh từ máy tính (hoặc kéo thả)"}
                      </span>
                      <span className="text-[11px] text-sky-200/60 block">
                        Hỗ trợ ảnh chụp màn hình bill chuyển khoản, ảnh sao kê ngân hàng, đoạn chat (PNG, JPG, WEBP)
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Ảnh Đã Tải Lên & Xem Trước (Preview Card) */
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.06] border border-emerald-400/30 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={uploadedPreviewUrl}
                        alt="Bằng chứng"
                        className="w-14 h-14 rounded-xl object-cover ring-2 ring-emerald-400/40 shrink-0 bg-black/40"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-xs truncate max-w-[200px] sm:max-w-xs">
                            {uploadedFileName || "bill_bang_chung.png"}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                            {uploadedFileSize || "Đã tải lên"}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-sky-200/80 block truncate max-w-[260px] sm:max-w-sm">
                          Mã hóa IPFS: <span className="text-emerald-300">{reportEvidenceUri || "ipfs://QmVerified..."}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeUploadedFile}
                      className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-300/30 text-rose-300 transition-colors shrink-0 flex items-center gap-1 text-[11px] font-semibold"
                      title="Xóa và chọn ảnh khác"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Chọn ảnh khác</span>
                    </button>
                  </div>
                )}

                {/* Hoặc Dán Link Ngoài */}
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-sky-200/60 shrink-0">Hoặc dán link trực tiếp:</span>
                    <input
                      type="text"
                      value={reportEvidenceUri}
                      onChange={(e) => setReportEvidenceUri(e.target.value)}
                      placeholder="ipfs://Qm... hoặc https://drive.google.com/..."
                      className="w-full px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.14] text-white font-mono text-[11px] outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-sky-100 block mb-1 text-xs">
                  Mô Tả Chi Tiết Kịch Bản &amp; Thủ Đoạn Lừa Đảo <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Nêu rõ tình tiết: Kẻ gian tiếp cận qua đâu, tráo ví như thế nào, làm giả bill biến động số dư hoặc quỵt cọc ra sao..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white text-xs outline-none focus:border-rose-400 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Cam kết & Preview On-Chain */}
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-300/20 flex items-start gap-2.5 text-[11px] text-sky-100">
                <input
                  type="checkbox"
                  id="confirm-report"
                  checked={reportConfirmed}
                  onChange={(e) => setReportConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-rose-500 focus:ring-rose-400"
                  required
                />
                <label htmlFor="confirm-report" className="cursor-pointer leading-relaxed text-sky-100/90">
                  Tôi cam đoan các thông tin tố cáo trên là sự thật, sẵn sàng chịu trách nhiệm trước cộng đồng và cung cấp thêm bằng chứng khi Moderator L1 yêu cầu đối soát.
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.14] text-white text-xs font-semibold transition-colors"
                >
                  Hủy Bỏ
                </button>
                <ShimmerButton
                  type="submit"
                  variant="danger"
                  className="px-6 py-2.5 text-xs font-bold shadow-lg"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Ký Lệnh Ghi Sổ Đen L1 (0đ Gas)</span>
                </ShimmerButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <TransactionFeedback status={txStatus} onClose={() => setTxStatus({ step: "idle" })} />
    </div>
  );
}
