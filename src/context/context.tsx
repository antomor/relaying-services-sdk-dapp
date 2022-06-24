import { createContext, useReducer, useContext, useMemo } from 'react';
import StoreReducer from 'src/context/reducer';
import { ProviderProps, State, Dispatch } from 'src/context/types';

const initialState: State = {
    account: '',
    connected: false,
    provider: undefined,
    chainId: 0,
    loader: false,
    token: undefined,
    smartWallet: undefined
};

const Context = createContext<{ state: State; dispatch: Dispatch } | undefined>(
    undefined
);

function StoreProvider({ children }: ProviderProps) {
    const [state, dispatch] = useReducer(StoreReducer, initialState);

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
