import { useEffect, useState } from "react";
import Utils from "../Utils";

const getTokenBalance = async (address) => {
    try {
        const balance = parseFloat(Utils.fromWei(await Utils.tokenBalance(address))).toFixed(4);
        return balance;
    } catch (error) {
        console.error(error);
        return '0';
    }
}

const getUpdatedBalances = async () => {
    const workerAddr = process.env.REACT_APP_CONTRACTS_RELAY_WORKER
    const collectorAddr = process.env.REACT_APP_CONTRACTS_COLLECTOR
    const partnerAddresses = Utils.getPartners();
    const addresses = [
        workerAddr,
        collectorAddr,
        ...partnerAddresses
    ];
    const updatedBalances = await Promise.all(addresses.map(address => getTokenBalance(address)))
    const [ worker, collector, ...partnerBalances] = updatedBalances;
    const newBalanceState = {
        worker,
        collector,
        partners: partnerBalances
    }
    return newBalanceState;
}

function PartnerBalances() {
    const [balances, setBalances] = useState({
        worker: '0',
        collector: '0',
        partners: []
    });


    useEffect(() => {
        let isMounted = true;
        getUpdatedBalances().then((balances) => {
            if (isMounted) {
                setBalances(balances);
            }
        })
        return () => {isMounted = false}
    }, [setBalances]);

    return (
        <ul className="collection with-header" style={{textAlign:'left'}}>
            <li className="collection-header"><h4>Balances</h4></li>
            <PartnerBalance label={'Worker'} balance={balances.worker}/>
            <PartnerBalance label={'Collector'} balance={balances.collector}/>
            {
                balances.partners.map((partnerBalance, index) => <PartnerBalance key={index} label={`Partner #${index+1}`} balance={partnerBalance}/>)
            }
        </ul>
    )
}

const PartnerBalance = ({ label, balance }) => (
    <li className="collection-item">
      <div>
        {label}
        <span className="secondary-content">
          <span id="worker-balance">{balance}</span> tRIF
        </span>
      </div>
    </li>
  );

export default PartnerBalances