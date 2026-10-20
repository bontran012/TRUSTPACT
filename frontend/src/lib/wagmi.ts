import { http, createConfig, injected } from "wagmi";
import { defineChain } from "viem";
import { avalancheFuji } from "wagmi/chains";

export const trustpactL1 = defineChain({
  id: Number(process.env.NEXT_PUBLIC_L1_CHAIN_ID || 99943113),
  name: "TrustPact Custom L1",
  nativeCurrency: {
    name: "TrustPact Gasless Token",
    symbol: "PACT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_L1_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "TrustPact Subnet Explorer",
      url: "https://testnet.snowtrace.io",
    },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [avalancheFuji, trustpactL1],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [avalancheFuji.id]: http(process.env.NEXT_PUBLIC_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"),
    [trustpactL1.id]: http(process.env.NEXT_PUBLIC_L1_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
