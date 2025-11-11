'use client'
import React, { useState } from 'react'
import { Button } from '../components/ui/button.tsx'
import { getAurinkoAuthorizationUrl } from '@/lib/aurinko.ts'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'

const LinkAccountButton = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { isSignedIn, isLoaded } = useUser()

  const handleClick = async () => {
    // Check if user is authenticated
    if (!isLoaded) {
      toast.info('Loading...')
      return
    }

    if (!isSignedIn) {
      toast.error('Please sign in to link an account')
      window.location.href = '/sign-in'
      return
    }

    try {
      setIsLoading(true)
      const authUrl = await getAurinkoAuthorizationUrl('Google');
      console.log('Redirecting to Aurinko authorization:', authUrl);
      // Redirect to Aurinko authorization URL, which will redirect back to /api/aurinko/callback
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting Aurinko authorization URL:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initiate account linking');
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading || !isLoaded}>
      {isLoading ? 'Redirecting...' : 'Link Account'}
    </Button>
  )
}

export default LinkAccountButton