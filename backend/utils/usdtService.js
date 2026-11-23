const { ethers } = require('ethers');

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];

const BSC_RPC = process.env.BSC_RPC || 'https://bsc-dataseed.binance.org';
const POLYGON_RPC = process.env.POLYGON_RPC || 'https://polygon-bor-rpc.publicnode.com';
const USDT_BSC = process.env.USDT_BSC_CONTRACT || '0x55d398326f99059fF775485246999027B3197955';
const USDT_POLYGON = process.env.USDT_POLYGON_CONTRACT || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

// Pre-define static networks to avoid repeated network detection calls
const BSC_NETWORK = new ethers.Network('bnb', 56);
const POLYGON_NETWORK = new ethers.Network('matic', 137);

/**
 * Fetch real USDT balance from blockchain
 */
const getUSDTBalance = async (address, network = 'BSC') => {
  try {
    if (!address) return '0';
    const rpc = network === 'BSC' ? BSC_RPC : POLYGON_RPC;
    const staticNetwork = network === 'BSC' ? BSC_NETWORK : POLYGON_NETWORK;
    const contractAddr = network === 'BSC' ? USDT_BSC : USDT_POLYGON;
    const provider = new ethers.JsonRpcProvider(rpc, staticNetwork, { staticNetwork: true });
    const contract = new ethers.Contract(contractAddr, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const raw = await contract.balanceOf(address);
    return ethers.formatUnits(raw, decimals);
  } catch (err) {
    // Retry once on failure
    try {
      const rpc = network === 'BSC' ? BSC_RPC : POLYGON_RPC;
      const staticNetwork = network === 'BSC' ? BSC_NETWORK : POLYGON_NETWORK;
      const contractAddr = network === 'BSC' ? USDT_BSC : USDT_POLYGON;
      const provider = new ethers.JsonRpcProvider(rpc, staticNetwork, { staticNetwork: true });
      const contract = new ethers.Contract(contractAddr, ERC20_ABI, provider);
      const decimals = await contract.decimals();
      const raw = await contract.balanceOf(address);
      return ethers.formatUnits(raw, decimals);
    } catch (_) {
      return '0';
    }
  }
};

/**
 * Fetch real USDT balance from blockchain as a raw BigInt (token's smallest unit).
 * Use this when the value will be fed straight into a transfer (e.g. transferring
 * a user's exact full balance) to avoid precision/scientific-notation issues that
 * happen when converting very small amounts to a decimal string and back.
 */
const getUSDTBalanceRaw = async (address, network = 'BSC') => {
  if (!address) return { raw: 0n, decimals: 18 };
  const rpc = network === 'BSC' ? BSC_RPC : POLYGON_RPC;
  const staticNetwork = network === 'BSC' ? BSC_NETWORK : POLYGON_NETWORK;
  const contractAddr = network === 'BSC' ? USDT_BSC : USDT_POLYGON;
  const provider = new ethers.JsonRpcProvider(rpc, staticNetwork, { staticNetwork: true });
  const contract = new ethers.Contract(contractAddr, ERC20_ABI, provider);
  const decimals = await contract.decimals();
  const raw = await contract.balanceOf(address);
  return { raw, decimals };
};

module.exports = { getUSDTBalance, getUSDTBalanceRaw };
