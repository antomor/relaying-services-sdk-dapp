import { RelayingServices } from '@rsksmart/rif-relay-sdk';
import { ReactNode } from 'react';
import { SmartWalletWithBalance, Token } from 'src/types';

export const SET_ACCOUNT_ACTION = 'set_account';
export const SET_CONNECTED_ACTION = 'set_connected';
export const SET_PROVIDER_ACTION = 'set_provider';
export const SET_CHAIN_ID_ACTION = 'set_chain_id';
export const SET_LOADER_ACTION = 'set_loader';
export const SET_TOKEN_ACTION = 'set_token';
export const SET_SMART_WALLET_ACTION = 'set_smart_wallet';

export type Action =
    | { type: typeof SET_ACCOUNT_ACTION; account: string }
    | { type: typeof SET_CONNECTED_ACTION; connected: boolean }
    | { type: typeof SET_PROVIDER_ACTION; provider: RelayingServices }
    | { type: typeof SET_CHAIN_ID_ACTION; chainId: number }
    | { type: typeof SET_LOADER_ACTION; show: boolean }
    | { type: typeof SET_TOKEN_ACTION; token: Token }
    | {
          type: typeof SET_SMART_WALLET_ACTION;
          smartWallet: SmartWalletWithBalance;
      };

export type Dispatch = (action: Action) => void;

export type ProviderProps = { children: ReactNode };

export type State = {
    account: string;
    connected: boolean;
    provider: RelayingServices | undefined;
    chainId: number;
    loader: boolean;
    token: Token | undefined;
    smartWallet: SmartWalletWithBalance | undefined;
};
