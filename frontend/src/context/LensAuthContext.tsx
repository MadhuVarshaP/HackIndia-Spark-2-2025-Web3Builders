// "use client";
// // src/context/LensAuthContext.tsx
// import React, { createContext, useContext, useState, useEffect } from "react";
// import { lensClient } from "../lib/lens-client";
// import { chains } from "@lens-network/sdk/viem";
// import {
//   CreateAccountWithUsernameResult,
//   PublicClient,
//   ResultAsync,
//   UnauthenticatedError,
//   UnexpectedError,
//   testnet as protocolTestnet,
//   evmAddress,
// } from "@lens-protocol/client";
// import { type Address, createWalletClient, custom } from "viem";
// import { MetaMaskInpageProvider } from "@metamask/providers";

// interface LensAuthContextType {
//   isAuthenticated: boolean;
//   profile: any;
//   login: () => Promise<void>;
//   logout: () => Promise<void>;
// }

// const LensAuthContext = createContext<LensAuthContextType | undefined>(
//   undefined
// );

// export const LensAuthProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [session, setSession] = useState<any>(null);
//   const [profile, setProfile] = useState<any>(null);

//   const chain = chains.testnet;

//   useEffect(() => {
//     const resumeSession = async () => {
//       const resumed = await lensClient.resumeSession();
//       if (resumed.isOk()) {
//         setSession(resumed.value);
//       }
//     };
//     resumeSession();
//   }, []);

//   const login = async () => {
//     try {
//       if (!window.ethereum) {
//         throw new Error("MetaMask not installed");
//       }

//       const [address] = (await window.ethereum!.request({
//         method: "eth_requestAccounts",
//       })) as [Address];

//       const walletClient = createWalletClient({
//         account: address,
//         chain,
//         transport: custom(window.ethereum!),
//       });

//       const newClient = PublicClient.create({
//         environment: protocolTestnet,
//       });
//       // Using test app address for development
//       const testAppAddress = "0xe5439696f4057aF073c0FB2dc6e5e755392922e1";

//       // You'll need to implement getWalletClient() based on your wallet integration
//       //   const wallet = await getWalletClient();

//       const result = await lensClient.login({
//         onboardingUser: {
//           app: testAppAddress,
//           wallet: walletClient.account.address,
//         },
//         signMessage: (message) => walletClient.signMessage({ message }),
//       });

//       if (result.isOk()) {
//         setSession(result.value);
//       }
//     } catch (error) {
//       console.error("Login failed:", error);
//     }
//   };

//   const logout = async () => {
//     if (session) {
//       await session.logout();
//       setSession(null);
//       setProfile(null);
//     }
//   };

//   return (
//     <LensAuthContext.Provider
//       value={{
//         isAuthenticated: !!session,
//         profile,
//         login,
//         logout,
//       }}
//     >
//       {children}
//     </LensAuthContext.Provider>
//   );
// };

// export const useLensAuth = () => {
//   const context = useContext(LensAuthContext);
//   if (context === undefined) {
//     throw new Error("useLensAuth must be used within a LensAuthProvider");
//   }
//   return context;
// };
