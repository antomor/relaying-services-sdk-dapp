import { useCallback, useEffect, useState } from 'react';
import { useStore } from 'src/context/context';
import type { Partner } from 'src/types';
import { getPartners, getTokenBalance } from 'src/Utils';

type PartnerBalanceProp = {
  label: string;
  balance: string;
  symbol: string | undefined;
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
  const { state, dispatch } = useStore();

  const { token, provider, reloadPartners } = state;

  const [feesReceiver, setFeesReceiver] = useState<Partner | undefined>(
    undefined
  );
  const [partners, setPartners] = useState<Partner[]>([]);

  const getPartnerBalance = async (address: string) => {
    try {
      const balance = await getTokenBalance(token!, address);
      return { address, balance };
    } catch (error) {
      console.error(error);
      return { address, balance: '-' };
    }
  };

  const refreshPartners = useCallback(async () => {
    if (provider && reloadPartners) {
      const localPartners = await getPartners(provider!);
      const updatedBalances = await Promise.all(
        localPartners.map((partner) => getPartnerBalance(partner))
      );
      const [newFeesReceiver, ...newPartners] = updatedBalances;
      setFeesReceiver(newFeesReceiver);
      setPartners(newPartners);
    }
  }, [token, reloadPartners]);

  useEffect(() => {
    refreshPartners();
    dispatch({
      type: 'reload_partners',
      reloadPartners: false,
    });
  }, [refreshPartners]);

  return (
    <ul className='collection with-header' style={{ textAlign: 'left' }}>
      <li className='collection-header'>
        <h4>Balances</h4>
      </li>
      {feesReceiver && (
        <PartnerBalance
          label='Fees Receiver'
          balance={feesReceiver.balance}
          symbol={token?.symbol}
        />
      )}
      {partners &&
        partners.map((partner, index) => (
          <PartnerBalance
            key={partner.address}
            label={`Partner #${index + 1}`}
            balance={partner.balance}
            symbol={token?.symbol}
          />
        ))}
    </ul>
  );
}

export default PartnerBalances;
