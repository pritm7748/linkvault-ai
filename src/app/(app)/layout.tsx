import Link from 'next/link'
import { createServer } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SideNav } from './_components/sidenav'
import { SearchBar } from './_components/search-bar'
import { Menu } from 'lucide-react'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServer()
  
  const [
    { data: { session } },
    { data: collections }
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from('collections').select('id, name').order('name')
  ]);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* --- Desktop Sidebar --- */}
      <div className="hidden border-r bg-background md:block">
        {/* We explicitly tell the sidebar it is NOT in a mobile sheet */}
        <SideNav 
          userEmail={session?.user.email || 'No user'} 
          collections={collections || []} 
          isSheet={false} 
        />
      </div>
      
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* --- Mobile Sheet (Hamburger Menu) --- */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              {/* We explicitly tell the sidebar it IS in a mobile sheet */}
              <SideNav 
                userEmail={session?.user.email || 'No user'} 
                collections={collections || []} 
                isSheet={true} 
              />
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1">
            <SearchBar />
          </div>
          <form action="/api/auth/signout" method="post" className="ml-4">
            <Button type="submit" variant="outline">Sign Out</Button>
          </form>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  )
}
