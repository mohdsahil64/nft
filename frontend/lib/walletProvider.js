/**
 * Global wallet provider reference.
 * Stores the exact provider instance used during wallet connect,
 * so smart contract calls use the SAME provider (MetaMask/Trust/etc.)
 * instead of defaulting to whatever window.ethereum points to.
 */

let _provider = null;

export const setWalletProvider = (provider) => {
  _provider = provider;
};

export const getWalletProvider = () => {
  return _provider || (typeof window !== 'undefined' ? window.ethereum : null);
};
