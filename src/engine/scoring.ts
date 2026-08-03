// ATS Compatibility Scoring engine.
// Computes a weighted 0-100 score across nine categories and returns a full
// breakdown so the UI can show exactly how each category contributed.

import type {
  ParsedResume,
  ScoreBreakdown,
  CategoryScore,
  AnalysisResult,
  Recommendation,
  InterviewQuestion,
  CareerDomain,
} from './types';
import { computeSemanticSimilarity } from './semantic';
import { detectSkills } from './fileParser';
import { extractKeywords } from './nlp';
import { DOMAIN_CERTIFICATIONS, DOMAIN_TECH_STACKS } from './skillsDatabase';

const WEIGHTS = {
  skillAlignment: 0.22,
  semanticRelevance: 0.18,
  keywordOptimization: 0.14,
  experience: 0.13,
  projects: 0.09,
  completeness: 0.09,
  education: 0.07,
  certifications: 0.05,
  formatting: 0.03,
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function scoreSkillAlignment(
  resumeSkills: string[],
  jobSkills: string[]
): CategoryScore {
  const resumeSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const matched: string[] = [];
  for (const skill of jobSkills) {
    if (resumeSet.has(skill.toLowerCase())) matched.push(skill);
  }
  const coverage = jobSkills.length === 0 ? 50 : (matched.length / jobSkills.length) * 100;
  const score = clamp(coverage);
  return {
    score: Math.round(score),
    weight: WEIGHTS.skillAlignment,
    maxScore: 100,
    details: `Matched ${matched.length} of ${jobSkills.length} required skills (${Math.round(coverage)}% coverage).`,
  };
}

export function scoreSemanticRelevance(resumeText: string, jobText: string): CategoryScore {
  const result = computeSemanticSimilarity(resumeText, jobText);
  return {
    score: result.score,
    weight: WEIGHTS.semanticRelevance,
    maxScore: 100,
    details: `TF-IDF cosine similarity between resume and job description is ${result.score}%.`,
  };
}

export function scoreKeywordOptimization(resumeText: string, jobText: string): CategoryScore {
  const resumeKeywords = new Set(extractKeywords(resumeText, 40));
  const jobKeywords = extractKeywords(jobText, 40);
  const matched = jobKeywords.filter((k) => resumeKeywords.has(k));
  const coverage = jobKeywords.length === 0 ? 50 : (matched.length / jobKeywords.length) * 100;
  return {
    score: Math.round(clamp(coverage)),
    weight: WEIGHTS.keywordOptimization,
    maxScore: 100,
    details: `Resume covers ${matched.length} of ${jobKeywords.length} key job-description terms.`,
  };
}

export function scoreExperience(experience: ParsedResume['experience']): CategoryScore {
  if (experience.length === 0) {
    return { score: 0, weight: WEIGHTS.experience, maxScore: 100, details: 'No work experience entries detected.' };
  }
  // Estimate years of experience from date ranges.
  let years = 0;
  const yearPattern = /((?:19|20)\d{2})\s*[-–to ]+\s*((?:19|20)\d{2}|present|current)/i;
  for (const exp of experience) {
    const m = `${exp.startDate} ${exp.endDate}`.match(yearPattern);
    if (m) {
      const start = parseInt(m[1], 10);
      const end = m[2].toLowerCase() === 'present' || m[2].toLowerCase() === 'current'
        ? new Date().getFullYear()
        : parseInt(m[2], 10);
      if (end >= start) years += end - start;
    }
  }
  const expScore = clamp(30 + years * 14);
  const descBonus = experience.filter((e) => e.description.length > 50).length > 0 ? 10 : 0;
  const score = clamp(expScore + descBonus);
  return {
    score: Math.round(score),
    weight: WEIGHTS.experience,
    maxScore: 100,
    details: `Detected ~${years} years across ${experience.length} role(s). Descriptions ${descBonus > 0 ? 'are' : 'should be'} detailed.`,
  };
}

export function scoreProjects(projects: ParsedResume['projects'], jobSkills: string[]): CategoryScore {
  if (projects.length === 0) {
    return { score: 20, weight: WEIGHTS.projects, maxScore: 100, details: 'No projects detected. Add relevant projects to strengthen your resume.' };
  }
  let relevancePoints = 0;
  const jobSet = new Set(jobSkills.map((s) => s.toLowerCase()));
  for (const proj of projects) {
    const overlap = proj.technologies.filter((t) => jobSet.has(t.toLowerCase())).length;
    relevancePoints += Math.min(overlap * 10, 25);
  }
  const countScore = Math.min(projects.length * 20, 60);
  const score = clamp(countScore + Math.min(relevancePoints, 40));
  return {
    score: Math.round(score),
    weight: WEIGHTS.projects,
    maxScore: 100,
    details: `${projects.length} project(s) detected with ${Math.round(Math.min(relevancePoints, 40))} relevance points to the job.`,
  };
}

export function scoreCompleteness(resume: ParsedResume): CategoryScore {
  const checks = [
    { label: 'name', has: resume.personalInfo.name.length > 0 },
    { label: 'email', has: resume.personalInfo.email.length > 0 },
    { label: 'phone', has: resume.personalInfo.phone.length > 0 },
    { label: 'summary', has: resume.summary.length > 30 },
    { label: 'skills', has: resume.skills.length >= 5 },
    { label: 'experience', has: resume.experience.length > 0 },
    { label: 'education', has: resume.education.length > 0 },
    { label: 'projects', has: resume.projects.length > 0 },
    { label: 'certifications', has: resume.certifications.length > 0 },
  ];
  const filled = checks.filter((c) => c.has).length;
  const score = Math.round((filled / checks.length) * 100);
  const missing = checks.filter((c) => !c.has).map((c) => c.label);
  return {
    score,
    weight: WEIGHTS.completeness,
    maxScore: 100,
    details: `${filled}/${checks.length} sections present${missing.length ? `; missing: ${missing.join(', ')}` : '.'}`,
  };
}

export function scoreEducation(education: ParsedResume['education']): CategoryScore {
  if (education.length === 0) {
    return { score: 30, weight: WEIGHTS.education, maxScore: 100, details: 'No education entries detected.' };
  }
  const hasDegree = education.some((e) => /b\.?tech|b\.?e|bachelor|master|m\.?tech|m\.?sc|ph\.?d/i.test(e.degree));
  const hasGpa = education.some((e) => e.gpa.length > 0);
  let score = 50 + education.length * 10;
  if (hasDegree) score += 20;
  if (hasGpa) score += 10;
  return {
    score: Math.round(clamp(score)),
    weight: WEIGHTS.education,
    maxScore: 100,
    details: `${education.length} education entr(ies). Degree detected: ${hasDegree}. GPA included: ${hasGpa}.`,
  };
}

export function scoreCertifications(
  certs: ParsedResume['certifications'],
  domain: CareerDomain
): CategoryScore {
  if (certs.length === 0) {
    return { score: 25, weight: WEIGHTS.certifications, maxScore: 100, details: 'No certifications detected.' };
  }
  const recommended = domain !== 'general' ? DOMAIN_CERTIFICATIONS[domain] : [];
  const certLower = certs.map((c) => c.name.toLowerCase());
  const aligned = recommended.filter((r) => certLower.some((c) => c.includes(r.toLowerCase().split(':')[0])));
  let score = 40 + certs.length * 12;
  if (aligned.length > 0) score += 20;
  return {
    score: Math.round(clamp(score)),
    weight: WEIGHTS.certifications,
    maxScore: 100,
    details: `${certs.length} certification(s) detected${aligned.length ? `, ${aligned.length} domain-aligned` : '.'}`,
  };
}

export function scoreFormatting(resume: ParsedResume): CategoryScore {
  const text = resume.rawText;
  const checks = [
    { label: 'reasonable length', has: text.length > 200 && text.length < 12000 },
    { label: 'section headings', has: resume.sections.length >= 3 },
    { label: 'bullet points', has: /•|\*|·|✓|-/.test(text) },
    { label: 'consistent dates', has: /(\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))/i.test(text) },
    { label: 'contact info block', has: resume.personalInfo.email.length > 0 },
  ];
  const passed = checks.filter((c) => c.has).length;
  const score = Math.round((passed / checks.length) * 100);
  const failed = checks.filter((c) => !c.has).map((c) => c.label);
  return {
    score,
    weight: WEIGHTS.formatting,
    maxScore: 100,
    details: `${passed}/${checks.length} formatting checks passed${failed.length ? `; review: ${failed.join(', ')}` : '.'}`,
  };
}

