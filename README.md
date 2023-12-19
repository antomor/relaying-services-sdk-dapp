# RIF Relaying Services SDK sample dApp

This is a sample dApp to showcase how users can submit relayed transactions to the RSK blockchain using the [RIF Relay SDK](https://github.com/rsksmart/rif-relay-sdk). You will need to connect to the dApp with MetaMask but only for signing transactions with the account that owns the Smart Wallets.

For a detailed step-by-step guide on getting started with RIF Relay, refer to the [RIF Relay Starter kit](https://dev.rootstock.io/guides/rif-relay/starter-kit).

## Pre-Requisites

* [NodeJS Version v16.14.2 or higher](https://nodejs.org/en/download/).
* [RSKj Node Running](https://github.com/rsksmart/rskj).
* [RIF Relay Contract](https://github.com/rsksmart/rif-relay-contracts) deployed.
* [Current Token Allowed](https://github.com/rsksmart/rif-relay-contracts#allowing-tokens).
* [RIF Relay Server](https://github.com/rsksmart/rif-relay-server) running and registered.

For details on the RIF Relay modules, see [RIF Relay](https://github.com/rsksmart/rif-relay) project.

## Running the sample dApp

To setup the dApp:

1. Clone this repository and install dependencies:
    ```bash
    # clone repository
    git clone https://github.com/rsksmart/relaying-services-sdk-dapp
    cd relaying-services-sdk-dapp
    # install dependencies
    npm install --force
    ```
2. Create a new file named `.env`  in the top directory, and add the following lines in it (with the contract addresses generated when we deployed the contracts) in the **Set up RIF Relay Contracts** section above:
    ```bash
    REACT_APP_CONTRACTS_RELAY_HUB=0x463F29B11503e198f6EbeC9903b4e5AaEddf6D29
    REACT_APP_CONTRACTS_DEPLOY_VERIFIER=0x14f6504A7ca4e574868cf8b49e85187d3Da9FA70
    REACT_APP_CONTRACTS_RELAY_VERIFIER=0xA66939ac57893C2E65425a5D66099Bc20C76D4CD
    REACT_APP_CONTRACTS_SMART_WALLET_FACTORY=0x79bbC6403708C6578B0896bF1d1a91D2BB2AAa1c
    REACT_APP_CONTRACTS_SMART_WALLET=0x987c1f13d417F7E04d852B44badc883E4E9782e1

    REACT_APP_RIF_RELAY_CHAIN_ID=33
    REACT_APP_RIF_RELAY_GAS_PRICE_FACTOR_PERCENT=0
    REACT_APP_RIF_RELAY_LOOKUP_WINDOW_BLOCKS=1e5
    REACT_APP_RIF_RELAY_PREFERRED_RELAYS=http://localhost:8090
    REACT_APP_BLOCK_EXPLORER=https://explorer.testnet.rsk.co
    ```
3. Run the dApp
    ```bash
    # run app in regtest environment
    ENV_VALUE="regtest" npm run start
    ```
4. Ensure that MetaMask is configured to use the same network where you deployed the contracts (e.g. Regtest or Testnet).
4. Open a browser and navigate to http://localhost:3000

## Running the sample dApp as a Docker container

You can run the sample dApp as a Docker container. Docker and Docker compose should be installed.
The steps are the same as indicated [here](#running-the-sample-dapp). The difference is in the step 3. Instead of npm run start, run this:

```bash
docker-compose build && docker-compose up
```

## Troubleshooting
### Error On Transaction Nonce
When using the RSK Regtest enviroment, it may happen that the transaction nonce is wrong. This is due to a MetaMask problem in which it saves the nonce locally and when you reset the chain the nonce is changed.

Solution:
1. Choose the account in which you have the problem
2. Enter Metamask `Advanced Settings`
3. Click on `Reset Account`. This will delete all data from the account saved in metamask, and it will look it up again on the chain. Please note that this procedure does not delete the account, but only the info gathered from the current connected blockchain.

Read more about this on [this medium post](https://medium.com/singapore-blockchain-dapps/reset-metamask-nonce-766dd4c27ca8)
