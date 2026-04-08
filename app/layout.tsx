import './globals.css'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import { SettingsProvider } from '@/context/SettingsContext'
import ConditionalShell from '@/components/ConditionalShell'
import RecentlyViewed from '@/components/RecentlyViewed'

const inter = Inter({ subsets: ['latin'] })
const SITE_URL = 'https://www.creativekids.co.in'

export const metadata = {
  title: {
    default: 'Creative Kids | Premium Children\'s Clothing India',
    template: '%s | Creative Kids',
  },
  description: 'Shop premium children\'s clothing at Creative Kids. Baby, toddler & kids fashion. Free shipping above ₹599. Easy 7-day returns.',
  keywords: ['kids clothing', 'children fashion', 'baby clothes india', 'toddler clothing', 'kids wear online'],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: 'Creative Kids',
    locale: 'en_IN',
    type: 'website',
    url: SITE_URL,
    title: 'Creative Kids | Premium Children\'s Clothing India',
    description: 'Shop premium children\'s clothing at Creative Kids. Baby, toddler & kids fashion. Free shipping above ₹599. Easy 7-day returns.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creative Kids | Premium Children\'s Clothing India',
    description: 'Shop premium children\'s clothing at Creative Kids. Baby, toddler & kids fashion. Free shipping above ₹599. Easy 7-day returns.',
  },
  icons: {
    icon: '/images/Creative-Kid\'s--Logo.jpg.jpeg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Creative Kids',
    url: SITE_URL,
    logo: `${SITE_URL}/images/Creative-Kid%27s--Logo.jpg.jpeg`,
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Creative Kids',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/shop?query={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
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
