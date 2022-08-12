import { Dispatch, SetStateAction, useState } from 'react';
import {
    Modal,
    Col,
    Row,
    TextInput,
    Button,
    Switch,
    Icon
} from 'react-materialize';
import { Modals, SmartWalletWithBalance } from 'src/types';
import LoadingButton from 'src/modals/LoadingButton';
import { useStore } from 'src/context/context';
import Utils from 'src/Utils';

type ValidateProps = {
    smartWallets: SmartWalletWithBalance[];
    setSmartWallets: Dispatch<SetStateAction<SmartWalletWithBalance[]>>;
    modal: Modals;
    setModal: Dispatch<SetStateAction<Modals>>;
};

type ValidateInfo = {
    check: boolean;
    address: string;
};

type ValidateInfoKey = keyof ValidateInfo;

function Validate(props: ValidateProps) {
    const { smartWallets, setSmartWallets, modal, setModal } = props;

    const [validate, setValidate] = useState<ValidateInfo>({
        check: false,
        address: ''
    });

    const [validateLoading, setValidateLoading] = useState(false);

    const { state, dispatch } = useStore();

    const changeValue = <T,>(value: T, prop: ValidateInfoKey) => {
        if (!validate.check && prop === 'address' && Number(value) < 0) {
            return;
        }
        setValidate((prev) => ({ ...prev, [prop]: value }));
    };

    const close = () => {
        setModal((prev) => ({ ...prev, validate: false }));
        setValidate({
            check: false,
            address: ''
        });
    };

    const validateSmartWallets = (address: string): Boolean => {
        for (let i = 0; i < smartWallets.length; i += 1) {
            if (smartWallets[i].address === address) {
                alert('Smart Wallet already included');
                return true;
            }
        }
        return false;
    };

    const importSmartWallet = async () => {
        setValidateLoading(true);
        try {
            dispatch({ type: 'set_loader', loader: true });
            if (validateSmartWallets(validate.address)) {
                dispatch({ type: 'set_loader', loader: false });
                return;
            }
            // Check if it can be re-factored to return a value
            await state.provider!.validateSmartWallet(validate.address);
            const smartWalletWithBalance = await Utils.getSmartWalletBalance(
                {
                    index: -1,
                    address: validate.address,
                    deployed: true
                },
                state.token!
            );
            const tempSmartWallets = [...smartWallets, smartWalletWithBalance];
            setSmartWallets(tempSmartWallets);
            localStorage.setItem(
                Utils.getChainKey(state.chainId, state.account),
                JSON.stringify(tempSmartWallets)
            );
            close();
        } catch (error) {
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
        if (Utils.checkAddress(address.toLowerCase())) {
            changeValue(address, 'address');
        }
    };

    const createSmartWallet = async () => {
        if (state.provider) {
            dispatch({ type: 'set_loader', loader: true });
            const smartWallet = await state.provider.generateSmartWallet(
                Number(validate.address)
            );
            if (validateSmartWallets(smartWallet.address)) {
                dispatch({ type: 'set_loader', loader: false });
                return;
            }
            const smartWalletWithBalance = await Utils.getSmartWalletBalance(
                smartWallet,
                state.token!
            );
            if (smartWalletWithBalance.deployed) {
                const tempSmartWallets = [
                    ...smartWallets,
                    smartWalletWithBalance
                ];
                setSmartWallets(tempSmartWallets);
                localStorage.setItem(
                    Utils.getChainKey(state.chainId, state.account),
                    JSON.stringify(tempSmartWallets)
                );
            } else {
                setSmartWallets((prev) => [...prev, smartWalletWithBalance]);
            }
            dispatch({ type: 'set_loader', loader: false });
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
            open={modal.validate}
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