export function calculateAtsScore(breakdown: ScoreBreakdown): number {
  const total = Object.values(breakdown).reduce(
    (sum, cat) => sum + cat.score * cat.weight,
    0
  );
  return Math.round(clamp(total));
}

export function computeScoreBreakdown(
  resume: ParsedResume,
  jobDescription: string,
  domain: CareerDomain
): ScoreBreakdown {
  const jobSkills = detectSkills(jobDescription);
  const jobKeywords = extractKeywords(jobDescription, 40);
  const resumeKeywords = extractKeywords(resume.rawText, 40);

  return {
    skillAlignment: scoreSkillAlignment(resume.skills, jobSkills),
    semanticRelevance: scoreSemanticRelevance(resume.rawText, jobDescription),
    keywordOptimization: scoreKeywordOptimization(resume.rawText, jobDescription),
    experience: scoreExperience(resume.experience),
    projects: scoreProjects(resume.projects, jobSkills),
    completeness: scoreCompleteness(resume),
    education: scoreEducation(resume.education),
    certifications: scoreCertifications(resume.certifications, domain),
    formatting: scoreFormatting(resume),
  };
}

export function getMatchedAndMissingSkills(resumeSkills: string[], jobDescription: string) {
  const jobSkills = detectSkills(jobDescription);
  const resumeSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const matched = jobSkills.filter((s) => resumeSet.has(s.toLowerCase()));
  const missing = jobSkills.filter((s) => !resumeSet.has(s.toLowerCase()));
  return { matched, missing, jobSkills };
}

