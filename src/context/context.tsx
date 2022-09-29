import {
    createContext,
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
    isReady: true,
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

    const { smartWallets, token, loader, worker, collector } = state;

    const refreshSmartWallets = () => {
        smartWallets.forEach(async (smartWallet) => {
            const newSmartWallet = {
                ...smartWallet,
                rbtcBalance: Utils.fromWei(
                    await Utils.getBalance(smartWallet.address)
                ),
                tokenBalance: Utils.fromWei(
                    await Utils.tokenBalance(
                        smartWallet.address,
                        token!.address
                    )
                )
            } as SmartWalletWithBalance;

            dispatch({
                type: 'update_smart_wallet',
                smartWallet: newSmartWallet
            });
        });
    };

    const getTokenBalance = async (address: string, tokenAddress: string) => {
        try {
            const balance = Utils.fromWei(
                await Utils.tokenBalance(address, tokenAddress)
            );
            return { address, balance };
        } catch (error) {
            console.error(error);
            return { address, balance: '0' };
        }
    };

    const refreshPartnersBalances = async () => {
        if (worker && collector && token) {
            const localPartners: Partner[] = [worker, collector];
            const updatedBalances = await Promise.all(
                localPartners.map((partner) =>
                    getTokenBalance(partner.address, token.address)
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
    };

    useEffect(() => {
        if (loader || token) {
            dispatch({
                type: 'set_loader',
                show: false
            });
            refreshSmartWallets();
            refreshPartnersBalances();
        }
    }, [token, loader]);

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
