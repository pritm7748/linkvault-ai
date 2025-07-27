    import { createServer } from '@/lib/supabase/server'
    import { SideNav } from './_components/sidenav'
    import { SearchBar } from './_components/search-bar'

    export default async function AppLayout({
      children,
    }: {
      children: React.ReactNode
    }) {
      const supabase = await createServer()
      
      // Fetch user session and collections data in parallel
      const [
        { data: { session } },
        { data: collections }
      ] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('collections').select('id, name').order('name')
      ]);

      return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          {/* Pass the fetched collections to the SideNav component */}
          <SideNav userEmail={session?.user.email || 'No user'} collections={collections || []} />
          
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
              <div className="w-full flex-1">
                <SearchBar />
              </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
              {children}
            </main>
          </div>
        </div>
      )
    }
    