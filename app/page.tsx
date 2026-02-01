'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { KNOWLEDGE_BASE_CSV } from './constants';
import { Message, LoadingState } from './types';
import { Info, Github, Key, Trash2, Send, ChevronRight, ChevronLeft, Search, FileText, X, ExternalLink, Filter, Calendar, MessageSquare } from 'lucide-react';

const ARCHIVE_BASE = "https://tingogtang.notion.site/2fa1c6815f788087a468d87a86e5522b?v=2fa1c6815f788079b30a000c89dfd6cb";

interface EmailRecord {
  Path: string;
  FileName: string;
  From: string;
  To: string;
  Sent: string;
  Subject: string;
  Content: string;
  tag?: string;
  notionPageId?: string;
}

const HIGHLIGHTS: { fileName: string; tag: string; notionPageId: string }[] = [
  { fileName: 'EFTA00646552.pdf', tag: 'GOOGLA EPSTEIN', notionPageId: '2fa1c6815f7881e1a48be871dfec3e1b' },
  { fileName: 'EFTA01772124.pdf', tag: 'DEN INTIME TONEN', notionPageId: '2fa1c6815f7881bdb083f3fb64ced5d8' },
  { fileName: 'EFTA01764058.pdf', tag: 'TAPETDISKUSJONEN', notionPageId: '2fa1c6815f78810596a1c88a5afa8079' },
  { fileName: 'EFTA00980215.pdf', tag: 'WOODY ALLEN-REFERANSEN', notionPageId: '2fa1c6815f7881fb9db3f5f8aeb82a1f' },
  { fileName: 'EFTA00680541.pdf', tag: 'PALE FIRE', notionPageId: '2fa1c6815f788127b44ac25a0b1b00c8' },
  { fileName: 'EFTA00627041.pdf', tag: 'PARIS & SAVN', notionPageId: '2fa1c6815f7881a4b555f7a020d22848' },
];

const EXAMPLE_PROMPTS = [
  "Vart kronprinsessa invitert til øya hans?",
  "Kva bøker tilrådde Epstein?",
  "Kven er Boris Nikolic?",
  "Kor ofte møttest dei i New York?",
  "Kva skreiv ho om helsa si?",
];

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm14.25 6a.75.75 0 01-.22.53l-2.25 2.25a.75.75 0 11-1.06-1.06L15.44 12l-1.72-1.72a.75.75 0 111.06-1.06l2.25 2.25c.141.14.22.331.22.53zm-10.28-.53a.75.75 0 000 1.06l2.25 2.25a.75.75 0 101.06-1.06L7.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-2.25 2.25z" clipRule="evenodd" />
  </svg>
);

const formatText = (text: string) => {
  const parts = text.split(/(\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    const match = part.match(/\[(.*?)\]\((.*?)\)/);
    if (match) {
      return (
        <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white underline underline-offset-2">
          {match[1]}
        </a>
      );
    }
    return part;
  });
};

function parseCSV(csv: string): EmailRecord[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const records: EmailRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 7) {
      const fileName = values[1] || '';
      const highlight = HIGHLIGHTS.find(h => h.fileName === fileName);
      records.push({
        Path: values[0] || '',
        FileName: fileName,
        From: values[2] || '',
        To: values[3] || '',
        Sent: values[4] || '',
        Subject: values[5] || '',
        Content: values[6] || '',
        tag: highlight?.tag,
        notionPageId: highlight?.notionPageId,
      });
    }
  }
  return records;
}

function getMessageUrl(record: EmailRecord): string {
  if (record.notionPageId) {
    return `${ARCHIVE_BASE}&p=${record.notionPageId}&pm=s`;
  }
  return ARCHIVE_BASE;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const match = dateStr.match(/(\d{1,2})\s+\w+\s+(\d{4})/);
      if (match) return dateStr;
      return dateStr;
    }
    const months = ['jan.', 'feb.', 'mar.', 'apr.', 'mai', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'des.'];
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day}. ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

function formatSender(from: string): string {
  if (from.toLowerCase().includes('kronprinsessen') || from.toLowerCase().includes('kpm')) {
    return 'KRONPRINSESSEN';
  }
  if (from.toLowerCase().includes('epstein') || from.toLowerCase().includes('jeffrey')) {
    return 'EPSTEIN';
  }
  if (from.toLowerCase().includes('boris')) {
    return 'BORIS NIKOLIC';
  }
  return from.toUpperCase().slice(0, 30);
}

