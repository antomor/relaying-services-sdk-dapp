import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import Utils from 'src/Utils';
import 'src/components/Header.css';
import { Row, Col, Button, Icon } from 'react-materialize';
import { useStore } from 'src/context/context';

type HeaderProps = {
    connect: () => Promise<void>;
    setUpdateInfo: Dispatch<SetStateAction<boolean>>;
};

function Header(props: HeaderProps) {
    const { state } = useStore();

    const { connect, setUpdateInfo } = props;

    const [balance, setBalance] = useState<string>();

    useEffect(() => {
        if (!state.account) {
            return;
        }
        (async () => {
            console.log(state.account);
            const currentBalance = await Utils.getBalance(state.account);
            const balanceConverted = Utils.fromWei(currentBalance);
            setBalance(`${balanceConverted} RBTC  `);
        })();
    }, [state.account]);

    const reload = async () => {
        setUpdateInfo(true);
    };

    return (
        <header>
            <nav
                className={
                    state.chainId.toString() ===
                    process.env.REACT_APP_RIF_RELAY_CHAIN_ID
                        ? 'connected-network'
                        : ''
                }
            >
                <Row>
                    <Col s={6}>
                        <Row>
                            <Col s={4}>
                                <div className='brand-logo'>
                                    <img
                                        alt='logo'
                                        src='images/rif_logo_2.png'
                                    />
                                    <span>
                                        <b>RIF Relay</b>
                                    </span>
                                </div>
                            </Col>
                        </Row>
                    </Col>

                    <Col s={6}>
                        <Row className='right'>
                            <Col>
                                <span id='eoa-address'>
                                    {state.account || 'Address'}{' '}
                                </span>
                                <span>&nbsp;|&nbsp;</span>
                                <span id='eoa-balance' className='eoa-balance'>
                                    {balance || 'Balance'}{' '}
                                </span>
                            </Col>
                            <Col>
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
                            <Col>
                                <Button
                                    waves='light'
                                    onClick={reload}
                                    floating
                                    tooltip='Refresh information'
                                >
                                    <Icon className='material-icons'>
                                        update
                                    </Icon>
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </nav>
        </header>
    );
}

export default Header;
