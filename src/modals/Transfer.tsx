import EnvelopingTransactionDetails from '@rsksmart/rif-relay-common/dist/types/EnvelopingTransactionDetails';
import { Dispatch, SetStateAction, useState } from 'react';
import { RelayingServices } from 'relaying-services-sdk';
import { toBN } from 'web3-utils';
import { FixMeLater } from '../types';
import Utils, { estimateMaxPossibleRelayGas, TRIF_PRICE } from '../Utils';
import './Transfer.css';

const M = window.M;
const $ = window.$;

type TransferProps = {
    currentSmartWallet: FixMeLater;
    provider: RelayingServices;
    setUpdateInfo: FixMeLater;
    account: FixMeLater;
    setShow: Dispatch<SetStateAction<boolean>>
}

type TransferInfo = {
    fees: number | string,
    check: boolean,
    address: string,
    amount: number
}

type TransferInfoKey = keyof TransferInfo;

function Transfer(props: TransferProps) {
    const {
        currentSmartWallet
        , provider
        , setUpdateInfo
        , account
    } = props;

    const [loading, setLoading] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(false);

    const [transfer, setTransfer] = useState<TransferInfo>({
        check: false,
        fees: 0,
        amount: 0,
        address: ''
    });

    async function pasteRecipientAddress() {
        setLoading(true);
        const address = await navigator.clipboard.readText();
        if (Utils.checkAddress(address.toLowerCase())) {
            changeValue(address, 'address');
        }
        setLoading(false);
    }

    function changeValue(value: FixMeLater, prop: TransferInfoKey) {
        let obj = Object.assign({}, transfer);
        // @ts-ignore: TODO: change this to be type safe 
        obj[prop] = value;
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
                .transfer(transfer.address, await Utils.toWei(amount.toString())).encodeABI();

            const txDetails = await provider.relayTransaction(
                {
                    to: transfer.address
                    , data: encodedAbi
                }
                , {
                    tokenAddress: process.env.REACT_APP_CONTRACTS_RIF_TOKEN,
                    address: currentSmartWallet.address,
                    deployed:  currentSmartWallet.deployed,
                    index: currentSmartWallet.index,
                }
                , Number(fees)
                , {
                    retries: 7
                }
            );
            console.log(txDetails);
            setUpdateInfo(true);
            close();
        } catch (error) {
            const errorObj = error as Error;
            if (errorObj.message) {
                alert(errorObj.message);
            }
            console.error(error);
        }
        setLoading(false);
    }

    async function sendRBTC() {
        setLoading(true);
        try {
            const amount = await Utils.toWei(transfer.amount.toString());
            await Utils.sendTransaction({
                from: account, //currentSmartWallet.address,
                to: transfer.address,
                value: amount
            });
            close();
            setUpdateInfo(true);
        } catch (error) {
            const errorObj = error as Error;
            if (errorObj.message) {
                alert(errorObj.message);
            }
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
            const trxDetails: EnvelopingTransactionDetails = {
                from: account,
                to: process.env.REACT_APP_CONTRACTS_RIF_TOKEN!,
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
            //@ts-ignore TODO: we shouldn't access to the relayProvider
            const maxPossibleGasValue = await estimateMaxPossibleRelayGas(provider.relayProvider.relayClient, trxDetails);    
            const gasPrice = toBN(
                //@ts-ignore TODO: we shouldn't access to the relayProvider
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
                changeValue(costInRBTC, "fees");
            } else {
                changeValue(costInTrifFixed, "fees");
            }
        } catch (error) {
            const errorObj = error as Error;
            if (errorObj.message) {
                alert(errorObj.message);
            }
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
                                    changeValue(event.currentTarget.value, 'address')
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
                                    changeValue(event.currentTarget.value, 'amount')
                                }} value={transfer.amount} />
                                <label htmlFor="transfer-amount">Amount</label>
                            </div>
                            <div className="switch col s4" style={{ 'paddingTop': '2.5em' }}>
                                <label>
                                    tRIF
                                    <input type="checkbox" onChange={(event) => {
                                        changeValue(event.currentTarget.checked, 'check')
                                    }} checked={transfer.check??undefined} />
                                    <span className="lever"></span>
                                    RBTC
                                </label>
                            </div>
                        </div>
                        <div className="row">
                            <div className="input-field col s10">
                                <input placeholder="0 tRIF" type="number" min="0" className="validate" onChange={(event) => {
                                    changeValue(event.currentTarget.value, 'fees')
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
