import './globals.css'
import { Toaster } from 'sonner'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata = {
  title: 'AU Connect',
  description: 'Connect with students at Anurag University',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <Toaster position="top-center" richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}