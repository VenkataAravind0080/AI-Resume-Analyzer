// Core type definitions for the AI Resume Analyzer engine.

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  gpa: string;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  date: string;
}

export interface ParsedResume {
  personalInfo: PersonalInfo;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  achievements: string[];
  rawText: string;
  sections: { heading: string; content: string }[];
}

export interface CategoryScore {
  score: number;
  weight: number;
  maxScore: number;
  details: string;
}

export interface ScoreBreakdown {
  skillAlignment: CategoryScore;
  education: CategoryScore;
  certifications: CategoryScore;
  experience: CategoryScore;
  projects: CategoryScore;
  keywordOptimization: CategoryScore;
  completeness: CategoryScore;
  formatting: CategoryScore;
  semanticRelevance: CategoryScore;
}

export interface Recommendation {
  type: 'skill' | 'certification' | 'project' | 'action-verb' | 'achievement' | 'summary' | 'formatting' | 'keyword';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface InterviewQuestion {
  question: string;
  category: string;
  sampleAnswer: string;
}

export interface AnalysisResult {
  atsScore: number;
  categoryScores: ScoreBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  semanticSimilarity: number;
  keywordsFound: string[];
  keywordsMissing: string[];
  recommendations: Recommendation[];
  interviewQuestions: InterviewQuestion[];
  parsedResume: ParsedResume;
}

export type CareerDomain =
  | 'software-engineering'
  | 'data-science'
  | 'devops-cloud'
  | 'cybersecurity'
  | 'ai-ml'
  | 'general';

export interface SkillCategory {
  name: string;
  skills: string[];
}
