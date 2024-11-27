"use client";
import React from 'react'

import { UserButton } from '@clerk/nextjs'
import { useClerk } from '@clerk/nextjs'
export default function page() {
  const { signOut } =useClerk();
  return (
    <div>
      <UserButton/>
      <button onClick={() => signOut({ redirectUrl: '/' })}>Sign out</button>

    </div>
  )
}
