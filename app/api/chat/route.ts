import { GoogleGenAI } from '@google/genai'
import { KNOWLEDGE_BASE_CSV } from '@/app/public/constants'

export const maxDuration = 120
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NOTION_DB_URL = 'https://tingogtang.notion.site/2fa1c6815f788087a468d87a86e5522b?v=2fa1c6815f788079b30a000c89dfd6cb'

const SYSTEM_INSTRUCTION = `Du er ein grundig analytisk assistent som hjelper med a undersoke e-postkorrespondanse mellom H.K.H. Kronprinsessen (Mette-Marit av Noreg) og Jeffrey Epstein fra 2012-2014.

VIKTIGE INSTRUKSJONAR:

1. MULTI-STEG RESONNERING:
   - Tenk grundig gjennom sporsmalet for du svarar
   - Bryt ned komplekse sporsmal i mindre delar
   - Analyser datasettet systematisk
   - Bygg opp svaret logisk basert pa funna
   - Ved usikkerheit, utforsk fleire vinklar

2. KJELDEBRUK:
   - Siter ALLTID eksakt tekst fra e-postane
   - Inkluder dato og avsender/mottaker for kvar sitering
   - Legg til lenke: [Sja kjelde](${NOTION_DB_URL})
   - Bruk format: [EFTA-nummer.pdf](${NOTION_DB_URL})

3. ANALYTISK TILNAERMING:
   - Identifiser monster og samanhengar pa tvers av meldingar
   - Legg merke til tidsliner og kronologi
   - Noter relevante personar (Boris Nikolic, Lesley Groff, etc.)
   - Marker stadar som blir nemnde (NYC, Paris, oya, etc.)
   - Ver objektiv og faktabasert

4. SVARFORMAT:
   - Svar pa nynorsk
   - Ver konsis men grundig
   - Strukturer lange svar med overskrifter
   - List opp relevante e-postar kronologisk
   - Avslutt med oppsummering ved komplekse sporsmal

5. SOKESTRATEGI:
   - Ved sporsmal om personar: finn alle meldingar som nemner dei
   - Ved sporsmal om tema: sok etter relaterte ord og frasar
   - Ved sporsmal om tid: filtrer etter datoar
   - Presenter 3-5 relevante meldingar om mogleg

TILGJENGELEGE DATA (CSV-format):
${KNOWLEDGE_BASE_CSV}

VIKTIG: Tenk steg for steg. Baser ALLE svar pa faktisk innhald i e-postane. Om du ikkje finn informasjon, sei det tydeleg.`

export async function POST(req: Request) {
  const { messages } = await req.json()
  const apiKeyHeader = req.headers.get('X-API-Key')

  const apiKey = (apiKeyHeader && apiKeyHeader.trim() !== '')
    ? apiKeyHeader
    : (process.env.GEMINI_API_KEY || 'AIzaSyDDUY8rCczYKtoaFh7ZjYa7SqTNtNOpe1s')

  if (!apiKey) {
    return new Response("Missing API Key", { status: 401 })
  }

  const ai = new GoogleGenAI({ apiKey })

  // Convert messages to Gemini format with system instruction in first message
  const contents = messages.map((m: any, index: number) => {
    let text = m.content
    if (index === 0 && m.role === 'user') {
      text = `${SYSTEM_INSTRUCTION}

---

BRUKAR-SPORSMAL: ${m.content}

(Tenk gjennom dette steg for steg. Analyser datasettet grundig for a finne all relevant informasjon.)`
    }
    return {
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text }]
    }
  })

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-pro-preview-05-06',
      config: {
        thinkingConfig: {
          thinkingBudget: 12000,
        },
        tools: [{ googleSearch: {} }],
      },
      contents,
    })

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
