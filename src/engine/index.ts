// Public API for the analysis engine — single entry point used by the UI layer.
export { parseResume } from './resumeParser';
export { runFullAnalysis } from './scoring';
export { validateFile, parseFile, detectSkills } from './fileParser';
export { computeSemanticSimilarity, cosineSimilarity } from './semantic';
export { extractKeywords, preprocess, tokenize } from './nlp';
export {
  SKILL_CATEGORIES,
  ALL_TECHNICAL_SKILLS,
  DOMAIN_CERTIFICATIONS,
  DOMAIN_TECH_STACKS,
  normalizeSkill,
} from './skillsDatabase';
export type * from './types';
