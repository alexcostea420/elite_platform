import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const META_PROMPT = `Ești un prompt engineer specializat pe thumbnail-uri YouTube pentru o platformă românească de trading crypto numită "Armata de Traderi". Output-ul tău este un singur prompt în engleză pentru Gemini 2.5 Flash Image (Nano Banana) care să genereze un thumbnail YouTube 16:9.

Stil obligatoriu (Template B - Cinematic Impact):
- Single focal point (1 subiect principal: o monedă, un grafic, un laptop, un indicator etc.)
- 1 cuvânt mare și impactant pe thumbnail (ex: BULLISH?, BOTTOM?, BREAKOUT, FOMC, OVERSOLD)
- High contrast cinematic lighting, dramatic depth of field
- Brand: emerald accent (#10B981) pe pill "LIVE ELITE" sau "ELITE◆", footer text "ARMATA DE TRADERI"
- Date chip top-right (ex: "29 APR" sau "BTC")
- NO em-dash (—). Use middle dot (·) or slash (/) sau line break.
- Toate textele românești cu diacritice corecte: ă, â, î, ș, ț.
- Scenă realistă, nu cartoon. 4K, sharp.

Structură output (4 secțiuni):
SUBJECT: [subiect principal informat de rezumat]
LIGHTING: [cinematic, moody, with emerald rim light]
CAMERA: [16:9 YouTube thumbnail, shallow depth of field]
TEXT: [exactly what text appears, with positions]

Citește cu atenție rezumatul video-ului mai jos. Subiectul principal și cuvântul mare TREBUIE să reflecte conținutul real (ex: dacă rezumatul vorbește de RSI oversold → indicator RSI ca focal, cuvânt "OVERSOLD"; dacă e despre FOMC → ciocan/Fed building, cuvânt "FOMC").

TITLU VIDEO: {title}

REZUMAT:
{summary}

Output: doar promptul pentru Gemini Nano Banana, fără explicații înainte sau după. Începe direct cu "SUBJECT:".`;

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }

  const { data: video } = await supabase
    .from("videos")
    .select("title, summary")
    .eq("id", params.id)
    .maybeSingle();

  if (!video) {
    return NextResponse.json({ error: "Video inexistent." }, { status: 404 });
  }

  if (!video.summary) {
    return NextResponse.json({ error: "Video-ul nu are rezumat. Rulează Whisper întâi." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY lipsește în env." }, { status: 500 });
  }

  const filledPrompt = META_PROMPT.replace("{title}", video.title).replace("{summary}", video.summary);

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: filledPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
      }),
    },
  );

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    return NextResponse.json({ error: `Gemini API: ${errText.slice(0, 300)}` }, { status: 502 });
  }

  const data = await geminiRes.json();
  const generated: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generated) {
    return NextResponse.json({ error: "Gemini nu a returnat text." }, { status: 502 });
  }

  return NextResponse.json({ prompt: generated.trim(), title: video.title });
}
