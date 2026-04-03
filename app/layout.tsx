import './globals.css'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import ConditionalShell from '@/components/ConditionalShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Creative Kids | Luxury Childrenswear',
  description: 'Premium fashion for babies, toddlers, and kids.',
  icons: {
    icon: '/images/logo.png',
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
          <ConditionalShell>
            {children}
          </ConditionalShell>
        </CartProvider>
      </body>
    </html>
  )
}
