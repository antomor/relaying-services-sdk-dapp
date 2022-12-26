import type { ERC20 } from "@rsksmart/rif-relay-contracts";

export type SmartWallet = {
    index: number;
    address: string;
    isDeployed: boolean;
    tokenBalance: string;
    rbtcBalance: string;
}

export type ERC20Token = {
    instance: ERC20;
    symbol: string;
    name: string;
    decimals: number;
}

export type Partner = {
    address: string;
    balance: string;
};

export type Modals = {
    deploy: boolean;
    execute: boolean;
    receive: boolean;
    transfer: boolean;
    transactions: boolean;
    validate: boolean;
};

export type LocalTransaction = {
    date: Date;
    id: string;
    type: string;
};
