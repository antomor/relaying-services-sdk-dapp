import type { RelayClient } from '@rsksmart/rif-relay-client';
import type { providers, Wallet } from 'ethers';
import type { ReactNode } from 'react';
import type { ERC20Token, Modals, SmartWallet } from 'src/types';

export const RELOAD_ACTION = 'reload';
export const RELOAD_PARTNERS_ACTION = 'reload_partners';
export const RELOAD_TOKEN_ACTION = 'reload_token';
export const SET_ACCOUNT_ACTION = 'set_account';
export const SET_CONNECTED_ACTION = 'set_connected';
export const SET_PROVIDER_ACTION = 'set_provider';
export const SET_CHAIN_ID_ACTION = 'set_chain_id';
export const SET_LOADER_ACTION = 'set_loader';
export const SET_TOKEN_ACTION = 'set_token';
export const SET_SMART_WALLET_ACTION = 'set_smart_wallet';
export const SET_SMART_WALLETS_ACTION = 'set_smart_wallets';
export const ADD_SMART_WALLET_ACTION = 'add_smart_wallet';
export const UPDATE_SMART_WALLET_ACTION = 'update_smart_wallet';
export const SET_MODALS_ACTION = 'set_modals';
export const SET_RELAY_CLIENT_ACTION = 'set_relay_client';
export const SET_SIGNATURE_WALLET = 'set_signature_wallet';

export type Action =
  | { type: typeof RELOAD_ACTION; reload: boolean }
  | { type: typeof RELOAD_PARTNERS_ACTION; reloadPartners: boolean }
  | { type: typeof RELOAD_TOKEN_ACTION; reloadToken: boolean }
  | { type: typeof SET_ACCOUNT_ACTION; account: string }
  | { type: typeof SET_CONNECTED_ACTION; connected: boolean }
  | { type: typeof SET_PROVIDER_ACTION; provider: providers.JsonRpcProvider }
  | { type: typeof SET_CHAIN_ID_ACTION; chainId: number }
  | { type: typeof SET_LOADER_ACTION; loader: boolean }
  | { type: typeof SET_TOKEN_ACTION; token: ERC20Token | undefined }
  | {
      type: typeof SET_SMART_WALLET_ACTION;
      smartWallet: SmartWallet;
    }
  | {
      type: typeof SET_SMART_WALLETS_ACTION;
      smartWallets: SmartWallet[];
    }
  | {
      type: typeof ADD_SMART_WALLET_ACTION;
      smartWallet: SmartWallet;
    }
  | {
      type: typeof UPDATE_SMART_WALLET_ACTION;
      smartWallet: SmartWallet;
    }
  | {
      type: typeof SET_MODALS_ACTION;
      modal: Partial<Modals>;
    }
  | {
      type: typeof SET_RELAY_CLIENT_ACTION;
      relayClient: RelayClient;
    }
  | {
    type: typeof SET_SIGNATURE_WALLET;
    wallet: Wallet;
  };

export type Dispatch = (action: Action) => void;

export type ProviderProps = { children: ReactNode };

export type State = {
  account: string;
  connected: boolean;
  provider: providers.JsonRpcProvider | undefined;
  chainId: number;
  loader: boolean;
  token: ERC20Token | undefined;
  smartWallet: SmartWallet | undefined;
  reload: boolean;
  reloadPartners: boolean;
  reloadToken: boolean;
  modals: Modals;
  smartWallets: SmartWallet[];
  relayClient: RelayClient | undefined;
  wallet: Wallet | undefined;
};
