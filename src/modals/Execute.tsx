import { Dispatch, SetStateAction, useState } from 'react';
// @ts-ignore: TODO: Check if there is a ts library
import abiDecoder from 'abi-decoder';
import {
    RelayGasEstimationOptions,
    RelayingTransactionOptions
} from '@rsksmart/rif-relay-sdk';
import IForwarderAbi from 'src/contracts/IForwarderAbi.json';
import { Modals } from 'src/types';
import 'src/modals/Execute.css';
import {
    Modal,
    Col,
    Row,
    TextInput,
    Button,
    Icon,
    Switch
} from 'react-materialize';
import Utils, { TRIF_PRICE } from 'src/Utils';
import { AbiItem, toBN } from 'web3-utils';
import LoadingButton from 'src/modals/LoadingButton';
import { useStore } from 'src/context/context';

type ExecuteProps = {
    setUpdateInfo: Dispatch<SetStateAction<boolean>>;
    modal: Modals;
    setModal: Dispatch<SetStateAction<Modals>>;
};

type ExecuteInfo = {
    fees: string;
    check: boolean;
    show: boolean;
    address: string;
    value: string;
    function: string;
};

type ExecuteInfoKey = keyof ExecuteInfo;

function Execute(props: ExecuteProps) {
    const { state } = useStore();
    const { setUpdateInfo, modal, setModal } = props;
    const [results, setResults] = useState('');
    const [execute, setExecute] = useState<ExecuteInfo>({
        check: false,
        show: false,
        address: '',
        value: '',
        function: '',
        fees: ''
    });
    const [executeLoading, setExecuteLoading] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(false);

    const calculateAbiEncodedFunction = () => {
        const contractFunction = execute.function.trim();
        const functionSig =
            web3.eth.abi.encodeFunctionSignature(contractFunction);

        const paramsStart = contractFunction.indexOf('(', 0);
        const paramsEnd = contractFunction.indexOf(')', paramsStart);

        let funcData = functionSig;

        if (paramsEnd > paramsStart + 1) {
            // There are params
            const paramsStr = contractFunction.substring(
                paramsStart + 1,
                paramsEnd
            );

            const paramsTypes = paramsStr.split(',');
            const paramsValues = execute.value.split(',');

            const encodedParamVals = web3.eth.abi.encodeParameters(
                paramsTypes,
                paramsValues
            );
            funcData = funcData.concat(
                encodedParamVals.slice(2, encodedParamVals.length)
            );
        }
        return funcData;
    };

    const relayTransactionDirectExecution = async (
        toAddress: string,
        swAddress: string,
        abiEncodedTx: string
    ) => {
        const swContract = new web3.eth.Contract(
            IForwarderAbi as AbiItem[],
            swAddress
        );

        const transaction = await swContract.methods
            .directExecute(toAddress, abiEncodedTx)
            .send(
                {
                    from: state.account
                },
                // TODO: we may add the types
                async (error: any, data: any) => {
                    if (error !== undefined && error !== null) {
                        throw error;
                    } else {
                        const txHash = data;
                        console.log(`Your TxHash is ${txHash}`);

                        // checks to verify that the contract was executed properly
                        const receipt = await Utils.getReceipt(txHash);

                        console.log(`Your receipt is`);
                        console.log(receipt);

                        const trxData = await web3.eth.getTransaction(txHash);
                        console.log('Your tx data is');
                        console.log(trxData);
                        if (execute.show) {
                            setResults(JSON.stringify(transaction));
                        }
                    }
                }
            );
        Utils.addTransaction(state.smartWallet!.address, {
            date: new Date(),
            id: transaction.transactionHash,
            type: 'Execute RBTC'
        });
    };

    const close = () => {
        setModal((prev) => ({ ...prev, execute: false }));
        setResults('');
        setExecute({
            check: false,
            show: false,
            address: '',
            value: '',
            function: '',
            fees: ''
        });
    };

    const changeValue = <T,>(value: T, prop: ExecuteInfoKey) => {
        setExecute((prev) => ({ ...prev, [prop]: value }));
    };

    const handleExecuteSmartWalletButtonClick = async () => {
        setExecuteLoading(true);
        try {
            const funcData = calculateAbiEncodedFunction();
            const destinationContract = execute.address;
            const swAddress = state.smartWallet!.address;

            if (execute.check) {
                await relayTransactionDirectExecution(
                    destinationContract,
                    swAddress,
                    funcData
                );
            } else {
                const fees = execute.fees === '' ? '0' : execute.fees;
                const relayTransactionOpts: RelayingTransactionOptions = {
                    unsignedTx: {
                        data: funcData
                    },
                    smartWallet: state.smartWallet!,
                    tokenAmount: Number(fees),
                    tokenAddress: state.token!.address
                };
                const transaction = await state.provider!.relayTransaction(
                    relayTransactionOpts
                );

                console.log('Transaction ', transaction);
                console.log(`Transaction hash: ${transaction.blockHash}`);

                const logs = abiDecoder.decodeLogs(transaction.logs);

                console.log('Transaction logs: ', logs);

                // TODO: abi-decode doesn't provide declaration files
                const sampleRecipientEmitted = logs.find(
                    (e: any) => e != null && e.name === 'TransactionRelayed'
                );
                console.log(sampleRecipientEmitted);
                if (execute.show) {
                    setResults(JSON.stringify(transaction));
                } else {
                    setUpdateInfo(true);
                    close();
                }
                Utils.addTransaction(state.smartWallet!.address, {
                    date: new Date(),
                    id: transaction.transactionHash,
                    type: `Execute ${state.token!.symbol}`
                });
            }
        } catch (error) {
            const errorObj = error as Error;
            if (errorObj.message) {
                alert(errorObj.message);
            }
            console.error(error);
        }
        setExecuteLoading(false);
    };

    const estimateDirectExecution = async (
        swAddress: string,
        toAddress: string,
        abiEncodedTx: string
    ) => {
        const swContract = new web3.eth.Contract(
            IForwarderAbi as AbiItem[],
            swAddress
        );

        const estimate = await swContract.methods
            .directExecute(toAddress, abiEncodedTx)
            .estimateGas({ from: state.account });
        return estimate;
    };

    const handleEstimateSmartWalletButtonClick = async () => {
        setEstimateLoading(true);
        try {
            const isUnitRBTC = execute.check;

            const funcData = calculateAbiEncodedFunction();
            const destinationContract = execute.address;
            const swAddress = state.smartWallet!.address;

            // for estimation we will use an eight of the user's token balance, it's just to estimate the gas cost
            const tokenBalance = await Utils.tokenBalance(
                swAddress,
                state.token!.address
            );
            const userTokenBalance = toBN(tokenBalance);

            if (userTokenBalance.gt(toBN('0'))) {
                const eightOfBalance = await Utils.fromWei(
                    userTokenBalance.divRound(toBN('8')).toString()
                );
                console.log(
                    'Your Balance: ',
                    await Utils.fromWei(userTokenBalance.toString())
                );
                console.log('Estimating with: ', eightOfBalance.toString());

                let result = 0;
                if (isUnitRBTC) {
                    result = await estimateDirectExecution(
                        swAddress,
                        destinationContract,
                        funcData
                    );
                    changeValue(result, 'fees');
                    console.log('Estimated direct SWCall cost: ', result);
                } else {
                    const relayWorker =
                        process.env.REACT_APP_CONTRACTS_RELAY_WORKER!;

                    const gasEstimationOpts: RelayGasEstimationOptions = {
                        destinationContract,
                        relayWorker,
                        smartWalletAddress: swAddress,
                        tokenFees: '0',
                        abiEncodedTx: funcData,
                        tokenAddress: state.token!.address
                    };

                    const costInWei =
                        await state.provider!.estimateMaxPossibleRelayGasWithLinearFit(
                            gasEstimationOpts
                        );

                    const costInRBTC = await Utils.fromWei(
                        costInWei.toString()
                    );
                    // TODO: We need to change it to support different tokens
                    // (we may want to receive it from the user)
                    const tRifPriceInRBTC = TRIF_PRICE;
                    const tRifPriceInWei = toBN(
                        await Utils.toWei(tRifPriceInRBTC.toString())
                    ); // 1 tRIF = tRifPriceInWei wei

                    console.log('Cost in RBTC (wei): ', costInWei.toString());
                    console.log('Cost in RBTC:', costInRBTC);
                    console.log(
                        'TRIf price in RBTC:',
                        tRifPriceInRBTC.toString()
                    );
                    console.log(
                        'TRIf price in Wei:',
                        tRifPriceInWei.toString()
                    );
                    const tokenDecimals = await Utils.tokenDecimals(
                        state.token!.address
                    );
                    console.log('TRIF Decimals: ', tokenDecimals);

                    const costInTrif = Number(costInRBTC) / tRifPriceInRBTC;
                    console.log('Cost in TRIF (rbtc): ', costInTrif.toString());

                    const costInTrifFixed = costInTrif.toFixed(tokenDecimals);
                    console.log(
                        'Cost in TRIF Fixed (rbtc): ',
                        costInTrifFixed.toString()
                    );

                    const costInTrifAsWei = Utils.toWei(
                        costInTrifFixed.toString()
                    );
                    console.log(
                        'Cost in TRIF (wei): ',
                        costInTrifAsWei.toString()
                    );

                    console.log('Token Decimals: ', tokenDecimals);

                    changeValue(costInTrifFixed, 'fees');
                    console.log('Cost in TRif: ', costInTrifFixed);
                }
            } else {
                throw new Error('You dont have any token balance');
            }
        } catch (error) {
            const errorObj = error as Error;
            if (errorObj.message) {
                alert(errorObj.message);
            }
            console.error(error);
        }
        setEstimateLoading(false);
    };

    const pasteRecipientAddress = async () => {
        const address = await navigator.clipboard.readText();
        if (Utils.checkAddress(address.toLowerCase())) {
            changeValue(address, 'address');
        }
    };

    const returnActions = () => [
        <Button
            flat
            node='button'
            waves='green'
            onClick={handleExecuteSmartWalletButtonClick}
            disabled={executeLoading}
        >
            Execute
            <LoadingButton show={executeLoading} />
        </Button>,
        <Button
            flat
            node='button'
            waves='green'
            onClick={handleEstimateSmartWalletButtonClick}
            disabled={estimateLoading}
        >
            Estimate
            <LoadingButton show={estimateLoading} />
        </Button>,
        <Button flat modal='close' node='button' waves='green'>
            Cancel
        </Button>
    ];

    return (
        <Modal
            open={modal.execute}
            options={{
                onCloseEnd: () => close()
            }}
            actions={returnActions()}
        >
            <Row>
                <form>
                    <Col s={10}>
                        <TextInput
                            label='Contract'
                            placeholder='Contract address'
                            value={execute.address}
                            validate
                            onChange={(event) => {
                                changeValue(
                                    event.currentTarget.value,
                                    'address'
                                );
                            }}
                        />
                    </Col>
                    <Col s={1}>
                        <Button
                            onClick={pasteRecipientAddress}
                            waves='light'
                            className='indigo accent-2'
                            tooltip='Paste'
                            node='div'
                        >
                            <Icon center>content_paste</Icon>
                        </Button>
                    </Col>
                    <Col s={8}>
                        <TextInput
                            label='Contract function'
                            placeholder='e.g.  transfer(address,uint256)'
                            value={execute.function}
                            type='text'
                            validate
                            onChange={(event) => {
                                changeValue(
                                    event.currentTarget.value,
                                    'function'
                                );
                            }}
                        />
                    </Col>
                    <Col s={4}>
                        <Switch
                            offLabel='Show return data'
                            onLabel=''
                            checked={execute.show}
                            onChange={(event) => {
                                changeValue(
                                    event.currentTarget.checked,
                                    'show'
                                );
                            }}
                        />
                    </Col>
                    <Col s={8}>
                        <TextInput
                            label='Contrac function values'
                            placeholder='e.g. recipientAddr,amount'
                            value={execute.value}
                            validate
                            onChange={(event) => {
                                changeValue(event.currentTarget.value, 'value');
                            }}
                        />
                    </Col>
                    <Col s={8}>
                        <TextInput
                            label={`Fees (${state.token!.symbol})`}
                            placeholder='0'
                            value={execute.fees}
                            type='text'
                            validate
                            onChange={(event) => {
                                changeValue(event.currentTarget.value, 'fees');
                            }}
                        />
                    </Col>
                    <Col s={4}>
                        <Switch
                            offLabel={state.token!.symbol}
                            onLabel='RBTC'
                            checked={execute.check}
                            onChange={(event) => {
                                changeValue(
                                    event.currentTarget.checked,
                                    'check'
                                );
                            }}
                        />
                    </Col>
                    <Col s={12}>
                        <span
                            style={{
                                wordBreak: 'break-all',
                                width: 'inherit'
                            }}
                        >
                            {results}
                        </span>
                    </Col>
                </form>
            </Row>
        </Modal>
    );
}

export default Execute;
