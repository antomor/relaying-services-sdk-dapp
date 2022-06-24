import { ReactNode } from 'react';
import { RelayingServices } from '@rsksmart/rif-relay-sdk';
import { SmartWalletWithBalance, Token } from 'src/types';

export type Action =
    | { type: 'set_account'; account: string }
    | { type: 'set_connected'; connected: boolean }
    | { type: 'set_provider'; provider: RelayingServices }
    | { type: 'set_chain_id'; chainId: number }
    | { type: 'set_loader'; loader: boolean }
    | { type: 'set_token'; token: Token }
    | { type: 'set_smart_wallet'; smartWallet: SmartWalletWithBalance };

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
