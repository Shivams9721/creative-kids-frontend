import './globals.css'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import { SettingsProvider } from '@/context/SettingsContext'
import ConditionalShell from '@/components/layout/ConditionalShell'
import RecentlyViewed from '@/components/shop/RecentlyViewed'
import WhatsAppWidget from '@/components/widgets/WhatsAppWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: "Creative Kid's | Premium Children's Clothing India",
    template: "%s | Creative Kid's",
  },
  description: "Shop premium children's clothing at Creative Kid's. Baby, toddler & kids fashion. Free shipping above ₹499. Easy 7-day returns.",
  keywords: ['kids clothing', 'children fashion', 'baby clothes india', 'toddler clothing', 'kids wear online'],
  metadataBase: new URL('https://www.creativekids.co.in'),
  openGraph: {
    siteName: "Creative Kid's",
    locale: 'en_IN',
    type: 'website',
  },
  icons: {
    icon: '/images/Creative-Kid\'s--Logo.jpg.jpeg',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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
            <WhatsAppWidget />
          </SettingsProvider>
        </CartProvider>
      </body>
    </html>
  )
}
