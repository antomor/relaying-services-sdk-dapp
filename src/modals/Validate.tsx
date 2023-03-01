import { FormEvent, useState } from 'react';
import {
  Button,
  Col,
  Icon,
  Modal,
  Row,
  Switch,
  TextInput,
} from 'react-materialize';
import LoadingButton from 'src/components/LoadingButton';
import { useStore } from 'src/context/context';
import type { SmartWallet } from 'src/types';
import { addLocalSmartWallet, addressHasCode, checkAddress } from 'src/Utils';
import { getSmartWalletAddress } from '@rsksmart/rif-relay-client';

type ValidateInfo = {
  check: boolean;
  address: string;
};

type ValidateInfoKey = keyof ValidateInfo;

function Validate() {
  const { state, dispatch } = useStore();

  const { chainId, account, smartWallets, modals, provider, relayClient } =
    state;

  const initialState: ValidateInfo = {
    check: false,
    address: '',
  };

  const [validate, setValidate] = useState<ValidateInfo>(initialState);

  const [validateLoading, setValidateLoading] = useState(false);

  const changeValue = <T,>(value: T, prop: ValidateInfoKey) => {
    if (!validate.check && prop === 'address' && Number(value) < 0) {
      return;
    }
    setValidate((prev: ValidateInfo) => ({ ...prev, [prop]: value }));
  };

  const close = () => {
    dispatch({ type: 'set_loader', loader: false });
    dispatch({ type: 'set_modals', modal: { validate: false } });
    setValidate(initialState);
  };

  const smartWalletExists = (address: string): Boolean => {
    const exists = smartWallets.find((x: SmartWallet) => x.address === address);
    if (exists) {
      dispatch({ type: 'set_loader', loader: false });
      alert('Smart Wallet already included');
      return true;
    }
    return false;
  };

  const importSmartWallet = async () => {
    setValidateLoading(true);
    try {
      dispatch({ type: 'set_loader', loader: true });
      if (smartWalletExists(validate.address)) {
        return;
      }
      if (await relayClient!.isSmartWalletOwner(validate.address, account)) {
        const smartWallet: SmartWallet = {
          index: -1,
          address: validate.address,
          isDeployed: true,
          tokenBalance: '0',
          rbtcBalance: '0',
        };
        dispatch({ type: 'add_smart_wallet', smartWallet });
        dispatch({ type: 'reload', reload: true });
        addLocalSmartWallet(chainId, account, smartWallet);
      }
      close();
    } catch (error) {
      dispatch({ type: 'set_loader', loader: false });
      const errorObj = error as Error;
      if (errorObj.message) {
        alert(errorObj.message);
      }
      console.error(error);
    }
    dispatch({ type: 'set_loader', loader: false });
    setValidateLoading(false);
  };

  const pasteRecipientAddress = async () => {
    const address = await navigator.clipboard.readText();
    if (checkAddress(address.toLowerCase())) {
      changeValue(address, 'address');
    }
  };

  const createSmartWallet = async () => {
    if (provider) {
      const index = Number(validate.address);
      const address = await getSmartWalletAddress(account, index);
      if (smartWalletExists(address)) {
        return;
      }
      const isDeployed = await addressHasCode(provider, address);
      const newSmartWallet: SmartWallet = {
        address,
        index,
        isDeployed,
        tokenBalance: '0',
        rbtcBalance: '0',
      };
      dispatch({
        type: 'add_smart_wallet',
        smartWallet: newSmartWallet,
      });
      dispatch({ type: 'reload', reload: true });
      if (newSmartWallet.isDeployed) {
        addLocalSmartWallet(chainId, account, newSmartWallet);
      }
      close();
    }
  };

  const handleValidateButtonClick = () => {
    if (validate.check) {
      importSmartWallet();
    } else {
      createSmartWallet();
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleValidateButtonClick();
  };

  function returnActions() {
    return [
      <Button
        flat
        node='button'
        waves='green'
        onClick={handleValidateButtonClick}
        disabled={validateLoading}
      >
        {validate.check ? 'Import' : 'Create'}
        <LoadingButton show={validateLoading} />
      </Button>,
      <Button flat modal='close' node='button' waves='green'>
        Cancel
      </Button>,
    ];
  }

  return (
    <Modal
      open={modals.validate}
      options={{
        onCloseEnd: () => close(),
      }}
      actions={returnActions()}
    >
      <Row>
        <form onSubmit={handleSubmit}>
          <Col s={7}>
            <TextInput
              label={validate.check ? 'Address' : 'Index'}
              placeholder={`Smart wallet ${
                validate.check ? 'address' : 'index'
              }`}
              value={validate.address}
              type={validate.check ? 'text' : 'number'}
              validate
              onChange={(event) => {
                changeValue(event.currentTarget.value, 'address');
              }}
            />
          </Col>
          <Col s={1}>
            {validate.check ? (
              <Button
                onClick={pasteRecipientAddress}
                waves='light'
                className='indigo accent-2'
                tooltip='Paste'
                node='div'
              >
                <Icon center>content_paste</Icon>
              </Button>
            ) : (
              ''
            )}
          </Col>
          <Col s={4}>
            <Switch
              offLabel='Deploy'
              onLabel='Import'
              checked={validate.check}
              onChange={(event) => {
                changeValue(event.currentTarget.checked, 'check');
              }}
            />
          </Col>
        </form>
      </Row>
    </Modal>
  );
}

export default Validate;
