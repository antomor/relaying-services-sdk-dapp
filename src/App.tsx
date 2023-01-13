import { useCallback, useEffect, useState } from 'react';
import { providers } from 'ethers';
import { HttpClient, RelayClient, setEnvelopingConfig, setProvider } from '@rsksmart/rif-relay-client';

import ActionBar from 'src/components/ActionBar';
import Header from 'src/components/Header';
import SmartWallets from 'src/components/SmartWallets';
import Deploy from 'src/modals/Deploy';
import Execute from 'src/modals/Execute';
import Loading from 'src/modals/Loading';
import Receive from 'src/modals/Receive';
import Transfer from 'src/modals/Transfer';
import rLogin from 'src/rLogin';
import 'src/App.css';
import { useStore } from 'src/context/context';
import TransactionHistory from 'src/modals/TransactionHistory';
import Validate from 'src/modals/Validate';
import type { SmartWallet } from 'src/types';
import Snackbar from 'src/components/Snackbar';
import PartnerBalances from 'src/components/PartnerBalances'; 
import { getLocalSmartWallets } from 'src/Utils';


function getEnvParamAsInt(value: string | undefined): number {
    return value ? parseInt(value, 10) : 0;
}

function App() {
    const { state, dispatch } = useStore();
    const { chainId, account, loader, connected, provider, token, reload } =
        state;

    const [errorMessage, setErrorMessage] = useState('');

    const initProvider = async () => { 
        const provider = new providers.Web3Provider(window.ethereum);
        dispatch({ type: 'set_provider', provider });
        
        setEnvelopingConfig({
            logLevel: 1,
            chainId: getEnvParamAsInt(process.env['REACT_APP_RIF_RELAY_CHAIN_ID']),
            preferredRelays: process.env['REACT_APP_RIF_RELAY_PREFERRED_RELAYS']!.split(','),
            relayHubAddress: process.env['REACT_APP_CONTRACTS_RELAY_HUB']!,
            deployVerifierAddress: process.env['REACT_APP_CONTRACTS_DEPLOY_VERIFIER']!,
            relayVerifierAddress: process.env['REACT_APP_CONTRACTS_RELAY_VERIFIER']!,
            smartWalletFactoryAddress: process.env['REACT_APP_CONTRACTS_SMART_WALLET_FACTORY']!,
            forwarderAddress: process.env['REACT_APP_CONTRACTS_SMART_WALLET']!,
            gasPriceFactorPercent: getEnvParamAsInt(process.env['REACT_APP_RIF_RELAY_GAS_PRICE_FACTOR_PERCENT']),
            relayLookupWindowBlocks: getEnvParamAsInt(process.env['REACT_APP_RIF_RELAY_LOOKUP_WINDOW_BLOCKS']),
        });
        setProvider(provider);
        dispatch({ type: 'set_relay_client', relayClient: new RelayClient() });
    }

    useEffect(() => {
        const wallets: SmartWallet[] = getLocalSmartWallets(
            chainId,
            account
        );
        dispatch({ type: 'set_smart_wallets', smartWallets: wallets });
        dispatch({ type: 'reload', reload: true });
    }, [account, chainId, dispatch]);

    const checkServer = useCallback(async () => {
        if (provider && reload) {
            try {
                const httpClient = new HttpClient();
                const { ready } = await httpClient.getChainInfo('http://localhost:8090');
                dispatch({ type: 'reload_partners', reloadPartners: true });
                if (!ready) {
                    setErrorMessage('Server is not ready');
                    return;
                }
                setErrorMessage('');
            } catch (error) {
                setErrorMessage('Server is not reachable');
            }
        }
    }, [reload]);

    useEffect(() => {
        checkServer();
    }, [checkServer]);

    const refreshAccount = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const currentAccount = accounts[0];
        dispatch({ type: 'set_account', account: currentAccount });
    };

    const reloadApp = async () => {
        dispatch({ type: 'set_loader', loader: true });
        await initProvider();
        await refreshAccount();
        dispatch({ type: 'reload_token', reloadToken: true });
        dispatch({ type: 'set_loader', loader: false });
    };

    const connectToRLogin = async () => {
        let isConnected = false;
        try {
            const chainId = window.ethereum.networkVersion;
            if (chainId.toString() === process.env['REACT_APP_RIF_RELAY_CHAIN_ID']) {
                const connect = await rLogin.connect();
                const login = connect.provider;

                login.on('accountsChanged', async (/* accounts */) => {
                    await reloadApp();
                });

                login.on('chainChanged', async (newChain: string) => {
                    dispatch({
                        type: 'set_chain_id',
                        chainId: parseInt(newChain, 16)
                    });
                });
                dispatch({ type: 'set_chain_id', chainId });
                isConnected = true;
            } else {
                alert(
                    `Wrong network ID ${chainId}, it must be ${process.env['REACT_APP_RIF_RELAY_CHAIN_ID']}`
                );
            }
        } catch (error) {
            console.error(error);
        }
        dispatch({ type: 'set_connected', connected: isConnected });
        return isConnected;
    };

    const connect = async () => {
        // TODO refactor this code
        try {
            let isConnected = false;
            if (!connected) {
                isConnected = await connectToRLogin();
            }

            if (isConnected) {
                await reloadApp();
            } else {
                console.warn('Unable to connect to Metamask');
            }
        } catch (error) {
            console.log(error);
            console.warn('User denied account access');
            dispatch({ type: 'set_loader', loader: false });
        }
    };

    return (
        <div className='App'>
            {!!loader && <Loading />}
            <Header connect={connect} />

            {provider && <ActionBar />}

            {token && (
                <div>
                    <SmartWallets />
                    <PartnerBalances />
                    <Deploy />
                    <Receive />
                    <Transfer />
                    <Execute />
                    <TransactionHistory />
                    <Validate />
                </div>
            )}

            {errorMessage.length > 0 && (
                <Snackbar message={errorMessage} position={2} />
            )}
        </div>
    );
}

export default App;
