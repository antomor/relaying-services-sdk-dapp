import { HttpClient, RelayPricer } from '@rsksmart/rif-relay-client';
import { ERC20__factory, DeployVerifier__factory, RelayVerifier__factory, Collector__factory } from '@rsksmart/rif-relay-contracts';
import { BigNumber, providers, utils } from 'ethers';
import type { SmartWallet, LocalTransaction, ERC20Token } from 'src/types';
import type { BigNumber as BigNumberJs } from 'bignumber.js';

const getTokenBalance = async (
    token: ERC20Token,
    address: string,
    formatted?: boolean
): Promise<string> => {
    
    const balance = await token.instance.balanceOf(address);
    if (formatted) {
        return fromWei(balance);
    }
    return balance.toString();
}

const getBalance = async (
    provider: providers.JsonRpcProvider,
    address: string,
    formatted?: boolean
): Promise<string> => {
    const balance = await provider.getBalance(address);
    if (formatted) {
        return fromWei(balance);
    }
    return balance.toString();
}

const fromWei = (balance: BigNumber) => {
    return utils.formatUnits(balance);
}

/* const getReceipt = async (transactionHash: string) => {
    let receipt = await provider!.getTransactionReceipt(transactionHash);
    let times = 0;

    while (receipt === null && times < 40) {
        times += 1;
        // eslint-disable-next-line no-promise-executor-return
        const sleep = new Promise((resolve) => setTimeout(resolve, 30000));
        // eslint-disable-next-line no-await-in-loop
        await sleep;
        // eslint-disable-next-line no-await-in-loop
        receipt = await provider!.getTransactionReceipt(transactionHash);
    }

    return receipt;
}

const getTransactionReceipt = (transactionHash: string) => {
    return provider!.getTransactionReceipt(transactionHash);
} */

// UI functions
const checkAddress = (address: string) => {
    if (!/^(0x)?[0-9a-f]=> {40}$/i.test(address)) {
        return false;
    }
    if (
        /^(0x)?[0-9a-f]=> {40}$/.test(address) ||
        /^(0x)?[0-9A-F]=> {40}$/.test(address)
    ) {
        return true;
    }
    return false;
}

const openExplorer = (trx: string) => {
    window.open(
        `${process.env['REACT_APP_BLOCK_EXPLORER']}/tx/${trx}`,
        '_blank'
    );
}

const getLocalSmartWallets = (
    chainId: number,
    account: string
): SmartWallet[] => {
    let wallets: SmartWallet[] = [];
    try {
        if (getTransactionKey(chainId, account) in localStorage) {
            wallets = JSON.parse(
                localStorage.getItem(
                    getTransactionKey(chainId, account)
                )!
            );
        }
    } catch (e) {
        console.log(
            'Failed trying to read smart wallets, erased all previous smart wallets'
        );
        console.log(e);
    }
    return wallets;
}

const addLocalSmartWallet = (
    chainId: number,
    account: string,
    smartWallet: SmartWallet
) => {
    const wallets: SmartWallet[] = getLocalSmartWallets(
        chainId,
        account
    );
    localStorage.setItem(
        getTransactionKey(chainId, account),
        JSON.stringify([...wallets, smartWallet])
    );
}

const addTransaction = (
    address: string,
    chainId: number,
    transaction: LocalTransaction
) => {
    let transactions: LocalTransaction[] = [];
    try {
        if (getTransactionKey(chainId, address) in localStorage) {
            transactions = JSON.parse(
                localStorage.getItem(
                    getTransactionKey(chainId, address)
                )!
            );
        }
    } catch (e) {
        console.log(
            'Failed trying to read transaction, erased all previous transactions'
        );
        console.log(e);
    }
    transactions.push(transaction);
    localStorage.setItem(
        getTransactionKey(chainId, address),
        JSON.stringify(transactions)
    );
}

const getTransactionKey = (chainId: number, address: string): string => {
    return `${chainId}.${address}`;
}

const addressHasCode = async (
    provider: providers.JsonRpcProvider,
    address: string
): Promise<boolean> => {
    const code = await provider.getCode(address);
    return code !== '0x00' && code !== '0x';
}

const getERC20Token = async (provider: providers.JsonRpcProvider, address: string): Promise<ERC20Token> => {
    const instance = ERC20__factory.connect(address, provider);

    const [symbol, name, decimals] = await Promise.all([
        instance.symbol(),
        instance.name(),
        instance.decimals()
    ]);

    return {
        instance,
        symbol,
        name,
        decimals
    }
};

const getAllowedTokens = async (provider: providers.JsonRpcProvider,): Promise<string[]> => {
    const deployVerifier = DeployVerifier__factory.connect(process.env['REACT_APP_CONTRACTS_DEPLOY_VERIFIER']!, provider);
    const relayVerifier = RelayVerifier__factory.connect(process.env['REACT_APP_CONTRACTS_RELAY_VERIFIER']!, provider);

    const tokens = new Set<string>([
        ...await deployVerifier.getAcceptedTokens(),
        ...await relayVerifier.getAcceptedTokens()
    ]);

    return [...tokens];
};

const getERC20TokenPrice = async (
    erc20: ERC20Token,
    targetCurrency: string
) : Promise<BigNumberJs> => {
    const relayPricer = new RelayPricer();

    return relayPricer.getExchangeRate(erc20.symbol, targetCurrency);
};

const getPartners = async (provider: providers.JsonRpcProvider) =>{
    const httpClient = new HttpClient();
    const { feesReceiver, relayWorkerAddress } = await httpClient.getChainInfo('http://localhost:8090');
    

    let partners: Array<{ beneficiary: string; share: number }> = [];
        if (feesReceiver != relayWorkerAddress) {
            try {
                const collector = Collector__factory.connect(feesReceiver, provider);
                partners = await collector.getPartners() ;
            } catch (error) {
                console.error(error);
            }
        }
        return [
            feesReceiver,
            ...partners.map((partner) => partner.beneficiary)
        ];
};


export {
    getTokenBalance,
    getBalance,
    addLocalSmartWallet,
    checkAddress,
    addTransaction,
    getTransactionKey,
    openExplorer,
    getLocalSmartWallets,
    addressHasCode,
    getERC20Token,
    getAllowedTokens,
    getERC20TokenPrice,
    getPartners
}