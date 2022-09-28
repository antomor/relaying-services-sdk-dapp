import { useEffect } from 'react';
import {
    DefaultRelayingServices,
    EnvelopingConfig,
    RelayingServicesAddresses,
    SmartWallet
} from '@rsksmart/rif-relay-sdk';

import ActionBar from 'src/components/ActionBar';
import Header from 'src/components/Header';
import SmartWallets from 'src/components/SmartWallets';
import Deploy from 'src/modals/Deploy';
import Execute from 'src/modals/Execute';
import Loading from 'src/modals/Loading';
import Receive from 'src/modals/Receive';
import Transfer from 'src/modals/Transfer';
import rLogin from 'src/rLogin';
import Utils from 'src/Utils';
import 'src/App.css';
import Web3 from 'web3';
import PartnerBalances from './components/PartnerBalances';
import { useStore } from './context/context';
import TransactionHistory from './modals/TransactionHistory';
import Validate from './modals/Validate';

if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
} else if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider);
} else {
    throw new Error('Error: MetaMask or web3 not detected');
}

function getEnvParamAsInt(value: string | undefined): number | undefined {
    return value ? parseInt(value, 10) : undefined;
}

function App() {
    const { state, dispatch } = useStore();
    const { chainId, account, isReady } = state;

    const initProvider = async () => {
        try {
            const config: Partial<EnvelopingConfig> = {
                chainId: getEnvParamAsInt(
                    process.env.REACT_APP_RIF_RELAY_CHAIN_ID
                ),
                gasPriceFactorPercent: getEnvParamAsInt(
                    process.env.REACT_APP_RIF_RELAY_GAS_PRICE_FACTOR_PERCENT
                ),
                relayLookupWindowBlocks: getEnvParamAsInt(
                    process.env.REACT_APP_RIF_RELAY_LOOKUP_WINDOW_BLOCKS
                ),
                preferredRelays: process.env
                    .REACT_APP_RIF_RELAY_PREFERRED_RELAYS
                    ? process.env.REACT_APP_RIF_RELAY_PREFERRED_RELAYS.split(
                          ','
                      )
                    : undefined,
                relayHubAddress: process.env.REACT_APP_CONTRACTS_RELAY_HUB,
                relayVerifierAddress:
                    process.env.REACT_APP_CONTRACTS_RELAY_VERIFIER,
                deployVerifierAddress:
                    process.env.REACT_APP_CONTRACTS_DEPLOY_VERIFIER,
                smartWalletFactoryAddress:
                    process.env.REACT_APP_CONTRACTS_SMART_WALLET_FACTORY,
                logLevel: 0
            };
            const contractAddresses: RelayingServicesAddresses = {
                relayHub: process.env.REACT_APP_CONTRACTS_RELAY_HUB!,
                smartWallet: process.env.REACT_APP_CONTRACTS_SMART_WALLET!,
                smartWalletFactory:
                    process.env.REACT_APP_CONTRACTS_SMART_WALLET_FACTORY!,
                smartWalletDeployVerifier:
                    process.env.REACT_APP_CONTRACTS_DEPLOY_VERIFIER!,
                smartWalletRelayVerifier:
                    process.env.REACT_APP_CONTRACTS_RELAY_VERIFIER!,
                // TODO: Why aren't these addresses required? we may set them as optional
                penalizer: '',
                customSmartWallet: '',
                customSmartWalletFactory: '',
                customSmartWalletDeployVerifier: '',
                customSmartWalletRelayVerifier: '',
                sampleRecipient: ''
            };

            // Get an RIF Relay RelayProvider instance and assign it to Web3 to use RIF Relay transparently
            const relayingServices = new DefaultRelayingServices(web3);
            await relayingServices.initialize(config, contractAddresses, {
                loglevel: 1
            });
            dispatch({ type: 'set_provider', provider: relayingServices });
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const wallets: SmartWallet[] = Utils.getLocalSmartWallets(
            chainId,
            account
        );
        dispatch({ type: 'set_smart_wallets', smartWallets: wallets });
    }, [chainId, account]);

    const refreshAccount = async () => {
        const accounts = await Utils.getAccounts();
        const currentAccount = accounts[0];
        dispatch({ type: 'set_account', account: currentAccount });
    };

    const reload = async () => {
        dispatch({ type: 'set_loader', show: true });
        await initProvider();
        await refreshAccount();
        dispatch({ type: 'set_loader', show: false });
    };

    const connectToRLogin = async () => {
        let isConnected = false;
        try {
            const chain: number = await web3.eth.getChainId();
            if (chain.toString() === process.env.REACT_APP_RIF_RELAY_CHAIN_ID) {
                const connect = await rLogin.connect();
                const login = connect.provider;

                login.on('accountsChanged', async (/* accounts */) => {
                    await reload();
                });

                login.on('chainChanged', async (newChain: string) => {
                    dispatch({
                        type: 'set_chain_id',
                        chainId: parseInt(newChain, 16)
                    });
                });
                dispatch({ type: 'set_chain_id', chainId: chain });
                isConnected = true;
            } else {
                alert(
                    `Wrong network ID ${chain}, it must be ${process.env.REACT_APP_RIF_RELAY_CHAIN_ID}`
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
            if (!state.connected) {
                isConnected = await connectToRLogin();
            }

            if (isConnected) {
                await reload();
            } else {
                console.warn('Unable to connect to Metamask');
            }
        } catch (error) {
            console.log(error);
            console.warn('User denied account access');
            dispatch({ type: 'set_loader', show: false });
        }
    };

    return (
        <div className='App'>
            {!isReady ?? <Loading />}
            <Header connect={connect} />

            {state.provider && <ActionBar />}

            {state.token && (
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
        </div>
    );
}

export default App;
