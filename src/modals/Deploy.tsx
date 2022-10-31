import { useState } from 'react';
import {
    RelayGasEstimationOptions,
    RelayEstimation
} from '@rsksmart/rif-relay-sdk';
import { Modal, Col, Row, TextInput, Button } from 'react-materialize';
import Utils, { ZERO_ADDRESS } from 'src/Utils';
import 'src/modals/Deploy.css';
import LoadingButton from 'src/modals/LoadingButton';
import { useStore } from 'src/context/context';

type DeployInfo = {
    fees: string;
    tokenGas: number | string;
    relayGas: number;
};

type DeployInfoKey = keyof DeployInfo;

function Deploy() {
    const { state, dispatch } = useStore();

    const { chainId, account, smartWallet, token, provider, modals } = state;

    const [deploy, setDeploy] = useState<DeployInfo>({
        fees: '0',
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
                smartWalletAddress: smartWallet!.address,
                tokenFees: '1',
                isSmartWalletDeploy: true,
                index: smartWallet!.index.toString(),
                tokenAddress: token!.instance.address
            };

            const estimation: RelayEstimation =
                await provider!.estimateMaxPossibleGas(opts);
            console.log('estimation', estimation);

            if (estimation) {
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

    const checkSmartWalletDeployment = async (txHash: string) => {
        const receipt = await provider!.getTransactionReceipt(txHash);
        if (receipt === null) {
            return false;
        }

        console.log(`Your receipt is`);
        console.log(receipt);
        return receipt.status;
    };

    const relaySmartWalletDeployment = async (tokenAmount: string) => {
        try {
            const isTokenAllowed = await provider!.isAllowedToken(
                token!.instance.address
            );
            if (isTokenAllowed) {
                const newSmartWallet = await provider!.deploySmartWallet(
                    smartWallet!,
                    {
                        tokenAddress: token!.instance.address,
                        tokenAmount,
                        transactionDetails: {
                            ignoreTransactionReceipt: true
                        }
                    }
                );
                const smartWalledIsDeployed = await checkSmartWalletDeployment(
                    newSmartWallet.deployment?.deployTransaction!
                );
                if (!smartWalledIsDeployed) {
                    throw new Error('SmartWallet: deployment failed');
                }
                return newSmartWallet;
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
        dispatch({ type: 'set_modals', modal: { deploy: false } });
        setDeploy({
            fees: '0',
            tokenGas: 0,
            relayGas: 0
        });
    };

    const handleDeploySmartWalletButtonClick = async () => {
        const fees = deploy.fees === '' ? '0' : deploy.fees;
        deploy.tokenGas = deploy.tokenGas === '' ? '0' : deploy.tokenGas;

        setDeployLoading(true);
        const newSmartWallet = await relaySmartWalletDeployment(fees);
        if (newSmartWallet?.deployment) {
            smartWallet!.deployed = true;
            Utils.addLocalSmartWallet(chainId, account, smartWallet!);
            close();
            dispatch({ type: 'reload', reload: true });
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
            open={modals.deploy}
            options={{
                onCloseEnd: () => close()
            }}
            actions={returnActions()}
        >
            <Row>
                <form>
                    <Col s={8}>
                        <TextInput
                            label={`Fees (${token!.symbol})`}
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
