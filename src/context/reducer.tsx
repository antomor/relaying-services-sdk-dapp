import { Action, State } from 'src/context/types';

const StoreReducer = (state: State, action: Action) => {
    switch (action.type) {
        case 'set_account':
            return {
                ...state,
                account: action.account
            };
        case 'set_connected':
            return {
                ...state,
                connected: action.connected
            };
        case 'set_provider':
            console.log(action.provider);
            return {
                ...state,
                provider: action.provider
            };
        case 'set_chain_id':
            return {
                ...state,
                chainId: action.chainId
            };
        case 'set_loader':
            return {
                ...state,
                loader: action.loader
            };
        case 'set_token':
            return {
                ...state,
                token: action.token
            };
        case 'set_smart_wallet':
            return {
                ...state,
                smartWallet: action.smartWallet
            };
        default:
            return state;
    }
};

export default StoreReducer;
