import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Modals, SmartWalletWithBalance } from 'src/types';
import Utils, { TRIF_PRICE } from 'src/Utils';
import 'src/components/ActionBar.css';
import { Col, Row, Button, Icon } from 'react-materialize';
import AllowedTokens from 'src/components/AllowedTokens';
import { useStore } from 'src/context/context';
import { SmartWallet } from '@rsksmart/rif-relay-sdk';

type ActionBarProps = {
    setSmartWallets: Dispatch<SetStateAction<SmartWalletWithBalance[]>>;
    updateInfo: boolean;
    setModal: Dispatch<SetStateAction<Modals>>;
};

function ActionBar(props: ActionBarProps) {
    const { setSmartWallets, updateInfo, setModal } = props;

    const [workerBalance, setWorkerBalance] = useState('0');

    const { state } = useStore();

    const loadSmartWallets = async () => {
        let tempSmartWallets: SmartWallet[] = [];
        try {
            if (
                Utils.getTransactionKey(state.chainId, state.account) in localStorage
            ) {
                tempSmartWallets = JSON.parse(
                    localStorage.getItem(
                        Utils.getTransactionKey(state.chainId, state.account)
                    )!
                );
            }
        } catch (e) {
            console.log(
                'Failed trying to read smart wallets, erased all previous smart wallets'
            );
            console.log(e);
        }
        setSmartWallets([]);
        for (let i = 0; i < tempSmartWallets.length; i += 1) {
            Utils.getSmartWalletBalance(tempSmartWallets[i], state.token!).then(
                (tempSmartWallet) =>
                    setSmartWallets((prev) => [...prev, tempSmartWallet])
            );
        }
    };

    useEffect(() => {
        (async () => {
            if (state.token) {
                await loadSmartWallets();
                const workerAddress =
                    process.env.REACT_APP_CONTRACTS_RELAY_WORKER!;
                const currentWorkerBalance = parseFloat(
                    Utils.fromWei(
                        await Utils.tokenBalance(
                            workerAddress,
                            state.token!.address
                        )
                    )
                ).toFixed(4);
                setWorkerBalance(currentWorkerBalance);
            }
        })();
    }, [state.token, updateInfo]);

    const createSmartWallet = async () => {
        setModal((prev) => ({ ...prev, validate: true }));
    };

    return (
        <Row className='space-row vertical-align'>
            <Col s={2}>
                <Button
                    waves='light'
                    className='indigo accent-2'
                    onClick={createSmartWallet}
                    disabled={!state.token}
                >
                    New Smart Wallet
                    <Icon right>add_circle_outline</Icon>
                </Button>
            </Col>
            <Col s={5}>
                <AllowedTokens updateInfo={updateInfo} />
            </Col>
            <Col s={5}>
                <Row>
                    <Col s={6}>
                        <h6>
                            {state.token?.symbol} price:{' '}
                            <span>{TRIF_PRICE}</span> RBTC
                        </h6>
                    </Col>
                    <Col s={6}>
                        <h6>
                            Worker balance: <span>{workerBalance}</span>{' '}
                            {state.token?.symbol}
                        </h6>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}

export default ActionBar;
