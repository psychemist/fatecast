import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/P9Wl_G12LXrEHdc9EZDE-b5kKRh6l-LZ';

// Override Sepolia's default RPC with Alchemy
const customSepolia = {
  ...sepolia,
  rpcUrls: {
    default: { http: [rpcUrl] },
    public: { http: [rpcUrl] },
  },
};

export const config = getDefaultConfig({
  appName: 'Fatecast',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a83108d42072874de6965f0ee92c672f',
  chains: [customSepolia],
  ssr: true,
});
