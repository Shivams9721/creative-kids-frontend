import './globals.css'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import { SettingsProvider } from '@/context/SettingsContext'
import ConditionalShell from '@/components/ConditionalShell'
import RecentlyViewed from '@/components/RecentlyViewed'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'Creative Kids | Premium Children\'s Clothing India',
    template: '%s | Creative Kids',
  },
  description: 'Shop premium children\'s clothing at Creative Kids. Baby, toddler & kids fashion. Free shipping above ₹599. Easy 7-day returns.',
  keywords: ['kids clothing', 'children fashion', 'baby clothes india', 'toddler clothing', 'kids wear online'],
  metadataBase: new URL('https://www.creativekids.co.in'),
  openGraph: {
    siteName: 'Creative Kids',
    locale: 'en_IN',
    type: 'website',
  },
  icons: {
    icon: '/images/Creative-Kid\'s---Logo (1).png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <SettingsProvider>
            <ConditionalShell>
              {children}
            </ConditionalShell>
            <RecentlyViewed />
          </SettingsProvider>
        </CartProvider>
      </body>
    </html>
  )
}
