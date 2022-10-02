import { useStore } from 'src/context/context';

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

function PartnerBalances() {
    const { state } = useStore();

    const { worker, collector, partners, token } = state;

    return (
        <ul className='collection with-header' style={{ textAlign: 'left' }}>
            <li className='collection-header'>
                <h4>Balances</h4>
            </li>
            <PartnerBalance
                label='Worker'
                balance={worker!.balance}
                symbol={token!.symbol}
            />
            {collector && (
                <PartnerBalance
                    label='Collector'
                    balance={collector.balance}
                    symbol={token!.symbol}
                />
            )}
            {partners &&
                partners.map((partner, index) => (
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
