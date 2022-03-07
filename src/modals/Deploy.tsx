import './Deploy.css';
import { Dispatch, SetStateAction, useState } from 'react';
import { RelayingServices, SmartWallet } from 'relaying-services-sdk';
import Utils, { TRIF_PRICE } from '../Utils';

const { $ } = window;
const { M } = window;
setTimeout(() => {
    M.AutoInit();
}, 0);

type DeployProps = {
    currentSmartWallet?: SmartWallet;
    provider?: RelayingServices;
    setUpdateInfo: Dispatch<SetStateAction<boolean>>;
};

type DeployInfo = {
    fees: number | string;
    check: boolean;
    tokenGas: number | string;
    relayGas: number;
};

type DeployInfoKey = keyof DeployInfo;

function Deploy(props: DeployProps) {
    const { currentSmartWallet, provider, setUpdateInfo } = props;

    const [deploy, setDeploy] = useState<DeployInfo>({
        fees: 0,
        check: false,
        tokenGas: 0,
        relayGas: 0
    });
    const [loading, setLoading] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(false);

    function changeValue<T>(value: T, prop: DeployInfoKey) {
        const obj: DeployInfo = { ...deploy };
        // @ts-ignore: TODO: change this to be type safe
        obj[prop] = value;
        setDeploy(obj);
    }

    async function handleEstimateDeploySmartWalletButtonClick() {
        setEstimateLoading(true);
        try {
            const estimate = await provider?.estimateMaxPossibleRelayGas(
                currentSmartWallet!,
                process.env.REACT_APP_CONTRACTS_RELAY_WORKER!
            );

            // TODO: delete this line, doesn't make sense
            // changeValue({ currentTarget: { value: estimate } });

            if (estimate) {
                const costInRBTC = await Utils.fromWei(estimate.toString());
                console.log('Cost in RBTC:', costInRBTC);

                const costInTrif = parseFloat(costInRBTC) / TRIF_PRICE;
                const tokenContract = await Utils.getTokenContract();
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
    }

    async function getReceipt(transactionHash: string) {
        let receipt = await Utils.getTransactionReceipt(transactionHash);
        let times = 0;

        while (receipt === null && times < 40) {
            times += 1;
            // eslint-disable-next-line no-promise-executor-return
            const sleep = new Promise((resolve) => setTimeout(resolve, 1000));
            // eslint-disable-next-line no-await-in-loop
            await sleep;
            // eslint-disable-next-line no-await-in-loop
            receipt = await Utils.getTransactionReceipt(transactionHash);
        }

        return receipt;
    }

    async function checkSmartWalletDeployment(txHash: string) {
        const receipt = await getReceipt(txHash);

        if (receipt === null) {
            return false;
        }

        console.log(`Your receipt is`);
        console.log(receipt);
        return receipt.status;
    }

    async function relaySmartWalletDeployment(tokenAmount: string | number) {
        try {
            if (provider) {
                const isAllowToken = await provider.isAllowedToken(
                    process.env.REACT_APP_CONTRACTS_RIF_TOKEN!
                );
                if (isAllowToken) {
                    const fees = await Utils.toWei(`${tokenAmount}`);
                    const smartWallet = await provider.deploySmartWallet(
                        currentSmartWallet!,
                        process.env.REACT_APP_CONTRACTS_RIF_TOKEN,
                        fees
                    );
                    const smartWalledIsDeployed =
                        await checkSmartWalletDeployment(
                            smartWallet.deployTransaction!
                        );
                    if (!smartWalledIsDeployed) {
                        throw new Error('SmartWallet: deployment failed');
                    }
                    return smartWallet;
                }
                throw new Error(
                    'SmartWallet: was not created because Verifier does not accept the specified token for payment'
                );
            }
        } catch (error) {
            const errorObj = error as Error;
            if (errorObj.message) {
                alert(errorObj.message);
            }
            console.error(error);
        }
        return undefined;
    }

    function close() {
        const instance = M.Modal.getInstance($('#deploy-modal'));
        instance.close();
        setDeploy({
            fees: 0,
            check: false,
            tokenGas: 0,
            relayGas: 0
        });
    }

    async function handleDeploySmartWalletButtonClick() {
        deploy.fees = deploy.fees === '' ? '0' : deploy.fees;
        deploy.tokenGas = deploy.tokenGas === '' ? '0' : deploy.tokenGas;

        setLoading(true);
        const smartWallet = await relaySmartWalletDeployment(deploy.fees);
        if (smartWallet?.deployed) {
            setUpdateInfo(true);
            close();
        }

        setLoading(false);
    }

    return (
        <div id='deploy-modal' className='modal'>
            <div className='modal-content'>
                <div className='row'>
                    <form className='col s12'>
                        <div className='row'>
                            <div className='input-field col s8'>
                                <input
                                    placeholder='0'
                                    value={deploy.fees}
                                    type='number'
                                    min='0'
                                    className='validate tooltipped'
                                    onChange={(event) => {
                                        changeValue(event.target.value, 'fees');
                                    }}
                                    data-tooltip=''
                                />
                                <label
                                    htmlFor='deploy-fees'
                                    id='deploy-fees-label'
                                >
                                    Fees (tRIF)
                                </label>
                            </div>
                            <div
                                className='switch col s4 hide'
                                style={{ paddingTop: '2.5em' }}
                            >
                                <label>
                                    tRIF
                                    <input
                                        type='checkbox'
                                        onChange={(event) => {
                                            changeValue(
                                                event.target.value,
                                                'check'
                                            );
                                        }}
                                        checked={deploy.check ?? undefined}
                                    />
                                    <span className='lever' />
                                    RBTC
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div className='modal-footer'>
                <a
                    href='#!'
                    id='deploy-smart-wallet-estimate'
                    className={`waves-effect waves-green btn-flat ${
                        estimateLoading ? 'disabled' : ''
                    }`}
                    onClick={handleEstimateDeploySmartWalletButtonClick}
                >
                    Estimate{' '}
                    <img
                        alt='loading'
                        className={`loading ${!estimateLoading ? 'hide' : ''}`}
                        src='images/loading.gif'
                    />
                </a>
                <a
                    onClick={handleDeploySmartWalletButtonClick}
                    href='#!'
                    className={`waves-effect waves-green btn-flat ${
                        loading ? 'disabled' : ''
                    }`}
                >
                    Deploy{' '}
                    <img
                        alt='loading'
                        className={`loading ${!loading ? 'hide' : ''}`}
                        src='images/loading.gif'
                    />
                </a>
                <a
                    href='#!'
                    className='waves-effect waves-green btn-flat'
                    onClick={() => {
                        close();
                    }}
                >
                    Cancel
                </a>
            </div>
        </div>
    );
}

export default Deploy;
