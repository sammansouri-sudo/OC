// Server-side call to Google Gemini. Your key stays private on the server.
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

export async function POST(req) {
  try {
    const { outcome, role, rolePurpose, expectations, companyObjectives, period } = await req.json();

    const prompt = `You are an exacting performance coach at a B2B SaaS company. An employee logged a business outcome. Evaluate it.

Employee role: ${role || "unspecified"}
Role purpose: ${rolePurpose || "unspecified"}
Their stated expectations: ${expectations || "none specified"}
Company objectives: ${companyObjectives || "none"}

The logged outcome: "${outcome}"
Period: ${period || "unspecified"}

Judge it on whether it states a SPECIFIC, MEASURABLE result tied to a dollar/business impact (not just activity). Be direct and concise.

Respond ONLY with raw JSON, no markdown, no backticks:
{"score": <integer 1-10>, "critique": "<1-2 sentences: is it specific & measurable, or vague activity?>", "alignment": "<1 sentence: how well it maps to this role's expectations>", "next_step": "<1 concrete next step>"}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1000 },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return Response.json({ error: "Gemini error: " + t.slice(0, 200) }, { status: 500 });
    }
    const data = await res.json();
    let text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    text = text.trim().replace(/```json|```/g, "").trim();
    return Response.json(JSON.parse(text));
  } catch (err) {
    return Response.json({ error: "Feedback failed: " + err.message }, { status: 500 });
  }
}
