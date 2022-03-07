import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import Utils from '../Utils';
import './Header.css';

type HeaderProps = {
    account?: string;
    connect: () => Promise<void>;
    setUpdateInfo: Dispatch<SetStateAction<boolean>>;
    connected: boolean;
};

function Header(props: HeaderProps) {
    const { account, connect, setUpdateInfo, connected } = props;

    const [balance, setBalance] = useState<string>();

    useEffect(() => {
        if (!account) {
            return;
        }
        (async () => {
            console.log(account);
            const currentBalance = await Utils.getBalance(account);
            const balanceConverted = Utils.fromWei(currentBalance);
            setBalance(`${balanceConverted} RBTC  `);
        })();
    }, [account]);

    async function refresh() {
        setUpdateInfo(true);
    }
    return (
        <header>
            <nav>
                <div className='nav-wrapper gradient'>
                    <div className='brand-logo left'>
                        <img
                            className='responsive-img'
                            alt='logo'
                            src='images/rif_logo.png'
                            onClick={() => refresh()}
                        />
                        <span>
                            <b>RIF Relay</b>
                        </span>
                    </div>
                    <ul id='nav-mobile' className='right hide-on-med-and-down'>
                        <li>
                            <span id='eoa-address'>
                                {account || 'Address'}{' '}
                            </span>
                        </li>
                        <li>
                            <span>&nbsp;|&nbsp;</span>
                        </li>
                        <li>
                            <span id='eoa-balance' className='eoa-balance'>
                                {balance || 'Balance'}{' '}
                            </span>
                        </li>
                        <li>
                            <a
                                className='waves-effect waves-light btn indigo accent-2'
                                href='#!'
                                onClick={() => {
                                    connect();
                                }}
                            >
                                Connect wallet
                                <i className='material-icons right'>
                                    account_balance_wallet
                                </i>
                            </a>
                        </li>
                        <a
                            className={`btn-floating btn-small waves-effect waves-light accent-2 ${
                                !connected ? 'disabled' : ''
                            }`}
                            onClick={() => {
                                refresh();
                            }}
                            data-position='bottom'
                            href='#!'
                        >
                            <i className='material-icons'>update</i>
                        </a>
                    </ul>
                </div>
            </nav>
        </header>
    );
}

export default Header;
