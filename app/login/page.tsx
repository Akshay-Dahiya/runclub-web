import React from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import LoginForm from '../../components/LoginForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  // If already logged in, redirect them immediately!
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <>
      <Navbar serverSession={session} />
      <div className="section" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <LoginForm />
      </div>
      <Footer />
    </>
  )
}
