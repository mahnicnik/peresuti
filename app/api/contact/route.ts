import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendOwnerContactEmail } from '@/lib/owner-email'
import { emailConfigured } from '@/lib/email'

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional().default(''),
  message: z.string().trim().min(3).max(3000),
  website: z.string().optional().default(''), // past za spam
})

// Preprosta omejitev: največ 5 sporočil na IP v 10 minutah (na instanco)
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000)
  arr.push(now)
  hits.set(ip, arr)
  return arr.length > 5
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Izpolnite ime, veljaven e-poštni naslov in vprašanje.' }, { status: 400 })
  }
  const body = parsed.data
  if (body.website) return NextResponse.json({ ok: true }) // bot

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (limited(ip)) {
    return NextResponse.json({ error: 'Preveč sporočil. Poskusite čez nekaj minut.' }, { status: 429 })
  }
  if (!emailConfigured()) {
    return NextResponse.json({ error: 'Pošiljanje trenutno ni mogoče — pokličite nas na 040 832 040.' }, { status: 503 })
  }
  const ok = await sendOwnerContactEmail(body)
  if (!ok) {
    return NextResponse.json({ error: 'Pošiljanje ni uspelo — pokličite nas na 040 832 040.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