function scoreRecord(record: EmailRecord, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(t => t.length > 2);
  let score = 0;

  tokens.forEach(token => {
    const content = record.Content.toLowerCase();
    const subject = record.Subject.toLowerCase();
    const from = record.From.toLowerCase();

    // Exact phrase match in content (highest weight)
    if (content.includes(q)) score += 10;

    // Token matches with different weights
    if (subject.includes(token)) score += 5;
    if (from.includes(token)) score += 3;
    if (content.includes(token)) score += 2;

    // Bonus for tag match
    if (record.tag && record.tag.toLowerCase().includes(token)) score += 8;
  });

  return score;
}

function getConversationThread(records: EmailRecord[], targetRecord: EmailRecord): EmailRecord[] {
  const targetDate = new Date(targetRecord.Sent);
  const dayBefore = new Date(targetDate);
  const dayAfter = new Date(targetDate);
  dayBefore.setDate(targetDate.getDate() - 1);
  dayAfter.setDate(targetDate.getDate() + 1);

  // Get messages within 1 day before/after, sorted by date
  return records
    .filter(r => {
      const date = new Date(r.Sent);
      return date >= dayBefore && date <= dayAfter;
    })
    .sort((a, b) => new Date(a.Sent).getTime() - new Date(b.Sent).getTime());
}

