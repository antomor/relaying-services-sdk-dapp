import { useState, useEffect } from 'react';
import 'src/App.css';

import {
    DefaultRelayingServices,
    RelayingServicesAddresses,
    EnvelopingConfig
} from '@rsksmart/rif-relay-sdk';

import Header from 'src/components/Header';
import SmartWallet from 'src/components/SmartWallet';
import ActionBar from 'src/components/ActionBar';
import Deploy from 'src/modals/Deploy';
import Receive from 'src/modals/Receive';
import Transfer from 'src/modals/Transfer';
import Loading from 'src/modals/Loading';
import Execute from 'src/modals/Execute';
import Utils from 'src/Utils';
import { Modals, SmartWalletWithBalance } from 'src/types';
import rLogin from 'src/rLogin';
import Web3 from 'web3';
import TransactionHistory from './modals/TransactionHistory';
import { useStore } from './context/context';
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

    const [modal, setModal] = useState<Modals>({
        deploy: false,
        execute: false,
        receive: false,
        transfer: false,
        transactions: false,
        validate: false
    });

    const [smartWallets, setSmartWallets] = useState<SmartWalletWithBalance[]>(
        []
    );

    const [updateInfo, setUpdateInfo] = useState(false);

    useEffect(() => {
        if (!updateInfo) {
            return;
        }
        (async () => {
            dispatch({ type: 'set_loader', loader: true });
            setTimeout(() => {
                setUpdateInfo(false);
                dispatch({ type: 'set_loader', loader: false });
            }, 100);
        })();
    }, [updateInfo]);

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

    const refreshAccount = async () => {
        const accounts = await Utils.getAccounts();
        const currentAccount = accounts[0];
        dispatch({ type: 'set_account', account: currentAccount });
    };

    const reload = async () => {
        dispatch({ type: 'set_loader', loader: true });
        await initProvider();
        await refreshAccount();
        setUpdateInfo(true);
        dispatch({ type: 'set_loader', loader: false });
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
            dispatch({ type: 'set_loader', loader: false });
        }
    };

    return (
        <div className='App'>
            <Loading />
            <Header connect={connect} setUpdateInfo={setUpdateInfo} />

            {state.provider && (
                <ActionBar
                    setSmartWallets={setSmartWallets}
                    updateInfo={updateInfo}
                    setModal={setModal}
                />
            )}

            {state.token && (
                <div>
                    <SmartWallet
                        smartWallets={smartWallets}
                        setModal={setModal}
                    />
                    <Deploy
                        smartWallets={smartWallets}
                        modal={modal}
                        setModal={setModal}
                    />
                    <Receive modal={modal} setModal={setModal} />
                    <Transfer
                        setUpdateInfo={setUpdateInfo}
                        modal={modal}
                        setModal={setModal}
                    />
                    <Execute
                        setUpdateInfo={setUpdateInfo}
                        modal={modal}
                        setModal={setModal}
                    />
                    <TransactionHistory modal={modal} setModal={setModal} />
                    <Validate
                        smartWallets={smartWallets}
                        setSmartWallets={setSmartWallets}
                        modal={modal}
                        setModal={setModal}
                    />
                </div>
            )}
        </div>
    );
}

export default App;