export function getKeywordCoverage(resumeText: string, jobDescription: string) {
  const resumeSet = new Set(extractKeywords(resumeText, 40));
  const jobKeywords = extractKeywords(jobDescription, 40);
  const found = jobKeywords.filter((k) => resumeSet.has(k));
  const missing = jobKeywords.filter((k) => !resumeSet.has(k));
  return { found, missing };
}

export function generateRecommendations(
  resume: ParsedResume,
  breakdown: ScoreBreakdown,
  missingSkills: string[],
  domain: CareerDomain
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Missing skills
  for (const skill of missingSkills.slice(0, 8)) {
    recs.push({
      type: 'skill',
      title: `Add the skill: ${skill}`,
      description: `This skill is explicitly mentioned in the job description but is missing from your resume. Adding it — even via a relevant project or course — will improve both ATS keyword matching and recruiter evaluation.`,
      priority: 'high',
    });
  }

  // Domain-recommended technologies
  if (domain !== 'general') {
    const recommended = DOMAIN_TECH_STACKS[domain];
    const resumeSet = new Set(resume.skills.map((s) => s.toLowerCase()));
    const missingDomain = recommended.filter((s) => !resumeSet.has(s.toLowerCase()));
    for (const skill of missingDomain.slice(0, 4)) {
      recs.push({
        type: 'skill',
        title: `Strengthen ${domain.replace(/-/g, ' ')} stack with ${skill}`,
        description: `${skill} is a core technology for ${domain.replace(/-/g, ' ')} roles. Including it signals domain competence to both ATS and hiring managers.`,
        priority: 'medium',
      });
    }
  }

  // Certifications
  if (domain !== 'general') {
    const haveCerts = resume.certifications.map((c) => c.name.toLowerCase());
    const suggested = DOMAIN_CERTIFICATIONS[domain].filter(
      (c) => !haveCerts.some((h) => h.includes(c.toLowerCase().split(':')[0]))
    );
    for (const cert of suggested.slice(0, 3)) {
      recs.push({
        type: 'certification',
        title: `Earn: ${cert}`,
        description: `This industry-recognized certification validates your ${domain.replace(/-/g, ' ')} expertise and is frequently listed as a preferred qualification in job postings.`,
        priority: 'medium',
      });
    }
  }

  // Summary
  if (resume.summary.length < 30) {
    recs.push({
      type: 'summary',
      title: 'Add a professional summary',
      description: 'A 2-3 line summary at the top of your resume gives recruiters and ATS an instant picture of your profile. Lead with your years of experience, core stack, and target role.',
      priority: 'high',
    });
  }

  // Action verbs
  if (resume.experience.length > 0) {
    const weakVerbs = ['responsible for', 'duties included', 'worked on', 'helped with', 'in charge of'];
    const hasWeak = weakVerbs.some((v) => resume.rawText.toLowerCase().includes(v));
    if (hasWeak) {
      recs.push({
        type: 'action-verb',
        title: 'Replace weak phrasing with strong action verbs',
        description: 'Phrases like "responsible for" are passive and dilute impact. Use strong verbs such as Led, Built, Architected, Optimized, Delivered, Spearheaded — they make contributions concrete and ATS-friendly.',
        priority: 'high',
      });
    }
  }

  // Quantified achievements
  const hasNumbers = /\d+%|\$\d+|\d+x|\d+ users|\d+ projects|\d+ servers|\d+ requests/i.test(resume.rawText);
  if (!hasNumbers && resume.experience.length > 0) {
    recs.push({
      type: 'achievement',
      title: 'Quantify your achievements',
      description: 'Add metrics to your experience bullets — "reduced latency by 40%", "served 1M+ requests/day". Numbers provide concrete evidence of impact and stand out to both ATS keyword filters and recruiters.',
      priority: 'high',
    });
  }

  // Projects
  if (resume.projects.length === 0) {
    recs.push({
      type: 'project',
      title: 'Add at least 2 relevant projects',
      description: 'Projects demonstrate applied skills. Add projects that use the technologies in the job description, with a one-line description of the problem, your role, and the outcome.',
      priority: 'medium',
    });
  }

  // Formatting
  if (breakdown.formatting.score < 70) {
    recs.push({
      type: 'formatting',
      title: 'Improve resume formatting',
      description: 'Use clear section headings (Experience, Education, Skills), consistent date formats, and bullet points. ATS parsers read structured text more accurately, and recruiters scan faster.',
      priority: 'low',
    });
  }

  // Keywords
  if (breakdown.keywordOptimization.score < 60) {
    recs.push({
      type: 'keyword',
      title: 'Incorporate more job-description keywords',
      description: 'Mirror the terminology used in the job description naturally in your experience and skills sections. ATS systems weight keyword frequency and placement heavily.',
      priority: 'high',
    });
  }

  // Experience descriptions
  if (resume.experience.some((e) => e.description.length < 50)) {
    recs.push({
      type: 'action-verb',
      title: 'Expand thin experience descriptions',
      description: 'Each role should have 3-5 bullet points describing what you built, the technologies used, and the measurable impact. Thin descriptions reduce both semantic relevance and recruiter signal.',
      priority: 'medium',
    });
  }

  // Sort by priority
  const order = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}

