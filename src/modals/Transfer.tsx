import { Dispatch, SetStateAction, useState } from 'react';
import {
    RelayGasEstimationOptions,
    RelayingTransactionOptions
} from '@rsksmart/rif-relay-sdk';
import { Modals } from 'src/types';
import Utils, { TRIF_PRICE } from 'src/Utils';
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

type TransferProps = {
    setUpdateInfo: Dispatch<SetStateAction<boolean>>;
    modal: Modals;
    setModal: Dispatch<SetStateAction<Modals>>;
};

type TransferInfo = {
    fees: string;
    check: boolean;
    address: string;
    amount: string;
};

type TransferInfoKey = keyof TransferInfo;

function Transfer(props: TransferProps) {
    const { state } = useStore();

    const { setUpdateInfo, modal, setModal } = props;

    const [transferLoading, setTransferLoading] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(false);

    const [transfer, setTransfer] = useState<TransferInfo>({
        check: false,
        fees: '',
        amount: '',
        address: ''
    });

    const close = () => {
        setModal((prev) => ({ ...prev, transfer: false }));
        setTransfer({
            check: false,
            fees: '',
            amount: '',
            address: ''
        });
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
        if (state.account) {
            setTransferLoading(true);
            try {
                const amount = await Utils.toWei(transfer.amount.toString());
                await Utils.sendTransaction({
                    from: state.account, // currentSmartWallet.address,
                    to: transfer.address,
                    value: amount,
                    data: '0x'
                });
                close();
                setUpdateInfo(true);
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
        console.log(address);
        if (Utils.checkAddress(address.toLowerCase())) {
            changeValue(address, 'address');
        }
    };

    const transferSmartWalletButtonClick = async () => {
        setTransferLoading(true);
        try {
            const { amount } = transfer;
            const fees = transfer.fees === '' ? '0' : transfer.fees;

            const encodedAbi = (
                await Utils.getTokenContract(state.token!.address)
            ).methods
                .transfer(
                    transfer.address,
                    await Utils.toWei(amount.toString())
                )
                .encodeABI();

            const relayTrxOpts: RelayingTransactionOptions = {
                smartWallet: state.smartWallet!,
                unsignedTx: {
                    to: transfer.address,
                    data: encodedAbi
                },
                tokenAddress: state.token!.address,
                tokenAmount: Number(fees),
                transactionDetails: {
                    retries: 7
                }
            };

            const txDetails = await state.provider!.relayTransaction(
                relayTrxOpts
            );
            console.log(txDetails);
            Utils.addTransaction(state.smartWallet!.address, {
                date: new Date(),
                id: txDetails.transactionHash,
                type: `Transfer ${
                    transfer.check ? 'RBTC' : state.token!.symbol
                }`
            });
            setUpdateInfo(true);
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
        if (state.account) {
            setEstimateLoading(true);
            try {
                const encodedTransferFunction = (
                    await Utils.getTokenContract(state.token!.address)
                ).methods
                    .transfer(
                        transfer.address,
                        await Utils.toWei(transfer.amount.toString() || '0')
                    )
                    .encodeABI();

                const opts: RelayGasEstimationOptions = {
                    abiEncodedTx: encodedTransferFunction,
                    smartWalletAddress: state.smartWallet!.address,
                    tokenFees: '1',
                    destinationContract: state.token!.address,
                    relayWorker: process.env.REACT_APP_CONTRACTS_RELAY_WORKER!,
                    tokenAddress: state.token!.address
                };

                const estimate =
                    await state.provider!.estimateMaxPossibleRelayGas(opts);

                const costInRBTC = await Utils.fromWei(estimate.toString());
                console.log('Cost in RBTC:', costInRBTC);

                const costInTrif = parseFloat(costInRBTC) / TRIF_PRICE;
                const tokenContract = await Utils.getTokenContract(
                    state.token!.address
                );
                const ritTokenDecimals = await tokenContract.methods
                    .decimals()
                    .call();
                const costInTrifFixed = costInTrif.toFixed(ritTokenDecimals);
                console.log('Cost in TRif: ', costInTrifFixed);

                if (transfer.check === true) {
                    changeValue(costInRBTC, 'fees');
                } else {
                    changeValue(costInTrifFixed, 'fees');
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
            open={modal.transfer}
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
                                transfer.check ? 'RBTC' : state.token!.symbol
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
                            offLabel={state.token!.symbol}
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
                            placeholder={`0 ${state.token!.symbol}`}
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
