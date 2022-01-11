import './Execute.css';
import { useState } from 'react';
import Utils from '../Utils'
import abiDecoder from 'abi-decoder'
import Web3 from 'web3';
import IForwarder from '../contracts/IForwarder.json'
import { toBN } from 'web3-utils'

const M = window.M;
const $ = window.$;
if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
} else if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider);
} else {
    throw new Error('Error: MetaMask or web3 not detected');
}
const web3 = window.web3;

function Execute(props) {
    const {
        account,
        currentSmartWallet,
        provider
        , setUpdateInfo
    } = props;
    const [results, setResults] = useState('');
    const [execute, setExecute] = useState({
        check: false,
        show: false,
        address: '',
        value: '',
        function: '',
        fees: ''
    });
    const [executeLoading, setExecuteLoading] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(false);

    async function handleExecuteSmartWalletButtonClick() {
        setExecuteLoading(true);
        try {
            const funcData = calculateAbiEncodedFunction();
            const destinationContract = execute.address;
            const swAddress = currentSmartWallet.address;

            if (execute.check) {
                await relayTransactionDirectExecution(destinationContract, swAddress, funcData);
            }
            else {
                const fees = execute.fees === "" ? undefined : execute.fees
                const transaction = await provider.relayTransaction({
                    data: funcData
                }, {
                    tokenAddress: destinationContract,
                    address: swAddress
                }, fees);

                console.log('Transaction ', transaction)
                console.log(`Transaction hash: ${transaction.blockHash}`)

                const logs = abiDecoder.decodeLogs(transaction.logs)

                console.log("Transaction logs: ", logs)

                const sampleRecipientEmitted = logs.find((e) => e != null && e.name === 'TransactionRelayed')
                console.log(sampleRecipientEmitted)
                if (execute.show) {
                    setResults(JSON.stringify(transaction));
                } else {
                    setUpdateInfo(true);
                    close();
                }
            }
        } catch (error) {
            alert(error.message);
            console.error(error)
        }
        setExecuteLoading(false);
    }
    async function relayTransactionDirectExecution(toAddress, swAddress, abiEncodedTx) {
        const swContract = new web3.eth.Contract(IForwarder.abi, swAddress)
        swContract.setProvider(web3.currentProvider)

        await swContract.methods
            .directExecute(toAddress, abiEncodedTx)
            .send({
                from: account
            }, async (error, data) => {
                if (error !== undefined && error !== null) {
                    throw error;
                }
                else {
                    const txHash = data
                    console.log(`Your TxHash is ${txHash}`)

                    // checks to verify that the contract was executed properly
                    let receipt = await Utils.getReceipt(txHash)

                    console.log(`Your receipt is`)
                    console.log(receipt)

                    const trxData = await web3.eth.getTransaction(txHash)
                    console.log("Your tx data is")
                    console.log(trxData)
                }
            })

    }

    async function handleEstimateSmartWalletButtonClick() {
        setEstimateLoading(true);
        try {
            const isUnitRBTC = execute.check;

            const funcData = calculateAbiEncodedFunction();
            const destinationContract = execute.address;
            const swAddress = currentSmartWallet.address;

            //for estimation we will use an eight of the user's token balance, it's just to estimate the gas cost
            const tokenBalance = await Utils.tokenBalance(swAddress)
            const userTokenBalance = toBN(tokenBalance)

            if (userTokenBalance.gt(toBN("0"))) {

                const eightOfBalance = await Utils.fromWei(userTokenBalance.divRound(toBN("8")));
                console.log("Your Balance: ", await Utils.fromWei(userTokenBalance.toString()))
                console.log("Estimating with: ", eightOfBalance.toString())

                let result = 0
                if (isUnitRBTC) {
                    result = await estimateDirectExecution(swAddress, destinationContract, funcData);
                    changeValue({ currentTarget: { value: result } }, 'fees');
                    console.log("Estimated direct SWCall cost: ", result);
                }
                else {
                    const relayWorker = process.env.REACT_APP_CONTRACTS_RELAY_WORKER;
                    const costInWei = await provider.estimateMaxPossibleRelayGasWithLinearFit(
                        destinationContract,
                        swAddress,
                        '0',
                        funcData,
                        relayWorker);

                    const costInRBTC = await Utils.fromWei(costInWei.toString());
                    const tRifPriceInRBTC = parseFloat($('#trif-price').text()); // 1 tRIF = tRifPriceInRBTC RBTC
                    const tRifPriceInWei = toBN(await Utils.toWei(tRifPriceInRBTC.toString())); // 1 tRIF = tRifPriceInWei wei

                    console.log("Cost in RBTC (wei): ", costInWei.toString());
                    console.log("Cost in RBTC:", costInRBTC);
                    console.log("TRIf price in RBTC:", tRifPriceInRBTC.toString());
                    console.log("TRIf price in Wei:", tRifPriceInWei.toString());
                    const ritTokenDecimals = await Utils.ritTokenDecimals()
                    console.log("TRIF Decimals: ", ritTokenDecimals);

                    const costInTrif = costInRBTC / tRifPriceInRBTC
                    console.log("Cost in TRIF (rbtc): ", costInTrif.toString());

                    const costInTrifFixed = costInTrif.toFixed(ritTokenDecimals);
                    console.log("Cost in TRIF Fixed (rbtc): ", costInTrifFixed.toString());

                    const costInTrifAsWei = Utils.toWei(costInTrifFixed.toString(), 'ether');
                    console.log("Cost in TRIF (wei): ", costInTrifAsWei.toString());


                    console.log("RIF Token Decimals: ", ritTokenDecimals);

                    changeValue({ currentTarget: { value: costInTrifFixed } }, 'fees');
                    console.log("Cost in TRif: ", costInTrifFixed);
                }
            }
            else {
                throw new Error("You dont have any token balance")
            }
        } catch (error) {
            alert(error.message);
            console.error(error)
        }
        setEstimateLoading(false);
    }

    function calculateAbiEncodedFunction() {
        const contractFunction = execute.function.trim();
        const functionSig = web3.eth.abi.encodeFunctionSignature(contractFunction);

        const paramsStart = contractFunction.indexOf("(", 0)
        const paramsEnd = contractFunction.indexOf(")", paramsStart)

        let funcData = functionSig

        if (paramsEnd > (paramsStart + 1)) {//There are params
            const paramsStr = contractFunction.substring(paramsStart + 1, paramsEnd);

            const paramsTypes = paramsStr.split(",");
            const paramsValues = execute.value.split(",");

            const encodedParamVals = web3.eth.abi.encodeParameters(paramsTypes, paramsValues);
            funcData = funcData.concat(encodedParamVals.slice(2, encodedParamVals.length));
        }
        return funcData
    }

    function changeValue(event, prop) {
        let obj = Object.assign({}, execute);
        if (event.currentTarget.type === 'checkbox') {
            obj[prop] = event.currentTarget.checked;
        } else {
            obj[prop] = event.currentTarget.value;
        }
        setExecute(obj)
    }

    async function pasteRecipientAddress() {
        setExecuteLoading(true);
        const address = await navigator.clipboard.readText();
        if (Utils.checkAddress(address.toLowerCase())) {
            changeValue({ currentTarget: { value: address } }, 'address');
        }
        setExecuteLoading(false);
    }

    async function estimateDirectExecution(swAddress, toAddress, abiEncodedTx) {
        const swContract = new web3.eth.Contract(IForwarder.abi, swAddress)
        swContract.setProvider(web3.currentProvider)

        const estimate = await swContract.methods
            .directExecute(toAddress, abiEncodedTx)
            .estimateGas({ from: account });
        return estimate
    }

    function close() {
        var instance = M.Modal.getInstance($('#execute-modal'));
        instance.close();
        setExecute({
            check: false,
            show: false,
            address: '',
            value: '',
            function: '',
            fees: ''
        })
    }
    return (
        <div id="execute-modal" className="modal large-modal" style={{ 'maxHeight': '95%' }} >
            <div className="modal-content" style={{ 'paddingBottom': '0em' }}>
                <div className="row">
                    <form className="col s12">
                        <div className="row mb-0">
                            <div className="input-field col s10">
                                <input placeholder="Contract address" id="execute-contract-address" type="text" className="validate" onChange={(event) => {
                                    changeValue(event, 'address')
                                }} value={execute.address} />
                                <label htmlFor="execute-contract-address">Contract</label>
                            </div>
                            <div className="input-field col s1" style={{ 'paddingTop': '0.5em' }}>
                                <a href="#!" id="paste-contract-address-button" className="btn waves-effect waves-light indigo accent-2" onClick={pasteRecipientAddress}><i className="material-icons center">content_paste</i></a>
                            </div>
                        </div>
                        <div className="row mb-0">
                            <div className="input-field col s8">
                                <input placeholder="e.g.  transfer(address,uint256)" id="contract-function" type="text" className="validate" onChange={(event) => {
                                    changeValue(event, 'function')
                                }} value={execute.function} />
                                <label htmlFor="contract-function">Contract Function</label>
                            </div>
                            <div className="switch col s4" style={{ 'paddingTop': '2.0em' }}>
                                <label>
                                    Show return data
                                    <input type="checkbox" id="show-return-execute" onChange={(event) => {
                                        changeValue(event, 'show')
                                    }} value={execute.show} />
                                    <span className="lever"></span>
                                </label>
                            </div>
                        </div>
                        <div className="row mb-0">
                            <div className="input-field col s8">
                                <input placeholder="e.g. recipientAddr,amount" id="execute-param-values" type="text" className="validate" onChange={(event) => {
                                    changeValue(event, 'value')
                                }} value={execute.value} />
                                <label htmlFor="execute-param-values">Contract Function Values</label>
                            </div>
                        </div>
                        <div className="row mb-0">
                            <div className="input-field col s8">
                                <input placeholder="0" id="execute-fees" type="number" min="0" className="validate tooltipped" data-tooltip="" onChange={(event) => {
                                    changeValue(event, 'fees')
                                }} value={execute.fees} />
                                <label htmlFor="execute-fees" id="execute-fees-label">Fees (tRIF)</label>
                            </div>
                            <div className="switch col s4" style={{ 'paddingTop': '2.5em' }}>
                                <label>
                                    tRIF
                                    <input type="checkbox" onChange={(event) => {
                                        changeValue(event, 'check')
                                    }} value={execute.check} />
                                    <span className="lever"></span>
                                    RBTC
                                </label>
                            </div>
                        </div>
                        <div className={`row mb-0 ${execute.show && results ? '' : 'hide'}`} id="execute-result-row">
                            <div className="input-field col s12">
                                <span id="execute-result" style={{ 'wordBreak': 'break-all', 'width': 'inherit' }}>{results}</span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div className="modal-footer">
                <a href="#!" id="execute-smart-wallet" className={`waves-effect waves-green btn-flat  ${executeLoading ? 'disabled' : ''}`} onClick={() => {
                    handleExecuteSmartWalletButtonClick()
                }}>Execute <img alt="loading" className={`loading ${!executeLoading ? 'hide' : ''}`} src="images/loading.gif" /></a>
                <a href="#!" id="execute-smart-wallet-estimate" className={`waves-effect waves-green btn-flat  ${estimateLoading ? 'disabled' : ''}`} onClick={() => {
                    handleEstimateSmartWalletButtonClick()
                }}>Estimate <img alt="loading" className={`loading ${!estimateLoading ? 'hide' : ''}`} src="images/loading.gif" /></a>
                <a href="#!" id="execute-smart-wallet-cancel" className="waves-effect waves-green btn-flat" onClick={() =>{ close()}}>Cancel</a>
            </div>
        </div>
    );
}

export default Execute;