export default function App() {
  const [mode, setMode] = useState<'search' | 'chat'>('search');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<EmailRecord | null>(null);
  const [filterSender, setFilterSender] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'thread'>('list');
  const [threadContext, setThreadContext] = useState<EmailRecord[]>([]);

  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const records = useMemo(() => parseCSV(KNOWLEDGE_BASE_CSV), []);

  const { highlightedRecords, otherRecords } = useMemo(() => {
    let filtered = [...records];

    // Apply sender filter
    if (filterSender !== 'all') {
      filtered = filtered.filter(r => {
        const from = formatSender(r.From);
        return from === filterSender;
      });
    }

    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(r => {
        const date = new Date(r.Sent);
        const start = dateRange.start ? new Date(dateRange.start) : new Date('2000-01-01');
        const end = dateRange.end ? new Date(dateRange.end) : new Date('2030-12-31');
        return date >= start && date <= end;
      });
    }

    // Apply search query with semantic scoring
    if (searchQuery.trim()) {
      const scored = filtered
        .map(r => ({ record: r, score: scoreRecord(r, searchQuery) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50)
        .map(item => item.record);
      return { highlightedRecords: [], otherRecords: scored };
    }

    // No search: show highlights first
    const highlighted = HIGHLIGHTS.map(h => filtered.find(r => r.FileName === h.fileName)).filter(Boolean) as EmailRecord[];
    const others = filtered.filter(r => !r.tag);
    return { highlightedRecords: highlighted, otherRecords: others };
  }, [records, searchQuery, filterSender, dateRange]);

  const getSystemInstruction = useCallback(() => {
    return `Du er ein objektiv dataanalytiker som har tilgang til eit spesifikt arkiv av e-postar mellom Kronprinsessen og Jeffrey Epstein (og relaterte partar).

MAL:
Hjelpe brukaren med a finne informasjon i det vedlagde CSV-datasettet.

KJELDER:
Datasettet inneheld kolonnar som "FileName", "From", "To", "Sent", "Subject", "Content".

DATASETT START:
${KNOWLEDGE_BASE_CSV}
DATASETT SLUTT

STRUKTURREFERANSE:
Hovudsider:
- Prinsessa og Epstein (hovudside): https://www.notion.so/Prinsessa-og-Epstein-2f91c6815f7880918c15f02cc8882b28
- Kronikk: Mønsteret av løgn: https://www.notion.so/Kronikk-M-nsteret-av-l-gn-2fa1c6815f7881d38424c70e616bebf7
- lesarinnlegg: https://www.notion.so/lesarinnlegg-2fa1c6815f78803c8ec3c92f9c4b3900

Databasar:
- messages database: https://www.notion.so/2fa1c6815f788087a468d87a86e5522b
- pdf-ar database: https://www.notion.so/2fa1c6815f7880708db0df6892b09449

messages-skjema: Name (filbane), Content (rå innhald), content_cleaned (reinsa), FileName (EFTA-nummer), From (avsendar), To (mottakar), Sent (dato), Subject (emne), PDF (relasjon til pdf-ar)

Eksterne lenker:
- Nettside: https://prinsessa-og-epstein.iverfinne.no/
- GitHub: https://github.com/fredfull/prinsessa-og-epstein

VIKTIGE INSTRUKSJONAR FOR SVAR:
1. Svar ALLTID pa NORSK (nynorsk eller bokmal).

2. HYPERLENKJER - KRITISK VIKTIG:
   - KVART EINASTE filnamn (EFTA-nummer) MA vere ei klikkbar lenkje
   - Bruk ALLTID markdown-format: [EFTA01754699.pdf](${ARCHIVE_BASE})
   - Aldri nemn eit filnamn utan lenkje
   - Eksempel: "I [EFTA01754699.pdf](${ARCHIVE_BASE}) skriv Kronprinsessen: 'Yes there are.'"

3. KRONOLOGISK KONTEKST - Vis heilskapsbilete:
   - Nar du svarar, finn FLEIRE relevante meldingar (3-5 stk om mogleg)
   - Presenter dei kronologisk for a vise utviklinga over tid
   - Lag ei narrativ kjede som viser samanhengen mellom meldingane
   - Eksempel: "Dette temaet strekkjer seg over fleire meldingar:
     - 10. des 2012: I [EFTA00646552.pdf](${ARCHIVE_BASE}) skriv ho 'Called u today'
     - 22. nov 2012: I [EFTA01754699.pdf](${ARCHIVE_BASE}) svarar ho 'Yes there are'
     - 24. okt 2012: I [EFTA01772124.pdf](${ARCHIVE_BASE}) reflekterer ho over..."

4. Viss du ikkje finn informasjonen i datasettet, sei: "Eg finn ikkje den informasjonen i det tilgjengelege arkivet."

5. Ver kortfatta, presis og noytral. Ikkje spekuler utover det som star i teksten.
`;
  }, []);

  const initializeChat = useCallback((key: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      chatRef.current = ai.chats.create({
        model: 'gemini-2.0-flash',
        config: { systemInstruction: getSystemInstruction() }
      });
    } catch (error) {
      console.error("Failed to initialize Gemini:", error);
    }
  }, [getSystemInstruction]);

  const getInitialGreeting = useCallback(() => ({
    id: 'init',
    role: 'model' as const,
    text: `Hei! Eg er ein assistent spesialisert pa korrespondansen mellom Kronprinsessen og Jeffrey Epstein. Eg har tilgang til ${records.length} e-postjournalar. Kva lurer du pa?`,
    timestamp: new Date()
  }), [records.length]);

  useEffect(() => {
    setMessages([getInitialGreeting()]);
    const defaultKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (defaultKey) initializeChat(defaultKey);
  }, [getInitialGreeting, initializeChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingState]);

  const clearChat = () => {
    setMessages([getInitialGreeting()]);
    setSearchQuery('');
    setSelectedRecord(null);
    const key = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (key) initializeChat(key);
  };

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(b.Sent).getTime() - new Date(a.Sent).getTime());
  }, [records]);

  const navigateRecord = (direction: 'prev' | 'next') => {
    if (!selectedRecord) return;
    const currentIndex = sortedRecords.findIndex(r => r.FileName === selectedRecord.FileName);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < sortedRecords.length) {
      setSelectedRecord(sortedRecords[newIndex]);
    }
  };

  const handleRecordClick = (record: EmailRecord) => {
    setSelectedRecord(record);
    const thread = getConversationThread(records, record);
    setThreadContext(thread);
  };

  const saveApiKey = () => {
    setApiKey(tempApiKey);
    if (tempApiKey) initializeChat(tempApiKey);
    setShowKeyModal(false);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || loadingState === LoadingState.LOADING) return;

    setInputValue('');
    setLoadingState(LoadingState.LOADING);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      if (!chatRef.current) throw new Error("Chat session not initialized");
      const response = await chatRef.current.sendMessage({ message: messageText });
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setLoadingState(LoadingState.IDLE);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Eg opplevde ein feil under behandlinga. Vennlegst sjekk konfigurasjonen din.",
        timestamp: new Date()
      }]);
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-medium tracking-tight">prinsessa og epstein</span>

        {/* Mode Toggle */}
        <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
          <button
            onClick={() => setMode('search')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'search' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            SOK
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'chat' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            CHAT
          </button>
        </div>

        <div className="flex items-center gap-1">
          <a
            href="https://tingogtang.notion.site/Prinsessa-og-Epstein-2f91c6815f7880918c15f02cc8882b28?source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Info"
          >
            <Info size={18} strokeWidth={1.5} />
          </a>
          <a
            href="https://github.com/lukketsvane/prinsessa-og-epstein"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="GitHub"
          >
            <Github size={18} strokeWidth={1.5} />
          </a>
          <button
            onClick={() => { setTempApiKey(apiKey); setShowKeyModal(true); }}
            className={`p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors ${apiKey ? 'text-green-400' : ''}`}
            aria-label="API Key"
          >
            <Key size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={clearChat}
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Clear"
          >
            <Trash2 size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-800">
            <h2 className="text-lg font-semibold mb-4">Gemini API-nokkel</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Legg inn din eigen Google Gemini API-nokkel for a bruke chatboten.
              Du kan fa ein gratis nokkel fra{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white underline">
                Google AI Studio
              </a>.
            </p>
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-zinc-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowKeyModal(false)} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                Avbryt
              </button>
              <button onClick={saveApiKey} className="flex-1 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors font-medium">
                Lagre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl border border-zinc-800 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigateRecord('prev')}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => navigateRecord('next')}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getMessageUrl(selectedRecord)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Open in Notion"
                >
                  <ExternalLink size={18} />
                </a>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {selectedRecord.tag && (
                <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-white/10 border border-white/20 rounded uppercase tracking-wider mb-4">
                  {selectedRecord.tag}
                </span>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>FRA: {formatSender(selectedRecord.From)}</span>
                  <span>{formatDate(selectedRecord.Sent)}</span>
                </div>
                <div className="text-xs text-zinc-500">
                  TIL: {formatSender(selectedRecord.To)}
                </div>
                {selectedRecord.Subject && (
                  <div className="text-xs text-zinc-500">
                    EMNE: {selectedRecord.Subject}
                  </div>
                )}
              </div>

              <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {selectedRecord.Content}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-600">
                <FileText size={12} />
                <span className="font-mono">{selectedRecord.FileName}</span>
              </div>

              {/* Thread Context */}
              {threadContext.length > 1 && (
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-zinc-500" />
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">
                      Korrespondanse ({threadContext.length} meldingar)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {threadContext.map((msg, idx) => (
                      <div
                        key={`thread-${msg.FileName}-${idx}`}
                        className={`p-3 rounded-lg border text-xs ${
                          msg.FileName === selectedRecord.FileName
                            ? 'bg-white/5 border-white/20'
                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 cursor-pointer'
                        }`}
                        onClick={() => msg.FileName !== selectedRecord.FileName && handleRecordClick(msg)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-zinc-500">{formatDate(msg.Sent)}</span>
                          <span className="text-zinc-600 font-mono text-[10px]">{msg.FileName}</span>
                        </div>
                        <div className="text-zinc-400 mb-1">
                          {formatSender(msg.From)} → {formatSender(msg.To)}
                        </div>
                        <div className="text-zinc-300 line-clamp-2">
                          "{msg.Content.slice(0, 100)}{msg.Content.length > 100 ? '...' : ''}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {mode === 'search' ? (
        <>
          {/* Search Input & Filters */}
          <div className="border-b border-zinc-800">
            <div className="p-4">
              <div className="max-w-4xl mx-auto">
                <div className="relative flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Semantisk søk i meldingar..."
                      className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-full focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-zinc-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-3 rounded-full border transition-colors ${showFilters ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
                  >
                    <Filter size={18} />
                  </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <div className="mt-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Sender Filter */}
                      <select
                        value={filterSender}
                        onChange={(e) => setFilterSender(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                      >
                        <option value="all">Alle</option>
                        <option value="KRONPRINSESSEN">Kronprinsessen</option>
                        <option value="EPSTEIN">Epstein</option>
                        <option value="BORIS NIKOLIC">Boris Nikolic</option>
                      </select>

                      {/* Date Range */}
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                      />
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                      >
                        Liste
                      </button>
                      <button
                        onClick={() => setViewMode('timeline')}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${viewMode === 'timeline' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                      >
                        Tidslinje
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            <div className="max-w-4xl mx-auto">
              {/* Timeline View */}
              {viewMode === 'timeline' ? (
                <div className="space-y-8">
                  {[...highlightedRecords, ...otherRecords]
                    .sort((a, b) => new Date(a.Sent).getTime() - new Date(b.Sent).getTime())
                    .reduce((acc, record) => {
                      const year = new Date(record.Sent).getFullYear();
                      if (!acc[year]) acc[year] = [];
                      acc[year].push(record);
                      return acc;
                    }, {} as Record<number, EmailRecord[]>)
                    && Object.entries(
                      [...highlightedRecords, ...otherRecords]
                        .sort((a, b) => new Date(a.Sent).getTime() - new Date(b.Sent).getTime())
                        .reduce((acc, record) => {
                          const year = new Date(record.Sent).getFullYear();
                          if (!acc[year]) acc[year] = [];
                          acc[year].push(record);
                          return acc;
                        }, {} as Record<number, EmailRecord[]>)
                    ).map(([year, yearRecords]) => (
                      <div key={year}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-2xl font-semibold text-white">{year}</div>
                          <div className="flex-1 h-px bg-zinc-800"></div>
                          <div className="text-xs text-zinc-600">{yearRecords.length} meldingar</div>
                        </div>
                        <div className="relative pl-8 space-y-4">
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-800"></div>
                          {yearRecords.map((record, idx) => (
                            <div key={`timeline-${record.FileName}-${idx}`} className="relative">
                              <div className="absolute left-[-33px] top-3 w-2 h-2 rounded-full bg-white"></div>
                              <div
                                onClick={() => handleRecordClick(record)}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors cursor-pointer"
                              >
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-500">{formatDate(record.Sent)}</span>
                                    {record.tag && (
                                      <span className="px-2 py-0.5 text-[10px] font-medium bg-white/10 border border-white/20 rounded uppercase tracking-wider">
                                        {record.tag}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                  {formatSender(record.From)} → {formatSender(record.To)}
                                </div>
                                <p className="text-sm text-zinc-200 leading-relaxed line-clamp-2">
                                  "{record.Content.slice(0, 150)}{record.Content.length > 150 ? '...' : ''}"
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-4">
              {/* Highlighted messages */}
              {highlightedRecords.map((record, idx) => (
                <div
                  key={`highlight-${record.FileName}-${idx}`}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    {record.tag && (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-white/10 border border-white/20 rounded uppercase tracking-wider">
                        {record.tag}
                      </span>
                    )}
                    <span className="text-xs text-zinc-500 ml-auto">{formatDate(record.Sent)}</span>
                  </div>

                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                    FRA: {formatSender(record.From)}
                  </div>

                  <p className="text-sm text-zinc-200 italic leading-relaxed mb-3 line-clamp-3">
                    "{record.Content.slice(0, 200)}{record.Content.length > 200 ? '...' : ''}"
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <FileText size={12} />
                      <span className="font-mono">{record.FileName}</span>
                    </div>
                    <button
                      onClick={() => handleRecordClick(record)}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      FULL MELDING <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Divider */}
              {highlightedRecords.length > 0 && otherRecords.length > 0 && (
                <div className="flex items-center gap-4 py-4">
                  <div className="flex-1 h-px bg-zinc-800"></div>
                  <span className="text-xs text-zinc-600 uppercase tracking-wider">Alle meldingar</span>
                  <div className="flex-1 h-px bg-zinc-800"></div>
                </div>
              )}

              {/* Other messages */}
              {otherRecords.map((record, idx) => (
                <div
                  key={`other-${record.FileName}-${idx}`}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <span className="text-xs text-zinc-500">{formatDate(record.Sent)}</span>
                  </div>

                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                    FRA: {formatSender(record.From)}
                  </div>

                  <p className="text-sm text-zinc-200 italic leading-relaxed mb-3 line-clamp-3">
                    "{record.Content.slice(0, 200)}{record.Content.length > 200 ? '...' : ''}"
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <FileText size={12} />
                      <span className="font-mono">{record.FileName}</span>
                    </div>
                    <button
                      onClick={() => handleRecordClick(record)}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      FULL MELDING <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {highlightedRecords.length === 0 && otherRecords.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  Ingen meldingar funne for "{searchQuery}"
                </div>
              )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-3`}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 border bg-zinc-900 border-zinc-800 text-zinc-400">
                      {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
                    </div>
                    <div className={`relative px-5 py-3 text-sm shadow-sm rounded-2xl bg-zinc-900 text-zinc-200 border border-zinc-800 ${
                      msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed">{formatText(msg.text)}</div>
                      <div className="text-[10px] mt-2 opacity-50 text-zinc-500">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {loadingState === LoadingState.LOADING && (
                <div className="flex w-full justify-start">
                  <div className="flex flex-row space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 flex items-center justify-center mt-1">
                      <BotIcon />
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-2xl rounded-tl-none flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Example Prompts */}
              {messages.length === 1 && (
                <div className="pt-4">
                  <p className="text-xs text-zinc-500 mb-3">Forslag til sporsmal:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(prompt)}
                        className="px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-800 transition-colors text-zinc-300"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-none p-4 border-t border-zinc-800">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleFormSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Spor om e-postane..."
                  className="w-full pl-5 pr-14 py-3.5 bg-zinc-900 border border-zinc-800 rounded-full focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-zinc-500"
                  disabled={loadingState === LoadingState.LOADING}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loadingState === LoadingState.LOADING}
                  className="absolute right-2 p-2.5 bg-white text-black rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
