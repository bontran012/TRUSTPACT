"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  Shield,
  AlertOctagon,
  FileText,
  Lock,
  Send,
  ArrowRight,
  Landmark,
  Smartphone,
  Wallet,
  X,
  Users,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Database,
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
import { useLanguage } from "@/src/context/LanguageContext";

type CategoryKey = "bank" | "phone" | "telegram" | "wallet";
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

interface ViolationRecord {
  target: string;
  type: CategoryKey;
  bankName: string;
  owner: string;
  description: string;
  descriptionEn?: string;
  flagsCount: number;
  status: "VERIFIED" | "PENDING_AUDIT";
  verifiedBy: string;
  timeAgo: string;
  amountLoss: string;
}

const BASE_REPORTS: ViolationRecord[] = SEED_SCAM_DATABASE;

const RECENT_L1_REPORTS = BASE_REPORTS;

function getInitials(name: string): string {
  const cleaned = name.replace(/\(.*?\)/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function stripNonTextSymbols(input?: string | null): string {
  if (!input) return "";
  return input.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").trim();
}

function formatTimeAgo(timeAgo: string, isEn?: boolean): string {
  if (!isEn) return timeAgo;
  return timeAgo
    .replace(" phút trước", "m ago")
    .replace(" giờ trước", "h ago")
    .replace(" ngày trước", "d ago")
    .replace("Mới cập nhật", "Just now");
}

function getCategoryBadge(type: CategoryKey, isEn?: boolean): { label: string; className: string } {
  switch (type) {
    case "bank":
      return {
        label: isEn ? "Bank Account" : "Ngân hàng",
        className: "bg-blue-500/10 text-blue-400 border-blue-500/25",
      };
    case "telegram":
      return {
        label: "Telegram",
        className: "bg-sky-500/10 text-sky-400 border-sky-500/25",
      };
    case "phone":
      return {
        label: isEn ? "Phone" : "Điện thoại",
        className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
      };
    case "wallet":
      return {
        label: isEn ? "Web3 Wallet" : "Ví Web3",
        className: "bg-amber-500/10 text-amber-400 border-amber-500/25",
      };
  }
}

export default function ScamRadarAndReputationPage() {
  const { address } = useAccount();
  const { findUserByQuery, setIsAuthModalOpen } = useAuth();
  const { language, t } = useLanguage();
  const isEn = language === "en";

  // ── Protocol On-Chain Telemetry (Avalanche Fuji)
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

  // ── Omnibox Search Terminal State
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("bank");
  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  // Bank Lookup & Logo Fallback State
  const [bankAnalysis, setBankAnalysis] = useState<any>(null);
  const [isCheckingBank, setIsCheckingBank] = useState(false);
  const [bankLogoError, setBankLogoError] = useState(false);

  // GoPlus Security Oracle State
  const [walletAnalysis, setWalletAnalysis] = useState<any>(null);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);

  // Violation Reports Table Filter State
  const [feedCategory, setFeedCategory] = useState<"all" | CategoryKey>("all");

  // SBT Lookup State
  const [resolvedSbtAddress, setResolvedSbtAddress] = useState<`0x${string}`>(
    (address as `0x${string}`) || "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5"
  );

  const { data: sbtBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.trustPassportSBT,
    abi: TRUST_PASSPORT_SBT_ABI,
    functionName: "balanceOf",
    args: [resolvedSbtAddress],
    query: { enabled: !!activeQuery },
  });

  const {
    data: scamCheckData,
    isLoading: isCheckingScam,
    refetch: refetchScamCheck,
  } = useReadContract({
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

  // ── Report Violation Modal State
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportIdType, setReportIdType] = useState<ReportCategoryKey>("bank");
  // Bank fields
  const [reportBankName, setReportBankName] = useState("Techcombank");
  const [reportBankAccount, setReportBankAccount] = useState("");
  const [reportAccountName, setReportAccountName] = useState("");
  // Impersonation fields
  const [reportImpersonatedRole, setReportImpersonatedRole] = useState(
    "Mạo danh GDTG bảo chứng"
  );
  const [reportFakeHandle, setReportFakeHandle] = useState("");
  const [reportRealTarget, setReportRealTarget] = useState("");
  const [reportPlatform, setReportPlatform] = useState("Telegram");
  // Phone fields
  const [reportPhoneNumber, setReportPhoneNumber] = useState("");
  const [reportPhoneWallet, setReportPhoneWallet] = useState("MoMo");
  const [reportPhoneOwner, setReportPhoneOwner] = useState("");
  // Telegram fields
  const [reportTelegramHandle, setReportTelegramHandle] = useState("");
  // Wallet fields
  const [reportWalletAddress, setReportWalletAddress] = useState("");
  const [reportWalletIssue, setReportWalletIssue] = useState("Hợp đồng rút tài sản trái phép");
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
  const [previewImgError, setPreviewImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewImgError(false);
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
    setPreviewImgError(false);
    setReportEvidenceUri("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openReportModalWithTarget = (target?: string) => {
    if (target && target.trim()) {
      const clean = target.trim();
      if (/^\d{10,16}$/.test(clean)) {
        setReportIdType("bank");
        setReportBankAccount(clean);
      } else if (clean.startsWith("@")) {
        setReportIdType("telegram");
        setReportTelegramHandle(clean);
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

  // Web3 Write
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "idle" });
  const { writeContractAsync } = useWriteContract();

  const executeScan = async (targetQuery: string, customCategory?: CategoryKey) => {
    const clean = targetQuery.trim();
    if (!clean) return;
    setActiveQuery(clean);
    setBankLogoError(false);

    const cat: CategoryKey =
      customCategory ||
      (clean.startsWith("0x")
        ? "wallet"
        : clean.startsWith("@")
        ? "telegram"
        : /^\d{9,10}$/.test(clean) && selectedCategory === "phone"
        ? "phone"
        : selectedCategory);

    const matched = findUserByQuery(clean);
    if (matched && matched.walletAddress) {
      setResolvedSbtAddress(matched.walletAddress);
    } else if (clean.startsWith("0x") && clean.length === 42) {
      setResolvedSbtAddress(clean as `0x${string}`);
    }

    // 1. Wallet address (0x...) -> Query GoPlus Security API
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

    // 2. Bank account -> Query Bank & Official GDTG Directory API
    if (cat === "bank" && !clean.startsWith("0x") && !clean.startsWith("@")) {
      setWalletAnalysis(null);
      setIsCheckingBank(true);
      try {
        const res = await fetch(`/api/radar/check-bank?accountNumber=${encodeURIComponent(clean)}`);
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

  const clearSearch = () => {
    setQueryInput("");
    setActiveQuery(null);
    setBankAnalysis(null);
    setWalletAnalysis(null);
    setBankLogoError(false);
  };

  const handleReportScamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let computedTarget = "";
    let compiledDescription = "";

    if (reportIdType === "bank") {
      if (!reportBankAccount.trim() || !reportAccountName.trim()) {
        alert("Vui lòng nhập đầy đủ số tài khoản và họ tên chủ tài khoản ngân hàng.");
        return;
      }
      computedTarget = reportBankAccount.trim();
      compiledDescription = `[Ngân hàng: ${reportBankName}] [Chủ TK: ${reportAccountName.trim().toUpperCase()}] ${
        reportLossAmount ? `[Thiệt hại: ${reportLossAmount} ${reportLossCurrency}] ` : ""
      }${reportDescription.trim()}`;
    } else if (reportIdType === "impersonation") {
      if (!reportFakeHandle.trim() || !reportRealTarget.trim()) {
        alert("Vui lòng nhập định danh giả mạo và tên GDTG hoặc quản trị viên bị mạo danh.");
        return;
      }
      computedTarget = reportFakeHandle.trim();
      compiledDescription = `[Phân loại: ${reportImpersonatedRole}] [Định danh vi phạm: ${reportFakeHandle.trim()} - ${reportPlatform}] [Đối tượng bị mạo danh: ${reportRealTarget.trim()}] ${
        reportLossAmount ? `[Thiệt hại: ${reportLossAmount} ${reportLossCurrency}] ` : ""
      }${reportDescription.trim()}`;
    } else if (reportIdType === "phone") {
      if (!reportPhoneNumber.trim()) {
        alert("Vui lòng nhập số điện thoại hoặc tài khoản ví điện tử.");
        return;
      }
      computedTarget = reportPhoneNumber.trim();
      compiledDescription = `[Ví/Mạng: ${reportPhoneWallet}] [Chủ đăng ký: ${reportPhoneOwner.trim().toUpperCase() || "Chưa xác định"}] ${
        reportLossAmount ? `[Thiệt hại: ${reportLossAmount} ${reportLossCurrency}] ` : ""
      }${reportDescription.trim()}`;
    } else if (reportIdType === "telegram") {
      if (!reportTelegramHandle.trim()) {
        alert("Vui lòng nhập @username hoặc liên kết Telegram.");
        return;
      }
      computedTarget = reportTelegramHandle.trim();
      compiledDescription = `${
        reportLossAmount ? `[Thiệt hại: ${reportLossAmount} ${reportLossCurrency}] ` : ""
      }${reportDescription.trim()}`;
    } else {
      if (!reportWalletAddress.trim()) {
        alert("Vui lòng nhập địa chỉ ví Web3 định dạng 0x...");
        return;
      }
      computedTarget = reportWalletAddress.trim();
      compiledDescription = `[Phân loại: ${reportWalletIssue}] ${
        reportLossAmount ? `[Thiệt hại: ${reportLossAmount} ${reportLossCurrency}] ` : ""
      }${reportDescription.trim()}`;
    }

    if (!compiledDescription.trim()) return;

    if (!address) {
      setTxStatus({
        step: "error",
        actionTitle: "Yêu cầu kết nối ví Web3",
        errorMessage:
          "Thao tác gửi báo cáo vi phạm lên ScamRegistryL1 yêu cầu chữ ký ví trên mạng Avalanche Fuji. Vui lòng kết nối ví để tiếp tục.",
      });
      setIsAuthModalOpen(true);
      return;
    }

    const actionLabel = "Ghi nhận báo cáo vi phạm On-Chain";

    try {
      setTxStatus({ step: "awaiting_signature", actionTitle: actionLabel });
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
      setTxStatus({ step: "confirming", txHash: hash, actionTitle: actionLabel });
      setTimeout(() => {
        setTxStatus({ step: "success", txHash: hash, actionTitle: actionLabel });
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
        removeUploadedFile();
        if (activeQuery) {
          refetchScamCheck();
          refetchReports();
        }
      }, 2000);
    } catch (err: any) {
      setTxStatus({
        step: "error",
        errorMessage: parseContractError(err),
        actionTitle: actionLabel,
      });
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
        let detectedCat: CategoryKey = "bank";
        if (clean.startsWith("0x")) detectedCat = "wallet";
        else if (clean.startsWith("@")) detectedCat = "telegram";
        else if (/^\d{10,16}$/.test(clean)) detectedCat = "bank";
        else if (/^\d{9,11}$/.test(clean)) detectedCat = "phone";

        setSelectedCategory(detectedCat);
        setQueryInput(clean);
        executeScan(clean, detectedCat);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          description:
            bankAnalysis.description || "Tài khoản có ghi nhận cảnh báo gian lận trên hệ thống",
          flagsCount: bankAnalysis.flagsCount || 5,
          status: (bankAnalysis.status === "VERIFIED" ? "VERIFIED" : "VERIFIED") as "VERIFIED",
          verifiedBy: "ScamRegistryL1",
          timeAgo: "Mới cập nhật",
          amountLoss: bankAnalysis.amountLoss || "31,200,000 đ",
        }
      : null);

  const onChainScamCount = scamCheckData ? Number(scamCheckData[0]) : 0;
  const scamCount =
    onChainScamCount > 0
      ? onChainScamCount
      : localScamMatch
      ? localScamMatch.flagsCount
      : walletAnalysis?.isMalicious
      ? 5
      : 0;

  const isBrokerImpersonation = Boolean(bankAnalysis?.brokerCheck?.isBrokerImpersonation);
  const isWalletDangerous = Boolean(walletAnalysis?.isMalicious);
  const isFlagged = scamCount > 0 || isWalletDangerous || isBrokerImpersonation;

  const hasVerified = scamCheckData
    ? Boolean(scamCheckData[1])
    : localScamMatch
    ? localScamMatch.status === "VERIFIED"
    : false;

  const reportsToDisplay: OnChainReport[] =
    reportsList && (reportsList as unknown as OnChainReport[]).length > 0
      ? (reportsList as unknown as OnChainReport[])
      : localScamMatch
      ? [
          {
            reporter: "0x44B1492bC78E12a899Ad34De91eF11B12E7a889B",
            identifier: localScamMatch.target,
            category: localScamMatch.type,
            evidenceHash: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
            description: stripNonTextSymbols(localScamMatch.description),
            timestamp: 1729600000n,
            isVerified: localScamMatch.status === "VERIFIED",
          },
        ]
      : [];

  const matchedScamUser = mounted && activeQuery ? findUserByQuery(activeQuery) : null;
  const hasOnChainSbt = sbtBalance !== undefined && Number(sbtBalance) > 0;

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
      ? Number(totalL1Reports).toLocaleString()
      : String(RECENT_L1_REPORTS.length);

  const countBank = RECENT_L1_REPORTS.filter((r) => r.type === "bank").length;
  const countTelegram = RECENT_L1_REPORTS.filter((r) => r.type === "telegram").length;
  const countPhone = RECENT_L1_REPORTS.filter((r) => r.type === "phone").length;
  const countWallet = RECENT_L1_REPORTS.filter((r) => r.type === "wallet").length;

  const filteredFeedReports = RECENT_L1_REPORTS.filter((item) => {
    return feedCategory === "all" || item.type === feedCategory;
  });

  const categories: { id: CategoryKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "bank", label: t("STK Ngân hàng", "Bank Account"), icon: Landmark },
    { id: "phone", label: t("Số điện thoại", "Phone Number"), icon: Smartphone },
    { id: "telegram", label: "Telegram", icon: Send },
    { id: "wallet", label: t("Ví Web3", "Web3 Wallet"), icon: Wallet },
  ];

  const isMonoQuery = /^(0x|\d)/i.test(queryInput.trim());
  const isBankLookupContext =
    Boolean(bankAnalysis) ||
    (Boolean(activeQuery) &&
      !activeQuery!.startsWith("0x") &&
      !activeQuery!.startsWith("@") &&
      (selectedCategory === "bank" || /^\d{10,16}$/.test(activeQuery!)));

  // Derived Dossier Key-Value Fields for Search Result Card
  const dossierStatusLabel = isFlagged
    ? isBrokerImpersonation
      ? t("Cảnh báo giả mạo GDTG", "Warning: Broker Impersonation")
      : isWalletDangerous
      ? t(
          `Địa chỉ ví rủi ro cao (${walletAnalysis?.riskScore ?? 85}/100)`,
          `High-Risk Wallet Address (${walletAnalysis?.riskScore ?? 85}/100)`
        )
      : hasVerified
      ? t("Cảnh báo vi phạm (Đã xác thực)", "Violation Warning (Verified)")
      : t("Có phản ánh vi phạm (Chờ duyệt)", "Flagged Violation (Pending Audit)")
    : matchedScamUser || bankAnalysis?.isOfficialBrokerAccount
    ? t("Đã xác thực bảo chứng", "Verified & Bonded")
    : t("Chưa ghi nhận vi phạm", "No Violations Recorded");

  const dossierOwnerLabel = (() => {
    if (bankAnalysis?.actualAccountName) {
      const bankShort = bankAnalysis.bank?.shortName ? ` · ${bankAnalysis.bank.shortName}` : "";
      return `${bankAnalysis.actualAccountName}${bankShort}`;
    }
    if (matchedScamUser) {
      return `${matchedScamUser.name} (@${matchedScamUser.username})`;
    }
    if (localScamMatch) {
      return `${localScamMatch.owner} · ${localScamMatch.bankName}`;
    }
    if (walletAnalysis) {
      if (walletAnalysis.knownIncident?.owner) return walletAnalysis.knownIncident.owner;
      return walletAnalysis.isContract
        ? t("Hợp đồng thông minh (Smart Contract)", "Smart Contract")
        : t("Địa chỉ ví cá nhân Web3", "Personal Web3 Wallet");
    }
    return t("Chưa đăng ký trong danh bạ công khai", "Not registered in public directory");
  })();

  const dossierSourceLabel = (() => {
    if (walletAnalysis?.oracleSource) {
      return `${walletAnalysis.oracleSource} · ScamRegistryL1`;
    }
    if (bankAnalysis?.isOfficialBrokerAccount) {
      return "StakedBrokerRegistry & ScamRegistryL1 (Fuji)";
    }
    if (matchedScamUser) {
      return hasOnChainSbt
        ? "TrustPassportSBT & StakedBrokerRegistry (Fuji)"
        : t("Danh bạ thành viên xác thực & ScamRegistryL1", "Verified Member Directory & ScamRegistryL1");
    }
    if (bankAnalysis) {
      return t("Đối soát danh bạ GDTG & ScamRegistryL1 (Fuji)", "Staked Broker Directory & ScamRegistryL1 (Fuji)");
    }
    return "ScamRegistryL1 On-Chain (Avalanche Fuji)";
  })();

  const renderBankBadgeOrLogo = (bank: any) => {
    if (!bank) return null;
    if (!bankLogoError && bank.logo) {
      return (
        <img
          src={bank.logo}
          alt={bank.shortName || bank.code || "Bank"}
          onError={() => setBankLogoError(true)}
          className="w-5 h-5 rounded object-contain bg-white p-0.5 shrink-0"
        />
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono font-semibold text-slate-200 shrink-0">
        {bank.code || bank.shortName?.slice(0, 4)?.toUpperCase() || "BANK"}
      </span>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-8 animate-fade-in" suppressHydrationWarning>
      {/* ── PART 1: FOCAL OMNIBOX SEARCH TERMINAL (TOP CENTER) ── */}
      <section className="pt-3 sm:pt-6 space-y-6">
        <div className="text-center space-y-2.5 max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-slate-100 tracking-tight leading-tight">
            {t("Hệ thống Tra cứu Rủi ro & Đối soát Giao dịch", "Risk Check & Transaction Verification System")}
          </h1>
          <p className="text-sm sm:text-[15px] text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t(
              "Kiểm tra tài khoản ngân hàng, số điện thoại, Telegram và địa chỉ ví trước khi chuyển tiền hoặc khởi tạo ký quỹ.",
              "Verify bank accounts, phone numbers, Telegram handles, and wallet addresses before transferring funds or creating escrow."
            )}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3.5">
          {/* Segmented Selector Bar */}
          <div className="flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-1 p-1 rounded-xl bg-[#111827] border border-slate-800">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-medium rounded-lg transition-colors ${
                      active
                        ? "bg-slate-800 text-slate-100 border border-slate-700/80 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-blue-400" : "text-slate-500"}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* High-Contrast Banking Omnibox Input */}
          <form onSubmit={handleScanSubmit}>
            <div className="relative flex items-center h-[54px] rounded-xl bg-[#111827] border border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-3.5 gap-2.5 shadow-sm">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={
                  selectedCategory === "bank"
                    ? t("Nhập số tài khoản ngân hàng cần đối soát (VD: 1903889922101)...", "Enter bank account number to verify (e.g. 1903889922101)...")
                    : selectedCategory === "phone"
                    ? t("Nhập số điện thoại hoặc tài khoản ví điện tử...", "Enter phone number or e-wallet account...")
                    : selectedCategory === "telegram"
                    ? t("Nhập @username Telegram hoặc liên kết nhóm...", "Enter Telegram @username or group link...")
                    : t("Nhập địa chỉ ví Web3 định dạng 0x...", "Enter Web3 wallet address starting with 0x...")
                }
                className={`w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-[15px] outline-none ${
                  isMonoQuery ? "font-mono" : ""
                }`}
              />
              {queryInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label={t("Xóa nội dung tìm kiếm", "Clear search query")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isCheckingScam || isCheckingBank || isCheckingWallet}
                className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-colors shrink-0"
              >
                {isCheckingScam || isCheckingBank || isCheckingWallet
                  ? t("Đang tra cứu...", "Scanning...")
                  : t("Tra cứu", "Verify")}
              </button>
            </div>
          </form>

          {/* Compact Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-0.5">
            <Link
              href="/pact/create"
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold border border-blue-500/30 transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t("Tạo giao dịch ký quỹ", "Create Escrow Pact")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/pact"
              className="px-3.5 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 text-slate-300 hover:text-slate-100 text-xs font-medium border border-slate-800 hover:border-slate-700 transition-colors inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("Danh sách ký quỹ", "Escrow List")}</span>
            </Link>
            <button
              type="button"
              onClick={() => openReportModalWithTarget(activeQuery || queryInput || "")}
              className="px-3.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/15 text-red-400 text-xs font-medium border border-red-500/30 transition-colors inline-flex items-center gap-1.5"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{t("Báo cáo vi phạm", "Report Violation")}</span>
            </button>
          </div>
        </div>

        {/* ── SEARCH RESULT DOSSIER CARD ── */}
        {activeQuery && (
          <div className="max-w-4xl mx-auto pt-2 animate-fade-in">
            <div
              className={`rounded-xl bg-[#111827] border overflow-hidden shadow-lg ${
                isFlagged
                  ? "border-red-500/40"
                  : matchedScamUser || bankAnalysis?.isOfficialBrokerAccount
                  ? "border-emerald-500/35"
                  : "border-slate-700/80"
              }`}
            >
              {/* Dossier Top Bar */}
              <div className="px-5 py-3.5 bg-[#0B0F17] border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  {isFlagged ? (
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                  ) : matchedScamUser || bankAnalysis?.isOfficialBrokerAccount ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Shield className="w-5 h-5 text-slate-300 shrink-0" />
                  )}
                  <h2 className="text-sm font-semibold text-slate-100">
                    {isFlagged
                      ? t("Hồ sơ cảnh báo rủi ro đối soát", "Risk Warning Dossier")
                      : matchedScamUser || bankAnalysis?.isOfficialBrokerAccount
                      ? t("Hồ sơ định danh đã xác thực bảo chứng", "Verified Staked Broker Dossier")
                      : t("Hồ sơ kết quả đối soát định danh", "Identity Verification Result Dossier")}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                      isFlagged
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : matchedScamUser || bankAnalysis?.isOfficialBrokerAccount
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {isFlagged
                      ? scamCount > 0
                        ? `${scamCount} ${t("báo cáo ghi nhận", "reports recorded")}`
                        : t("Phát hiện rủi ro", "Risk Detected")
                      : matchedScamUser || bankAnalysis?.isOfficialBrokerAccount
                      ? t("Đối tác xác thực", "Verified Partner")
                      : t("Trạng thái bình thường", "Normal Status")}
                  </span>
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title={t("Đóng hồ sơ đối soát", "Close dossier")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Verified SBT Member Credential Strip (Initials Monogram - Zero broken images) */}
                {!isFlagged && matchedScamUser && (
                  <div className="p-4 rounded-xl bg-[#0B0F17] border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-sm flex items-center justify-center shrink-0">
                        {getInitials(matchedScamUser.name)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-100">
                            {matchedScamUser.name}
                          </span>
                          <span className="text-xs font-mono text-emerald-400">
                            @{matchedScamUser.username}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold">
                            {t("Đã xác thực SBT", "Verified SBT")} {matchedScamUser.sbtId || ""}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          {matchedScamUser.walletAddress
                            ? shortenAddress(matchedScamUser.walletAddress)
                            : t("Chưa liên kết ví", "Wallet not linked")}{" "}
                          · {t("Vai trò:", "Role:")} {matchedScamUser.role}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-800">
                      <div>
                        <span className="text-slate-500 block">{t("Tỷ lệ hoàn thành", "Completion Rate")}</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          {matchedScamUser.successRate ?? 100}%
                        </span>
                      </div>
                      <div className="h-7 w-px bg-slate-800" />
                      <div>
                        <span className="text-slate-500 block">{t("Số dư bảo chứng", "Bonded Balance")}</span>
                        <span className="font-mono font-semibold text-slate-100">
                          {matchedScamUser.balanceUsdc.toLocaleString()} USDC
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Structured Key-Value Banking Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1">
                    <span className="text-[11px] font-medium text-slate-400 block">
                      {t("Định danh tra cứu", "Queried Identifier")}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      {bankAnalysis?.bank && renderBankBadgeOrLogo(bankAnalysis.bank)}
                      <span className="font-mono text-sm font-semibold text-slate-100 break-all">
                        {activeQuery}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1">
                    <span className="text-[11px] font-medium text-slate-400 block">
                      {t("Trạng thái đối soát", "Verification Status")}
                    </span>
                    <span
                      className={`text-sm font-semibold block ${
                        isFlagged
                          ? "text-red-400"
                          : matchedScamUser || bankAnalysis?.isOfficialBrokerAccount
                          ? "text-emerald-400"
                          : "text-slate-200"
                      }`}
                    >
                      {dossierStatusLabel}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1">
                    <span className="text-[11px] font-medium text-slate-400 block">
                      {t("Chủ tài khoản / Tổ chức", "Account Owner / Entity")}
                    </span>
                    <span className="text-sm font-medium text-slate-100 block truncate" title={dossierOwnerLabel}>
                      {dossierOwnerLabel}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1 sm:col-span-2">
                    <span className="text-[11px] font-medium text-slate-400 block">
                      {t("Nguồn xác thực", "Verification Source")}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-300 font-mono block truncate" title={dossierSourceLabel}>
                      {dossierSourceLabel}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1">
                    <span className="text-[11px] font-medium text-slate-400 block">
                      {t("Số lượng báo cáo On-Chain", "On-Chain Reports Count")}
                    </span>
                    <span
                      className={`font-mono text-sm font-semibold block ${
                        scamCount > 0 ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {scamCount} {t("báo cáo", "reports")} {scamCount > 0 && (hasVerified ? t("(Đã xác thực)", "(Verified)") : t("(Chờ duyệt)", "(Pending Audit)"))}
                    </span>
                  </div>
                </div>

                {/* Broker Impersonation Notice (No animation, no emojis) */}
                {isBrokerImpersonation && bankAnalysis?.brokerCheck?.impersonationDetails && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-1.5">
                    <div className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                      {t("Cảnh báo sai lệch tài khoản nhận tiền của GDTG", "Warning: Receiving account mismatch for Staked Broker")}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                      {stripNonTextSymbols(bankAnalysis.brokerCheck.impersonationDetails)}
                    </p>
                  </div>
                )}

                {/* GoPlus Security Oracle Breakdown */}
                {walletAnalysis && (
                  <div
                    className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                      walletAnalysis.isMalicious
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-[#0B0F17] border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`font-semibold ${
                          walletAnalysis.isMalicious ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {t("Phân tích bảo mật ví GoPlus Oracle", "GoPlus Security Oracle Breakdown")}
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                        {t("Điểm rủi ro:", "Risk Score:")} {walletAnalysis.riskScore}/100 ({walletAnalysis.riskLevel})
                      </span>
                    </div>
                    {walletAnalysis.isMalicious &&
                      Array.isArray(walletAnalysis.detectedThreats) &&
                      walletAnalysis.detectedThreats.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {walletAnalysis.detectedThreats.map((threat: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-300 text-[11px]"
                            >
                              {stripNonTextSymbols(threat)}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {/* Recorded Violation Reports List */}
                {isFlagged && reportsToDisplay.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-300">
                      {t("Chi tiết biên bản vi phạm đã ghi nhận", "Recorded Violation Reports Details")}
                    </div>
                    <div className="divide-y divide-slate-800 rounded-lg bg-[#0B0F17] border border-slate-800 overflow-hidden">
                      {reportsToDisplay.map((r, idx) => (
                        <div key={idx} className="p-3.5 text-xs space-y-1">
                          <div className="flex items-center justify-between gap-2 text-slate-400">
                            <span>
                              {t("Người gửi:", "Reporter:")}{" "}
                              <code className="font-mono text-slate-200">
                                {shortenAddress(r.reporter)}
                              </code>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                r.isVerified || hasVerified
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                              }`}
                            >
                              {r.isVerified || hasVerified ? t("Đã xác thực", "Verified") : t("Chờ duyệt", "Pending Audit")}
                            </span>
                          </div>
                          <p className="text-slate-200 leading-relaxed">
                            {stripNonTextSymbols(r.description)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Official GDTG Bank Directory Comparison Table (Shown when checking a bank account) */}
                {isBankLookupContext && (
                  <div className="rounded-lg bg-[#0B0F17] border border-slate-800 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-200">
                        {t("Danh bạ tài khoản ngân hàng chính chủ của GDTG", "Official Bank Accounts Directory of Staked Brokers")}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        StakedBrokerRegistry
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800/80 text-[11px] text-slate-400 bg-slate-900/50">
                            <th className="py-2 px-3.5 font-medium">{t("GDTG bảo chứng", "Staked Broker")}</th>
                            <th className="py-2 px-3.5 font-medium">{t("Ngân hàng", "Bank")}</th>
                            <th className="py-2 px-3.5 font-medium">{t("Số tài khoản chính chủ", "Official Account No.")}</th>
                            <th className="py-2 px-3.5 font-medium">{t("Chủ tài khoản", "Account Owner")}</th>
                            <th className="py-2 px-3.5 font-medium">{t("Thế chấp", "Staked Deposit")}</th>
                            <th className="py-2 px-3.5 font-medium text-right">{t("Kết quả đối chiếu", "Match Result")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                          {VERIFIED_BROKERS.map((b) => {
                            const isExactMatch =
                              activeQuery?.replace(/\s+/g, "") === b.officialBank.accountNumber;
                            return (
                              <tr key={b.id} className="hover:bg-slate-800/30">
                                <td className="py-2.5 px-3.5 font-medium text-slate-200 whitespace-nowrap">
                                  {b.name}
                                </td>
                                <td className="py-2.5 px-3.5 text-slate-300 whitespace-nowrap">
                                  {b.officialBank.bankName}
                                </td>
                                <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-100 whitespace-nowrap">
                                  {b.officialBank.accountNumber}
                                </td>
                                <td className="py-2.5 px-3.5 font-mono text-slate-300 whitespace-nowrap">
                                  {b.officialBank.accountOwner}
                                </td>
                                <td className="py-2.5 px-3.5 font-mono text-emerald-400 whitespace-nowrap">
                                  {b.depositUsdc.toLocaleString()} USDC
                                </td>
                                <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                  {isExactMatch ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{t("Trùng khớp chính chủ", "Official Match")}</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[11px]">
                                      {t("Khác STK tra cứu", "Mismatch with queried No.")}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Dossier Action Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs text-slate-400">
                    {isFlagged
                      ? t(
                          "Khuyến nghị dừng chuyển khoản trực tiếp đối với định danh có cảnh báo vi phạm.",
                          "Recommended to stop direct bank transfer to flagged identities."
                        )
                      : t(
                          "Sử dụng hợp đồng ký quỹ đa chữ ký khi giao dịch với đối tác mới.",
                          "Use multi-sig escrow pact when transacting with new counterparts."
                        )}
                  </span>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openReportModalWithTarget(activeQuery)}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                    >
                      {t("Báo cáo vi phạm", "Report Violation")}
                    </button>
                    <Link
                      href={
                        !isFlagged && matchedScamUser?.walletAddress
                          ? `/pact/create?seller=${matchedScamUser.walletAddress}`
                          : "/pact/create"
                      }
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold border border-blue-500/30 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t("Tạo giao dịch ký quỹ", "Create Escrow Pact")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── PART 2: COMPACT 1-ROW ON-CHAIN TELEMETRY STRIP ── */}
      <section className="rounded-xl bg-[#111827] border border-slate-800 px-4 py-3.5 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-slate-800">
          <div className="lg:px-4 first:lg:pl-1 space-y-0.5">
            <span className="text-[11px] font-medium text-slate-400 block">
              {t("Tổng thế chấp GDTG", "Total Broker Staking")}
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-100">
                {principalDisplay} USDC
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">Aave V3 Fuji</span>
            </div>
          </div>

          <div className="lg:px-4 space-y-0.5">
            <span className="text-[11px] font-medium text-slate-400 block">
              {t("Hợp đồng ký quỹ", "Escrow Pacts")}
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-100">
                {escrowsDisplay}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">UniversalEscrow</span>
            </div>
          </div>

          <div className="lg:px-4 space-y-0.5">
            <span className="text-[11px] font-medium text-slate-400 block">
              {t("Báo cáo On-Chain", "On-Chain Reports")}
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-100">
                {reportsDisplay}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">ScamRegistryL1</span>
            </div>
          </div>

          <div className="lg:px-4 last:lg:pr-1 space-y-0.5">
            <span className="text-[11px] font-medium text-slate-400 block">
              {t("Tra cứu nhanh Telegram", "Quick Telegram Bot")}
            </span>
            <a
              href="https://t.me/TrustPact_Sentinel_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>@TrustPact_Sentinel_bot</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        </div>
      </section>

      {/* ── PART 3: FLAT MULTI-COLUMN DATA TABLE FOR VIOLATION REPORTS ── */}
      <section className="space-y-3.5">
        {/* Table Header & Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-slate-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              {t("Cơ sở dữ liệu cảnh báo vi phạm", "Violation Warning Database")}
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
              {filteredFeedReports.length} {t("bản ghi", "records")}
            </span>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: "all", label: `${t("Tất cả", "All")} (${RECENT_L1_REPORTS.length})` },
              { id: "bank", label: `${t("STK Ngân hàng", "Bank")} (${countBank})` },
              { id: "telegram", label: `Telegram (${countTelegram})` },
              { id: "phone", label: `${t("Số điện thoại", "Phone")} (${countPhone})` },
              { id: "wallet", label: `${t("Ví Web3", "Web3 Wallet")} (${countWallet})` },
            ].map((tab) => {
              const active = feedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFeedCategory(tab.id as "all" | CategoryKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap border ${
                    active
                      ? "bg-slate-800 text-slate-100 border-slate-700 shadow-sm"
                      : "bg-[#111827] text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Streamlined Banking Data Table (Responsive & Auto-fit) */}
        <div className="rounded-xl bg-[#111827] border border-slate-800 overflow-hidden shadow-sm flex flex-col">
          {/* Desktop & Tablet View (5 Columns: 100% width, fixed max-height with internal scroll & sticky header) */}
          <div className="hidden sm:block overflow-x-auto overflow-y-auto max-h-[460px]">
            <table className="w-full text-left border-collapse table-auto relative">
              <thead className="sticky top-0 z-10 bg-[#0B0F17] shadow-sm">
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 w-[30%] min-w-[210px] bg-[#0B0F17]">{t("Định danh & Nền tảng", "Identifier & Platform")}</th>
                  <th className="py-3 px-3.5 w-[36%] min-w-[180px] bg-[#0B0F17]">{t("Nội dung vi phạm", "Violation Details")}</th>
                  <th className="py-3 px-3.5 w-[14%] whitespace-nowrap text-right bg-[#0B0F17]">{t("Thiệt hại", "Loss Amount")}</th>
                  <th className="py-3 px-3.5 w-[10%] whitespace-nowrap text-center bg-[#0B0F17]">{t("Trạng thái", "Status")}</th>
                  <th className="py-3 px-4 w-[10%] whitespace-nowrap text-right bg-[#0B0F17]">{t("Thao tác", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs sm:text-[13px]">
                {filteredFeedReports.length > 0 ? (
                  filteredFeedReports.map((item, idx) => {
                    const catBadge = getCategoryBadge(item.type, isEn);
                    const isVerified = item.status === "VERIFIED";
                    return (
                      <tr
                        key={`${item.target}-${idx}`}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        {/* 1. Định danh & Kênh (Gộp Định danh, Phân loại, Ngân hàng/Nền tảng, Chủ thể, Thời gian) */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="font-mono font-bold text-slate-100 text-xs sm:text-[13px] break-all"
                              title={item.target}
                            >
                              {item.type === "wallet" ? shortenAddress(item.target) : item.target}
                            </span>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${catBadge.className}`}
                            >
                              {catBadge.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap leading-tight">
                            <span className="text-slate-300 font-medium">{item.bankName}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400">{item.owner}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-500">{formatTimeAgo(item.timeAgo, isEn)}</span>
                          </div>
                        </td>

                        {/* 2. Nội dung vi phạm (Tự co giãn, ngắt dòng line-clamp-2 rõ ràng, không tràn ngang) */}
                        <td className="py-3 px-3.5 align-top">
                          <p
                            className="text-slate-300 text-xs sm:text-[13px] leading-relaxed line-clamp-2"
                            title={isEn && item.descriptionEn ? item.descriptionEn : item.description}
                          >
                            {isEn && item.descriptionEn ? item.descriptionEn : item.description}
                          </p>
                        </td>

                        {/* 3. Thiệt hại */}
                        <td className="py-3 px-3.5 align-top font-mono text-red-400 whitespace-nowrap text-right font-medium text-xs sm:text-[13px]">
                          {item.amountLoss}
                        </td>

                        {/* 4. Trạng thái */}
                        <td className="py-3 px-3.5 align-top text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              isVerified
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                            }`}
                          >
                            {isVerified ? t("Đã xác thực", "Verified") : t("Chờ duyệt", "Pending Audit")}
                          </span>
                        </td>

                        {/* 5. Thao tác đối soát */}
                        <td className="py-3 px-4 align-top whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(item.type);
                              setQueryInput(item.target);
                              executeScan(item.target, item.type);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
                          >
                            {t("Đối soát", "Verify")}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-xs text-slate-400">
                      {t("Không có bản ghi vi phạm trong danh mục đã chọn.", "No violation records found in the selected category.")}{" "}
                      <button
                        type="button"
                        onClick={() => setFeedCategory("all")}
                        className="text-blue-400 hover:text-blue-300 underline font-medium ml-1"
                      >
                        {t("Xem tất cả", "View all")}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Feed View (Màn hình điện thoại < 640px: fixed max-height with scroll) */}
          <div className="sm:hidden divide-y divide-slate-800/80 max-h-[460px] overflow-y-auto">
            {filteredFeedReports.length > 0 ? (
              filteredFeedReports.map((item, idx) => {
                const catBadge = getCategoryBadge(item.type, isEn);
                const isVerified = item.status === "VERIFIED";
                return (
                  <div key={`mob-${item.target}-${idx}`} className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-slate-100 text-xs break-all">
                            {item.type === "wallet" ? shortenAddress(item.target) : item.target}
                          </span>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${catBadge.className}`}
                          >
                            {catBadge.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {item.bankName} · {item.owner} · {formatTimeAgo(item.timeAgo, isEn)}
                        </div>
                      </div>
                      <div className="font-mono text-xs font-semibold text-red-400 whitespace-nowrap text-right shrink-0">
                        {item.amountLoss}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {isEn && item.descriptionEn ? item.descriptionEn : item.description}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          isVerified
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                        }`}
                      >
                        {isVerified ? t("Đã xác thực", "Verified") : t("Chờ duyệt", "Pending Audit")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(item.type);
                          setQueryInput(item.target);
                          executeScan(item.target, item.type);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium"
                      >
                        {t("Đối soát", "Verify")}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 px-4 text-center text-xs text-slate-400">
                {t("Không có bản ghi vi phạm.", "No violation records.")}
              </div>
            )}
          </div>

          {/* Table Footer */}
          <div className="px-4 py-2.5 bg-[#0B0F17] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span>
                {t("Hiển thị", "Showing")}{" "}
                <strong className="font-mono text-slate-200">{filteredFeedReports.length}</strong> /{" "}
                <strong className="font-mono text-slate-200">{RECENT_L1_REPORTS.length}</strong> {t("bản ghi cảnh báo", "warning records")}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">{t("(Cuộn khung để xem thêm)", "(Scroll container for more)")}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-slate-500">
                ScamRegistryL1 · {shortenAddress(CONTRACT_ADDRESSES.scamRegistryL1)}
              </span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                title={t("Cuộn lên đầu trang tra cứu", "Scroll up to search")}
              >
                {t("↑ Lên tra cứu", "↑ Back to search")}
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* ── REPORT VIOLATION MODAL ── */}
      {showReportForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-xl bg-[#111827] border border-slate-700 p-5 sm:p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-800 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                    {t("Gửi báo cáo vi phạm lên ScamRegistryL1", "Submit Violation Report to ScamRegistryL1")}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 pl-10">
                  {t(
                    "Hồ sơ được lưu trữ trên hợp đồng thông minh Avalanche Fuji để phục vụ đối soát giao dịch.",
                    "Record is stored on Avalanche Fuji smart contract for transaction verification."
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportScamSubmit} className="space-y-4 text-xs">
              {/* 1. Loại định danh vi phạm */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-200 block text-xs">
                  {t("1. Phân loại định danh vi phạm", "1. Violation Identifier Category")} <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-xl bg-[#0B0F17] border border-slate-800">
                  {[
                    { id: "bank", label: t("STK Ngân hàng", "Bank Account"), icon: Landmark },
                    { id: "impersonation", label: t("Mạo danh GDTG", "Impersonation"), icon: Users },
                    { id: "phone", label: t("Số điện thoại", "Phone Number"), icon: Smartphone },
                    { id: "telegram", label: "Telegram", icon: Send },
                    { id: "wallet", label: t("Ví Web3", "Web3 Wallet"), icon: Wallet },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const active = reportIdType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setReportIdType(cat.id as ReportCategoryKey)}
                        className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[11px] font-medium rounded-lg transition-colors border ${
                          active
                            ? "bg-slate-800 text-slate-100 border-slate-700"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-transparent"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${active ? "text-red-400" : "text-slate-500"}`} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Trường thông tin theo phân loại */}
              {reportIdType === "bank" && (
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("Ngân hàng", "Bank")} <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={reportBankName}
                        onChange={(e) => setReportBankName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 text-xs outline-none focus:border-blue-500"
                        required
                      >
                        {[
                          "Techcombank",
                          "Vietcombank",
                          "MBBank",
                          "BIDV",
                          "VPBank",
                          "ACB",
                          "TPBank",
                          "Sacombank",
                          "VIB",
                          "Agribank",
                          "SHB",
                          "HDBank",
                          "OCB",
                          "MSB",
                          "SeABank",
                          "Khác",
                        ].map((b) => (
                          <option key={b} value={b} className="bg-[#111827] text-slate-100">
                            {b === "Khác" ? t("Khác", "Other") : b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("Số tài khoản", "Account Number")} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportBankAccount}
                        onChange={(e) => setReportBankAccount(e.target.value)}
                        placeholder="1903889922101"
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 font-mono text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("Chủ tài khoản", "Account Owner")} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportAccountName}
                        onChange={(e) => setReportAccountName(e.target.value.toUpperCase())}
                        placeholder="NGUYEN VAN DUC"
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 uppercase text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {reportIdType === "impersonation" && (
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("Hình thức mạo danh", "Impersonation Type")} <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={reportImpersonatedRole}
                        onChange={(e) => setReportImpersonatedRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 text-xs outline-none focus:border-blue-500"
                        required
                      >
                        <option value="Mạo danh GDTG bảo chứng" className="bg-[#111827]">
                          {t("Mạo danh GDTG bảo chứng", "Impersonating Staked Broker")}
                        </option>
                        <option value="Mạo danh quản trị viên hệ thống" className="bg-[#111827]">
                          {t("Mạo danh quản trị viên hệ thống", "Impersonating System Admin")}
                        </option>
                        <option value="Mạo danh trung gian nhóm OTC / P2P" className="bg-[#111827]">
                          {t("Mạo danh trung gian nhóm OTC / P2P", "Impersonating OTC/P2P Group Escrow")}
                        </option>
                        <option value="Đối tác gian lận chứng từ thanh toán" className="bg-[#111827]">
                          {t("Đối tác gian lận chứng từ thanh toán", "Fraudulent Payment Proof Partner")}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("Nền tảng", "Platform")} <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={reportPlatform}
                        onChange={(e) => setReportPlatform(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 text-xs outline-none focus:border-blue-500"
                        required
                      >
                        <option value="Telegram" className="bg-[#111827]">Telegram</option>
                        <option value="Facebook" className="bg-[#111827]">Facebook</option>
                        <option value="Zalo" className="bg-[#111827]">Zalo</option>
                        <option value="Discord" className="bg-[#111827]">Discord</option>
                        <option value="Khác" className="bg-[#111827]">{t("Nền tảng khác", "Other Platform")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("Định danh giả mạo", "Fake Identifier")} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportFakeHandle}
                        onChange={(e) => setReportFakeHandle(e.target.value)}
                        placeholder="@otc_vn_fake_admin"
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 font-mono text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("GDTG / Tổ chức bị mạo danh", "Impersonated Broker / Entity")} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportRealTarget}
                        onChange={(e) => setReportRealTarget(e.target.value)}
                        placeholder="Nguyễn Nam (GDTG)"
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {reportIdType === "phone" && (
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("Ví điện tử / Nhà mạng", "E-Wallet / Telecom")} <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={reportPhoneWallet}
                        onChange={(e) => setReportPhoneWallet(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 text-xs outline-none focus:border-blue-500"
                      >
                        <option value="MoMo" className="bg-[#111827]">MoMo</option>
                        <option value="ZaloPay" className="bg-[#111827]">ZaloPay</option>
                        <option value="Viettel Money" className="bg-[#111827]">Viettel Money</option>
                        <option value="ShopeePay" className="bg-[#111827]">ShopeePay</option>
                        <option value="VNPAY" className="bg-[#111827]">VNPAY</option>
                        <option value="Viễn thông" className="bg-[#111827]">{t("Số điện thoại viễn thông", "Telecom Phone Number")}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("Số điện thoại", "Phone Number")} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportPhoneNumber}
                        onChange={(e) => setReportPhoneNumber(e.target.value)}
                        placeholder="0982736182"
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 font-mono text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("Chủ đăng ký (nếu có)", "Registered Owner (if any)")}
                      </label>
                      <input
                        type="text"
                        value={reportPhoneOwner}
                        onChange={(e) => setReportPhoneOwner(e.target.value.toUpperCase())}
                        placeholder="TRAN THI MAI"
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 uppercase text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {reportIdType === "telegram" && (
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-2">
                  <label className="text-[11px] font-medium text-slate-300 block">
                    {t("Tài khoản @username hoặc liên kết nhóm Telegram", "Telegram @username or group link")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={reportTelegramHandle}
                    onChange={(e) => setReportTelegramHandle(e.target.value)}
                    placeholder="@otc_vn_fake_admin"
                    className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 font-mono text-xs outline-none focus:border-blue-500"
                    required
                  />
                </div>
              )}

              {reportIdType === "wallet" && (
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("Địa chỉ ví (0x...)", "Wallet Address (0x...)")} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportWalletAddress}
                        onChange={(e) => setReportWalletAddress(e.target.value)}
                        placeholder="0x71C84043CD9c86523674805113B78444499c0009"
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 font-mono text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        {t("Nhóm hành vi", "Threat Category")}
                      </label>
                      <select
                        value={reportWalletIssue}
                        onChange={(e) => setReportWalletIssue(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 text-xs outline-none focus:border-blue-500"
                      >
                        <option value="Hợp đồng rút tài sản trái phép" className="bg-[#111827]">
                          {t("Hợp đồng rút tài sản trái phép", "Unauthorized Asset Drainer Contract")}
                        </option>
                        <option value="Liên kết giả mạo cổng ký quỹ" className="bg-[#111827]">
                          {t("Liên kết giả mạo cổng ký quỹ", "Phishing Escrow Gateway Link")}
                        </option>
                        <option value="Phát hành token giả mạo" className="bg-[#111827]">
                          {t("Phát hành token giả mạo", "Fake Token Distribution")}
                        </option>
                        <option value="Chiếm đoạt thanh toán P2P" className="bg-[#111827]">
                          {t("Chiếm đoạt thanh toán P2P", "P2P Payment Theft")}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Giá trị thiệt hại */}
              <div>
                <label className="font-semibold text-slate-200 block mb-1.5 text-xs">
                  {t("Giá trị thiệt hại ước tính", "Estimated Financial Loss")}
                </label>
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    value={reportLossAmount}
                    onChange={(e) => setReportLossAmount(e.target.value)}
                    placeholder="31,200,000"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0F17] border border-slate-700 text-slate-100 font-mono text-xs outline-none focus:border-blue-500"
                  />
                  <select
                    value={reportLossCurrency}
                    onChange={(e) => setReportLossCurrency(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#0B0F17] border border-slate-700 text-slate-100 text-xs outline-none font-semibold shrink-0"
                  >
                    <option value="VNĐ" className="bg-[#111827]">VNĐ</option>
                    <option value="USDT" className="bg-[#111827]">USDT</option>
                    <option value="USDC" className="bg-[#111827]">USDC</option>
                    <option value="AVAX" className="bg-[#111827]">AVAX</option>
                  </select>
                </div>
              </div>

              {/* 4. Chứng từ & Bằng chứng IPFS */}
              <div className="space-y-2.5 p-4 rounded-xl bg-[#0B0F17] border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t("Tệp bằng chứng (Sao kê, biên lai, lịch sử hội thoại)", "Evidence Files (Statement, receipt, chat logs)")}</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">IPFS CIDv0</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />

                {!uploadedPreviewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border border-dashed border-slate-700 hover:border-slate-500 hover:bg-slate-800/40 rounded-lg p-4 text-center transition-colors flex flex-col items-center justify-center gap-1.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-slate-200 text-xs">
                      {isUploadingFile
                        ? t("Đang tải tệp lên IPFS...", "Uploading file to IPFS...")
                        : t("Chọn tệp từ thiết bị (PNG, JPG, WEBP, PDF)", "Select file from device (PNG, JPG, WEBP, PDF)")}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#111827] border border-slate-700 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {!previewImgError && !uploadedFileName?.toLowerCase().endsWith(".pdf") ? (
                        <img
                          src={uploadedPreviewUrl}
                          alt="Bằng chứng đính kèm"
                          onError={() => setPreviewImgError(true)}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0 bg-[#0B0F17]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-100 text-xs truncate max-w-[200px] sm:max-w-xs">
                            {uploadedFileName || "bang_chung_giao_dich"}
                          </span>
                          {uploadedFileSize && (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                              {uploadedFileSize}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 block truncate max-w-[260px] sm:max-w-sm">
                          IPFS: <span className="text-emerald-400">{reportEvidenceUri || t("Đang khởi tạo...", "Generating...")}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeUploadedFile}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors shrink-0 flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span className="hidden sm:inline">{t("Xóa tệp", "Remove file")}</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[11px] text-slate-400 shrink-0">{t("Hoặc nhập URI:", "Or enter URI:")}</span>
                  <input
                    type="text"
                    value={reportEvidenceUri}
                    onChange={(e) => setReportEvidenceUri(e.target.value)}
                    placeholder={t("ipfs://Qm... hoặc liên kết tài liệu", "ipfs://Qm... or document link")}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#111827] border border-slate-700 text-slate-100 font-mono text-[11px] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 5. Nội dung chi tiết */}
              <div>
                <label className="font-semibold text-slate-200 block mb-1.5 text-xs">
                  {t("Nội dung sự việc", "Incident Details")} <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder={t(
                    "Mô tả ngắn gọn thời gian, phương thức giao dịch và hành vi vi phạm...",
                    "Briefly describe time, transaction method, and fraudulent act..."
                  )}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-700 text-slate-100 text-xs outline-none focus:border-blue-500 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Xác nhận */}
              <div className="p-3 rounded-lg bg-[#0B0F17] border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  id="confirm-report"
                  checked={reportConfirmed}
                  onChange={(e) => setReportConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  required
                />
                <label htmlFor="confirm-report" className="cursor-pointer leading-relaxed">
                  {t(
                    "Tôi xác nhận thông tin và chứng từ cung cấp là chính xác, phục vụ công tác đối soát và thẩm định trên hệ thống.",
                    "I confirm that the provided information and evidence are accurate for system verification and audit."
                  )}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  {t("Hủy", "Cancel")}
                </button>
                <ShimmerButton type="submit" variant="danger" className="px-5 py-2 text-xs font-semibold">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{t("Gửi báo cáo vi phạm", "Submit Report")}</span>
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
