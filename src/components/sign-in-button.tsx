'use client'

import { Button } from '@/components/ui/button.tsx'

export default function SignInButton() {
    return (
        <Button 
            variant="outline"
            onClick={() => {
                window.location.href = '/sign-in'
            }}
        >
            Sign In
        </Button>
    )
}



