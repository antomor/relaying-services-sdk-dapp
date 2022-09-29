import { SmartWallet } from '@rsksmart/rif-relay-sdk';

export interface SmartWalletWithBalance extends SmartWallet {
    tokenBalance: string;
    rbtcBalance: string;
}

export type Partner = {
    address: string;
    balance: string;
};

export type Token = {
    address: string;
    symbol: string;
    decimals: number;
};

export type Modals = {
    deploy: boolean;
    execute: boolean;
    receive: boolean;
    transfer: boolean;
    transactions: boolean;
    validate: boolean;
};

export type Transaction = {
    date: Date;
    id: string;
    type: string;
};
