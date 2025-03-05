"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { config } from "./../../config";
import { ConnectKitProvider } from "connectkit";

const queryClient = new QueryClient();

export function Web3Provider(props: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {/* <LensProvider> */}
          {props.children}
          {/* </LensProvider> */}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
