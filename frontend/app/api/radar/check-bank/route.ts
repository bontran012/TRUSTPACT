import { NextRequest, NextResponse } from "next/server";
import { SEED_SCAM_DATABASE } from "@/src/data/seedScamDatabase";
import { VERIFIED_BROKERS } from "@/src/data/verifiedBrokers";
import { readDB } from "@/src/lib/server/db";

interface BankInfo {
  code: string;
  shortName: string;
  name: string;
  bin: string;
  logo: string;
}

const VIETNAM_BANKS: BankInfo[] = [
  { code: "TCB", shortName: "Techcombank", name: "Ngân hàng TMCP Kỹ Thương Việt Nam", bin: "970407", logo: "https://cdn.vietqr.io/img/TCB.png" },
  { code: "VCB", shortName: "Vietcombank", name: "Ngân hàng TMCP Ngoại Thương Việt Nam", bin: "970436", logo: "https://cdn.vietqr.io/img/VCB.png" },
  { code: "MB", shortName: "MBBank", name: "Ngân hàng TMCP Quân Đội", bin: "970422", logo: "https://cdn.vietqr.io/img/MB.png" },
  { code: "BIDV", shortName: "BIDV", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", bin: "970418", logo: "https://cdn.vietqr.io/img/BIDV.png" },
  { code: "VPB", shortName: "VPBank", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng", bin: "970432", logo: "https://cdn.vietqr.io/img/VPB.png" },
  { code: "ACB", shortName: "ACB", name: "Ngân hàng TMCP Á Châu", bin: "970416", logo: "https://cdn.vietqr.io/img/ACB.png" },
  { code: "TPB", shortName: "TPBank", name: "Ngân hàng TMCP Tiên Phong", bin: "970423", logo: "https://cdn.vietqr.io/img/TPB.png" },
  { code: "STB", shortName: "Sacombank", name: "Ngân hàng TMCP Sài Gòn Thương Tín", bin: "970403", logo: "https://cdn.vietqr.io/img/STB.png" },
  { code: "VIB", shortName: "VIB", name: "Ngân hàng TMCP Quốc tế Việt Nam", bin: "970441", logo: "https://cdn.vietqr.io/img/VIB.png" },
  { code: "VBA", shortName: "Agribank", name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn VN", bin: "970405", logo: "https://cdn.vietqr.io/img/VBA.png" },
  { code: "ICB", shortName: "VietinBank", name: "Ngân hàng TMCP Công thương Việt Nam", bin: "970415", logo: "https://cdn.vietqr.io/img/ICB.png" },
  { code: "SHB", shortName: "SHB", name: "Ngân hàng TMCP Sài Gòn - Hà Nội", bin: "970443", logo: "https://cdn.vietqr.io/img/SHB.png" },
  { code: "HDB", shortName: "HDBank", name: "Ngân hàng TMCP Phát triển TP.HCM", bin: "970437", logo: "https://cdn.vietqr.io/img/HDB.png" },
  { code: "OCB", shortName: "OCB", name: "Ngân hàng TMCP Phương Đông", bin: "970448", logo: "https://cdn.vietqr.io/img/OCB.png" },
  { code: "MSB", shortName: "MSB", name: "Ngân hàng TMCP Hàng Hải Việt Nam", bin: "970426", logo: "https://cdn.vietqr.io/img/MSB.png" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountNumber = searchParams.get("accountNumber")?.trim() || "";
  const bankQuery = searchParams.get("bank")?.trim() || "";
  const claimedBrokerId = searchParams.get("claimedBrokerId")?.trim() || "";

  if (!accountNumber || accountNumber.length < 6) {
    return NextResponse.json(
      { success: false, error: "Số tài khoản không hợp lệ (tối thiểu 6 ký tự số)" },
      { status: 400 }
    );
  }

  // 2. Check Match in Server DB (dynamic on-chain reports) & Seed Scam Database
  const db = readDB();
  const dbScamMatch = db.scams.find(
    (s) => s.identifier.replace(/\s+/g, "") === accountNumber.replace(/\s+/g, "")
  );

  const localMatch = SEED_SCAM_DATABASE.find(
    (item) => item.type === "bank" && item.target === accountNumber
  );

  // 3. Check if this account belongs to an official verified broker
  const matchedOfficialBroker = VERIFIED_BROKERS.find(
    (b) => b.officialBank.accountNumber === accountNumber
  );

  // 1. Resolve Bank Info
  let resolvedBank = bankQuery
    ? VIETNAM_BANKS.find(
        (b) =>
          b.code.toLowerCase() === bankQuery.toLowerCase() ||
          b.shortName.toLowerCase().includes(bankQuery.toLowerCase()) ||
          b.bin === bankQuery
      )
    : undefined;

  if (!resolvedBank && matchedOfficialBroker) {
    resolvedBank = VIETNAM_BANKS.find(
      (b) => b.shortName.toLowerCase() === matchedOfficialBroker.officialBank.bankName.toLowerCase()
    );
  }

  if (!resolvedBank) {
    if (accountNumber.startsWith("190")) {
      resolvedBank = VIETNAM_BANKS.find((b) => b.code === "TCB");
    } else if (accountNumber.startsWith("001") || accountNumber.startsWith("049") || accountNumber.startsWith("102") || accountNumber.startsWith("9999")) {
      resolvedBank = VIETNAM_BANKS.find((b) => b.code === "VCB");
    } else if (accountNumber.startsWith("882") || accountNumber.startsWith("09")) {
      resolvedBank = VIETNAM_BANKS.find((b) => b.code === "MB");
    } else {
      resolvedBank = VIETNAM_BANKS[0]; // Techcombank default
    }
  }

  // Determine Verified Actual Name (without fabricated Napas names)
  let actualAccountName =
    localMatch?.owner ||
    (dbScamMatch ? "TÀI KHOẢN BỊ TỐ CÁO ON-CHAIN (SCAMREGISTRY L1)" : "") ||
    matchedOfficialBroker?.officialBank.accountOwner ||
    "Chưa niêm yết trong Danh Bạ Bảo Chứng";
  let isKnownScammer = Boolean(localMatch || dbScamMatch);

  // 4. Broker Impersonation Check (Đối soát danh bạ bảo chứng on-chain)
  let isBrokerImpersonation = false;
  let impersonationDetails = "";
  let targetBroker: (typeof VERIFIED_BROKERS)[0] | undefined;

  if (claimedBrokerId && claimedBrokerId !== "none") {
    targetBroker = VERIFIED_BROKERS.find((b) => b.id === claimedBrokerId);

    if (targetBroker) {
      const isOfficialMatch =
        targetBroker.officialBank.accountNumber === accountNumber &&
        targetBroker.officialBank.accountOwner === actualAccountName;

      if (!isOfficialMatch) {
        isBrokerImpersonation = true;
        impersonationDetails = `Đối tác trên mạng tự xưng là "${targetBroker.name}" (đã ký quỹ bảo chứng ${targetBroker.depositUsdc.toLocaleString()} USDC trên Smart Contract), nhưng lại yêu cầu bạn chuyển khoản vào ${resolvedBank?.shortName} (STK: ${accountNumber} - Chủ thẻ: ${actualAccountName}).\n\nTrong khi đó, ${targetBroker.name} chỉ sử dụng duy nhất tài khoản chính chủ đã niêm yết: ${targetBroker.officialBank.bankName} - ${targetBroker.officialBank.accountNumber} (${targetBroker.officialBank.accountOwner}).\n\n⛔ KẺ ĐANG GIAO DỊCH VỚI BẠN LÀ KẺ MẠO DANH 100%!`;
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      accountNumber,
      bank: resolvedBank,
      actualAccountName,
      isKnownScammer,
      isOfficialBrokerAccount: !!matchedOfficialBroker,
      officialBroker: matchedOfficialBroker || null,
      flagsCount: localMatch?.flagsCount || dbScamMatch?.reportsCount || 0,
      scamCategory: localMatch?.scamCategory || (dbScamMatch ? "Báo cáo ScamRegistryL1" : null),
      description: localMatch?.description || dbScamMatch?.reason || null,
      amountLoss: localMatch?.amountLoss || dbScamMatch?.victimLoss || null,
      status: isKnownScammer
        ? "SCAM"
        : matchedOfficialBroker
        ? "VERIFIED_BROKER"
        : "CLEAN",
      napasVerification: {
        verified: Boolean(matchedOfficialBroker),
        source: matchedOfficialBroker
          ? "Danh Bạ GDTG Bảo Chứng On-Chain (StakedBrokerRegistry)"
          : "Sổ Đen Phi Tập Trung (ScamRegistryL1)",
        timestamp: new Date().toISOString(),
      },
      brokerCheck: {
        claimedBrokerId: claimedBrokerId || null,
        targetBroker: targetBroker || null,
        isBrokerImpersonation,
        impersonationDetails,
      },
      verifiedBrokersDirectory: VERIFIED_BROKERS,
    },
  });
}
