import { Dispatch, SetStateAction, useState } from 'react';
import { RelayGasEstimationOptions } from '@rsksmart/rif-relay-sdk';
import { Modal, Col, Row, TextInput, Button } from 'react-materialize';
import Utils, { TRIF_PRICE, ZERO_ADDRESS } from 'src/Utils';
import { Modals, SmartWalletWithBalance } from 'src/types';
import 'src/modals/Deploy.css';
import LoadingButton from 'src/modals/LoadingButton';
import { useStore } from 'src/context/context';

type DeployProps = {
    smartWallets: SmartWalletWithBalance[];
    modal: Modals;
    setModal: Dispatch<SetStateAction<Modals>>;
};

type DeployInfo = {
    fees: string;
    check: boolean;
    tokenGas: number | string;
    relayGas: number;
};

type DeployInfoKey = keyof DeployInfo;

function Deploy(props: DeployProps) {
    const { state } = useStore();

    const { smartWallets, modal, setModal } = props;

    const [deploy, setDeploy] = useState<DeployInfo>({
        fees: '0',
        check: false,
        tokenGas: 0,
        relayGas: 0
    });

    const [deployLoading, setDeployLoading] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(false);

    /*
     * It receives the value and the property to change and
     * it updates the status of the `deploy` object with a copy
     * of the current status but with the property specified updated
     * with the new value
     */
    const changeValue = <T,>(value: T, prop: DeployInfoKey) => {
        if (prop === 'fees' && Number(value) < 0) {
            return;
        }
        setDeploy((prev) => ({ ...prev, [prop]: value }));
    };

    const handleEstimateDeploySmartWalletButtonClick = async () => {
        setEstimateLoading(true);
        try {
            const opts: RelayGasEstimationOptions = {
                abiEncodedTx: '0x',
                destinationContract: ZERO_ADDRESS,
                relayWorker: process.env.REACT_APP_CONTRACTS_RELAY_WORKER!,
                smartWalletAddress: state.smartWallet!.address,
                tokenFees: '1',
                isSmartWalletDeploy: true,
                index: state.smartWallet!.index.toString(),
                tokenAddress: state.token!.address
            };

            const estimate = await state.provider!.estimateMaxPossibleRelayGas(
                opts
            );

            if (estimate) {
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

                if (deploy.check === true) {
                    changeValue(costInRBTC, 'fees');
                } else {
                    changeValue(costInTrifFixed, 'fees');
                }
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

    const checkSmartWalletDeployment = async (txHash: string) => {
        const receipt = await state.provider!.getTransactionReceipt(txHash);
        if (receipt === null) {
            return false;
        }

        console.log(`Your receipt is`);
        console.log(receipt);
        return receipt.status;
    };

    const relaySmartWalletDeployment = async (tokenAmount: string | number) => {
        try {
            const isTokenAllowed = await state.provider!.isAllowedToken(
                state.token!.address
            );
            if (isTokenAllowed) {
                const fees = await Utils.toWei(`${tokenAmount}`);
                const smartWallet = await state.provider!.deploySmartWallet(
                    state.smartWallet!,
                    {
                        tokenAddress: state.token!.address,
                        tokenAmount: Number(fees),
                        transactionDetails: {
                            ignoreTransactionReceipt: true
                        }
                    }
                );
                const smartWalledIsDeployed = await checkSmartWalletDeployment(
                    smartWallet.deployment?.deployTransaction!
                );
                if (!smartWalledIsDeployed) {
                    throw new Error('SmartWallet: deployment failed');
                }
                return smartWallet;
            }
            throw new Error(
                'SmartWallet: was not created because Verifier does not accept the specified token for payment'
            );
        } catch (error) {
            const errorObj = error as Error;
            if (errorObj.message) {
                alert(errorObj.message);
            }
            console.error(error);
        }
        return undefined;
    };

    const close = () => {
        setModal((prev) => ({ ...prev, deploy: false }));
        setDeploy({
            fees: '0',
            check: false,
            tokenGas: 0,
            relayGas: 0
        });
    };

    const handleDeploySmartWalletButtonClick = async () => {
        deploy.fees = deploy.fees === '' ? '0' : deploy.fees;
        deploy.tokenGas = deploy.tokenGas === '' ? '0' : deploy.tokenGas;

        setDeployLoading(true);
        const smartWallet = await relaySmartWalletDeployment(deploy.fees);
        if (smartWallet?.deployment) {
            state.smartWallet!.deployed = true;
            localStorage.setItem(
                Utils.getTransactionKey(state.chainId, state.account),
                JSON.stringify(smartWallets)
            );
            close();
        }

        setDeployLoading(false);
    };

    function returnActions() {
        return [
            <Button
                flat
                node='button'
                waves='green'
                onClick={handleDeploySmartWalletButtonClick}
                disabled={deployLoading}
            >
                Deploy
                <LoadingButton show={deployLoading} />
            </Button>,
            <Button
                flat
                node='button'
                waves='green'
                onClick={handleEstimateDeploySmartWalletButtonClick}
                disabled={estimateLoading}
            >
                Estimate
                <LoadingButton show={estimateLoading} />
            </Button>,
            <Button flat modal='close' node='button' waves='green'>
                Cancel
            </Button>
        ];
    }

    return (
        <Modal
            open={modal.deploy}
            options={{
                onCloseEnd: () => close()
            }}
            actions={returnActions()}
        >
            <Row>
                <form>
                    <Col s={8}>
                        <TextInput
                            label={`Fees (${state.token!.symbol})`}
                            placeholder='0'
                            value={deploy.fees}
                            type='number'
                            validate
                            onChange={(event) => {
                                changeValue(event.target.value, 'fees');
                            }}
                        />
                    </Col>
                </form>
            </Row>
        </Modal>
    );
}

export default Deploy;
