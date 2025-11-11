import React from 'react'
import LinkAccountButton from '@/components/link-account-button.tsx'
import SignInButton from '@/components/sign-in-button.tsx'

const LandingPage = async () => {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Normal Human</h1>
                <p className="text-muted-foreground">The minimalistic, AI-powered email client.</p>
                <div className="mt-8 space-x-4 flex items-center justify-center">
                    <LinkAccountButton />
                    <SignInButton />
                </div>
            </div>
        </div>
      
    )
}

export default LandingPage