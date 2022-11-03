import { useState } from 'react';
import {
    RelayGasEstimationOptions,
    RelayingTransactionOptions,
    RelayingResult,
    RelayEstimation
} from '@rsksmart/rif-relay-sdk';
import IForwarderAbi from 'src/contracts/IForwarderAbi.json';
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
import Utils from 'src/Utils';
import { AbiItem } from 'web3-utils';
import LoadingButton from 'src/modals/LoadingButton';
import { useStore } from 'src/context/context';

type ExecuteInfo = {
    fees: string;
    check: boolean;
    show: boolean;
    address: string;
    value: string;
    function: string;
};

type ExecuteInfoKey = keyof ExecuteInfo;

function Execute() {
    const { state, dispatch } = useStore();
    const { modals, account, token, smartWallet, provider, chainId } = state;

    const [results, setResults] = useState('');

    const initialState: ExecuteInfo = {
        check: false,
        show: false,
        address: '',
        value: '',
        function: '',
        fees: ''
    };

    const [execute, setExecute] = useState<ExecuteInfo>(initialState);
    const [executeLoading, setExecuteLoading] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(false);

    const checkAddress = (address: string) => {
        if (!Utils.checkAddress(address.toLowerCase())) {
            throw Error('Contract address is not valid');
        }
    };

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

    const close = () => {
        dispatch({ type: 'set_modals', modal: { execute: false } });
        setResults('');
        setExecute(initialState);
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

        const transaction = swContract.methods
            .directExecute(toAddress, abiEncodedTx)
            .send(
                {
                    from: account
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
                        } else {
                            close();
                        }
                    }
                }
            );
        Utils.addTransaction(smartWallet!.address, chainId, {
            date: new Date(),
            id: transaction.transactionHash,
            type: 'Execute RBTC'
        });
    };

    const changeValue = <T,>(value: T, prop: ExecuteInfoKey) => {
        setExecute((prev: ExecuteInfo) => ({ ...prev, [prop]: value }));
    };

    const handleExecuteSmartWalletButtonClick = async () => {
        setExecuteLoading(true);
        try {
            checkAddress(execute.address);
            const funcData = calculateAbiEncodedFunction();
            const destinationContract = execute.address;
            const swAddress = smartWallet!.address;

            if (execute.check) {
                await relayTransactionDirectExecution(
                    destinationContract,
                    swAddress,
                    funcData
                );
            } else {
                const tokenAmount = execute.fees === '' ? '0' : execute.fees;
                const relayTransactionOpts: RelayingTransactionOptions = {
                    unsignedTx: {
                        data: funcData,
                        to: execute.address
                    },
                    smartWallet: smartWallet!,
                    tokenAmount,
                    tokenAddress: token!.instance.address,
                    transactionDetails: {
                        to: execute.address
                    }
                };
                const result: RelayingResult = await provider!.relayTransaction(
                    relayTransactionOpts
                );

                const txHash: string = result
                    .transaction!.hash(true)
                    .toString('hex');

                Utils.addTransaction(smartWallet!.address, chainId, {
                    date: new Date(),
                    id: txHash,
                    type: `Execute ${token!.symbol}`
                });
                dispatch({ type: 'reload', reload: true });
                if (execute.show) {
                    setResults(JSON.stringify(result?.transaction));
                } else {
                    close();
                }
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
    ): Promise<BN> => {
        const swContract = new web3.eth.Contract(
            IForwarderAbi as AbiItem[],
            swAddress
        );

        const estimate = await swContract.methods
            .directExecute(toAddress, abiEncodedTx)
            .estimateGas({ from: account });
        return estimate;
    };

    const handleEstimateSmartWalletButtonClick = async () => {
        setEstimateLoading(true);
        try {
            checkAddress(execute.address);
            const funcData = calculateAbiEncodedFunction();
            const destinationContract = execute.address;
            const swAddress = smartWallet!.address;

            if (execute.check === true) {
                const result = await estimateDirectExecution(
                    swAddress,
                    destinationContract,
                    funcData
                );
                changeValue(result.toString(), 'fees');
            } else {
                const opts: RelayGasEstimationOptions = {
                    destinationContract,
                    smartWalletAddress: swAddress,
                    tokenFees: '0',
                    abiEncodedTx: funcData,
                    tokenAddress: token!.instance.address,
                    isLinearEstimation: true
                };

                const estimation: RelayEstimation =
                    await provider!.estimateMaxPossibleGas(opts);

                console.log('estimation', estimation);

                changeValue(estimation.requiredTokenAmount, 'fees');
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
            open={modals.execute}
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
                            label={`Fees (${token!.symbol})`}
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
                            offLabel={token!.symbol!}
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
                        {execute.show && (
                            <span
                                style={{
                                    wordBreak: 'break-all',
                                    width: 'inherit'
                                }}
                            >
                                {results}
                            </span>
                        )}
                    </Col>
                </form>
            </Row>
        </Modal>
    );
}

export default Execute;
