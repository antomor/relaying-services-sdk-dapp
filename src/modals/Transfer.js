import { useState } from 'react';
import { toBN } from 'web3-utils';
import Utils, { estimateMaxPossibleRelayGas, TRIF_PRICE } from '../Utils';
import './Transfer.css';

const M = window.M;
const $ = window.$;

function Transfer(props) {
    const {
        currentSmartWallet
        , provider
        , setUpdateInfo
        , account
    } = props;

    const [loading, setLoading] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(false);

    const [transfer, setTransfer] = useState({
        check: false,
        fees: 0,
        amount: 0,
        address: ''
    });

    async function pasteRecipientAddress() {
        setLoading(true);
        const address = await navigator.clipboard.readText();
        if (Utils.checkAddress(address.toLowerCase())) {
            changeValue({ currentTarget: { value: address } }, 'address');
        }
        setLoading(false);
    }

    function changeValue(event, prop) {
        let obj = Object.assign({}, transfer);
        if (event.currentTarget.type === 'checkbox') {
            obj[prop] = event.currentTarget.checked;
        } else {
            obj[prop] = event.currentTarget.value;
        }
        setTransfer(obj)
    }

    async function handleTransferSmartWalletButtonClick() {
        if (transfer.check) {
            await sendRBTC();
        } else {
            await transferSmartWalletButtonClick();
        }
    }
    async function transferSmartWalletButtonClick() {
        setLoading(true);
        try {
            const amount = transfer.amount;
            const fees = transfer.fees === "" ? "0" : transfer.fees;

            const encodedAbi = (await Utils.getTokenContract()).methods
                .transfer(transfer.address, await Utils.toWei(amount)).encodeABI();

            const txDetails = await provider.relayTransaction(
                {
                    to: transfer.address
                    , data: encodedAbi
                }
                , {
                    tokenAddress: process.env.REACT_APP_CONTRACTS_RIF_TOKEN
                    , ...currentSmartWallet
                }
                , fees
                , {
                    retries: 7
                }
            );
            console.log(txDetails);
            setUpdateInfo(true);
            close();
        } catch (error) {
            alert(error.message);
            console.error(error);
        }
        setLoading(false);
    }

    async function sendRBTC() {
        setLoading(true);
        try {
            const amount = await Utils.toWei(transfer.amount, "ether");
            await Utils.sendTransaction({
                from: account, //currentSmartWallet.address,
                to: transfer.address,
                value: amount
            });
            close();
            setUpdateInfo(true);
        } catch (error) {
            alert(error.message);
            console.error(error)
        }
        setLoading(false);
    }

    function close(){
        var instance = M.Modal.getInstance($('#transfer-modal'));
        instance.close();
        setTransfer({
            check: false,
            fees: 0,
            amount: 0,
            address: ''
        });
        setEstimateLoading(false);
        setLoading(false);
    }
    
      async function handleEstimateTransferButtonClick() {
        setEstimateLoading(true);
        try {
            const encodedTransferFunction = (await Utils.getTokenContract()).methods
            .transfer(
                transfer.address,
                await Utils.toWei(transfer.amount.toString() || "0")
            )
            .encodeABI();
            const trxDetails = {
                from: account,
                to: process.env.REACT_APP_CONTRACTS_RIF_TOKEN,
                value: "0",
                relayHub: process.env.REACT_APP_CONTRACTS_RELAY_HUB,
                callVerifier: process.env.REACT_APP_CONTRACTS_RELAY_VERIFIER,
                callForwarder: currentSmartWallet.address,
                data: encodedTransferFunction,
                tokenContract: process.env.REACT_APP_CONTRACTS_RIF_TOKEN,
                // value set just for the estimation; in the original dapp the estimation is performed using an eight of the user's token balance,
                tokenAmount: window.web3.utils.toWei("1"),
                onlyPreferredRelays: true,
            };
            const maxPossibleGasValue = await estimateMaxPossibleRelayGas(provider.relayProvider.relayClient, trxDetails);    
            const gasPrice = toBN(
                await provider.relayProvider.relayClient._calculateGasPrice()
                );
            console.log('maxPossibleGas, gasPrice', maxPossibleGasValue.toString(), gasPrice.toString());
            const maxPossibleGas = toBN(maxPossibleGasValue);
            const estimate = maxPossibleGas.mul(gasPrice);
        
            const costInRBTC = await Utils.fromWei(estimate.toString());
            console.log("Cost in RBTC:", costInRBTC);

            const costInTrif = parseFloat(costInRBTC) / TRIF_PRICE;
            const tokenContract = await Utils.getTokenContract();
            const ritTokenDecimals = await tokenContract.methods.decimals().call();
            const costInTrifFixed = costInTrif.toFixed(ritTokenDecimals);
            console.log("Cost in TRif: ", costInTrifFixed);

            if (transfer.check === true) {
                changeValue({ currentTarget: { value: costInRBTC } }, "fees");
            } else {
                changeValue({ currentTarget: { value: costInTrifFixed } }, "fees");
            }
        } catch (error) {
          alert(error.message);
          console.error(error);
        }
        setEstimateLoading(false);
      }

    return (
        <div id="transfer-modal" className="modal">
            <div className="modal-content">
                <div className="row">
                    <form className="col s12 offset-s1">
                        <div className="row">
                            <div className="input-field col s5">
                                <input placeholder="Address" type="text" className="validate" onChange={(event) => {
                                    changeValue(event, 'address')
                                }} value={transfer.address} />
                                <label htmlFor="transfer-to">Transfer to</label>
                            </div>
                            <div className="input-field paste-container col s1">
                                <a href="#!" className="btn waves-effect waves-light indigo accent-2"><i className="material-icons center" onClick={pasteRecipientAddress}>content_paste</i></a>
                            </div>
                        </div>
                        <div className="row">
                            <div className="input-field col s8">
                                <input placeholder="0 tRIF" type="number" min="0" className="validate" onChange={(event) => {
                                    changeValue(event, 'amount')
                                }} value={transfer.amount} />
                                <label htmlFor="transfer-amount">Amount</label>
                            </div>
                            <div className="switch col s4" style={{ 'paddingTop': '2.5em' }}>
                                <label>
                                    tRIF
                                    <input type="checkbox" onChange={(event) => {
                                        changeValue(event, 'check')
                                    }} value={transfer.check} />
                                    <span className="lever"></span>
                                    RBTC
                                </label>
                            </div>
                        </div>
                        <div className="row">
                            <div className="input-field col s10">
                                <input placeholder="0 tRIF" type="number" min="0" className="validate" onChange={(event) => {
                                    changeValue(event, 'fees')
                                }} value={transfer.fees} />
                                <label htmlFor="transfer-fees">Fees</label>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div className="modal-footer">
                <a href="#!" onClick={handleTransferSmartWalletButtonClick} className={`waves-effect waves-green btn-flat ${ loading? 'disabled' : ''}`}>
                    Transfer <img alt="loading" className={`loading ${ !loading? 'hide' : ''}`} src="images/loading.gif"/>
                </a>
                <a href="#!" id="deploy-smart-wallet-estimate" className={`waves-effect waves-green btn-flat ${estimateLoading ? "disabled" : ""}`}onClick={handleEstimateTransferButtonClick}>
                    Estimate<img alt="loading" className={`loading ${!estimateLoading ? "hide" : ""}`} src="images/loading.gif"/>
                </a>
                <a href="#!" className="waves-effect waves-green btn-flat" onClick={() =>{
                    close();
                }} >Cancel</a>
            </div>
        </div>
    );
}

export default Transfer;
