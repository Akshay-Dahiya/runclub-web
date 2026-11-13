import './globals.css'
import React from 'react'
import { Providers } from './providers'

export const metadata = {
  title: 'Joyville Road Runners',
  description: 'Run together, follow club activities, and share stories with the Joyville Road Runners community.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
