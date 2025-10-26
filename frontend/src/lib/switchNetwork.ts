/**
 * Force wallet to use our Alchemy RPC for Sepolia
 * This REPLACES the default Sepolia config in the wallet
 */
export async function forceAlchemyRPC() {
  if (typeof window === 'undefined' || !window.ethereum) return;

  const chainId = '0xaa36a7'; // Sepolia
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

  try {
    // Force add our custom Sepolia with Alchemy RPC
    // This will prompt the wallet to add/update the network
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId,
          chainName: 'Sepolia Testnet',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: [rpcUrl],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        },
      ],
    });
    
    // Then switch to it
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (error: unknown) {
    const err = error as { code?: number };
    // If user rejects or already exists, try to switch
    if (err.code === 4001) {
      throw new Error('User rejected network change');
    }
    // Network already added, just switch
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError) {
      console.error('Failed to switch network:', switchError);
      throw switchError;
    }
  }
}

export async function ensureCorrectNetwork() {
  return forceAlchemyRPC();
}
