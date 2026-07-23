import './globals.css';
import { Inter } from 'next/font/google';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'FutureMint NFT Earn, Grow, Withdraw',
  description: 'Join FutureMint NFT Platform. Connect your wallet, earn NFTs through referrals and team building.',
  keywords: 'NFT, DeFi, Earn, BSC, Polygon, Referral, Web3, FutureMint',
  icons: {
    icon: [
      { url: '/assets/favicon/favicon.ico', sizes: 'any' },
      { url: '/assets/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/assets/favicon/apple-touch-icon.png',
  },
  manifest: '/assets/favicon/site.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-dark-900 text-white min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
