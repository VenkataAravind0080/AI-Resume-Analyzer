// Document file parser — extracts plain text from PDF and DOCX files.
// Uses pdfjs-dist for PDF and mammoth for DOCX, both running in-browser.

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ALL_TECHNICAL_SKILLS } from './skillsDatabase';

// Worker import path for pdfjs. The Vite worker URL syntax keeps parsing off
// the main thread; we fall back to a no-worker config if it isn't available.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface ParsedFile {
  text: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt';
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File is too large. Maximum size is 10 MB.' };
  }
  const name = file.name.toLowerCase();
  const hasExt = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasType = ACCEPTED_TYPES.includes(file.type);
  if (!hasExt && !hasType) {
    return {
      valid: false,
      error: 'Unsupported format. Please upload a PDF, DOCX, or TXT file.',
    };
  }
  return { valid: true };
}

function detectType(fileName: string): 'pdf' | 'docx' | 'txt' {
  const name = fileName.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  return 'txt';
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const fileType = detectType(file.name);

  if (fileType === 'pdf') {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      text += pageText + '\n';
    }
    return { text: text.trim(), fileName: file.name, fileType };
  }

  if (fileType === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { text: result.value.trim(), fileName: file.name, fileType };
  }

  // Plain text
  const text = await file.text();
  return { text: text.trim(), fileName: file.name, fileType };
}

// Helper: detect skills present in a body of text.
export function detectSkills(text: string): string[] {
  const lower = text.toLowerCase();
  return ALL_TECHNICAL_SKILLS.filter((skill) => {
    const needle = skill.toLowerCase();
    // Match as whole word to avoid false positives (e.g. "C" inside "React").
    return new RegExp(`(^|[^a-z0-9])${escapeRegex(needle)}([^a-z0-9]|$)`, 'i').test(lower);
  });
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
