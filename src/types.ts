import { SmartWallet } from '@rsksmart/rif-relay-sdk';

export interface SmartWalletWithBalance extends SmartWallet {
    balance: string;
    rbtcBalance: string;
}

export interface Token {
    address: string;
    symbol: string;
    decimals: number;
}

export interface Modals {
    deploy: boolean;
    execute: boolean;
    receive: boolean;
    transfer: boolean;
    transactions: boolean;
}

export interface Transaction {
    date: Date;
    id: string;
    type: string;
}
