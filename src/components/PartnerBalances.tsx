import { useEffect, useState } from 'react';
import { useStore } from 'src/context/context';
import Utils from '../Utils';

type PartnerBalanceProp = {
    label: string;
    balance: string;
};
function PartnerBalance({ label, balance }: PartnerBalanceProp) {
    return (
        <li className='collection-item'>
            <div>
                {label}
                <span className='secondary-content'>
                    <span id='worker-balance'>{balance}</span> tRIF
                </span>
            </div>
        </li>
    );
}

const getTokenBalance = async (address: string, token: string) => {
    try {
        const balance = parseFloat(
            Utils.fromWei(await Utils.tokenBalance(address, token))
        ).toFixed(4);
        return balance;
    } catch (error) {
        console.error(error);
        return '0';
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

type BalancesState = {
    worker: string;
    collector: string;
    partners: string[];
};

function PartnerBalances() {
    const [balances, setBalances] = useState<BalancesState>({
        worker: '0',
        collector: '0',
        partners: []
    });

    const { state } = useStore();

    useEffect(() => {
        let isMounted = true;
        getUpdatedBalances(state.token!.address).then((newBalances) => {
            if (isMounted) {
                setBalances(newBalances);
            }
        });
        return () => {
            isMounted = false;
        };
    }, [setBalances]);

    return (
        <ul className='collection with-header' style={{ textAlign: 'left' }}>
            <li className='collection-header'>
                <h4>Balances</h4>
            </li>
            <PartnerBalance label='Worker' balance={balances.worker} />
            <PartnerBalance label='Collector' balance={balances.collector} />
            {balances.partners.map((partnerBalance, index) => (
                <PartnerBalance
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    label={`Partner #${index + 1}`}
                    balance={partnerBalance}
                />
            ))}
        </ul>
    );
}

export default PartnerBalances;
