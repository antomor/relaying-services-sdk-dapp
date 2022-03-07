import { Dispatch, SetStateAction } from 'react';
import { SmartWalletWithBalance } from '../types';
import './SmartWallet.css';

// TODO: Replace it with react-materialize
window.M.AutoInit();
const { M } = window;

type SmartWalletProps = {
    connected: boolean;
    smartWallets: SmartWalletWithBalance[];
    setCurrentSmartWallet: Dispatch<
        SetStateAction<SmartWalletWithBalance | undefined>
    >;
    setShow: Dispatch<SetStateAction<boolean>>;
};

function SmartWallet(props: SmartWalletProps) {
    const { connected, smartWallets, setCurrentSmartWallet, setShow } = props;

    async function copySmartWalletAddress(address: string) {
        setShow(true);
        await navigator.clipboard.writeText(address);
        setShow(false);
    }
    function openModal(modalId: string, smartWallet: SmartWalletWithBalance) {
        console.log({ smartWallet });
        setCurrentSmartWallet(smartWallet);
        const instance = M.Modal.init(document.getElementById(modalId), {
            dismissible: false
        });
        instance.open();
    }
    return (
        <div className='smart-wallets'>
            <div id='no-smart-wallets' className='row grey'>
                <div
                    id='no-wallets-message'
                    className={`col s12 ${
                        smartWallets.length <= 0 && connected ? '' : 'hide'
                    }`}
                >
                    <h6 className='center-align'>
                        No Smart Wallets detected for selected account. Create a
                        new Smart Wallet by clicking the New Smart Wallet
                        button.
                    </h6>
                </div>
                <div
                    id='no-connection'
                    className={`col s12 ${connected ? 'hide' : ''}`}
                >
                    <h6 className='center-align'>
                        Wallet not connected, please connect.
                    </h6>
                </div>
            </div>
            {smartWallets.map((smartWallet: SmartWalletWithBalance) => (
                <div
                    key={smartWallet.index}
                    className='smart-wallet row teal lighten-4'
                >
                    <div className='col s1'>
                        <a
                            className={`btn-floating btn-medium waves-effect waves-light indigo accent-2 tooltipped modal-trigger ${
                                smartWallet.deployed ? 'disabled' : ''
                            }`}
                            href='#!'
                            data-position='bottom'
                            data-tooltip='Deploy'
                            onClick={() => {
                                openModal('deploy-modal', smartWallet);
                            }}
                        >
                            <i className='material-icons'>file_upload</i>
                        </a>
                    </div>
                    <div className='col s2'>
                        <h6
                            className='tooltipped summary-smart-wallet-address'
                            data-position='bottom'
                            data-tooltip='0x'
                        >
                            {smartWallet.address}
                        </h6>
                    </div>
                    <div className='col s1 copy-container'>
                        <a
                            href='#!'
                            className='btn-floating btn-small waves-effect waves-light indigo accent-2 tooltipped'
                            data-position='bottom'
                            data-tooltip='Copy address'
                            onClick={() => {
                                copySmartWalletAddress(smartWallet.address);
                            }}
                        >
                            <i className='material-icons'>content_copy</i>
                        </a>
                    </div>
                    <div className='col s2'>
                        <h6>{smartWallet.balance}</h6>
                    </div>
                    <div className='col s3'>
                        <h6>{smartWallet.rbtcBalance}</h6>
                    </div>
                    <div className='col s1 right-align'>
                        <a
                            id='transfer-button-0'
                            href='#!'
                            className={`btn-floating btn-medium waves-effect waves-light indigo accent-2 tooltipped modal-trigger ${
                                smartWallet.deployed ? '' : 'disabled'
                            }`}
                            data-position='bottom'
                            data-tooltip='Transfer'
                            onClick={() => {
                                openModal('transfer-modal', smartWallet);
                            }}
                        >
                            <i className='material-icons'>call_made</i>
                        </a>
                    </div>
                    <div className='col s1 center-align'>
                        <a
                            id='receive-button-0'
                            href='#!'
                            className='btn-floating btn-medium waves-effect waves-light indigo accent-2 tooltipped modal-trigger'
                            data-position='bottom'
                            data-tooltip='Receive'
                            onClick={() => {
                                openModal('receive-modal', smartWallet);
                            }}
                        >
                            <i className='material-icons'>arrow_downward</i>
                        </a>
                    </div>
                    <div className='col s1 left-align'>
                        <a
                            className={`btn-floating btn-medium waves-effect waves-light indigo accent-2 tooltipped modal-trigger ${
                                smartWallet.deployed ? '' : 'disabled'
                            }`}
                            href='#!'
                            data-position='bottom'
                            data-tooltip='Execute'
                            onClick={() => {
                                openModal('execute-modal', smartWallet);
                            }}
                        >
                            <i className='material-icons'>
                                play_circle_outline
                            </i>
                        </a>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default SmartWallet;