const QUESTION_TEMPLATES: Record<string, (role: string) => string> = {
  technical: (role) => `Walk me through how you would design a scalable ${role} system from scratch. What trade-offs would you consider?`,
  behavioral: (_role) => `Tell me about a time you faced a significant technical challenge. What was the problem, how did you approach it, and what was the outcome?`,
  experience: (role) => `Which project on your resume best prepared you for this ${role} role, and why?`,
  skills: (role) => `How have you applied the key technologies required for this ${role} position in a real project?`,
};

export function generateInterviewQuestions(
  resume: ParsedResume,
  jobDescription: string,
  domain: CareerDomain
): InterviewQuestion[] {
  const role = jobDescription.match(/(?:for|as)\s+(?:a\s+|an\s+)?([A-Z][a-zA-Z\s]+)/)?.[1]
    || domain !== 'general' ? domain.replace(/-/g, ' ') : 'the role';
  const cleanRole = role.slice(0, 40);

  const questions: InterviewQuestion[] = [
    {
      question: QUESTION_TEMPLATES.technical(cleanRole),
      category: 'Technical',
      sampleAnswer: `Start by clarifying requirements (scale, latency, consistency). Then walk through data model, API design, infrastructure (e.g. load balancers, caching, database choice), and discuss trade-offs like consistency vs. availability. Close with monitoring and failure handling.`,
    },
    {
      question: QUESTION_TEMPLATES.behavioral(cleanRole),
      category: 'Behavioral',
      sampleAnswer: `Use the STAR framework: describe the Situation, the Task you owned, the Action you took, and the measurable Result. Emphasize your individual contribution and what you learned.`,
    },
    {
      question: QUESTION_TEMPLATES.experience(cleanRole),
      category: 'Experience',
      sampleAnswer: `Pick the project most relevant to the job description. Describe the problem, your specific role, the stack you used, and a quantified outcome. Tie it back to a requirement from the job posting.`,
    },
    {
      question: QUESTION_TEMPLATES.skills(cleanRole),
      category: 'Skills',
      sampleAnswer: `For each key technology, give a concrete example: the project, the problem it solved, and a metric that shows impact. Avoid listing technologies without context.`,
    },
  ];

  // Add skill-specific question if we have matched skills
  if (resume.skills.length > 0) {
    const topSkill = resume.skills[0];
    questions.push({
      question: `Describe a production issue you debugged involving ${topSkill}. How did you diagnose and resolve it?`,
      category: 'Technical',
      sampleAnswer: `Explain the symptom, your diagnostic process (logs, metrics, reproduction), the root cause, the fix, and any preventive measure you added afterward (tests, alerts, docs).`,
    });
  }

  return questions;
}

export function runFullAnalysis(
  resume: ParsedResume,
  jobDescription: string,
  domain: CareerDomain
): AnalysisResult {
  const breakdown = computeScoreBreakdown(resume, jobDescription, domain);
  const atsScore = calculateAtsScore(breakdown);
  const { matched, missing } = getMatchedAndMissingSkills(resume.skills, jobDescription);
  const { found, missing: missingKeywords } = getKeywordCoverage(resume.rawText, jobDescription);
  const semantic = computeSemanticSimilarity(resume.rawText, jobDescription);
  const recommendations = generateRecommendations(resume, breakdown, missing, domain);
  const interviewQuestions = generateInterviewQuestions(resume, jobDescription, domain);

  return {
    atsScore,
    categoryScores: breakdown,
    matchedSkills: matched,
    missingSkills: missing,
    semanticSimilarity: semantic.score,
    keywordsFound: found,
    keywordsMissing: missingKeywords,
    recommendations,
    interviewQuestions,
    parsedResume: resume,
  };
}
