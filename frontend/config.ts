"use client";

import { getDefaultConfig } from "connectkit";
import { createConfig, createStorage } from "wagmi";
// import { mainnet, base } from 'wagmi/chains';
import { chains } from "@lens-network/sdk/viem";

export const config = createConfig(
  getDefaultConfig({
    appName: "AI Agent Arena",
    chains: [chains.testnet],
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    storage:
      typeof window !== "undefined"
        ? createStorage({ storage: window.localStorage })
        : undefined,
  })
);

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
