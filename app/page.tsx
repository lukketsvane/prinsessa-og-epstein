'use client'

import React, { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { Search, Info, Github, Trash2, MessageCircle, Send, ExternalLink } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  FileName: string
  From: string
  To: string
  Sent: string
  Subject: string
  Content: string
}

const NOTION_URL = "https://tingogtang.notion.site/2fa1c6815f788087a468d87a86e5522b?v=2fa1c6815f788079b30a000c89dfd6cb&source=copy_link"

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [results, setResults] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/messages.csv')
      .then(r => r.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (res) => setMessages(res.data as Message[])
        })
      })
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    
    const term = query.toLowerCase()
    const filtered = messages.filter(m => 
      m.Content?.toLowerCase().includes(term) || 
      m.From?.toLowerCase().includes(term) ||
      m.Subject?.toLowerCase().includes(term)
    )
    setResults(filtered)
    setHasSearched(true)
  }

  const clear = () => {
    setQuery('')
    setResults([])
    setHasSearched(false)
  }

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-100 selection:bg-zinc-800">
      {/* Header - Matches image.png structure */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <h1 className="text-sm font-medium tracking-tight text-zinc-400">prinsessa og epstein</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
            <Info size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" asChild>
            <a href="https://github.com/lukketsvane/prinsessa-og-epstein" target="_blank" rel="noreferrer">
              <Github size={18} />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" onClick={clear}>
            <Trash2 size={18} />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full">
          <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
            {!hasSearched ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-20">
                <MessageCircle size={64} strokeWidth={1} />
              </div>
            ) : (
              <div className="space-y-6">
                {results.map((msg, i) => (
                  <div key={i} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500 uppercase tracking-wider">
                            {msg.From?.replace(/<[^>]*>/g, '').trim()}
                          </Badge>
                          <span className="text-zinc-700">→</span>
                          <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500 uppercase tracking-wider">
                            {msg.To?.replace(/<[^>]*>/g, '').trim()}
                          </Badge>
                        </div>
                        <time className="text-[10px] font-mono text-zinc-600">{msg.Sent}</time>
                      </div>
                      
                      <div className="text-lg leading-relaxed font-serif italic text-zinc-300">
                        "{msg.Content}"
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/30">
                        <span className="text-[9px] font-mono text-zinc-700">{msg.FileName}</span>
                        <Button variant="link" size="sm" className="h-auto p-0 text-zinc-500 hover:text-zinc-300 text-xs" asChild>
                          <a href={NOTION_URL} target="_blank" rel="noreferrer">
                            <ExternalLink size={12} className="mr-1" />
                            Kilde
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {results.length === 0 && (
                  <div className="text-center text-zinc-600 font-serif italic py-12">
                    Ingen resultater funnet for "{query}"
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Floating Notion Button - Bottom Left as in image.png */}
        <div className="absolute bottom-6 left-6 z-20">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-10 w-10 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 shadow-2xl transition-transform active:scale-90"
            asChild
          >
            <a href={NOTION_URL} target="_blank" rel="noreferrer">
              <span className="font-bold text-lg">N</span>
            </a>
          </Button>
        </div>
      </main>

      {/* Input Section - Bottom center as in image.png */}
      <footer className="px-6 py-8">
        <form 
          onSubmit={handleSearch}
          className="max-w-2xl mx-auto relative group"
        >
          <div className="absolute inset-0 bg-white/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
          <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 shadow-2xl focus-within:border-zinc-700 transition-colors">
            <Input 
              placeholder="Søk i arkivet..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-base placeholder:text-zinc-600"
            />
            <Button 
              type="submit" 
              size="icon" 
              variant="ghost" 
              className="rounded-full h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800"
              disabled={!query.trim()}
            >
              <Send size={18} />
            </Button>
          </div>
        </form>
      </footer>
    </div>
  )
}
