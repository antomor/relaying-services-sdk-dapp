import { useCallback, useEffect, useState } from 'react';
import { Button, Col, Icon, Row } from 'react-materialize';
import 'src/components/ActionBar.css';
import AllowedTokens from 'src/components/AllowedTokens';
import { useStore } from 'src/context/context';

function ActionBar() {
    const { state, dispatch } = useStore();

    const { token, provider, reload } = state;

    const [tokenPrice, setTokenPrice] = useState('0');

    const createSmartWallet = async () => {
        dispatch({ type: 'set_modals', modal: { validate: true } });
    };

    const reloadTokenPrice = useCallback(async () => {
        if (token) {
            const price = await provider!.getERC20TokenPrice(token!, 'RBTC');
            setTokenPrice(price.toString());
        }
    }, [token]);

    useEffect(() => {
        reloadTokenPrice();
    }, [token, reload]);

    return (
        <Row className='space-row vertical-align'>
            <Col s={3}>
                <Button
                    waves='light'
                    className='indigo accent-2'
                    onClick={createSmartWallet}
                    disabled={!token}
                >
                    New Smart Wallet
                    <Icon right>add_circle_outline</Icon>
                </Button>
            </Col>
            <Col s={6}>
                <AllowedTokens />
            </Col>
            <Col s={3}>
                <h6>
                    {token?.symbol} price: <span>{tokenPrice}</span> RBTC
                </h6>
            </Col>
        </Row>
    );
}

export default ActionBar;
