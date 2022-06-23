import { EnvelopingTransactionDetails } from '@rsksmart/rif-relay-common';
import { AbiItem } from 'web3-utils';
import TestToken from './contracts/TestToken.json';

export const TRIF_PRICE = 0.000005739;
export const TRIF_TOKEN_DECIMALS = 18;
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

class Utils {
    static async tokenSymbol(token: string) {
        const tokenContract = new web3.eth.Contract(
            TestToken.abi as AbiItem[],
            token
        );

        const symbol = await tokenContract.methods.symbol().call();
        return symbol;
    }

    static async tokenDecimals(token: string) {
        // TODO: we may want to change this to support multiple tokens
        const tokenContract = new web3.eth.Contract(
            TestToken.abi as AbiItem[],
            token
        );

        const balance = await tokenContract.methods.decimals().call();
        return balance;
    }

    static async tokenBalance(address: string, token: string) {
        const tokenContract = new web3.eth.Contract(
            TestToken.abi as AbiItem[],
            token
        );
        const balance = await tokenContract.methods.balanceOf(address).call();
        return balance;
    }

    static async getTokenContract(token: string) {
        const tokenContract = new web3.eth.Contract(
            TestToken.abi as AbiItem[],
            token
        );
        return tokenContract;
    }

    static async getBalance(address: string) {
        const balance = await web3.eth.getBalance(address);
        return balance;
    }

    static fromWei(balance: string) {
        return web3.utils.fromWei(balance);
    }

    static async getReceipt(transactionHash: string) {
        let receipt = await web3.eth.getTransactionReceipt(transactionHash);
        let times = 0;

        while (receipt === null && times < 40) {
            times += 1;
            // eslint-disable-next-line no-promise-executor-return
            const sleep = new Promise((resolve) => setTimeout(resolve, 30000));
            // eslint-disable-next-line no-await-in-loop
            await sleep;
            // eslint-disable-next-line no-await-in-loop
            receipt = await web3.eth.getTransactionReceipt(transactionHash);
        }

        return receipt;
    }

    static async getAccounts(): Promise<string[]> {
        const accounts = await web3.eth.getAccounts();
        if (accounts.length === 0) {
            console.error(
                "Couldn't get any accounts! Make sure your Client is configured correctly."
            );
            return [];
        }
        return accounts;
    }

    static async toWei(tRifPriceInRBTC: string) {
        return web3.utils.toWei(tRifPriceInRBTC);
    }

    static async getTransactionReceipt(transactionHash: string) {
        return web3.eth.getTransactionReceipt(transactionHash);
    }

    // UI functions
    static checkAddress(address: string) {
        if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
            return false;
        }
        if (
            /^(0x)?[0-9a-f]{40}$/.test(address) ||
            /^(0x)?[0-9A-F]{40}$/.test(address)
        ) {
            return true;
        }
        return false;
    }

    static async sendTransaction(
        transactionDetails: EnvelopingTransactionDetails
    ) {
        await web3.eth.sendTransaction(transactionDetails);
    }
}

export default Utils;
