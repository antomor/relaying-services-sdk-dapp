import RLogin from '@rsksmart/rlogin';

const rpcUrls = {
  30: 'https://public-node.rsk.co',
  31: 'https://public-node.testnet.rsk.co',
  33: 'http://127.0.0.1:4444',
};

const supportedChains = Object.keys(rpcUrls).map(Number);

const infoOptions = {
  30: { addressBaseURL: 'https://explorer.rsk.co/address/' },
  31: { addressBaseURL: 'https://explorer.testnet.rsk.co/address/' },
  33: { addressBaseURL: 'http://127.0.0.1:4444/address/' },
};

const rLogin = new RLogin({
  providerOptions: {},
  rpcUrls,
  supportedChains,
  infoOptions,
});

export default rLogin;
