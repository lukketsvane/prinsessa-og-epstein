import { GoogleGenAI } from '@google/genai'
import { KNOWLEDGE_BASE_CSV } from '@/app/public/constants'

export const maxDuration = 30
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface EmailRecord {
  Path: string
  FileName: string
  From: string
  To: string
  Sent: string
  Subject: string
  Content: string
}

function parseCSV(csv: string): EmailRecord[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []

  const records: EmailRecord[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    if (values.length >= 7) {
      records.push({
        Path: values[0] || '',
        FileName: values[1] || '',
        From: values[2] || '',
        To: values[3] || '',
        Sent: values[4] || '',
        Subject: values[5] || '',
        Content: values[6] || '',
      })
    }
  }
  return records
}

// Cache for embeddings to avoid recomputing
let cachedEmbeddings: { record: EmailRecord; embedding: number[] }[] | null = null

async function getEmbedding(ai: GoogleGenAI, text: string): Promise<number[]> {
  const result = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: [{ parts: [{ text }] }],
  })
  return result.embeddings?.[0]?.values || []
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function POST(req: Request) {
  const { query, filters } = await req.json()
  const apiKeyHeader = req.headers.get('X-API-Key')

  const apiKey = (apiKeyHeader && apiKeyHeader.trim() !== '')
    ? apiKeyHeader
    : process.env.GEMINI_API_KEY

  if (!apiKey) {
    return new Response("Missing API Key", { status: 401 })
  }

  const ai = new GoogleGenAI({ apiKey })

  try {
    // Parse records
    let records = parseCSV(KNOWLEDGE_BASE_CSV)

    // Apply filters first
    if (filters?.sender && filters.sender !== 'all') {
      records = records.filter(r => {
        const from = r.From.toLowerCase()
        return from.includes(filters.sender.toLowerCase())
      })
    }

    if (filters?.dateStart) {
      const start = new Date(filters.dateStart)
      records = records.filter(r => new Date(r.Sent) >= start)
    }

    if (filters?.dateEnd) {
      const end = new Date(filters.dateEnd)
      records = records.filter(r => new Date(r.Sent) <= end)
    }

    if (!query || query.trim().length < 2) {
      // No query, return filtered records sorted by date
      return Response.json({
        results: records.slice(0, 50).map(r => ({ ...r, score: 1 })),
        mode: 'chronological'
      })
    }

    // Use Gemini to understand the query intent and expand it
    const intentResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        parts: [{
          text: `Analyze this search query about emails between Norwegian Crown Princess and Jeffrey Epstein (2012-2014).

Query: "${query}"

Return a JSON object with:
- "expandedTerms": array of related search terms in Norwegian and English
- "intent": brief description of what user is looking for
- "entities": any people, places, or topics mentioned
- "timeframe": if a specific time period is mentioned

Response in JSON only, no markdown.`
        }]
      }]
    })

    let searchTerms = [query.toLowerCase()]
    try {
      const intentText = intentResponse.text?.replace(/```json\n?|\n?```/g, '') || '{}'
      const intent = JSON.parse(intentText)
      if (intent.expandedTerms) {
        searchTerms = [...searchTerms, ...intent.expandedTerms.map((t: string) => t.toLowerCase())]
      }
    } catch {
      // Use original query if parsing fails
    }

    // Score records using expanded semantic matching
    const scoredRecords = records.map(record => {
      let score = 0
      const content = record.Content.toLowerCase()
      const subject = record.Subject.toLowerCase()
      const from = record.From.toLowerCase()
      const to = record.To.toLowerCase()
      const fullText = `${content} ${subject} ${from} ${to}`

      // Check each search term
      for (const term of searchTerms) {
        // Exact phrase match (highest weight)
        if (fullText.includes(term)) {
          score += term === query.toLowerCase() ? 10 : 5
        }

        // Word-level matching
        const words = term.split(/\s+/)
        for (const word of words) {
          if (word.length < 3) continue
          if (content.includes(word)) score += 2
          if (subject.includes(word)) score += 3
          if (from.includes(word)) score += 2
          if (to.includes(word)) score += 2
        }
      }

      return { ...record, score }
    })

    // Filter and sort by score
    const results = scoredRecords
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)

    return Response.json({
      results,
      mode: 'semantic',
      expandedTerms: searchTerms
    })

  } catch (error) {
    console.error("Search API Error:", error)
    return new Response("Search failed", { status: 500 })
  }
}
