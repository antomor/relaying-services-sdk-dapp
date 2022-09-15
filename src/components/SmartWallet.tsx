import { Dispatch, SetStateAction } from 'react';
import { Modals, SmartWalletWithBalance } from 'src/types';
import 'src/components/SmartWallet.css';
import { Col, Row, Button, Icon } from 'react-materialize';
import { useStore } from 'src/context/context';

type SmartWalletProps = {
    smartWallets: SmartWalletWithBalance[];
    setModal: Dispatch<SetStateAction<Modals>>;
};

type ModalsKey = keyof Modals;

function SmartWallet(props: SmartWalletProps) {
    const { state, dispatch } = useStore();

    const { smartWallets, setModal } = props;

    async function copySmartWalletAddress(address: string) {
        await navigator.clipboard.writeText(address);
    }

    function openModal(smartWallet: SmartWalletWithBalance, modal: ModalsKey) {
        dispatch({ type: 'set_smart_wallet', smartWallet });
        setModal((prev) => ({ ...prev, [modal]: true }));
    }

    return (
        <div className='smart-wallets'>
            <Row
                className={`grey ${
                    smartWallets.length <= 0 && state.connected ? '' : 'hide'
                }`}
            >
                <Col s={12}>
                    <h6 className='center-align'>
                        No Smart Wallets detected for selected account. Create a
                        new Smart Wallet by clicking the New Smart Wallet
                        button.
                    </h6>
                </Col>
                <Col s={12} className={`${state.connected ? 'hide' : ''}`}>
                    <h6 className='center-align'>
                        Wallet not connected, please connect.
                    </h6>
                </Col>
            </Row>
            {smartWallets.map((smartWallet: SmartWalletWithBalance) => (
                <Row key={smartWallet.address} className='space-row'>
                    <Row className='teal vertical-align lighten-4'>
                        <Col s={1}>
                            <Button
                                waves='light'
                                className='indigo accent-2'
                                tooltip='Deploy'
                                floating
                                disabled={smartWallet.deployed}
                                onClick={() => {
                                    openModal(smartWallet, 'deploy');
                                }}
                            >
                                <Icon center>file_upload</Icon>
                            </Button>
                        </Col>
                        <Col s={3}>
                            <h6 className='summary-smart-wallet-address'>
                                {smartWallet.address}
                            </h6>
                        </Col>
                        <Col s={1}>
                            <Button
                                waves='light'
                                className='indigo accent-2'
                                tooltip='Copy address'
                                floating
                                onClick={() => {
                                    copySmartWalletAddress(smartWallet.address);
                                }}
                            >
                                <Icon center>content_copy</Icon>
                            </Button>
                        </Col>
                        <Col s={2}>
                            <h6>{smartWallet.balance}</h6>
                        </Col>
                        <Col s={2}>
                            <h6>{smartWallet.rbtcBalance}</h6>
                        </Col>
                        <Col s={3}>
                            <Row>
                                <Col>
                                    <Button
                                        waves='light'
                                        className='indigo accent-2'
                                        tooltip='Transfer'
                                        floating
                                        disabled={!smartWallet.deployed}
                                        onClick={() => {
                                            openModal(smartWallet, 'transfer');
                                        }}
                                    >
                                        <Icon center>call_made</Icon>
                                    </Button>
                                </Col>
                                <Col>
                                    <Button
                                        waves='light'
                                        className='indigo accent-2'
                                        tooltip='Receive'
                                        floating
                                        onClick={() => {
                                            openModal(smartWallet, 'receive');
                                        }}
                                    >
                                        <Icon center>arrow_downward</Icon>
                                    </Button>
                                </Col>
                                <Col>
                                    <Button
                                        waves='light'
                                        className='indigo accent-2'
                                        tooltip='Execute'
                                        floating
                                        disabled={!smartWallet.deployed}
                                        onClick={() => {
                                            openModal(smartWallet, 'execute');
                                        }}
                                    >
                                        <Icon center>play_circle_outline</Icon>
                                    </Button>
                                </Col>
                                <Col>
                                    <Button
                                        waves='light'
                                        className='indigo accent-2'
                                        tooltip='Transactions'
                                        floating
                                        disabled={!smartWallet.deployed}
                                        onClick={() => {
                                            openModal(
                                                smartWallet,
                                                'transactions'
                                            );
                                        }}
                                    >
                                        <Icon center>manage_search</Icon>
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Row>
            ))}
        </div>
    );
}

export default SmartWallet;
