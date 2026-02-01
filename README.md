# Prinsessa og Epstein

A Gmail-inspired interface for exploring email correspondence between Norwegian Crown Princess Mette-Marit and Jeffrey Epstein.

**Live:** [prinsessa-og-epstein.iverfinne.no](https://prinsessa-og-epstein.iverfinne.no/)

## Features

### Gmail-like Email Experience
- **Read/Unread status**: Blue dot indicates unread messages, dims when read
- **Important marking**: Star messages as "Viktige" (important) for quick access
- **Compact desktop view**: Gmail-style single-line rows on large screens
- **Persistent state**: Read/important status cached in localStorage

### Search & Discovery
- **AI-powered semantic search**: Uses embeddings for intelligent search
- **Basic keyword search**: Fallback full-text search across all fields
- **Thread view**: See email chains and related messages
- **PDF links**: Click filenames to view original PDFs in Notion database

### Sharing
- **Copy to clipboard**: One-click sharing with URL and message preview
- **Direct links**: Share links that open specific messages via `?search=EFTA...`

### AI Chatbot
- **Gemini 2.0 Flash**: Natural language queries about the archive
- **In-app citations**: Clickable links open messages directly in the app
- **Context-aware**: Full dataset available for comprehensive answers
- **Norwegian language**: Responds in nynorsk or bokmål

## Tech Stack

- **Next.js 16** with App Router
- **React 19** + TypeScript
- **Tailwind CSS v4** + shadcn/ui
- **Google Gemini 2.0 Flash** for chat
- **Vercel** hosting

## Quick Start

```bash
# Install
npm install

# Configure
echo "NEXT_PUBLIC_GEMINI_API_KEY=your_key" > .env.local

# Run
npm run dev
```

Visit [localhost:3000](http://localhost:3000)

## Data

~200 emails from EFTA/DOJ archive embedded at build time (~47k tokens).

### Structure
```typescript
interface EmailRecord {
  FileName: string      // e.g., "EFTA00646552.pdf"
  From: string          // Sender
  To: string            // Recipient
  Sent: string          // ISO date
  Subject: string       // Subject line
  Content: string       // Full body
}
```

### Notion Integration
- Messages database: [View in Notion](https://tingogtang.notion.site/2fa1c6815f788087a468d87a86e5522b)
- PDF viewer: Links filtered by filename for direct PDF access

## Architecture

```
CSV Dataset → Next.js Bundle → Client-side Search + Gemini Chat
```

- **No backend database**: Full dataset compiled into app
- **Client-side filtering**: Zero-latency search via JavaScript
- **Semantic search API**: `/api/search` for AI-powered queries
- **Static export**: Pages pre-rendered for fast loading

## Design

Minimalist dark theme inspired by email clients:

- **Background**: Pure black (`#000`)
- **Surface**: `zinc-900`, `zinc-800`
- **Accent**: Yellow stars, blue unread dots
- **Typography**: System sans-serif

### Desktop vs Mobile
- Desktop: Compact Gmail-style row layout
- Mobile: Card-based layout with more padding

## License

Research/educational project. Email data from EFTA/DOJ public archive.
