// PDF report generator — builds a downloadable analysis report using jsPDF.
import { jsPDF } from 'jspdf';
import type { AnalysisResult, CareerDomain } from '@/engine/types';
import type { AIEnhancement } from './aiService';

const COLORS = {
  primary: [37, 99, 235] as [number, number, number],
  dark: [17, 24, 39] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  light: [243, 244, 246] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
};

function scoreColor(score: number): [number, number, number] {
  if (score >= 75) return COLORS.green;
  if (score >= 50) return COLORS.amber;
  return COLORS.red;
}

export function generateReport(
  analysis: AnalysisResult,
  jobTitle: string,
  company: string,
  domain: CareerDomain,
  aiEnhancement?: AIEnhancement | null
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = 0;

  // Header band
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AI Resume Analyzer', margin, 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('ATS Compatibility & Career Analysis Report', margin, 58);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 74);
  y = 110;

  // ATS score circle
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Overall ATS Compatibility Score', margin, y);
  y += 20;
  const [r, g, b] = scoreColor(analysis.atsScore);
  doc.setFillColor(r, g, b);
  doc.roundedRect(margin, y, 70, 36, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(`${analysis.atsScore}`, margin + 18, y + 25);
  doc.setFontSize(10);
  doc.text('/ 100', margin + 50, y + 25);
  doc.setTextColor(...COLORS.gray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const rating =
    analysis.atsScore >= 75 ? 'Strong match' :
    analysis.atsScore >= 50 ? 'Moderate match — improvement needed' :
    'Weak match — significant gaps';
  doc.text(rating, margin + 90, y + 14);
  doc.text(`Semantic similarity: ${analysis.semanticSimilarity}%`, margin + 90, y + 30);
  y += 56;

  // Job info
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Target Position', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Role: ${jobTitle || 'Not specified'}`, margin, y);
  y += 14;
  doc.text(`Company: ${company || 'Not specified'}`, margin, y);
  y += 14;
  doc.text(`Career domain: ${domain.replace(/-/g, ' ')}`, margin, y);
  y += 24;

  // Category breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.text('Score Breakdown', margin, y);
  y += 18;
  const cats = analysis.categoryScores;
  const catLabels: [string, number, string][] = [
    ['Skill Alignment', cats.skillAlignment.score, cats.skillAlignment.details],
    ['Semantic Relevance', cats.semanticRelevance.score, cats.semanticRelevance.details],
    ['Keyword Optimization', cats.keywordOptimization.score, cats.keywordOptimization.details],
    ['Experience', cats.experience.score, cats.experience.details],
    ['Projects', cats.projects.score, cats.projects.details],
    ['Completeness', cats.completeness.score, cats.completeness.details],
    ['Education', cats.education.score, cats.education.details],
    ['Certifications', cats.certifications.score, cats.certifications.details],
    ['Formatting', cats.formatting.score, cats.formatting.details],
  ];
  for (const [label, score, details] of catLabels) {
    if (y > pageH - 60) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.dark);
    doc.text(label, margin, y);
    const [cr, cg, cb] = scoreColor(score);
    doc.setTextColor(cr, cg, cb);
    doc.text(`${score}/100`, margin + 150, y);
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin + 195, y - 8, 200, 10, 3, 3, 'F');
    doc.setFillColor(cr, cg, cb);
    doc.roundedRect(margin + 195, y - 8, (score / 100) * 200, 10, 3, 3, 'F');
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    const splitDetails = doc.splitTextToSize(details, pageW - margin * 2);
    doc.text(splitDetails, margin, y);
    y += splitDetails.length * 10 + 6;
  }
  y += 10;

  // Skills
  if (y > pageH - 80) { doc.addPage(); y = margin; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.text('Matched Skills', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.green);
  const matchedText = analysis.matchedSkills.length
    ? analysis.matchedSkills.join(', ')
    : 'None detected';
  y = writeWrapped(doc, matchedText, margin, y, pageW - margin * 2, 11) + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.text('Missing Skills', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.red);
  const missingText = analysis.missingSkills.length
    ? analysis.missingSkills.join(', ')
    : 'None — great coverage!';
  y = writeWrapped(doc, missingText, margin, y, pageW - margin * 2, 11) + 12;

  // Recommendations
  if (y > pageH - 80) { doc.addPage(); y = margin; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.text('Recommendations', margin, y);
  y += 18;
  for (const rec of analysis.recommendations.slice(0, 10)) {
    if (y > pageH - 60) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const pColor = rec.priority === 'high' ? COLORS.red : rec.priority === 'medium' ? COLORS.amber : COLORS.gray;
    doc.setTextColor(...pColor);
    doc.text(`[${rec.priority.toUpperCase()}]`, margin, y);
    doc.setTextColor(...COLORS.dark);
    doc.text(rec.title, margin + 55, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    const descLines = doc.splitTextToSize(rec.description, pageW - margin * 2 - 10);
    doc.text(descLines, margin + 10, y);
    y += descLines.length * 10 + 8;
  }

  // Interview questions
  if (y > pageH - 80) { doc.addPage(); y = margin; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.text('Interview Preparation', margin, y);
  y += 18;
  for (const q of analysis.interviewQuestions) {
    if (y > pageH - 80) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.text(`[${q.category}]`, margin, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    const qLines = doc.splitTextToSize(q.question, pageW - margin * 2);
    doc.text(qLines, margin, y);
    y += qLines.length * 11 + 4;
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    const aLines = doc.splitTextToSize(`Sample answer: ${q.sampleAnswer}`, pageW - margin * 2 - 10);
    doc.text(aLines, margin + 10, y);
    y += aLines.length * 10 + 10;
  }

  // AI enhancement section
  if (aiEnhancement && (aiEnhancement.summary || aiEnhancement.coverLetter)) {
    if (y > pageH - 100) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.dark);
    doc.text(aiEnhancement.available ? 'AI-Generated Enhancements' : 'Suggested Enhancements (local)', margin, y);
    y += 18;
    if (aiEnhancement.summary) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Professional Summary', margin, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.gray);
      y = writeWrapped(doc, aiEnhancement.summary, margin, y, pageW - margin * 2, 11) + 10;
    }
    if (aiEnhancement.coverLetter) {
      if (y > pageH - 120) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.dark);
      doc.text('Cover Letter', margin, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.gray);
      y = writeWrapped(doc, aiEnhancement.coverLetter, margin, y, pageW - margin * 2, 11) + 10;
    }
    if (aiEnhancement.learningRoadmap.length > 0) {
      if (y > pageH - 100) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.dark);
      doc.text('Learning Roadmap', margin, y);
      y += 14;
      for (const item of aiEnhancement.learningRoadmap) {
        if (y > pageH - 60) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.primary);
        y = writeWrapped(doc, item.skill, margin, y, pageW - margin * 2, 11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.gray);
        y = writeWrapped(doc, `Why: ${item.reason}`, margin + 10, y, pageW - margin * 2 - 10, 10) + 2;
        y = writeWrapped(doc, `How: ${item.resource}`, margin + 10, y, pageW - margin * 2 - 10, 10) + 8;
      }
    }
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...COLORS.light);
    doc.rect(0, pageH - 30, pageW, 30, 'F');
    doc.setTextColor(...COLORS.gray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('AI Resume Analyzer — Confidential', margin, pageH - 12);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin - 60, pageH - 12);
  }

  const safeName = (analysis.parsedResume.personalInfo.name || 'resume')
    .replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Resume_Analysis_${safeName}_${Date.now()}.pdf`);
}

function writeWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}
