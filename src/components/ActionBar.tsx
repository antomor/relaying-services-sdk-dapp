import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { SmartWallet } from '@rsksmart/rif-relay-sdk';
import { SmartWalletWithBalance } from 'src/types';
import Utils, { TRIF_PRICE } from 'src/Utils';
import 'src/components/ActionBar.css';
import { Col, Row, Button, Icon } from 'react-materialize';
import AllowedTokens from 'src/components/AllowedTokens';
import { useStore } from 'src/context/context';

type ActionBarProps = {
    smartWallets: SmartWalletWithBalance[];
    setSmartWallets: Dispatch<SetStateAction<SmartWalletWithBalance[]>>;
    updateInfo: boolean;
};

function ActionBar(props: ActionBarProps) {
    const { smartWallets, setSmartWallets, updateInfo } = props;

    const [workerBalance, setWorkerBalance] = useState('0');

    const { state, dispatch } = useStore();

    const setBalance = async (
        smartWallet: SmartWallet
    ): Promise<SmartWalletWithBalance> => {
        const balance = await Utils.tokenBalance(
            smartWallet.address,
            state.token!.address
        );
        const rbtcBalance = await Utils.getBalance(smartWallet.address);
        const swWithBalance = {
            ...smartWallet,
            balance: `${Utils.fromWei(balance)} ${state.token!.symbol}`,
            rbtcBalance: `${Utils.fromWei(rbtcBalance)} RBTC`
        };
        return swWithBalance;
    };

    useEffect(() => {
        if (!state.account || !state.provider || !state.token) {
            return;
        }
        (async () => {
            let index: number = 0;
            let found: boolean = true;
            const tempSmartWallets: SmartWalletWithBalance[] = [];
            while (found) {
                // eslint-disable-next-line no-await-in-loop
                const swAddress = await state.provider!.generateSmartWallet(
                    index + 1
                );
                // eslint-disable-next-line no-await-in-loop
                const deployed = await state.provider!.isSmartWalletDeployed(
                    swAddress.address
                );
                if (deployed) {
                    // eslint-disable-next-line no-await-in-loop
                    const smartWalletWithBalance = await setBalance(swAddress);
                    tempSmartWallets.push(smartWalletWithBalance);
                    index += 1;
                } else {
                    setSmartWallets(tempSmartWallets);
                    found = false;
                }
            }
        })();
    }, [state.account, state.token, updateInfo]);

    useEffect(() => {
        (async () => {
            if (state.token) {
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
    }, [state.token]);

    const create = async () => {
        if (state.provider) {
            dispatch({ type: 'set_loader', loader: true });
            const smartWallet = await state.provider.generateSmartWallet(
                smartWallets.length + 1
            );

            const smartWalletWithBalance = await setBalance(smartWallet);
            setSmartWallets([...smartWallets, smartWalletWithBalance]);
            dispatch({ type: 'set_loader', loader: false });
        }
    };

    return (
        <Row className='space-row valign-wrapper'>
            <Col s={2}>
                <Button
                    waves='light'
                    className='indigo accent-2'
                    onClick={create}
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
