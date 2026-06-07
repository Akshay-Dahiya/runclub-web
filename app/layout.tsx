import './globals.css'
import React from 'react'
import { Providers } from './providers'

export const metadata = {
  title: 'Joyville Road Runners',
  description: 'A social platform for runners to share their runs, compete on leaderboards, and connect with fellow athletes.',
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
