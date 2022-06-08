import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useState
} from 'react';
import { RelayingServices } from 'relaying-services-sdk';
import { SmartWalletAddress } from 'relaying-services-sdk/dist/interfaces';
import { SmartWalletWithBalance } from '../types';
import Utils, { TRIF_PRICE } from '../Utils';
import './Footer.css';

type FooterProps = {
    smartWallets: SmartWalletWithBalance[];
    setSmartWallets: Dispatch<SetStateAction<SmartWalletWithBalance[]>>;
    connected: boolean;
    account?: string;
    provider?: RelayingServices;
    setShow: Dispatch<SetStateAction<boolean>>;
};

function Footer(props: FooterProps) {
    const {
        smartWallets,
        setSmartWallets,
        connected,
        account,
        provider,
        setShow
    } = props;

    const [workerBalance, setWorkerBalance] = useState('0');

    const setBalance = useCallback(
        async (smartWallet: SmartWalletAddress): Promise<SmartWalletWithBalance> => {
            const balance = await Utils.tokenBalance(smartWallet.address);
            const rbtcBalance = await Utils.getBalance(smartWallet.address);
            const swWithBalance = {
                ...smartWallet,
                balance: `${Utils.fromWei(balance)} tRIF`,
                rbtcBalance: `${Utils.fromWei(rbtcBalance)} RBTC`,
            };
            return swWithBalance as SmartWalletWithBalance;
        },
        [provider]
    );

    useEffect(() => {
        if (!account || !provider) {
            return;
        }
        (async () => {
            let smartWalletIndex = 0;
            let found = true;
            setShow(true);
            while (found === true) {
                // eslint-disable-next-line no-await-in-loop
                const smartWalletAddress = await provider.generateSmartWallet(
                    smartWalletIndex + 1
                );
                // eslint-disable-next-line no-await-in-loop
                const balance = await Utils.tokenBalance(smartWalletAddress.address);
                if (balance > '0') {
                    // eslint-disable-next-line no-await-in-loop
                    const smartWalletWithBalance = await setBalance(
                        smartWalletAddress
                    );
                    setSmartWallets((currentSmartWallet) => [
                        ...currentSmartWallet,
                        smartWalletWithBalance
                    ]);
                    smartWalletIndex += 1;
                } else {
                    found = false;
                }
            }
            setShow(false);
        })();
    }, [account, provider, setSmartWallets, setBalance, setShow]);

    useEffect(() => {
        (async () => {
            const workerAddress = process.env.REACT_APP_CONTRACTS_RELAY_WORKER!;
            const currentWorkerBalance = parseFloat(
                Utils.fromWei(await Utils.tokenBalance(workerAddress))
            ).toFixed(4);
            setWorkerBalance(currentWorkerBalance);
        })();
    }, [setWorkerBalance]);

    async function create() {
        if (provider) {
            setShow(true);
            const smartWallet = await provider?.generateSmartWallet(
                smartWallets.length + 1
            );
            const smartWalletWithBalance = await setBalance(smartWallet);
            setSmartWallets([...smartWallets, smartWalletWithBalance]);
            setShow(false);
        }
    }

    return (
        <div className='row footer-controls'>
            <div className='col s12'>
                <div className='row'>
                    <div className='col s6'>
                        <a
                            href='#!'
                            className={`waves-effect waves-light btn indigo accent-2 ${
                                !connected ? 'disabled' : ''
                            } create`}
                            onClick={create}
                        >
                            <i className='material-icons right'>
                                add_circle_outline
                            </i>
                            New Smart Wallet
                        </a>
                    </div>
                    <div className='col s6'>
                        <h6 className='right-align'>
                            tRIF price:
                            <span id='trif-price'>{TRIF_PRICE}</span>
                            RBTC - Worker balance:
                            <span id='worker-balance'>
                                {workerBalance}
                            </span>{' '}
                            tRIF
                        </h6>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Footer;
