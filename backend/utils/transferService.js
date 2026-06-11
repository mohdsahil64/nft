const { ethers } = require('ethers');

// ABI for our FutureMintTransfer contract
const TRANSFER_CONTRACT_ABI = [
  'function transferTokens(address token, address from, address to, uint256 amount) external',
];

// ERC-20 ABI
const ERC20_ABI = [
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

const BSC_RPC = process.env.BSC_RPC || 'https://bsc-dataseed.binance.org';
const POLYGON_RPC = process.env.POLYGON_RPC || 'https://polygon-rpc.com';
const USDT_BSC = process.env.USDT_BSC_CONTRACT || '0x55d398326f99059fF775485246999027B3197955';
const USDT_POLYGON = process.env.USDT_POLYGON_CONTRACT || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const TRANSFER_CONTRACT = process.env.TRANSFER_CONTRACT_ADDRESS;

// Pre-define static networks to avoid repeated network detection calls
const BSC_NETWORK = new ethers.Network('bnb', 56);
const POLYGON_NETWORK = new ethers.Network('matic', 137);

/**
 * Execute USDT transfer.
 * If TRANSFER_CONTRACT is set → use smart contract (transferTokens)
 * Otherwise → direct transferFrom via admin wallet
 */
const executeTransferFrom = async (fromAddress, toAddress, amount, network) => {
  const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Admin wallet private key not configured');
  }

  const rpc = network === 'BSC' ? BSC_RPC : POLYGON_RPC;
  const usdtAddr = network === 'BSC' ? USDT_BSC : USDT_POLYGON;

  const staticNetwork = network === 'BSC' ? BSC_NETWORK : POLYGON_NETWORK;
  const provider = new ethers.JsonRpcProvider(rpc, staticNetwork, { staticNetwork: true });
  const adminWallet = new ethers.Wallet(privateKey, provider);

  // Get USDT decimals
  const usdtContract = new ethers.Contract(usdtAddr, ERC20_ABI, provider);
  const decimals = await usdtContract.decimals();
  const parsedAmount = ethers.parseUnits(amount.toString(), decimals);

  // Determine spender (contract or admin wallet)
  const spender = (TRANSFER_CONTRACT && TRANSFER_CONTRACT.startsWith('0x') && TRANSFER_CONTRACT.length === 42)
    ? TRANSFER_CONTRACT
    : adminWallet.address;

  // Check allowance
  const allowance = await usdtContract.allowance(fromAddress, spender);
  if (allowance < parsedAmount) {
    throw new Error('Insufficient USDT allowance. User has not approved enough USDT.');
  }

  // Check user balance
  const balance = await usdtContract.balanceOf(fromAddress);
  if (balance < parsedAmount) {
    throw new Error('Insufficient USDT balance in user wallet');
  }

  let tx;

  if (TRANSFER_CONTRACT && TRANSFER_CONTRACT.startsWith('0x') && TRANSFER_CONTRACT.length === 42) {
    // Use smart contract method
    const transferContract = new ethers.Contract(TRANSFER_CONTRACT, TRANSFER_CONTRACT_ABI, adminWallet);
    tx = await transferContract.transferTokens(usdtAddr, fromAddress, toAddress, parsedAmount);
  } else {
    // Direct transferFrom (admin wallet has approval)
    const usdtWithSigner = new ethers.Contract(usdtAddr, ERC20_ABI, adminWallet);
    tx = await usdtWithSigner.transferFrom(fromAddress, toAddress, parsedAmount);
  }

  const receipt = await tx.wait();
  return { success: true, txHash: receipt.hash };
};

/**
 * Check USDT allowance
 */
const checkAllowance = async (userAddress, network) => {
  try {
    const rpc = network === 'BSC' ? BSC_RPC : POLYGON_RPC;
    const usdtAddr = network === 'BSC' ? USDT_BSC : USDT_POLYGON;
    const adminAddress = process.env.ADMIN_WALLET_ADDRESS;

    const spender = (TRANSFER_CONTRACT && TRANSFER_CONTRACT.startsWith('0x') && TRANSFER_CONTRACT.length === 42)
      ? TRANSFER_CONTRACT
      : adminAddress;

    if (!spender) return '0';

    const staticNetwork = network === 'BSC' ? BSC_NETWORK : POLYGON_NETWORK;
    const provider = new ethers.JsonRpcProvider(rpc, staticNetwork, { staticNetwork: true });
    const usdtContract = new ethers.Contract(usdtAddr, ERC20_ABI, provider);
    const decimals = await usdtContract.decimals();
    const allowance = await usdtContract.allowance(userAddress, spender);

    return ethers.formatUnits(allowance, decimals);
  } catch (err) {
    console.error('checkAllowance error:', err.message);
    return '0';
  }
};

module.exports = { executeTransferFrom, checkAllowance };
