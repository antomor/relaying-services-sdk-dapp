import { useState } from 'react';
import {
    RelayGasEstimationOptions,
    RelayingTransactionOptions,
    RelayingResult,
    RelayEstimation
} from '@rsksmart/rif-relay-sdk';
import Utils from 'src/Utils';
import 'src/modals/Transfer.css';
import {
    Modal,
    Col,
    Row,
    TextInput,
    Button,
    Icon,
    Switch
} from 'react-materialize';
import LoadingButton from 'src/modals/LoadingButton';
import { useStore } from 'src/context/context';

type TransferInfo = {
    fees: string;
    check: boolean;
    address: string;
    amount: string;
};

type TransferInfoKey = keyof TransferInfo;

function Transfer() {
    const { state, dispatch } = useStore();

    const { modals, account, token, smartWallet, provider, chainId } = state;

    const [transferLoading, setTransferLoading] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(false);

    const initialState: TransferInfo = {
        check: false,
        fees: '',
        amount: '',
        address: ''
    };

    const [transfer, setTransfer] = useState<TransferInfo>(initialState);

    const close = () => {
        dispatch({ type: 'set_modals', modal: { transfer: false } });
        setTransfer(initialState);
        setEstimateLoading(false);
        setTransferLoading(false);
    };

    const changeValue = <T,>(value: T, prop: TransferInfoKey) => {
        if ((prop === 'fees' || prop === 'amount') && Number(value) < 0) {
            return;
        }
        setTransfer((prev) => ({ ...prev, [prop]: value }));
    };

    const sendRBTC = async () => {
        if (account) {
            setTransferLoading(true);
            try {
                const amount = await Utils.toWei(transfer.amount.toString());
                await Utils.sendTransaction({
                    from: account, // currentSmartWallet.address,
                    to: transfer.address,
                    value: amount,
                    data: '0x'
                });
                close();
            } catch (error) {
                const errorObj = error as Error;
                if (errorObj.message) {
                    alert(errorObj.message);
                }
                console.error(error);
            }
            setTransferLoading(false);
        }
    };

    const pasteRecipientAddress = async () => {
        const address = await navigator.clipboard.readText();
        if (Utils.checkAddress(address.toLowerCase())) {
            changeValue(address, 'address');
        }
    };

    const transferSmartWalletButtonClick = async () => {
        setTransferLoading(true);
        try {
            const { amount } = transfer;
            const tokenAmount = transfer.fees === '' ? '0' : transfer.fees;

            const encodedAbi = token!.instance.contract.methods
                .transfer(transfer.address, amount.toString())
                .encodeABI();

            const relayTrxOpts: RelayingTransactionOptions = {
                smartWallet: smartWallet!,
                unsignedTx: {
                    to: transfer.address,
                    data: encodedAbi
                },
                tokenAddress: token!.instance.address,
                tokenAmount,
                transactionDetails: {
                    to: token!.instance.address,
                    retries: 7,
                    ignoreTransactionReceipt: true
                }
            };

            const result: RelayingResult = await provider!.relayTransaction(
                relayTrxOpts
            );
            const txHash: string = result
                .transaction!.hash(true)
                .toString('hex');
            Utils.addTransaction(smartWallet!.address, chainId, {
                date: new Date(),
                id: txHash,
                type: `Transfer ${transfer.check ? 'RBTC' : token!.symbol}`
            });
            dispatch({ type: 'reload', reload: true });
            close();
        } catch (error) {
            const errorObj = error as Error;
            if (errorObj.message) {
                alert(errorObj.message);
            }
            console.error(error);
        }
        setTransferLoading(false);
    };

    const handleEstimateTransferButtonClick = async () => {
        if (account) {
            setEstimateLoading(true);
            try {
                const encodedTransferFunction = token!.instance.contract.methods
                    .transfer(transfer.address, transfer.amount)
                    .encodeABI();

                const opts: RelayGasEstimationOptions = {
                    abiEncodedTx: encodedTransferFunction,
                    smartWalletAddress: smartWallet!.address,
                    tokenFees: '1',
                    destinationContract: token!.instance.address,
                    tokenAddress: token!.instance.address
                };

                const estimation: RelayEstimation =
                    await provider!.estimateMaxPossibleGas(opts);

                console.log('estimation', estimation);

                if (transfer.check === true) {
                    changeValue(estimation.requiredNativeAmount, 'fees');
                } else {
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
        }
    };

    const handleTransferSmartWalletButtonClick = async () => {
        if (transfer.check) {
            await sendRBTC();
        } else {
            await transferSmartWalletButtonClick();
        }
    };

    const returnActions = () => [
        <Button
            flat
            node='button'
            waves='green'
            onClick={handleTransferSmartWalletButtonClick}
            disabled={transferLoading}
        >
            Transfer
            <LoadingButton show={transferLoading} />
        </Button>,
        <Button
            flat
            node='button'
            waves='green'
            onClick={handleEstimateTransferButtonClick}
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
            open={modals.transfer}
            options={{
                onCloseEnd: () => close()
            }}
            actions={returnActions()}
        >
            <Row>
                <form>
                    <Col s={8}>
                        <TextInput
                            label='Transfer to'
                            placeholder='Address'
                            value={transfer.address}
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
                            label='Amount'
                            placeholder={`0  ${
                                transfer.check ? 'RBTC' : token!.symbol
                            }`}
                            value={transfer.amount}
                            type='number'
                            validate
                            onChange={(event) => {
                                changeValue(
                                    event.currentTarget.value,
                                    'amount'
                                );
                            }}
                        />
                    </Col>
                    <Col s={4}>
                        <Switch
                            offLabel={token!.symbol!}
                            onLabel='RBTC'
                            checked={transfer.check}
                            onChange={(event) => {
                                changeValue(
                                    event.currentTarget.checked,
                                    'check'
                                );
                            }}
                        />
                    </Col>
                    <Col s={10}>
                        <TextInput
                            label='Fees'
                            placeholder={`0 ${token!.symbol}`}
                            value={transfer.fees}
                            type='number'
                            validate
                            onChange={(event) => {
                                changeValue(event.currentTarget.value, 'fees');
                            }}
                        />
                    </Col>
                </form>
            </Row>
        </Modal>
    );
}

export default Transfer;
