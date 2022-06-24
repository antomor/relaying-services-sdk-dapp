import { Dispatch, SetStateAction } from 'react';
import { SmartWallet } from '@rsksmart/rif-relay-sdk';
import { QRCodeSVG } from 'qrcode.react';
import { Modal, Col, Row } from 'react-materialize';
import 'src/modals/Receive.css';
import { Modals } from 'src/types';

type ReceiveProps = {
    currentSmartWallet?: SmartWallet;
    modal: Modals;
    setModal: Dispatch<SetStateAction<Modals>>;
};

function Receive(props: ReceiveProps) {
    const { currentSmartWallet, modal, setModal } = props;

    return (
        <Modal
            open={modal.receive}
            options={{
                onCloseEnd: () =>
                    setModal((prev) => ({ ...prev, receive: false }))
            }}
        >
            <Row>
                <Col s={12}>
                    <h6 className='col s12 center-align'>
                        {currentSmartWallet ? (
                            <span>
                                <QRCodeSVG
                                    value={currentSmartWallet.address}
                                    size={256}
                                />
                                <br />
                                <br />
                                {currentSmartWallet.address}
                            </span>
                        ) : (
                            ''
                        )}
                    </h6>
                </Col>
            </Row>
        </Modal>
    );
}

export default Receive;
