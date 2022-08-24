# RIF Relaying Services SDK sample dApp

This is a sample dApp to showcase how users can submit relayed transactions to the RSK blockchain using the [RIF Relay SDK](https://github.com/infuy/relaying-services-sdk). You will need to connect to the dApp with MetaMask but only for signing transactions with the account that owns the Smart Wallets.

See [RIF Relay](https://github.com/rsksmart/rif-relay) project.


## Pre-Requisites

* [NodeJS Version v16.14.2 or higher](https://nodejs.org/en/download/).
* [RSKj Node Running](https://github.com/rsksmart/rskj).
* [RIF Relay Contracts](https://github.com/anarancio/rif-relay-contracts) deployed.
* [An allowed Token](https://github.com/anarancio/rif-relay-contracts#allowing-tokens).
* [RIF Relay Server](https://github.com/infuy/rif-relay-server) running and registered.

## Running the sample dApp

To setup the dApp:

* Clone this repo 
* Run `npm i`

To run the sample dApp follow these steps:

1. Edit the sample dApp config file located in `.env` and add the contract addresses. By default the project imports `.env` on the `npm start`. Look for these lines and modify them accordingly:
```
REACT_APP_CONTRACTS_RELAY_HUB=0xE0825f57Dd05Ef62FF731c27222A86E104CC4Cad
REACT_APP_CONTRACTS_DEPLOY_VERIFIER=0x1eD614cd3443EFd9c70F04b6d777aed947A4b0c4
REACT_APP_CONTRACTS_RELAY_VERIFIER=0x5159345aaB821172e795d56274D0f5FDFdC6aBD9
REACT_APP_CONTRACTS_SMART_WALLET_FACTORY=0x03F23ae1917722d5A27a2Ea0Bcc98725a2a2a49a
REACT_APP_CONTRACTS_SMART_WALLET=0x73ec81da0C72DD112e06c09A6ec03B5544d26F05
REACT_APP_CONTRACTS_RELAY_WORKER=0x3d67f029f778a088904f12d030933967d220faa3

REACT_APP_RIF_RELAY_CHAIN_ID=33
REACT_APP_RIF_RELAY_GAS_PRICE_FACTOR_PERCENT=0
REACT_APP_RIF_RELAY_LOOKUP_WINDOW_BLOCKS=1e5
REACT_APP_RIF_RELAY_PREFERRED_RELAYS=http://localhost:8090
```

To retrieve the value of `REACT_APP_CONTRACTS_RELAY_WORKER`, please call the `/getaddr` API against a running [rif-relay-server](https://github.com/infuy/rif-relay-server) instance and use the field `relayWorkerAddress` from the response.

E.g.:
```bash
curl http://localhost:8090/getaddr
```
The response has the following format:
```json
{
  "relayWorkerAddress": "0x74105590d404df3f384a099c2e55135281ca6b40",
  "relayManagerAddress": "0x4a6a175c1140f01679525ca3612364f5384cde46",
  "relayHubAddress": "0x66Fa9FEAfB8Db66Fe2160ca7aEAc7FC24e254387",
  "minGasPrice": "65164000",
  "chainId": "31",
  "networkId": "31",
  "ready": true,
  "version": "2.0.1"
}
```

2. Open a terminal in the sample dApp project root and run

```
npm start
```

3. Ensure that MetaMask is configured to use the same network where you deployed the contracts (e.g. Regtest or Testnet).

4. Open a browser and navigate to http://localhost:3000

## Troubleshooting
### Error On Transaction Nonce
When using the RSK Regtest enviroment, it may happen that the transaction nonce is wrong. This is due to a MetaMask problem in which it saves the nonce locally and when you reset the chain the nonce is changed.

Solution:
1. Choose the account in which you have the problem
2. Enter Metamask `Advanced Settings`
3. Click on `Reset Account`. This will delete all data from the account saved in metamask, and it will look it up again on the chain. Please note that this procedure does not delete the account, but only the info gathered from the current connected blockchain.

Read more about this on [this medium post](https://medium.com/singapore-blockchain-dapps/reset-metamask-nonce-766dd4c27ca8)
