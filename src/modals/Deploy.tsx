import { FormEvent, useState } from 'react';
import { Modal, Col, Row, TextInput, Button } from 'react-materialize';
import 'src/modals/Deploy.css';
import LoadingButton from 'src/components/LoadingButton';
import { useStore } from 'src/context/context';
import { addLocalSmartWallet } from 'src/Utils';
import type {
  RelayEstimation,
  UserDefinedDeployRequest,
} from '@rsksmart/rif-relay-client';
import type { SmartWallet } from 'src/types';

type DeployInfo = {
  fees: string;
  tokenGas: number | string;
  relayGas: number;
};

type DeployInfoKey = keyof DeployInfo;

function Deploy() {
  const { state, dispatch } = useStore();
  const {
    chainId,
    account,
    smartWallet,
    token,
    provider,
    modals,
    relayClient,
  } = state;

  const initialState: DeployInfo = {
    fees: '0',
    tokenGas: 0,
    relayGas: 0,
  };

  const [deploy, setDeploy] = useState<DeployInfo>(initialState);

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
      const relayTransactionOpts: UserDefinedDeployRequest = {
        request: {
          from: account,
          tokenContract: token!.instance.address,
          index: smartWallet!.index,
        },
      };

      const estimation: RelayEstimation =
        await relayClient!.estimateRelayTransaction(relayTransactionOpts);

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
    if ( !provider ) {
      return false;
    }
    const receipt = await provider.waitForTransaction(txHash, 1, 40000);
    if (receipt === null) {
      return false;
    }

    console.log(`Your receipt is ${receipt}`);

    return receipt.status === 1;
  };

  const relaySmartWalletDeployment = async (
    tokenAmount: string
  ): Promise<SmartWallet | undefined> => {
    try {
      const relayTransactionOpts: UserDefinedDeployRequest = {
        request: {
          from: account,
          tokenAmount,
          tokenContract: token!.instance.address,
          index: smartWallet!.index,
        },
      };

      const transaction = await relayClient!.relayTransaction(
        relayTransactionOpts
      );

      const isDeployed = await checkSmartWalletDeployment(transaction.hash!);
      if (!isDeployed) {
        throw new Error('SmartWallet: deployment failed');
      }

      return {
        ...smartWallet!,
        isDeployed,
      };
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
    setDeploy(initialState);
  };

  const handleDeploySmartWalletButtonClick = async () => {
    const fees = deploy.fees === '' ? '0' : deploy.fees;
    deploy.tokenGas = deploy.tokenGas === '' ? '0' : deploy.tokenGas;

    setDeployLoading(true);
    const newSmartWallet = await relaySmartWalletDeployment(fees);
    if (newSmartWallet?.isDeployed) {
      smartWallet!.isDeployed = true;
      addLocalSmartWallet(chainId, account, smartWallet!);
      close();
      dispatch({ type: 'reload', reload: true });
    }
    setDeployLoading(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleDeploySmartWalletButtonClick();
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
      </Button>,
    ];
  }

  return (
    <Modal
      open={modals.deploy}
      options={{
        onCloseEnd: () => close(),
      }}
      actions={returnActions()}
    >
      <Row>
        <form onSubmit={handleSubmit}>
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
