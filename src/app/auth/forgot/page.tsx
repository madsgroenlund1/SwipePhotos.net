import { redirect } from 'next/navigation'

// Password reset is handled inside Clerk's SignIn component
export default function ForgotPage() {
  redirect('/auth/signin')
}
