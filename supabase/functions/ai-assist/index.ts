import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface ParsedResume {
  personalInfo: { name: string; email: string };
  summary: string;
  skills: string[];
  experience: { title: string; company: string; description: string }[];
  projects: { name: string; description: string }[];
}

interface RequestBody {
  resume: ParsedResume;
  jobDescription: string;
  domain: string;
  missingSkills: string[];
  atsScore: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Probe endpoint — lets the frontend check whether the LLM is configured.
  if (req.method === "GET" || new URL(req.url).searchParams.get("probe") === "true") {
    return new Response(
      JSON.stringify({ available: GEMINI_API_KEY.length > 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI enhancement is not configured. Set GEMINI_API_KEY.", available: false }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: RequestBody = await req.json();

    const prompt = buildPrompt(body);
    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiRes.status}`, detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({ error: "Gemini returned non-JSON content", raw: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        summary: parsed.summary ?? "",
        rewrittenBullets: parsed.rewrittenBullets ?? [],
        coverLetter: parsed.coverLetter ?? "",
        learningRoadmap: parsed.learningRoadmap ?? [],
        available: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPrompt(body: RequestBody): string {
  const { resume, jobDescription, domain, missingSkills, atsScore } = body;
  const experienceText = resume.experience
    .map((e) => `- ${e.title} at ${e.company}: ${e.description}`)
    .join("\n");
  const projectsText = resume.projects
    .map((p) => `- ${p.name}: ${p.description}`)
    .join("\n");

  return `You are an expert career coach and resume writer. Analyze the following resume and job description, then return ONLY a valid JSON object (no markdown, no explanation) with these exact fields:

{
  "summary": "A polished 2-3 line professional summary",
  "rewrittenBullets": [{"original": "...", "improved": "stronger version with action verbs and metrics"}],
  "coverLetter": "A 3-paragraph cover letter",
  "learningRoadmap": [{"skill": "...", "reason": "...", "resource": "..."}]
}

CANDIDATE INFO:
Name: ${resume.personalInfo.name}
Domain: ${domain}
Skills: ${resume.skills.join(", ")}
ATS Score: ${atsScore}/100
Missing skills from JD: ${missingSkills.join(", ")}

EXPERIENCE:
${experienceText || "None listed"}

PROJECTS:
${projectsText || "None listed"}

JOB DESCRIPTION:
${jobDescription.slice(0, 1500)}

Return rewrittenBullets for up to 3 experience entries. For learningRoadmap, cover the top missing skills. Make every recommendation specific and actionable.`;
}
