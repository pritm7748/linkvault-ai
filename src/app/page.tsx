import { redirect } from 'next/navigation'

export default function RootPage() {
  // This function tells Next.js to permanently redirect any user
  // who visits the root URL ('/') to the '/vault' page.
  redirect('/vault')
}
