import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer
} from 'react';
import StoreReducer from 'src/context/reducer';
import { Dispatch, ProviderProps, State } from 'src/context/types';
import { SmartWalletWithBalance } from 'src/types';
import Utils from 'src/Utils';

const initialState: State = {
    account: '',
    connected: false,
    provider: undefined,
    chainId: 0,
    loader: false,
    token: undefined,
    smartWallet: undefined,
    reload: false,
    reloadPartners: false,
    reloadToken: false,
    modals: {
        deploy: false,
        execute: false,
        receive: false,
        transfer: false,
        transactions: false,
        validate: false
    },
    smartWallets: []
};

const Context = createContext<{ state: State; dispatch: Dispatch } | undefined>(
    undefined
);

function StoreProvider({ children }: ProviderProps) {
    const [state, dispatch] = useReducer(StoreReducer, initialState);

    const { smartWallets, token, reload } = state;

    const getSmartWalletBalance = async (
        smartWallet: SmartWalletWithBalance
    ): Promise<SmartWalletWithBalance> => {
        try {
            const [tokenBalance, rbtcBalance] = await Promise.all([
                await Utils.getTokenBalance(smartWallet.address, token!),
                await Utils.getBalance(smartWallet.address)
            ]);
            return {
                ...smartWallet,
                tokenBalance,
                rbtcBalance
            };
        } catch (error) {
            console.error(error);
            return {
                ...smartWallet,
                tokenBalance: '-',
                rbtcBalance: '-'
            };
        }
    };

    const refreshSmartWallets = useCallback(async () => {
        if (token && reload) {
            const updatedBalances = await Promise.all(
                smartWallets.map((wallet: SmartWalletWithBalance) =>
                    getSmartWalletBalance(wallet)
                )
            );
            dispatch({
                type: 'set_smart_wallets',
                smartWallets: updatedBalances
            });
        }
    }, [token, reload]);

    useEffect(() => {
        refreshSmartWallets();
        dispatch({
            type: 'reload',
            reload: false
        });
    }, [refreshSmartWallets]);

    const value = useMemo(() => ({ state, dispatch }), [state]);
    return <Context.Provider value={value}>{children}</Context.Provider>;
}

function useStore() {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}

export { StoreProvider, useStore };
