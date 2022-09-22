import { useEffect, useState } from 'react';
import { useStore } from 'src/context/context';
import Utils from '../Utils';

type PartnerBalanceProp = {
    label: string;
    balance: string;
    symbol: string;
};

function PartnerBalance({ label, balance, symbol }: PartnerBalanceProp) {
    return (
        <li className='collection-item'>
            <div>
                {label}
                <span className='secondary-content'>
                    <span id='worker-balance'>{balance}</span> {symbol}
                </span>
            </div>
        </li>
    );
}

const getTokenBalance = async (
    address: string,
    token: string
): Promise<Partner> => {
    try {
        const balance = parseFloat(
            Utils.fromWei(await Utils.tokenBalance(address, token))
        ).toFixed(4);
        return { address, balance };
    } catch (error) {
        console.error(error);
        return { address, balance: '0' };
    }
};

const getUpdatedBalances = async (token: string) => {
    const workerAddr = process.env.REACT_APP_CONTRACTS_RELAY_WORKER!;
    const collectorAddr = process.env.REACT_APP_CONTRACTS_COLLECTOR!;
    const partnerAddresses = Utils.getPartners();
    const addresses = [workerAddr, collectorAddr, ...partnerAddresses];
    const updatedBalances = await Promise.all(
        addresses.map((address) => getTokenBalance(address, token))
    );
    const [worker, collector, ...partnerBalances] = updatedBalances;
    const newBalanceState = {
        worker,
        collector,
        partners: partnerBalances
    };
    return newBalanceState;
};

type Partner = {
    address: string;
    balance: string;
};

type BalancesState = {
    worker: Partner;
    collector: Partner;
    partners: Partner[];
};

type PartnerBalancesProp = {
    updateInfo: boolean;
};

function PartnerBalances({ updateInfo }: PartnerBalancesProp) {
    const [balances, setBalances] = useState<BalancesState>({
        worker: { address: '', balance: '0' },
        collector: { address: '', balance: '0' },
        partners: []
    });

    const { state } = useStore();

    useEffect(() => {
        getUpdatedBalances(state.token!.address).then((newBalances) => {
            setBalances(newBalances);
        });
    }, [updateInfo]);

    return (
        <ul className='collection with-header' style={{ textAlign: 'left' }}>
            <li className='collection-header'>
                <h4>Balances</h4>
            </li>
            <PartnerBalance
                label='Worker'
                balance={balances!.worker.balance}
                symbol={state.token!.symbol}
            />
            <PartnerBalance
                label='Collector'
                balance={balances!.collector.balance}
                symbol={state.token!.symbol}
            />
            {balances!.partners.map((partner, index) => (
                <PartnerBalance
                    key={partner.address}
                    label={`Partner #${index + 1}`}
                    balance={partner.balance}
                    symbol={state.token!.symbol}
                />
            ))}
        </ul>
    );
}

export default PartnerBalances;
