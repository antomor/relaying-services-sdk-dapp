import { QRCodeSVG } from 'qrcode.react';
import { Modal, Col, Row } from 'react-materialize';
import 'src/modals/Receive.css';
import { useStore } from 'src/context/context';

function Receive() {
  const { state, dispatch } = useStore();

  const { smartWallet, modals } = state;

  return (
    <Modal
      open={modals.receive}
      options={{
        onCloseEnd: () =>
          dispatch({ type: 'set_modals', modal: { receive: false } }),
      }}
    >
      <Row>
        <Col s={12}>
          {smartWallet ? (
            <h6 className='col s12 center-align'>
              <span>
                <QRCodeSVG value={smartWallet.address} size={256} />
                <br />
                <br />
                {smartWallet.address}
              </span>
            </h6>
          ) : (
            ''
          )}
        </Col>
      </Row>
    </Modal>
  );
}

export default Receive;
