// Lightweight NLP utilities implemented fully in-browser (no external NLP deps).
// Covers tokenization, normalization, stop-word removal, lemmatization (rule-based),
// keyword extraction via term frequency, and n-gram generation.

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'shall', 'to', 'of', 'in', 'on', 'at',
  'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's',
  't', 'just', 'don', 'now', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he',
  'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what',
  'which', 'who', 'this', 'that', 'these', 'those', 'am', 'as', 'if', 'because',
  'while', 'also', 'using', 'used', 'use', 'using', 'able', 'etc', 'eg', 'ie',
  'including', 'include', 'included', 'within', 'across', 'upon', 'towards',
  'responsible', 'responsibilities', 'role', 'roles', 'team', 'teams', 'work',
  'working', 'worked', 'experience', 'experiences', 'year', 'years', 'month',
  'months', 'developer', 'engineer', 'development', 'developed', 'developing',
]);

// Rule-based lemmatization suffix rules.
const LEMMA_RULES: [RegExp, string][] = [
  [/ies$/i, 'y'],
  [/ied$/i, 'y'],
  [/ying$/i, 'y'],
  [/ying$/i, 'ie'],
  [/(.+)ies$/i, '$1y'],
  [/ous$/i, ''],
  [/(.+e)s$/i, '$1'],
  [/s$/i, ''],
  [/ing$/i, ''],
  [/ed$/i, ''],
  [/ly$/i, ''],
];

function lemmatize(word: string): string {
  const lower = word.toLowerCase();
  if (lower.length <= 3) return lower;
  for (const [pattern, replacement] of LEMMA_RULES) {
    if (pattern.test(lower)) {
      return lower.replace(pattern, replacement);
    }
  }
  return lower;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((t) => !STOP_WORDS.has(t));
}

export function lemmatizeTokens(tokens: string[]): string[] {
  return tokens.map(lemmatize);
}

export function preprocess(text: string): string[] {
  return lemmatizeTokens(removeStopWords(tokenize(text)));
}

// Extract candidate keywords using term frequency with n-gram support.
export function extractKeywords(text: string, topN = 30): string[] {
  const tokens = tokenize(text);
  const meaningful = removeStopWords(tokens);
  const freq = new Map<string, number>();

  // Unigrams
  for (const token of meaningful) {
    const lemma = lemmatize(token);
    freq.set(lemma, (freq.get(lemma) ?? 0) + 1);
  }

  // Bigrams
  for (let i = 0; i < meaningful.length - 1; i++) {
    const pair = `${lemmatize(meaningful[i])} ${lemmatize(meaningful[i + 1])}`;
    freq.set(pair, (freq.get(pair) ?? 0) + 2);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

// Bag-of-words vector for cosine similarity.
export function buildBagOfWords(text: string): Map<string, number> {
  const tokens = preprocess(text);
  const vec = new Map<string, number>();
  for (const t of tokens) {
    vec.set(t, (vec.get(t) ?? 0) + 1);
  }
  return vec;
}
