import './globals.css';
import { Inter } from 'next/font/google';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL('https://futuremint.pro'),
  title: 'FutureMint NFT — Watch, Earn & Own the Digital Future | Web3 Ecosystem',
  description: 'FutureMint NFT is a premium Web3 ecosystem where you watch short videos, earn NFTs & FM tokens daily, build teams, and grow in the evolving digital economy. Join free today.',
  keywords: 'FutureMint, NFT, FM Token, Web3, earn NFTs, watch to earn, DeFi, BSC, Polygon, digital future, blockchain, crypto earning, referral rewards, passive income crypto',
  openGraph: {
    title: 'FutureMint NFT — Watch, Earn & Own the Digital Future',
    description: 'Join FutureMint NFT ecosystem. Watch 15-sec videos, earn NFTs + FM tokens daily. No investment required. Build your digital future now.',
    url: 'https://futuremint.app',
    siteName: 'FutureMint NFT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FutureMint NFT — Web3 Earn Ecosystem',
    description: 'Watch short videos, earn NFTs & FM daily. Join the future of digital ownership.',
  },
  icons: {
    icon: [
      { url: '/assets/favicon/favicon.ico', sizes: 'any' },
      { url: '/assets/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/assets/favicon/apple-touch-icon.png',
  },
  manifest: '/assets/favicon/site.webmanifest',
  alternates: {
    canonical: 'https://futuremint.app',
  },
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
