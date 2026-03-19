import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer' // <-- ADDED BACK
import { CartProvider } from '@/context/CartContext'

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
          {/* Global UI */}
          <Navbar /> 
          <CartDrawer /> {/* <-- ADDED BACK: This makes the cart slide out! */}
          
          {/* Page Content */}
          {children}
          
          {/* Global Footer */}
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
