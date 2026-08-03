// Resume structure parser — extracts structured information from raw resume text.
// Uses section detection + regex patterns to identify personal info, education,
// experience, skills, projects, certifications, and achievements.

import type {
  ParsedResume,
  PersonalInfo,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  CertificationEntry,
} from './types';
import { detectSkills } from './fileParser';

const SECTION_PATTERNS: [string, RegExp][] = [
  ['summary', /(?:professional\s+summary|summary|objective|profile|about\s+me)\b/i],
  ['experience', /(?:work\s+experience|professional\s+experience|experience|employment\s+history|work\s+history)\b/i],
  ['education', /(?:education|academic\s+background|qualifications)\b/i],
  ['skills', /(?:technical\s+skills|skills|core\s+competencies|technologies|tech\s+stack)\b/i],
  ['projects', /(?:projects|personal\s+projects|key\s+projects|academic\s+projects)\b/i],
  ['certifications', /(?:certifications|certificates|licenses|courses)\b/i],
  ['achievements', /(?:achievements|accomplishments|awards|honors|honours)\b/i],
];

function splitSections(text: string): { heading: string; content: string }[] {
  const lines = text.split(/\n+/);
  const sections: { heading: string; content: string }[] = [];
  let currentHeading = 'Header';
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const matched = SECTION_PATTERNS.find(([, pattern]) => pattern.test(trimmed));
    if (matched && trimmed.length < 60) {
      if (currentContent.length > 0) {
        sections.push({ heading: currentHeading, content: currentContent.join('\n') });
      }
      currentHeading = matched[0];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentContent.length > 0) {
    sections.push({ heading: currentHeading, content: currentContent.join('\n') });
  }
  return sections;
}

function extractPersonalInfo(text: string): PersonalInfo {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const phoneMatch = text.match(/(\+?\d[\d\s().-]{8,}\d)/);
  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin:\s*)[\w-]+/i);
  const githubMatch = text.match(/(?:github\.com\/|github:\s*)[\w-]+/i);
  const websiteMatch = text.match(/https?:\/\/(?!.*linkedin)(?!.*github)[\w.-]+\.[a-z]{2,}[^\s]*/i);

  const lines = text.split(/\n+/).filter((l) => l.trim());
  const name = lines[0]?.trim() || '';
  const locationMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2,3})/);

  return {
    name: name.slice(0, 80),
    email: emailMatch?.[0] ?? '',
    phone: phoneMatch?.[0] ?? '',
    location: locationMatch?.[0] ?? '',
    links: [linkedinMatch?.[0], githubMatch?.[0], websiteMatch?.[0]].filter(Boolean) as string[],
  };
}

function extractEducation(content: string): EducationEntry[] {
  const entries: EducationEntry[] = [];
  const lines = content.split(/\n+/).filter((l) => l.trim());
  const degreePattern = /(?:B\.?Tech|B\.?E\.?|B\.?Sc|M\.?Tech|M\.?E\.?|M\.?Sc|MBA|B\.?A|M\.?A|Ph\.?D|Diploma|Associate|Bachelor|Master)/i;
  const yearPattern = /(\b(?:19|20)\d{2}\b)(?:\s*[-–to ]+\s*(\b(?:19|20)\d{2}\b|\bpresent\b|\bcurrent\b))?/i;

  for (const line of lines) {
    const degreeMatch = line.match(degreePattern);
    const yearMatch = line.match(yearPattern);
    if (degreeMatch || yearMatch) {
      const institution = line.split(/[,|]/).pop()?.trim() || line;
      entries.push({
        institution: institution.slice(0, 100),
        degree: degreeMatch?.[0] ?? '',
        field: '',
        startYear: yearMatch?.[1] ?? '',
        endYear: yearMatch?.[2] ?? '',
        gpa: line.match(/(?:GPA|CGPA)[:\s]+([\d.]+\/?[\d.]*)/i)?.[1] ?? '',
      });
    }
  }
  return entries.slice(0, 8);
}

function extractExperience(content: string): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  const blocks = content.split(/\n{2,}/);
  const datePattern = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–to ]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current)/i;
  const titlePattern = /^(?:senior\s+|lead\s+|junior\s+|principal\s+)?([A-Z][a-zA-Z\s]+)\s*(?:at|@|,\s*|\s*[-–|])\s*([A-Z][\w\s&.,]+)/;

  for (const block of blocks) {
    const lines = block.split(/\n+/).filter((l) => l.trim());
    const firstLine = lines[0] || '';
    const titleMatch = firstLine.match(titlePattern);
    const dateMatch = block.match(datePattern);
    if (titleMatch || dateMatch) {
      const [_, title, company] = titleMatch || [firstLine, '', ''];
      const description = lines.slice(1).join(' ').slice(0, 500);
      entries.push({
        title: title?.trim() || firstLine.slice(0, 60),
        company: company?.trim() || '',
        startDate: dateMatch?.[1] ?? '',
        endDate: dateMatch?.[2] ?? '',
        description,
      });
    }
  }
  return entries.slice(0, 10);
}

function extractSkills(content: string, fullText: string): string[] {
  const sectionSkills = content
    .split(/[,;|•\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40);
  const detected = detectSkills(fullText);
  return [...new Set([...sectionSkills, ...detected])].slice(0, 60);
}

function extractProjects(content: string): ProjectEntry[] {
  const entries: ProjectEntry[] = [];
  const blocks = content.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split(/\n+/).filter((l) => l.trim());
    if (lines.length === 0) continue;
    const nameLine = lines[0];
    const techMatch = block.match(/(?:technologies?|tools?|tech\s+stack|built\s+with)[:\s]+([^\n]+)/i);
    const description = lines.slice(1).join(' ').slice(0, 400);
    entries.push({
      name: nameLine.slice(0, 80),
      description,
      technologies: techMatch?.[1].split(/[,;|]+/).map((t) => t.trim()).slice(0, 10) ?? [],
    });
  }
  return entries.slice(0, 10);
}

function extractCertifications(content: string): CertificationEntry[] {
  const entries: CertificationEntry[] = [];
  const lines = content.split(/\n+/).filter((l) => l.trim());
  const certPattern = /^(.+?)(?:\s*[-–|,]\s*(.+?))?(?:\s*[-–|,]\s*((?:19|20)\d{2}))?$/;
  for (const line of lines) {
    if (line.length > 5 && line.length < 120) {
      const m = line.match(certPattern);
      entries.push({
        name: m?.[1]?.trim() ?? line,
        issuer: m?.[2]?.trim() ?? '',
        date: m?.[3]?.trim() ?? '',
      });
    }
  }
  return entries.slice(0, 10);
}

function extractAchievements(content: string): string[] {
  return content
    .split(/[\n•·]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10)
    .slice(0, 10);
}

export function parseResume(rawText: string): ParsedResume {
  const sections = splitSections(rawText);
  const getSection = (name: string) =>
    sections.find((s) => s.heading.toLowerCase() === name)?.content ?? '';

  const fullText = rawText;
  const personalInfo = extractPersonalInfo(rawText);
  const summary = getSection('summary').slice(0, 500);
  const skills = extractSkills(getSection('skills'), fullText);

  return {
    personalInfo,
    summary,
    skills,
    experience: extractExperience(getSection('experience')),
    education: extractEducation(getSection('education')),
    projects: extractProjects(getSection('projects')),
    certifications: extractCertifications(getSection('certifications')),
    achievements: extractAchievements(getSection('achievements')),
    rawText,
    sections,
  };
}
