export interface VerifiedBroker {
  id: string;
  name: string;
  role: string;
  telegram: string;
  depositUsdc: number;
  walletAddress: `0x${string}`;
  officialBank: {
    bankName: string;
    accountNumber: string;
    accountOwner: string;
  };
}

export const VERIFIED_BROKERS: VerifiedBroker[] = [
  {
    id: "nam_broker",
    name: "Nguyễn Nam (GDTG Bảo Chứng)",
    role: "Giám Định Viên / GDTG Độc Lập",
    telegram: "@nam_escrow_official",
    depositUsdc: 5000,
    walletAddress: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    officialBank: {
      bankName: "MBBank",
      accountNumber: "099999998888",
      accountOwner: "NGUYEN HOANG NAM",
    },
  },
  {
    id: "hoangminh_otc",
    name: "Hoàng Minh (OTC Custodian)",
    role: "Thương Nhân OTC Cọc Lớn",
    telegram: "@hoangminh_otc",
    depositUsdc: 12450,
    walletAddress: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
    officialBank: {
      bankName: "Vietcombank",
      accountNumber: "999988887777",
      accountOwner: "HOANG MINH",
    },
  },
];
