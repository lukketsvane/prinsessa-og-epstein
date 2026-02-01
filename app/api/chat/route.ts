import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'

export const maxDuration = 30

const NOTION_DB_URL = 'https://tingogtang.notion.site/2fa1c6815f788087a468d87a86e5522b?v=2fa1c6815f788079b30a000c89dfd6cb'

const KNOWLEDGE_BASE = `Du er ein AI-assistent med tilgang til e-postkorrespondanse mellom H.K.H. Kronprinsessen (Mette-Marit av Noreg) og Jeffrey Epstein frå 2012-2014. Svar alltid på norsk.

VIKTIG: Når du siterer frå meldingane, inkluder alltid ein lenkje til kjelda i dette formatet:
[Sjå kjelde](${NOTION_DB_URL})

Siter den relevante teksten direkte, og vis dato for meldinga.

EMAIL DATA:
- Mon, 10 Dec 2012: Kronprinsessen to Epstein: "Called u today"
- 2012-11-13: Kpm to Epstein: "In this house mum decides Fairly and most of the time cool I surf so I own my respect there I will now make an effort with shades of grey"
- 2013-09-22: Epstein to Kronprinsessen: "welcome. I told boris there are a group of swedish female economists coming to the house at 6 tonight, you are of course welcome."
- 2013-09-24: Kronprinsessen to Epstein: "Def 9" (meeting at 9 east 71st)
- 2013-09-25: Kronprinsessen: "Im stuck in bed Cant Get out.. S00000 exchausted!"
- 2013-09-26: Epstein: "I may be here on friday. you looked great, would love to catch up."
- 2013-09-28: Epstein: "hope you are feeling better" / Kronprinsessen: "A bit Thanx" / "I love being home with the kids"
- 2013-10-06: Kronprinsessen: "N00000" / Epstein: "back/neck? emotionally?"
- 2013-10-09: Kronprinsessen: "I have a new prolapsed disc in my neck so it puts strains on the nerve going out to my left arm. So not feeling great. Ingrid broke her 3 teeth yesterday and the dog has a huge infection on her tail. Reading tons though Stendhal cures for love James salters latest Just finished the heart is a lonely hunter. I could never find anyone to keep up with you!!!"
- 2013-10-09: Epstein: "try the financier by theodor dreiser... gone with the wind margaret mitchell.. catch 22 heller."
- 2013-10-22: Kronprinsessen: "Prolapsed disc in c7 on both sides :) feeling somewhat under the weather... And loosing a bit of feeling in the arms."
- 2013-10-22: Boris Nikolic: "Lets all of us go to jee's island to recover on a sun"
- 2013-11-03: Epstein: "any better?"
- 2013-11-09: Kronprinsessen: "Thank you my friend I have good help here." / Epstein: "Hope it goes well. If you prefer us hospital help"
- 2013-11-22: Kronprinsessen: "So much for The beautiful flowers... Im finally feeling better..., Love Mm" / "I miss paris We need to talk soon" / "Yes there are. Where are you?"
- 2013-12-14: Epstein: "How are you"
- 2013-12-21: Epstein: "where for the holidays?"
- 2014-01-06: Epstein: "i've been thinking about you how are you feeling?"
- 2014-01-07: Kronprinsessen: "Feeling better Broke rib this weekend so seems im under some wicked spell :) How are u Sun or snow?" / "Im reading pale fire" / "Good Christmas fun?" / Epstein: "Woody Allen at my house for a week" / Kronprinsessen: "well that must have been a neurotic expereince for the two of you ;)"
- 2014-01-28: Epstein: "spoke to boris, glad to hear you are feeling better"
- 2014-02-06: Epstein: "I think you and Ariane will really get along. you share many interests"
- 2014-03-30: Epstein to Boris Nikolic and Kronprinsessen: "origins institute tempe arizona. violence humanity"
- 2014-05-17: Epstein: "happy national day, hope you are well"
- 2014-06-05: Epstein: "do i get to see you in ny?" / 2014-06-06: Kronprinsessen: "Think tuesday will work"
- 2014-06-09: Epstein: "well?"
- 2014-06-14: Epstein: "didn't get to see you?" / Kronprinsessen: "Call me"
- 2014-06-15: Epstein: "when you have time we can continue the conversation" / Kronprinsessen: "Tomorrow works for me"
- 2014-06-16: Epstein: "i tried same number as yesterday" / "please send number" / Kronprinsessen: "Wherever u r awake"
- 2014-06-21: Epstein: "we didn't finish conversation"
- 2014-06-23: Epstein: "??"

KEY PEOPLE MENTIONED:
- Boris Nikolic: Mutual friend, mentioned frequently, had eye surgery in 2013
- Lesley Groff: Epstein's assistant who coordinated meetings
- Ariane: Someone Epstein thought Kronprinsessen would get along with
- Woody Allen: Stayed at Epstein's house

MEETING LOCATIONS:
- 9 East 71st Street (Epstein's NYC townhouse)
- Paris (multiple references)
- Epstein's island (mentioned by Boris Nikolic)

TOPICS DISCUSSED:
- Health issues (prolapsed discs, broken ribs, general wellbeing)
- Book recommendations (Pale Fire, The Financier, Gone with the Wind, Catch 22, The Heart is a Lonely Hunter, Stendhal)
- Travel plans between Norway, NYC, Paris
- Family (Kronprinsessen's children including Ingrid)
- Interior design (discussing designers for projects)

Svar kort og faktabasert. Siter alltid den eksakte teksten frå meldingane og inkluder lenkje til kjelda: ${NOTION_DB_URL}

Om du ikkje finn svaret i dataa, sei det. Svar alltid på norsk.`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'google/gemini-2.0-flash',
    system: KNOWLEDGE_BASE,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
