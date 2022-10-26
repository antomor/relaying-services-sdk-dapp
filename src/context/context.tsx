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
import { Partner, SmartWalletWithBalance } from 'src/types';
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
    modals: {
        deploy: false,
        execute: false,
        receive: false,
        transfer: false,
        transactions: false,
        validate: false
    },
    smartWallets: [],
    worker: undefined,
    collector: undefined,
    partners: []
};

const Context = createContext<{ state: State; dispatch: Dispatch } | undefined>(
    undefined
);

function StoreProvider({ children }: ProviderProps) {
    const [state, dispatch] = useReducer(StoreReducer, initialState);

    const { smartWallets, token, reload, worker, collector, partners } = state;

    const getSmartWalletBalance = async (
        smartWalelt: SmartWalletWithBalance
    ) => {
        try {
            const [tokenBalance, rbtcBalance] = await Promise.all([
                await Utils.getTokenBalance(smartWalelt.address, token!, true),
                await Utils.getBalance(smartWalelt.address, true)
            ]);
            return {
                ...smartWalelt,
                tokenBalance,
                rbtcBalance
            };
        } catch (error) {
            console.error(error);
            return {
                ...smartWalelt,
                tokenBalance: '-',
                rbtcBalance: '-'
            };
        }
    };

    const refreshSmartWallets = useCallback(async () => {
        if (token) {
            const updatedBalances = await Promise.all(
                smartWallets.map((wallet) => getSmartWalletBalance(wallet))
            );
            dispatch({
                type: 'set_smart_wallets',
                smartWallets: updatedBalances
            });
        }
    }, [token, reload]);

    const getPartnerBalance = async (address: string) => {
        try {
            const balance = await Utils.getTokenBalance(address, token!, true);
            return { address, balance };
        } catch (error) {
            console.error(error);
            return { address, balance: '-' };
        }
    };

    const refreshPartnersBalances = useCallback(async () => {
        if (worker && token) {
            let localPartners: Partner[];
            if (collector) {
                localPartners = [worker, collector, ...partners];
            } else {
                localPartners = [worker];
            }
            const updatedBalances = await Promise.all(
                localPartners.map((partner) =>
                    getPartnerBalance(partner.address)
                )
            );
            const [newWorker, newCollector, ...newPartners] = updatedBalances;
            dispatch({
                type: 'set_partners',
                worker: newWorker,
                collector: newCollector,
                partners: newPartners
            });
        }
    }, [token, reload]);

    useEffect(() => {
        if (reload || token) {
            refreshSmartWallets();
            refreshPartnersBalances();
            dispatch({
                type: 'reload',
                reload: false
            });
        }
    }, [token, reload]);

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
