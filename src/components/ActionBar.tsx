import { SmartWallet } from '@rsksmart/rif-relay-sdk';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { Button, Col, Icon, Row } from 'react-materialize';
import 'src/components/ActionBar.css';
import AllowedTokens from 'src/components/AllowedTokens';
import { useStore } from 'src/context/context';
import { Modals, SmartWalletWithBalance } from 'src/types';
import Utils, { TRIF_PRICE } from 'src/Utils';

type ActionBarProps = {
    smartWallets: SmartWalletWithBalance[];
    setSmartWallets: Dispatch<SetStateAction<SmartWalletWithBalance[]>>;
    updateInfo: boolean;
    setModal: Dispatch<SetStateAction<Modals>>;
};

function ActionBar({
    smartWallets,
    setSmartWallets,
    updateInfo,
    setModal
}: ActionBarProps) {
    const {
        state: { token, account, chainId }
    } = useStore();

    useEffect(() => {
        if (!updateInfo || !token) {
            return;
        }
        let tempSmartWallets: SmartWallet[] = [];
        try {
            if (Utils.getTransactionKey(chainId, account) in localStorage) {
                tempSmartWallets = JSON.parse(
                    localStorage.getItem(
                        Utils.getTransactionKey(chainId, account)
                    )!
                );
            }
        } catch (e) {
            console.log(
                'Failed trying to read smart wallets, erased all previous smart wallets'
            );
            console.log(e);
        }
        tempSmartWallets.push(...smartWallets);

        for (let i = 0; i < tempSmartWallets.length; i += 1) {
            Utils.getSmartWalletBalance(tempSmartWallets[i], token!).then(
                (tempSmartWallet) => {
                    const exists = smartWallets.find(
                        (x) => x.address === tempSmartWallet.address
                    );
                    if (exists) {
                        setSmartWallets((prev) =>
                            prev.map((x) => {
                                if (x.address === tempSmartWallet.address) {
                                    return tempSmartWallet;
                                }
                                return x;
                            })
                        );
                    } else {
                        setSmartWallets((prev) => [...prev, tempSmartWallet]);
                    }
                }
            );
        }
    }, [token, updateInfo]);

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
