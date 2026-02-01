# Prinsessa og Epstein

A minimalist search and chat interface for exploring email correspondence between Norwegian Crown Princess Mette-Marit and Jeffrey Epstein.

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first styling with custom variables
- **shadcn/ui** - Component library built on Radix UI primitives
- **Lucide React** - Icon system

### AI/Chat
- **Google Gemini 2.0 Flash** - LLM for natural language chat
- **@google/genai** - Official Google AI SDK

### Deployment
- **Vercel** - Hosting and CI/CD
- **Vercel Analytics** - Usage tracking

## Architecture

### Data Pipeline
```
Email PDFs → Python Extraction → CSV Dataset → Embedded in App Bundle
```

1. **Source**: EFTA/DOJ email archive (PDF format)
2. **Extraction**: Python script parses metadata (From, To, Sent, Subject) and content
3. **Compilation**: All records compiled into `/app/constants.ts` (~47k tokens)
4. **Delivery**: Bundled directly with Next.js application (no runtime database)

### File Structure
```
app/
├── page.tsx          # Main UI component (search + chat modes)
├── constants.ts      # Full CSV dataset (~2MB, embedded at build time)
├── types.ts          # TypeScript interfaces (Message, LoadingState, EmailRecord)
├── globals.css       # Tailwind config + CSS variables
├── layout.tsx        # Root layout, metadata, fonts
└── api/
    └── chat/
        └── route.ts  # (unused - chat runs client-side)

components/ui/        # shadcn components (dialog, label, switch, etc.)
public/              # Static assets (favikon.png, banner.png, globals.css)
scripts/             # Python extraction scripts
```

## How It Works

### Search Mode
- **Client-side filtering**: Full-text search across all fields (Content, Subject, From, To, tags)
- **Zero latency**: No API calls, immediate results via JavaScript `.filter()`
- **Curated highlights**: 6 featured emails shown first (when no search query)
- **Pagination**: Limits display to 50 results to prevent UI lag
- **Modal details**: Click any email for full-screen view with prev/next navigation

### Chat Mode
- **Full context injection**: Entire CSV dataset (all emails) embedded in system instruction
- **Gemini 2.0 Flash**: Fast, cost-effective LLM with 128k token context window
- **Streaming responses**: Real-time token generation (not currently implemented, but SDK supports it)
- **Auto-citation**: Bot generates Notion archive links in markdown format `[EFTA01754699.pdf](url)`
- **Example prompts**: 5 pre-loaded Norwegian questions to guide users

### Data Model
```typescript
interface EmailRecord {
  Path: string           // Original PDF file path
  FileName: string       // Unique ID (e.g., EFTA01754699.pdf)
  From: string          // Sender email/name
  To: string            // Recipient email/name
  Sent: string          // ISO date string
  Subject: string       // Email subject line
  Content: string       // Full email body (cleaned, UTF-8)
  tag?: string          // Optional highlight label (e.g., "GOOGLA EPSTEIN")
  notionPageId?: string // Notion database page ID for deep linking
}
```

### Gemini Chat System Instruction
The entire CSV dataset is injected into the system instruction with:
- **Role**: "Objektiv dataanalytiker" (objective data analyst)
- **Goal**: Help users find information in the attached CSV
- **Language**: Always respond in Norwegian (nynorsk or bokmål)
- **Citations**: Must cite sources using filename + Notion URL
- **Constraints**: Only use information from the dataset, no speculation

## Setup

### Prerequisites
- Node.js 18+
- Google Gemini API key ([Get free key](https://aistudio.google.com/app/apikey))

### Installation
```bash
npm install
```

### Environment
```bash
# .env.local
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
```

### Development
```bash
npm run dev
# Visit http://localhost:3000
```

### Build
```bash
npm run build
npm start
```

## Features

- **Dual-mode UI**: Toggle between search and chat with single button
- **Highlight curation**: 6 hand-picked emails with custom tags
- **Responsive**: Mobile-first design, touch-optimized
- **Dark theme**: Pure black (`#000`) with zinc accent colors
- **Direct linking**: Every email links to full Notion archive
- **Keyboard-friendly**: Enter to send, tab navigation, escape to close modals
- **No backend**: Fully static site after build (no server runtime needed)

## Design System

### Brand Style
Minimalist black/white aesthetic with zinc grays.

### Colors
- **Background**: `#000000` (pure black)
- **Surface**: `zinc-900` (#18181b), `zinc-800` (#27272a)
- **Borders**: `zinc-800`, `zinc-700`
- **Text**: `zinc-200` (primary), `zinc-400` (secondary), `zinc-500` (tertiary)
- **Accent**: `white` (buttons, active states)

### Typography
- **Font**: System sans-serif (`font-sans`)
- **Sizes**: `xs` (10px), `sm` (14px), `base` (16px)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold)

### Components
- **Chat bubbles**: `bg-zinc-900`, rounded-2xl, consistent for both user/bot
- **Input fields**: `bg-zinc-900`, `border-zinc-800`, rounded-full
- **Buttons**: `bg-white text-black` (primary), `bg-zinc-800` (secondary)
- **Cards**: `bg-zinc-900/50`, `border-zinc-800`, hover: `border-zinc-700`

## Data Processing

### CSV Structure
```
Path,FileName,From,To,Sent,Subject,Content
```
- **Delimiter**: Comma (`,`)
- **Quoting**: Double quotes for multi-line content
- **Encoding**: UTF-8

### Highlights
6 manually tagged emails for homepage:
```typescript
const HIGHLIGHTS = [
  { fileName: 'EFTA00646552.pdf', tag: 'GOOGLA EPSTEIN', notionPageId: '...' },
  { fileName: 'EFTA01772124.pdf', tag: 'DEN INTIME TONEN', notionPageId: '...' },
  // ... 4 more
];
```

### Notion Integration
- **Base URL**: `https://tingogtang.notion.site/2fa1c6815f788087a468d87a86e5522b`
- **Deep link**: `${BASE}&p=${notionPageId}&pm=s`
- **Fallback**: If no pageId, link to base archive

## Performance

- **Bundle size**: ~2MB (mostly CSV data in constants.ts)
- **First load**: <2s on fast connections
- **Search latency**: <100ms (client-side)
- **Chat latency**: 1-3s (Gemini API round-trip)
- **Context window**: Full dataset fits in 128k token limit

## Limitations

- **Static dataset**: No updates without rebuild + redeploy
- **Token limits**: Large CSV (~47k tokens) uses significant context window
- **No auth**: All data publicly accessible
- **No rate limiting**: Users can spam Gemini API (costs on owner)
- **No streaming**: Chat responses appear all at once (could be improved)

## License

Research/educational project. Email data subject to EFTA/DOJ public archive terms.
