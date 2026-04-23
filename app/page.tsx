import { redirect } from 'next/navigation'

// Home page — redirect to static index for now
// In production this will be the Next.js home page
export default function Home() {
  redirect('/login')
}
