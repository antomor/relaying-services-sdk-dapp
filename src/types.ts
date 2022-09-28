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
    validate: boolean;
}

export interface Transaction {
    date: Date;
    id: string;
    type: string;
}
