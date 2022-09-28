import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Button, Col, Icon, Row } from 'react-materialize';
import 'src/components/Header.css';
import { useStore } from 'src/context/context';
import Utils from 'src/Utils';

type HeaderProps = {
    connect: () => Promise<void>;
    setUpdateInfo: Dispatch<SetStateAction<boolean>>;
};

function Header(props: HeaderProps) {
    const { state, dispatch } = useStore();

    const { connect, setUpdateInfo } = props;

    const [balance, setBalance] = useState<string>();

    useEffect(() => {
        if (!state.account) {
            return;
        }
        (async () => {
            const currentBalance = await Utils.getBalance(state.account);
            const balanceConverted = Utils.fromWei(currentBalance);
            setBalance(`${balanceConverted} RBTC  `);
        })();
    }, [state.account]);

    const reload = () => {
        dispatch({
            type: 'set_loader',
            show: true
        });
    };

    return (
        <header>
            <Row
                className={`nav vertical-align ${
                    state.chainId.toString() ===
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
                                {state.account || 'Address'}{' '}
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
                                disabled={state.connected}
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
                                onClick={reload}
                                floating
                                tooltip='Refresh information'
                                disabled={!state.connected}
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
