import { SmartWallet } from "relaying-services-sdk";

export interface SmartWalletWithBalance extends SmartWallet {
    balance: string;
    rbtcBalance: string;
}