'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname, useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Wand2, ArrowLeft, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { QandADialog } from './q-and-a-dialog'
import { ItemDetailsDialog } from '../vault/_components/item-details-dialog'
import { getChatTitle, renameChat, deleteChat } from '../chat/actions'

type Source = { id: number; processed_title: string; content_type: string; };

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const params = useParams()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  
  // Chat Header State
  const chatId = params?.id ? Number(params.id) : null
  const [chatTitle, setChatTitle] = useState("")
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [newTitleInput, setNewTitleInput] = useState("")

  // Q&A / Details State
  const [isQnOpen, setIsQnOpen] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)
  const [sources, setSources] = useState<Source[]>([])
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Determine Context
  const isChatDashboard = pathname === '/chat'
  const isProfilePage = pathname === '/profile'
  // FIX: Detect if we are inside a Collection or Favorites
  const isCollectionContext = pathname.startsWith('/collections/') || pathname === '/vault/favorites';

  useEffect(() => {
    if (chatId) {
      getChatTitle(chatId).then(title => {
        setChatTitle(title)
        setNewTitleInput(title)
      })
    }
  }, [chatId])

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const handleRename = async () => {
    if (!chatId || !newTitleInput.trim()) return;
    setChatTitle(newTitleInput); 
    setIsRenameOpen(false);
    await renameChat(chatId, newTitleInput);
    router.refresh();
  }

  const handleDelete = async () => {
    if (!chatId || !confirm("Delete this conversation?")) return;
    await deleteChat(chatId);
    router.push('/chat');
  }

  const executeSearch = () => {
    // Handle clearing search
    if (!query.trim()) {
        if (isChatDashboard) router.replace('/chat');
        else if (isCollectionContext) router.replace(pathname); // Stay on collection, clear query
        else router.push('/vault');
        return;
    }

    // FIX: Route based on context
    if (isChatDashboard) {
        router.replace(`/chat?q=${encodeURIComponent(query)}`);
    } else if (isCollectionContext) {
        // Filter IN PLACE for Collections/Favorites
        router.replace(`${pathname}?q=${encodeURIComponent(query)}`);
    } else {
        // Default to Vault for everything else
        router.push(`/vault?q=${encodeURIComponent(query)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); executeSearch(); }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val === '') {
        if (isChatDashboard) router.replace('/chat');
        else if (isCollectionContext) router.replace(pathname);
        else router.push('/vault');
    }
  }

  const handleAskAI = async () => { 
    if (!query) return;
    setIsQnOpen(true); setIsLoadingAnswer(true); setAnswer(null); setSources([]);
    try {
      const response = await fetch('/api/ai-query', { method: 'POST', body: JSON.stringify({ query }), headers: { 'Content-Type': 'application/json' } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setAnswer(result.answer); setSources(result.sources || []);
    } catch (e: any) { setAnswer(e.message); } finally { setIsLoadingAnswer(false); }
  };

  // --- RENDER LOGIC ---

  if (isProfilePage) {
    return <div className="w-full flex items-center h-10 animate-in fade-in duration-200"><h2 className="font-serif font-bold text-2xl text-stone-900">Profile Settings</h2></div>
  }

  if (chatId) {
    return (
      <>
        <div className="w-full flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="-ml-2 text-stone-500 hover:text-stone-900"><ArrowLeft className="h-5 w-5" /></Button>
            <h2 className="font-serif font-bold text-lg text-stone-900 truncate">{chatTitle}</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-stone-500 hover:text-stone-900"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsRenameOpen(true)}><Pencil className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-700 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
            <DialogContent><DialogHeader><DialogTitle>Rename Chat</DialogTitle></DialogHeader><div className="py-2"><Input value={newTitleInput} onChange={(e) => setNewTitleInput(e.target.value)} placeholder="Chat Title" /></div><DialogFooter><Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button><Button onClick={handleRename}>Save</Button></DialogFooter></DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <div className="w-full flex items-center gap-2">
        <div className="relative flex-1 min-w-0"> 
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={isChatDashboard ? "Search conversation titles..." : isCollectionContext ? "Search this collection..." : "Search..."}
            className="w-full bg-background pl-9 shadow-none h-10 text-base md:text-sm"
            value={query}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button variant="outline" onClick={executeSearch} disabled={!query} className="shrink-0 px-3 md:px-4">
            <Search className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Search</span>
        </Button>
        {!isChatDashboard && (
            <Button onClick={handleAskAI} disabled={!query || isLoadingAnswer} className="bg-purple-600 hover:bg-purple-700 shrink-0 px-3 md:px-4">
              <Wand2 className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Ask AI</span>
              <span className="md:hidden">Ask</span>
            </Button>
        )}
      </div>
      <QandADialog isOpen={isQnOpen} onOpenChange={setIsQnOpen} query={query} answer={answer} isLoading={isLoadingAnswer} sources={sources} onSourceClick={(id) => { setIsQnOpen(false); setSelectedItemId(id); setIsDetailsOpen(true); }} />
      <ItemDetailsDialog itemId={selectedItemId} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} onUpdate={() => router.refresh()} />
    </>
  )
}