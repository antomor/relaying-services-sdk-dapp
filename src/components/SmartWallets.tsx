import type { Modals, SmartWallet } from 'src/types';
import 'src/components/SmartWallets.css';
import { Col, Row, Button, Icon } from 'react-materialize';
import { useStore } from 'src/context/context';

type ModalsKey = keyof Modals;

type SmartWalletComponentProp = {
  smartWallet: SmartWallet;
};

function SmartWalletComponent({ smartWallet }: SmartWalletComponentProp) {
  const { state, dispatch } = useStore();

  const { token } = state;

  async function copySmartWalletAddress(address: string) {
    await navigator.clipboard.writeText(address);
  }

  function openModal(newSmartWallet: SmartWallet, modal: ModalsKey) {
    dispatch({ type: 'set_smart_wallet', smartWallet: newSmartWallet });
    dispatch({ type: 'set_modals', modal: { [modal]: true } });
  }

  return (
    <Row className='teal vertical-align lighten-4'>
      <Col s={1}>
        <Button
          waves='light'
          className='indigo accent-2'
          tooltip='Deploy'
          floating
          disabled={smartWallet.isDeployed}
          onClick={() => {
            openModal(smartWallet, 'deploy');
          }}
        >
          <Icon center>file_upload</Icon>
        </Button>
      </Col>
      <Col s={3}>
        <h6 className='summary-smart-wallet-address'>{smartWallet.address}</h6>
      </Col>
      <Col s={1}>
        <Button
          waves='light'
          className='indigo accent-2'
          tooltip='Copy address'
          floating
          onClick={() => {
            copySmartWalletAddress(smartWallet.address);
          }}
        >
          <Icon center>content_copy</Icon>
        </Button>
      </Col>
      <Col s={2}>
        <h6>{`${smartWallet.tokenBalance!} ${token!.symbol}`}</h6>
      </Col>
      <Col s={2}>
        <h6>{`${smartWallet.rbtcBalance!} RBTC`}</h6>
      </Col>
      <Col s={3}>
        <Row>
          <Col>
            <Button
              waves='light'
              className='indigo accent-2'
              tooltip='Transfer'
              floating
              disabled={!smartWallet.isDeployed}
              onClick={() => {
                openModal(smartWallet, 'transfer');
              }}
            >
              <Icon center>call_made</Icon>
            </Button>
          </Col>
          <Col>
            <Button
              waves='light'
              className='indigo accent-2'
              tooltip='Receive'
              floating
              onClick={() => {
                openModal(smartWallet, 'receive');
              }}
            >
              <Icon center>arrow_downward</Icon>
            </Button>
          </Col>
          <Col>
            <Button
              waves='light'
              className='indigo accent-2'
              tooltip='Execute'
              floating
              disabled={!smartWallet.isDeployed}
              onClick={() => {
                openModal(smartWallet, 'execute');
              }}
            >
              <Icon center>play_circle_outline</Icon>
            </Button>
          </Col>
          <Col>
            <Button
              waves='light'
              className='indigo accent-2'
              tooltip='Transactions'
              floating
              disabled={!smartWallet.isDeployed}
              onClick={() => {
                openModal(smartWallet, 'transactions');
              }}
            >
              <Icon center>manage_search</Icon>
            </Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}

function SmartWallets() {
  const { state } = useStore();

  const { smartWallets, connected } = state;

  return (
    <div className='smart-wallets'>
      <Row
        className={`grey ${
          smartWallets.length <= 0 && connected ? '' : 'hide'
        }`}
      >
        <Col s={12}>
          <h6 className='center-align'>
            No Smart Wallets detected for selected account. Create a new Smart
            Wallet by clicking the New Smart Wallet button.
          </h6>
        </Col>
        <Col s={12} className={`${connected ? 'hide' : ''}`}>
          <h6 className='center-align'>
            Wallet not connected, please connect.
          </h6>
        </Col>
      </Row>
      {smartWallets.map((smartWallet: SmartWallet) => (
        <Row key={smartWallet.address} className='space-row'>
          <SmartWalletComponent smartWallet={smartWallet} />
        </Row>
      ))}
    </div>
  );
}

export default SmartWallets;
