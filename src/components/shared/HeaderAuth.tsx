'use client'
import { useUser } from '@clerk/nextjs'
import { UserButton, SignInButton, SignUpButton } from '@clerk/nextjs'

export default function HeaderAuth() {
  const { isSignedIn } = useUser()

  if (isSignedIn) {
    return <UserButton />
  }

  return (
    <div className="flex gap-3">
      <SignInButton>
        <button className="text-sm px-4 py-2 border border-[#eeeeee] rounded-lg text-[#333333] hover:border-[#446dd5] hover:text-[#446dd5] transition-colors font-medium">
          Sign in
        </button>
      </SignInButton>
      <SignUpButton>
        <button className="text-sm px-4 py-2 bg-[#446dd5] text-white rounded-lg hover:bg-[#315bcf] transition-colors font-medium">
          Sign up
        </button>
      </SignUpButton>
    </div>
  )
}
