import { GoogleGenAI } from '@google/genai'
import { streamText } from 'ai'
import { KNOWLEDGE_BASE_CSV } from '@/app/public/constants'

export const maxDuration = 60
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NOTION_DB_URL = 'https://tingogtang.notion.site/2fa1c6815f788087a468d87a86e5522b?v=2fa1c6815f788079b30a000c89dfd6cb'

const KNOWLEDGE_BASE = `Du er ein AI-assistent med tilgang til e-postkorrespondanse mellom H.K.H. Kronprinsessen (Mette-Marit av Noreg) og Jeffrey Epstein frå 2012-2014. Svar alltid på norsk.

VIKTIG: Når du siterer frå meldingane, inkluder alltid ein lenkje til kjelda i dette formatet:
[Sjå kjelde](${NOTION_DB_URL})

Siter den relevante teksten direkte, og vis dato for meldinga.

DATASETT (CSV):
${KNOWLEDGE_BASE_CSV}

Svar kort og faktabasert. Siter alltid den eksakte teksten frå meldingane og inkluder lenkje til kjelda: ${NOTION_DB_URL}`

export async function POST(req: Request) {
  const { messages } = await req.json()
  const apiKeyHeader = req.headers.get('X-API-Key')
  
  // Free tier fallback or user key
  const apiKey = (apiKeyHeader && apiKeyHeader.trim() !== '') 
    ? apiKeyHeader 
    : (process.env.GEMINI_API_KEY || 'AIzaSyDDUY8rCczYKtoaFh7ZjYa7SqTNtNOpe1s')

  if (!apiKey) {
     return new Response("Missing API Key", { status: 401 })
  }

  // Gemini Logic (using @google/genai as requested)
  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  // Convert history to Gemini format
  const contents = messages.map((m: any, index: number) => {
    let text = m.content
    // Inject system context into the first message to guide the model
    if (index === 0 && m.role === 'user') {
      text = `System Context: ${KNOWLEDGE_BASE}\n\nUser Question: ${m.content}`
    }
    return {
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text }]
    }
  })

  const modelName = 'gemini-2.5-pro-preview-05-06'

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      config: {
        thinkingConfig: {
          thinkingBudget: 8000,
        },
        tools: [
          { googleSearch: {} }
        ],
      },
      contents,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of responseStream) {
            const candidates = chunk.candidates
            if (candidates && candidates[0]) {
               const parts = candidates[0].content.parts
               for (const part of parts) {
                 if (part.text) {
                   controller.enqueue(encoder.encode(`0:${JSON.stringify(part.text)}\n`))
                 }
               }
            } else if (chunk.text) {
               controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk.text)}\n`))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1'
      }
    })

  } catch (error) {
    console.error("Gemini API Error:", error)
    return new Response("Error communicating with Gemini", { status: 500 })
  }
}
