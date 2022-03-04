
import TestToken from './contracts/TestToken.json';
import Web3 from 'web3';
import { toHex } from 'web3-utils';
import { RelayClient } from '@rsksmart/rif-relay-client';
import { EnvelopingTransactionDetails } from '@rsksmart/rif-relay-common';

export const TRIF_PRICE = 0.000005739;
export const TRIF_TOKEN_DECIMALS = 18;
if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
} else if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider);
} else {
    throw new Error('No web3 detected');
}
const web3 = window.web3;

class Utils {
    static async ritTokenDecimals() {
        let rifTokenContract = new web3.eth.Contract(TestToken.abi, process.env.REACT_APP_CONTRACTS_RIF_TOKEN);
        rifTokenContract.setProvider(web3.currentProvider);
        const balance = await rifTokenContract.methods.decimals().call();
        return balance;
    }
    static async tokenBalance(address: string) {
        let rifTokenContract = new web3.eth.Contract(TestToken.abi, process.env.REACT_APP_CONTRACTS_RIF_TOKEN);
        rifTokenContract.setProvider(web3.currentProvider);
        const balance = await rifTokenContract.methods.balanceOf(address).call();
        return balance;
    }
    static async getTokenContract( ) {
        let rifTokenContract = new web3.eth.Contract(TestToken.abi, process.env.REACT_APP_CONTRACTS_RIF_TOKEN);
        rifTokenContract.setProvider(web3.currentProvider);
        return rifTokenContract;
    }

    static async getBalance(address: string) {
        const balance = await web3.eth.getBalance(address);
        return balance;
    }
    static fromWei(balance: string) {
        return web3.utils.fromWei(balance);
    }

    static async getReceipt(transactionHash: string) {
        let receipt = await web3.eth.getTransactionReceipt(transactionHash)
        let times = 0

        while (receipt === null && times < 40) {
            times++
            const sleep = new Promise(resolve => setTimeout(resolve, 30000))
            await sleep
            receipt = await web3.eth.getTransactionReceipt(transactionHash)
        }

        return receipt
    }

    static async getAccounts() {
        const accounts = await web3.eth.getAccounts()
        if (accounts.length === 0) {
            console.error("Couldn't get any accounts! Make sure your Client is configured correctly.")
            return
        }
        return accounts;
    }

    static async toWei(tRifPriceInRBTC: string) {
        return web3.utils.toWei(tRifPriceInRBTC);
    }

    static async getTransactionReceipt(transactionHash: string) {
        return await web3.eth.getTransactionReceipt(transactionHash);
    }
    // UI functions
    static checkAddress(address: string) {
        if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
            return false;
        } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
            return true;
        }
    }

    static async sendTransaction(transactionDetails: EnvelopingTransactionDetails){
        await web3.eth.sendTransaction(transactionDetails);
    }
}

const ESTIMATED_GAS_CORRECTION_FACTOR = 1.0;
// When estimating the gas an internal call is going to spend, we need to subtract some gas inherent to send the parameters to the blockchain
const INTERNAL_TRANSACTION_ESTIMATE_CORRECTION = 20000;
// extracted from rif-relay-common/ContractInteractor
async function estimateDestinationContractCallGas(transactionDetails: EnvelopingTransactionDetails, addCushion = true): Promise<string|number> {
    // For relay calls, transactionDetails.gas is only the portion of gas sent to the destination contract, the tokenPayment
    // Part is done before, by the SmartWallet

    const estimated = await window.web3.eth.estimateGas({
        from: transactionDetails.from,
        to: transactionDetails.to,
        gasPrice: transactionDetails.gasPrice,
        data: transactionDetails.data
    });
    let internalCallCost =
        estimated > INTERNAL_TRANSACTION_ESTIMATE_CORRECTION
            ? estimated - INTERNAL_TRANSACTION_ESTIMATE_CORRECTION
            : estimated;

    // The INTERNAL_TRANSACTION_ESTIMATE_CORRECTION is substracted because the estimation is done using web3.eth.estimateGas which
    // estimates the call as if it where an external call, and in our case it will be called internally (it's not the same cost).
    // Because of this, the estimated maxPossibleGas in the server (which estimates the whole transaction) might not be enough to successfully pass
    // the following verification made in the SmartWallet:
    // require(gasleft() > req.gas, "Not enough gas left"). This is done right before calling the destination internally

    if (addCushion) {
        internalCallCost =
            internalCallCost * ESTIMATED_GAS_CORRECTION_FACTOR;
    }

    return internalCallCost;
  }

// TODO: this method should be moved to the sdk
export async function estimateMaxPossibleRelayGas(relayClient: RelayClient, trxDetails: EnvelopingTransactionDetails) {
    const txDetailsClone = {
        ...trxDetails
    };
    const internalCallCost = await estimateDestinationContractCallGas(
              relayClient.getEstimateGasParams(txDetailsClone)
    );
    txDetailsClone.gas = toHex(internalCallCost);
    const tokenGas = (
        await relayClient.estimateTokenTransferGas(txDetailsClone, process.env.REACT_APP_CONTRACTS_RELAY_WORKER!)
    ).toString();
    txDetailsClone.tokenGas = tokenGas;
    const maxPossibleGasValue = await relayClient.estimateMaxPossibleRelayGas(
        txDetailsClone, process.env.REACT_APP_CONTRACTS_RELAY_WORKER!
    );
    return maxPossibleGasValue;
}

export default Utils;