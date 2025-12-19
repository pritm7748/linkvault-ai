import { createServer } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SideNav } from './_components/sidenav'
import { SearchBar } from './_components/search-bar'
import { Menu } from 'lucide-react'
import { cookies } from 'next/headers'
import { AppMain } from './_components/app-main'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  // 1. Get User First
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Fetch Collections (Strictly for this user)
  // If no user (e.g. during redirect), return empty array to prevent error
  const { data: collections } = user 
    ? await supabase
        .from('collections')
        .select('id, name')
        .eq('user_id', user.id) // <--- CRITICAL FIX
        .order('name')
    : { data: [] }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-background md:block">
        <SideNav 
          userEmail={user?.email || 'No user'} 
          collections={collections || []} 
          isSheet={false} 
        />
      </div>
      
      <div className="flex flex-col max-h-screen">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <SideNav 
                userEmail={user?.email || 'No user'} 
                collections={collections || []} 
                isSheet={true} 
              />
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1">
            <SearchBar />
          </div>
        </header>

        <AppMain>
          {children}
        </AppMain>
      </div>
    </div>
  )
}