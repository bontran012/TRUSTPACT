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
      target: {
        id: "metaMask",
        name: "MetaMask",
        provider: (window: any) => {
          if (!window) return undefined;
          if (window.ethereum?.providers?.length) {
            return window.ethereum.providers.find(
              (p: any) => p.isMetaMask && !p.isPhantom
            );
          }
          if (window.ethereum?.isMetaMask && !window.ethereum?.isPhantom) {
            return window.ethereum;
          }
          return undefined;
        },
      },
      shimDisconnect: true,
    }),
    injected({
      target: {
        id: "core",
        name: "Core Wallet",
        provider: (window: any) => {
          if (!window) return undefined;
          if (window.avalanche) return window.avalanche;
          if (window.ethereum?.providers?.length) {
            return window.ethereum.providers.find((p: any) => p.isAvalanche);
          }
          if (window.ethereum?.isAvalanche) return window.ethereum;
          return undefined;
        },
      },
      shimDisconnect: true,
    }),
    injected({
      target: {
        id: "rabby",
        name: "Rabby Wallet",
        provider: (window: any) => {
          if (!window) return undefined;
          if (window.rabby) return window.rabby;
          if (window.ethereum?.providers?.length) {
            return window.ethereum.providers.find((p: any) => p.isRabby);
          }
          if (window.ethereum?.isRabby) return window.ethereum;
          return undefined;
        },
      },
      shimDisconnect: true,
    }),
    injected({
      target: {
        id: "phantom",
        name: "Phantom",
        provider: (window: any) => {
          if (!window) return undefined;
          if (window.phantom?.ethereum) return window.phantom.ethereum;
          if (window.ethereum?.providers?.length) {
            return window.ethereum.providers.find((p: any) => p.isPhantom);
          }
          if (window.ethereum?.isPhantom) return window.ethereum;
          return undefined;
        },
      },
      shimDisconnect: true,
    }),
    injected({
      target: {
        id: "injected",
        name: "Trình duyệt Web3",
        provider: (window: any) => window?.ethereum,
      },
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
