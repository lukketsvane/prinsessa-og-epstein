'use client'

import React, { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import Image from 'next/image'
import { Search, Info, Github, Trash2, MessageCircle, Send, ExternalLink, Star } from 'lucide-react'
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
  content_cleaned?: string
  displayContent?: string
}

const NOTION_URL = "https://tingogtang.notion.site/2fa1c6815f788087a468d87a86e5522b?v=2fa1c6815f788079b30a000c89dfd6cb&source=copy_link"

// Function to clean content if content_cleaned is missing
function cleanMessageContent(content: string): string {
  if (!content) return ''
  let cleaned = content.replace(/<\?xml[\s\S]*?<\/plist>/g, '')
  cleaned = cleaned.replace(/\d+\s+EFTA_R1_\d+\s+EFTA\d+/g, '')
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  return cleaned
}

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
            const data = (res.data as Message[]).map(m => ({
              ...m,
              displayContent: m.content_cleaned || cleanMessageContent(m.Content)
            }))
            setMessages(data)
          }
        })
      })
  }, [])

  const handleSearch = (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault()
    const searchTerm = overrideQuery !== undefined ? overrideQuery : query
    
    if (!searchTerm.trim()) return
    
    const term = searchTerm.toLowerCase()
    const filtered = messages.filter((m) => 
      m.displayContent?.toLowerCase().includes(term) || 
      m.From?.toLowerCase().includes(term) ||
      m.Subject?.toLowerCase().includes(term)
    )
    setResults(filtered)
    setHasSearched(true)
    
    if (overrideQuery !== undefined) {
      setQuery(overrideQuery)
    }
  }

  const clear = () => {
    setQuery('')
    setResults([])
    setHasSearched(false)
  }

  // Curated highlights based on user input
  const highlights = [
    {
      title: "Tapetdiskusjonen",
      date: "13. nov. 2012",
      from: "Kronprinsessen",
      content: "Is it inappropriate for a mother to suggest two naked women carrying a surfboard for my 15 yr old sons wallpaper ?",
      responseFrom: "Epstein",
      response: "let them decide, mother should stay out of it.",
      file: "EFTA01764058.pdf"
    },
    {
      title: "Invitasjon til øya",
      date: "22. okt. 2013",
      from: "Boris Nikolic",
      content: "Lets all of us go to jee's island to recover on a sun",
      file: "EFTA02576070.pdf"
    },
    {
      title: "Woody Allen-referansen",
      date: "7. jan. 2014",
      from: "Epstein",
      content: "Woody Allen at my house for a week",
      responseFrom: "Kronprinsessen",
      response: "well that must have been a neurotic experience for the two of you ;)",
      file: "EFTA00980215.pdf"
    },
    {
      title: "Pale Fire",
      date: "Jan. 2014",
      from: "Kronprinsessen",
      content: "Im reading pale fire",
      file: "EFTA00680541.pdf"
    },
    {
      title: "Den intime tonen",
      date: "24. okt. 2011",
      from: "Kronprinsessen",
      content: "Every day is a constant struggle of scratching the soul just Enough to still be able to chose the light",
      file: "EFTA01772124.pdf"
    },
    {
      title: "Paris & Savn",
      date: "22. nov. 2013",
      from: "Kronprinsessen",
      content: "I miss paris. We need to talk soon",
      file: "EFTA00627041.pdf"
    },
    {
        title: "Siste kjente kontakt",
        date: "23. juni 2014",
        from: "Epstein",
        content: "??9",
        file: "EFTA00991747.pdf"
    }
  ]

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-100 selection:bg-zinc-800 font-sans antialiased">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-black/50 backdrop-blur-md z-30">
        <h1 className="text-sm font-medium tracking-tight text-zinc-400 uppercase tracking-[0.2em]">prinsessa og epstein</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" asChild title="Kilde">
            <a href={NOTION_URL} target="_blank" rel="noreferrer">
              <Info size={18} />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" asChild title="GitHub">
            <a href="https://github.com/lukketsvane/prinsessa-og-epstein" target="_blank" rel="noreferrer">
              <Github size={18} />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" onClick={clear} title="Tøm søk">
            <Trash2 size={18} />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full w-full">
          <div className="w-full max-w-4xl mx-auto px-6 pb-32">
            {!hasSearched ? (
              <div className="pt-12 space-y-16 animate-in fade-in duration-1000">
                {/* Banner Integration */}

                {/* Highlights Section */}
                <section className="space-y-8">

                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {highlights.map((h, i) => (
                      <div 
                        key={i} 
                        className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700 transition-all group cursor-pointer" 
                        onClick={() => handleSearch(undefined, h.content.substring(0, 40))}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="outline" className="text-[9px] border-zinc-800 text-zinc-500 uppercase px-2 py-0">{h.title}</Badge>
                          <span className="text-[10px] font-mono text-zinc-600">{h.date}</span>
                        </div>
                        
                        <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-tighter mb-2">
                          Fra: {h.from}
                        </div>

                        <div className="space-y-4 mb-4">
                          <p className="text-base font-serif italic text-zinc-300 leading-relaxed">
                            "{h.content}"
                          </p>
                          {h.response && (
                            <div className="space-y-1 border-l border-zinc-800 pl-4 py-1">
                              <div className="text-[9px] uppercase text-zinc-600 font-bold">{h.responseFrom}:</div>
                              <p className="text-xs text-zinc-400 font-serif italic">
                                "{h.response}"
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-auto">
                          <span className="text-[9px] text-zinc-700 font-mono">
                            {h.file}
                          </span>
                          <span className="text-[9px] text-zinc-500 uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity">Full melding →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-50">
                  <div className="p-4 rounded-full bg-zinc-900/50 border border-zinc-800">
                    <Search size={32} className="text-zinc-500" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-zinc-200 uppercase tracking-widest">Fullstendig arkiv</h3>
                    <p className="text-zinc-500 max-w-xs mx-auto text-xs leading-relaxed">
                      Bruk søkefeltet nedenfor for å finne spesifikke dokumenter blant 529 meldinger.
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
                  <Button variant="ghost" size="sm" onClick={clear} className="text-xs text-zinc-500 h-8">Nullstill</Button>
                </div>

                <div className="grid gap-6">
                  {results.map((msg: any, i) => (
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
                          "{msg.displayContent}"
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