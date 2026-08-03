// Semantic similarity analysis.
// Uses TF-IDF weighted cosine similarity as a lightweight, in-browser approach
// that approximates the contextual relevance comparison done by transformer-based
// embedding models. This avoids shipping a multi-MB model while still weighting
// domain-specific terms higher than common words.

import { preprocess } from './nlp';

export interface SimilarityResult {
  score: number; // 0-100
  resumeVector: Map<string, number>;
  jobVector: Map<string, number>;
  topTerms: { term: string; resumeWeight: number; jobWeight: number }[];
}

function termFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  return freq;
}

function buildTfIdfVector(
  tokens: string[],
  documentFreq: Map<string, number>,
  totalDocs: number
): Map<string, number> {
  const tf = termFrequency(tokens);
  const vector = new Map<string, number>();
  for (const [term, count] of tf) {
    const idf = Math.log((totalDocs + 1) / (documentFreq.get(term) ?? 0 + 1)) + 1;
    vector.set(term, (count / tokens.length) * idf);
  }
  return vector;
}

export function computeSemanticSimilarity(resumeText: string, jobText: string): SimilarityResult {
  const resumeTokens = preprocess(resumeText);
  const jobTokens = preprocess(jobText);

  // Build document frequency across the two "documents".
  const documentFreq = new Map<string, number>();
  const updateDf = (tokens: string[]) => {
    const seen = new Set<string>();
    for (const t of tokens) {
      if (!seen.has(t)) {
        documentFreq.set(t, (documentFreq.get(t) ?? 0) + 1);
        seen.add(t);
      }
    }
  };
  updateDf(resumeTokens);
  updateDf(jobTokens);

  const resumeVector = buildTfIdfVector(resumeTokens, documentFreq, 2);
  const jobVector = buildTfIdfVector(jobTokens, documentFreq, 2);

  const similarity = cosineSimilarity(resumeVector, jobVector);

  // Build top overlapping terms for the breakdown view.
  const allTerms = new Set([...resumeVector.keys(), ...jobVector.keys()]);
  const topTerms = [...allTerms]
    .filter((term) => resumeVector.has(term) && jobVector.has(term))
    .map((term) => ({
      term,
      resumeWeight: resumeVector.get(term) ?? 0,
      jobWeight: jobVector.get(term) ?? 0,
    }))
    .sort((a, b) => b.resumeWeight + b.jobWeight - (a.resumeWeight + a.jobWeight))
    .slice(0, 15);

  return {
    score: Math.round(similarity * 100),
    resumeVector,
    jobVector,
    topTerms,
  };
}

export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const [, val] of a) magA += val * val;
  for (const [, val] of b) magB += val * val;

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return 0;

  // Iterate the smaller vector for efficiency.
  const [smaller, larger] = a.size < b.size ? [a, b] : [b, a];
  for (const [term, val] of smaller) {
    const otherVal = larger.get(term);
    if (otherVal !== undefined) dot += val * otherVal;
  }

  return dot / (magA * magB);
}
