import {
    Action,
    SET_ACCOUNT_ACTION,
    SET_CHAIN_ID_ACTION,
    SET_CONNECTED_ACTION,
    SET_LOADER_ACTION,
    SET_PROVIDER_ACTION,
    SET_SMART_WALLET_ACTION,
    SET_TOKEN_ACTION,
    State
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
            console.log(action.provider);
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
                loader: action.loader
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
        default:
            return state;
    }
};

export default StoreReducer;
