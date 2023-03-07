import { useState } from 'react';
import 'src/modals/Execute.css';
import {
  Modal,
  Col,
  Row,
  TextInput,
  Button,
  Icon,
  Switch,
} from 'react-materialize';
import { addTransaction, checkAddress } from 'src/Utils';
import LoadingButton from 'src/components/LoadingButton';
import { useStore } from 'src/context/context';
import { BigNumber, Transaction, utils } from 'ethers';
import { IForwarder__factory } from '@rsksmart/rif-relay-contracts';
import type {
  RelayEstimation,
  UserDefinedEnvelopingRequest,
} from '@rsksmart/rif-relay-client';

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
  const {
    modals,
    account,
    token,
    smartWallet,
    provider,
    chainId,
    relayClient,
  } = state;

  const [results, setResults] = useState('');

  const initialState: ExecuteInfo = {
    check: false,
    show: false,
    address: '',
    value: '',
    function: '',
    fees: '',
  };

  const [execute, setExecute] = useState<ExecuteInfo>(initialState);
  const [executeLoading, setExecuteLoading] = useState(false);
  const [estimateLoading, setEstimateLoading] = useState(false);

  const calculateAbiEncodedFunction = () => {
    const functionTrimmed = execute.function.trim();
    const iface = new utils.Interface([`function ${functionTrimmed}`]);

    const [functionName] = functionTrimmed.split(/[()]+/);

    const functionParams = execute.value.split(',');

    return iface.encodeFunctionData(functionName!, functionParams);
  };

  const close = () => {
    dispatch({ type: 'set_modals', modal: { execute: false } });
    setResults('');
    setExecute(initialState);
  };

  const directExecute = async (
    toAddress: string,
    swAddress: string,
    abiEncodedTx: string
  ) => {
    const iForwarder = IForwarder__factory.connect(
      swAddress,
      provider!.getSigner()
    );

    const transaction = await iForwarder.directExecute(toAddress, abiEncodedTx);

    const receipt = transaction.wait();

    console.log(`Your receipt is`);
    console.log(receipt);

    if (execute.show) {
      setResults(JSON.stringify(transaction));
    } else {
      close();
    }

    addTransaction(smartWallet!.address, chainId, {
      date: new Date(),
      id: transaction.hash,
      type: 'Execute RBTC',
    });
  };

  const changeValue = <T,>(value: T, prop: ExecuteInfoKey) => {
    setExecute((prev: ExecuteInfo) => ({ ...prev, [prop]: value }));
  };

  const handleExecuteSmartWalletButtonClick = async () => {
    setExecuteLoading(true);
    try {
      const funcData = calculateAbiEncodedFunction();
      const destinationContract = execute.address;
      const swAddress = smartWallet!.address;

      if (execute.check) {
        await directExecute(destinationContract, swAddress, funcData);
      } else {
        const tokenAmount = execute.fees === '' ? '0' : execute.fees;
        const relayTransactionOpts: UserDefinedEnvelopingRequest = {
          request: {
            from: account,
            data: funcData,
            to: execute.address,
            tokenAmount,
            tokenContract: token!.instance.address,
          },
          relayData: {
            callForwarder: smartWallet!.address,
          },
        };

        const transaction: Transaction = await relayClient!.relayTransaction(
          relayTransactionOpts
        );

        addTransaction(smartWallet!.address, chainId, {
          date: new Date(),
          id: transaction.hash!,
          type: `Execute ${token!.symbol}`,
        });
        dispatch({ type: 'reload', reload: true });
        if (execute.show) {
          setResults(JSON.stringify(transaction));
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
  ): Promise<BigNumber> => {
    const iForwarder = IForwarder__factory.connect(swAddress, provider!);

    const estimate = await iForwarder.estimateGas.directExecute(
      toAddress,
      abiEncodedTx
    );

    return estimate;
  };

  const handleEstimateSmartWalletButtonClick = async () => {
    setEstimateLoading(true);
    try {
      checkAddress(execute.address);
      const funcData = calculateAbiEncodedFunction();
      const destinationContract = execute.address;
      const swAddress = smartWallet!.address;

      if (execute.check) {
        const result = await estimateDirectExecution(
          swAddress,
          destinationContract,
          funcData
        );
        changeValue(result.toString(), 'fees');
      } else {
        const relayTransactionOpts: UserDefinedEnvelopingRequest = {
          request: {
            from: account,
            data: funcData,
            to: destinationContract,
            tokenContract: token!.instance.address,
          },
          relayData: {
            callForwarder: smartWallet!.address,
          },
        };

        const estimation: RelayEstimation =
          await relayClient!.estimateRelayTransaction(relayTransactionOpts);

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
    if (checkAddress(address.toLowerCase())) {
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
      className='execute-btn-execute'
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
      className='execute-btn-estimate'
    >
      Estimate
      <LoadingButton show={estimateLoading} />
    </Button>,
    <Button
      flat
      modal='close'
      node='button'
      waves='green'
      className='execute-btn-cancel'
    >
      Cancel
    </Button>,
  ];

  return (
    <Modal
      open={modals.execute}
      options={{
        onCloseEnd: () => close(),
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
                changeValue(event.currentTarget.value, 'address');
              }}
              id='execute-input-address'
            />
          </Col>
          <Col s={1}>
            <Button
              onClick={pasteRecipientAddress}
              waves='light'
              className='indigo accent-2 execute-btn-past'
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
                changeValue(event.currentTarget.value, 'function');
              }}
              id='execute-input-function'
            />
          </Col>
          <Col s={4}>
            <Switch
              offLabel='Show return data'
              onLabel=''
              checked={execute.show}
              onChange={(event) => {
                changeValue(event.currentTarget.checked, 'show');
              }}
              id='execute-switch-return-data'
            />
          </Col>
          <Col s={8}>
            <TextInput
              label='Contract function values'
              placeholder='e.g. recipientAddr,amount'
              value={execute.value}
              validate
              onChange={(event) => {
                changeValue(event.currentTarget.value, 'value');
              }}
              id='execute-input-function-values'
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
              id='execute-input-fee'
            />
          </Col>
          <Col s={4}>
            <Switch
              offLabel={token!.symbol!}
              onLabel='RBTC'
              checked={execute.check}
              onChange={(event) => {
                changeValue(event.currentTarget.checked, 'check');
              }}
              id='execute-switch-rbtc'
            />
          </Col>
          <Col s={12}>
            {execute.show && (
              <span
                style={{
                  wordBreak: 'break-all',
                  width: 'inherit',
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
