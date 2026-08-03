// AI service — calls the Gemini edge function when an API key is configured.
// Falls back to local algorithms when the key is absent so core functionality
// (analysis, scoring, recommendations) keeps working without the LLM.

import { supabase } from './supabase';
import type { ParsedResume, AnalysisResult, CareerDomain } from '@/engine/types';

export interface AIEnhancement {
  summary: string;
  rewrittenBullets: { original: string; improved: string }[];
  coverLetter: string;
  learningRoadmap: { skill: string; reason: string; resource: string }[];
  available: boolean;
}

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

export async function checkAIAvailability(): Promise<boolean> {
  try {
    const res = await fetch(`${EDGE_URL}?probe=true`, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.available === true;
  } catch {
    return false;
  }
}

export async function getAIEnhancement(
  resume: ParsedResume,
  jobDescription: string,
  domain: CareerDomain,
  analysis: AnalysisResult
): Promise<AIEnhancement> {
  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume,
        jobDescription,
        domain,
        missingSkills: analysis.missingSkills,
        atsScore: analysis.atsScore,
      }),
    });

    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = await res.json();
    if (!data.summary && !data.coverLetter) throw new Error('Invalid AI response');

    return {
      summary: data.summary ?? '',
      rewrittenBullets: data.rewrittenBullets ?? [],
      coverLetter: data.coverLetter ?? '',
      learningRoadmap: data.learningRoadmap ?? [],
      available: true,
    };
  } catch {
    // Graceful local fallback
    return localEnhancement(resume, jobDescription, domain, analysis);
  }
}

function localEnhancement(
  resume: ParsedResume,
  jobDescription: string,
  domain: CareerDomain,
  analysis: AnalysisResult
): AIEnhancement {
  const name = resume.personalInfo.name || 'the candidate';
  const topSkills = resume.skills.slice(0, 5).join(', ');
  const yearsExp = resume.experience.length;
  const domainLabel = domain !== 'general' ? domain.replace(/-/g, ' ') : 'technology';

  const summary = `${yearsExp > 0 ? `${yearsExp}+ year${yearsExp > 1 ? 's' : ''}` : 'Results-driven'} ${domainLabel} professional with expertise in ${topSkills || 'modern technologies'}. Proven track record of building scalable solutions and delivering measurable impact. Seeking to leverage technical skills to drive innovation and growth.`;

  const rewrittenBullets = resume.experience.slice(0, 3).map((exp) => ({
    original: exp.description || exp.title,
    improved: strengthenBullet(exp.description || exp.title),
  }));

  const coverLetter = `Dear Hiring Manager,

I am excited to apply for the ${domainLabel} position. With ${yearsExp > 0 ? `${yearsExp}+ year${yearsExp > 1 ? 's' : ''} of` : ''} experience in ${topSkills || 'software development'}, I am confident my skills in ${analysis.matchedSkills.slice(0, 3).join(', ') || 'key technologies'} align well with your requirements.

Throughout my career I have ${resume.achievements[0]?.toLowerCase() ?? 'delivered high-impact projects that drove measurable results'}. I am particularly drawn to this role because it offers the opportunity to ${jobDescription.slice(0, 80).trim()}...

I would welcome the chance to discuss how my background can contribute to your team.

Sincerely,
${name}`;

  const learningRoadmap = analysis.missingSkills.slice(0, 5).map((skill) => ({
    skill,
    reason: `Listed in the job description but not on your resume.`,
    resource: `Search for a hands-on ${skill} tutorial on freeCodeCamp, YouTube, or the official documentation, then build a small project to apply it.`,
  }));

  return { summary, rewrittenBullets, coverLetter, learningRoadmap, available: false };
}

function strengthenBullet(text: string): string {
  const weak: [RegExp, string][] = [
    [/responsible for/gi, 'Owned'],
    [/worked on/gi, 'Built'],
    [/helped with/gi, 'Drove'],
    [/in charge of/gi, 'Led'],
    [/duties included/gi, 'Delivered'],
    [/was tasked with/gi, 'Executed'],
  ];
  let improved = text;
  for (const [pattern, replacement] of weak) {
    improved = improved.replace(pattern, replacement);
  }
  if (!/\d/.test(improved) && improved.length > 20) {
    improved += ' achieving measurable results.';
  }
  return improved.charAt(0).toUpperCase() + improved.slice(1);
}
