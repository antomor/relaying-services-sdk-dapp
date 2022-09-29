import {
    Action,
    SET_ACCOUNT_ACTION,
    SET_CHAIN_ID_ACTION,
    SET_CONNECTED_ACTION,
    SET_LOADER_ACTION,
    SET_PROVIDER_ACTION,
    SET_TOKEN_ACTION,
    SET_SMART_WALLET_ACTION,
    SET_SMART_WALLETS_ACTION,
    ADD_SMART_WALLET_ACTION,
    UPDATE_SMART_WALLET_ACTION,
    SET_MODALS_ACTION,
    State,
    SET_PARTNERS_ACTION
} from 'src/context/types';

const StoreReducer = (state: State, action: Action) => {
    switch (action.type) {
        case SET_ACCOUNT_ACTION:
            return {
                ...state,
                account: action.account
            };
        case SET_CONNECTED_ACTION:
            return {
                ...state,
                connected: action.connected
            };
        case SET_PROVIDER_ACTION:
            return {
                ...state,
                provider: action.provider
            };
        case SET_CHAIN_ID_ACTION:
            return {
                ...state,
                chainId: action.chainId
            };
        case SET_LOADER_ACTION:
            return {
                ...state,
                loader: action.show
            };
        case SET_TOKEN_ACTION:
            return {
                ...state,
                token: action.token
            };
        case SET_SMART_WALLET_ACTION:
            return {
                ...state,
                smartWallet: action.smartWallet
            };
        case SET_SMART_WALLETS_ACTION:
            return {
                ...state,
                smartWallets: action.smartWallets
            };
        case ADD_SMART_WALLET_ACTION:
            return {
                ...state,
                smartWallets: [...state.smartWallets, action.smartWallet]
            };
        case UPDATE_SMART_WALLET_ACTION:
            return {
                ...state,
                smartWallets: state.smartWallets.map((wallet) =>
                    wallet.address === action.smartWallet.address
                        ? action.smartWallet
                        : wallet
                )
            };
        case SET_MODALS_ACTION:
            return {
                ...state,
                modals: { ...state.modals, ...action.modal }
            };
        case SET_PARTNERS_ACTION:
            return {
                ...state,
                worker: action.worker,
                collector: action.collector,
                partners: action.partners
            };
        default:
            return state;
    }
};

export default StoreReducer;
