import { Dispatch, SetStateAction, useEffect } from 'react';
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

function ActionBar({ setSmartWallets, updateInfo, setModal }: ActionBarProps) {
    const { state } = useStore();

    const loadSmartWallets = async () => {
        let tempSmartWallets: SmartWallet[] = [];
        try {
            if (
                Utils.getTransactionKey(state.chainId, state.account) in
                localStorage
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
        for (let i = 0; i < tempSmartWallets.length; i += 1) {
            Utils.getSmartWalletBalance(tempSmartWallets[i], state.token!).then(
                (tempSmartWallet) => {
                    setSmartWallets((prev) =>
                        prev.map((x) => {
                            if (x.address === tempSmartWallet.address) {
                                return tempSmartWallet;
                            }
                            return x;
                        })
                    );
                }
            );
        }
    };

    useEffect(() => {
        if (!updateInfo) {
            return;
        }
        (async () => {
            if (state.token) {
                await loadSmartWallets();
            }
        })();
    }, [state.token, updateInfo]);

    const createSmartWallet = async () => {
        setModal((prev) => ({ ...prev, validate: true }));
    };

    return (
        <Row className='space-row vertical-align'>
            <Col s={3}>
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
            <Col s={6}>
                <AllowedTokens updateInfo={updateInfo} />
            </Col>
            <Col s={3}>
                <h6>
                    {state.token?.symbol} price: <span>{TRIF_PRICE}</span> RBTC
                </h6>
            </Col>
        </Row>
    );
}

export default ActionBar;
