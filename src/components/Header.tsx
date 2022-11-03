import { useEffect, useState } from 'react';
import { Button, Col, Icon, Row } from 'react-materialize';
import 'src/components/Header.css';
import { useStore } from 'src/context/context';
import Utils from 'src/Utils';

type HeaderProps = {
    connect: () => Promise<void>;
};

function Header(props: HeaderProps) {
    const { state, dispatch } = useStore();

    const { account, connected, chainId, reload } = state;

    const { connect } = props;

    const [balance, setBalance] = useState<string>();

    useEffect(() => {
        if (!account) {
            return;
        }
        (async () => {
            const currentBalance = await Utils.getBalance(account);
            setBalance(`${currentBalance} RBTC  `);
        })();
    }, [account, reload]);

    const reloadComponents = () => {
        dispatch({
            type: 'reload',
            reload: true
        });
        dispatch({
            type: 'reload_token',
            reloadToken: true
        });
    };

    return (
        <header>
            <Row
                className={`nav vertical-align ${
                    chainId.toString() ===
                    process.env.REACT_APP_RIF_RELAY_CHAIN_ID
                        ? 'connected-network'
                        : ''
                }
            `}
            >
                <Col s={3}>
                    <div className='brand-logo'>
                        <img alt='logo' src='images/rif_logo_2.png' />
                        <span>
                            <b>RIF Relay</b>
                        </span>
                    </div>
                </Col>
                <Col s={9}>
                    <Row className='data right vertical-align'>
                        <Col s={7} className='address'>
                            <span id='eoa-address'>
                                {account || 'Address'}{' '}
                            </span>
                            <span>&nbsp;|&nbsp;</span>
                            <span id='eoa-balance'>
                                {balance || 'Balance'}{' '}
                            </span>
                        </Col>
                        <Col s={4} className='connect'>
                            <Button
                                waves='light'
                                className='indigo accent-2'
                                onClick={connect}
                                disabled={connected}
                            >
                                Connect Wallet
                                <Icon right className='material-icons'>
                                    account_balance_wallet
                                </Icon>
                            </Button>
                        </Col>
                        <Col s={1} className='refresh'>
                            <Button
                                waves='light'
                                onClick={reloadComponents}
                                floating
                                tooltip='Refresh information'
                                disabled={!connected}
                            >
                                <Icon className='material-icons'>update</Icon>
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </header>
    );
}

export default Header;
