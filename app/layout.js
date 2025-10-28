import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Next.js MongoDB Template',
  description: 'A simple template with App Router, MongoDB, and shadcn/ui',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}