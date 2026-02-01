'use client'

import React, { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import Image from 'next/image'
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
          complete: (res) => {
            const data = res.data as Message[]
            setMessages(data)
          }
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
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-black/50 backdrop-blur-md z-30">
        <h1 className="text-sm font-medium tracking-tight text-zinc-400 uppercase tracking-[0.2em]">prinsessa og epstein</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" asChild>
            <a href={NOTION_URL} target="_blank" rel="noreferrer">
              <Info size={18} />
            </a>
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
        <ScrollArea className="h-full w-full">
          <div className="w-full max-w-4xl mx-auto px-6 pb-32">
            {!hasSearched ? (
              <div className="pt-12 space-y-12 animate-in fade-in duration-1000">
                {/* Banner Integration */}
                <div className="relative w-full aspect-[21/9] overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl">
                  <Image 
                    src="/banner.png" 
                    alt="Banner" 
                    fill 
                    className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-6 left-8">
                    <Badge className="bg-white text-black font-bold px-3 py-1 mb-2">ARKIV 2026</Badge>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Dokumentasjon & Korrespondanse</h2>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="p-4 rounded-full bg-zinc-900/50 border border-zinc-800">
                    <MessageCircle size={32} className="text-zinc-500" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium text-zinc-200">Søk i arkivet</h3>
                    <p className="text-zinc-500 max-w-xs mx-auto text-sm leading-relaxed">
                      Skriv inn et søkeord nedenfor for å utforske de lekkede meldingene.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                  <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                    Resultater: <span className="text-zinc-200 ml-1">{results.length} funnet</span>
                  </h2>
                </div>

                <div className="grid gap-6">
                  {results.map((msg, i) => (
                    <div key={i} className="group">
                      <div className="bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700/50 transition-all rounded-2xl p-6 space-y-4 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-[10px] border-zinc-800 bg-zinc-950 text-zinc-400 font-medium">
                              FRA: {msg.From?.replace(/<[^>]*>/g, '').trim()}
                            </Badge>
                            <span className="text-zinc-700 text-xs">→</span>
                            <Badge variant="outline" className="text-[10px] border-zinc-800 bg-zinc-950 text-zinc-400 font-medium">
                              TIL: {msg.To?.replace(/<[^>]*>/g, '').trim()}
                            </Badge>
                          </div>
                          <time className="text-[10px] font-mono text-zinc-600">{msg.Sent}</time>
                        </div>
                        
                        <div className="text-lg leading-relaxed font-serif italic text-zinc-300 px-2 border-l-2 border-zinc-800 group-hover:border-zinc-600 transition-colors">
                          "{msg.Content}"
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/30">
                          <span className="text-[9px] font-mono text-zinc-700 tracking-wider uppercase">{msg.FileName}</span>
                          <Button variant="ghost" size="sm" className="h-auto p-0 text-zinc-500 hover:text-zinc-200 text-[10px] font-bold uppercase tracking-tighter" asChild>
                            <a href={NOTION_URL} target="_blank" rel="noreferrer">
                              <ExternalLink size={12} className="mr-1.5" />
                              Kilde
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {results.length === 0 && (
                  <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                    <p className="text-zinc-600 font-serif italic">
                      Ingen treff for "{query}"
                    </p>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Floating Notion Button */}
        <div className="absolute bottom-8 left-8 z-20">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-12 w-12 bg-zinc-950 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 shadow-2xl transition-all active:scale-90 group"
            asChild
          >
            <a href={NOTION_URL} target="_blank" rel="noreferrer">
              <span className="font-bold text-lg group-hover:scale-110 transition-transform">N</span>
            </a>
          </Button>
        </div>
      </main>

      {/* Input Section */}
      <footer className="px-6 py-10 bg-gradient-to-t from-black via-black to-transparent border-t border-zinc-900/50">
        <form 
          onSubmit={handleSearch}
          className="max-w-2xl mx-auto relative"
        >
          <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 shadow-2xl focus-within:border-zinc-600 transition-all">
            <Input 
              placeholder="Søk i korrespondansen..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-base placeholder:text-zinc-600 h-10"
            />
            <Button 
              type="submit" 
              size="icon" 
              variant="secondary" 
              className="rounded-xl h-10 w-10 bg-zinc-100 text-black hover:bg-white"
              disabled={!query.trim()}
            >
              <Send size={20} />
            </Button>
          </div>
        </form>
      </footer>
    </div>
  )
}