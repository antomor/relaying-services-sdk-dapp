import { useState } from 'react';
import {
    Button,
    Col,
    Icon,
    Modal,
    Row,
    Switch,
    TextInput
} from 'react-materialize';
import LoadingButton from 'src/modals/LoadingButton';
import Utils from 'src/Utils';
import { useStore } from 'src/context/context';
import { SmartWalletWithBalance } from 'src/types';

type ValidateInfo = {
    check: boolean;
    address: string;
};

type ValidateInfoKey = keyof ValidateInfo;

function Validate() {
    const { state, dispatch } = useStore();

    const { chainId, account, smartWallets, modals } = state;

    const [validate, setValidate] = useState<ValidateInfo>({
        check: false,
        address: ''
    });

    const [validateLoading, setValidateLoading] = useState(false);

    const changeValue = <T,>(value: T, prop: ValidateInfoKey) => {
        if (!validate.check && prop === 'address' && Number(value) < 0) {
            return;
        }
        setValidate((prev) => ({ ...prev, [prop]: value }));
    };

    const close = () => {
        dispatch({ type: 'set_modals', modal: { validate: false } });
        setValidate({
            check: false,
            address: ''
        });
    };

    const validateSmartWallets = (address: string): Boolean => {
        const existing = smartWallets.find((x) => x.address === address);
        if (existing) {
            alert('Smart Wallet already included');
            return true;
        }
        return false;
    };

    const importSmartWallet = async () => {
        setValidateLoading(true);
        try {
            dispatch({ type: 'set_loader', show: true });
            if (validateSmartWallets(validate.address)) {
                dispatch({ type: 'set_loader', show: false });
                return;
            }
            // TO-DO: Check if it can be re-factored to return a value
            await state.provider!.validateSmartWallet(validate.address);
            const smartWallet: SmartWalletWithBalance = {
                index: -1,
                address: validate.address,
                deployed: true,
                tokenBalance: '0',
                rbtcBalance: '0'
            };
            dispatch({ type: 'add_smart_wallet', smartWallet });
            Utils.addLocalSmartWallet(chainId, account, smartWallet);
            close();
        } catch (error) {
            const errorObj = error as Error;
            if (errorObj.message) {
                alert(errorObj.message);
            }
            console.error(error);
        }
        dispatch({ type: 'set_loader', show: false });
        setValidateLoading(false);
    };

    const pasteRecipientAddress = async () => {
        const address = await navigator.clipboard.readText();
        if (Utils.checkAddress(address.toLowerCase())) {
            changeValue(address, 'address');
        }
    };

    const createSmartWallet = async () => {
        if (state.provider) {
            // dispatch({ type: 'set_loader', show: true });
            const smartWallet = await state.provider.generateSmartWallet(
                Number(validate.address)
            );
            if (validateSmartWallets(smartWallet.address)) {
                dispatch({ type: 'set_loader', show: false });
                return;
            }
            const newSmartWallet = {
                ...smartWallet,
                tokenBalance: '0',
                rbtcBalance: '0'
            };
            dispatch({
                type: 'add_smart_wallet',
                smartWallet: newSmartWallet
            });
            if (smartWallet.deployed) {
                Utils.addLocalSmartWallet(chainId, account, newSmartWallet);
            }
            // dispatch({ type: 'set_loader', show: false });
            close();
        }
    };

    const handleDeployButtonClick = () => {
        if (validate.check) {
            importSmartWallet();
        } else {
            createSmartWallet();
        }
    };

    function returnActions() {
        return [
            <Button
                flat
                node='button'
                waves='green'
                onClick={handleDeployButtonClick}
                disabled={validateLoading}
            >
                {validate.check ? 'Import' : 'Create'}
                <LoadingButton show={validateLoading} />
            </Button>,
            <Button flat modal='close' node='button' waves='green'>
                Cancel
            </Button>
        ];
    }

    return (
        <Modal
            open={modals.validate}
            options={{
                onCloseEnd: () => close()
            }}
            actions={returnActions()}
        >
            <Row>
                <form>
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
                                changeValue(
                                    event.currentTarget.value,
                                    'address'
                                );
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
                            offLabel='Create smart wallet'
                            onLabel='Import smart wallet'
                            checked={validate.check}
                            onChange={(event) => {
                                changeValue(
                                    event.currentTarget.checked,
                                    'check'
                                );
                            }}
                        />
                    </Col>
                </form>
            </Row>
        </Modal>
    );
}

export default Validate;
