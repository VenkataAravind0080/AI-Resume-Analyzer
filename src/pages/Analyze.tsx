import { useState, type DragEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileSearch,
  ArrowRight,
} from 'lucide-react';
import { validateFile, parseFile, parseResume, runFullAnalysis } from '@/engine';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button, Card, Select, Textarea, Badge } from '@/components/ui';
import type { CareerDomain, AnalysisResult, ParsedResume } from '@/engine/types';
import { getAIEnhancement, checkAIAvailability, type AIEnhancement } from '@/lib/aiService';

type Step = 'upload' | 'job' | 'analyzing' | 'done' | 'error';

const DOMAINS: { value: CareerDomain; label: string }[] = [
  { value: 'software-engineering', label: 'Software Engineering' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'devops-cloud', label: 'DevOps & Cloud' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'ai-ml', label: 'AI & Machine Learning' },
  { value: 'general', label: 'General / Other' },
];

export function Analyze() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedFile, setParsedFile] = useState<{ text: string; fileName: string } | null>(null);
  const [parseError, setParseError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [domain, setDomain] = useState<CareerDomain>('software-engineering');

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [aiEnhancement, setAiEnhancement] = useState<AIEnhancement | null>(null);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setParseError('');
    const validation = validateFile(file);
    if (!validation.valid) {
      setParseError(validation.error ?? 'Invalid file');
      return;
    }
    setFile(file);
    setParsing(true);
    try {
      const parsed = await parseFile(file);
      if (!parsed.text || parsed.text.length < 20) {
        setParseError('Could not extract enough text from this file. Try a different file or format.');
        setFile(null);
        setParsing(false);
        return;
      }
      setParsedFile({ text: parsed.text, fileName: parsed.fileName });
      setStep('job');
    } catch (err) {
      setParseError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setFile(null);
    }
    setParsing(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  }

  function resetFile() {
    setFile(null);
    setParsedFile(null);
    setParseError('');
    setStep('upload');
  }

  async function runAnalysis() {
    if (!parsedFile || !user) return;
    if (jobDescription.trim().length < 30) {
      setError('Please paste a job description with at least 30 characters.');
      return;
    }
    setError('');
    setStep('analyzing');

    try {
      const parsedResume: ParsedResume = parseResume(parsedFile.text);
      const result: AnalysisResult = runFullAnalysis(parsedResume, jobDescription, domain);

      // Save resume
      const { data: resumeRow } = await supabase
        .from('resumes')
        .insert({
          name: parsedFile.fileName.replace(/\.(pdf|docx|txt)$/i, ''),
          file_name: parsedFile.fileName,
          file_type: file?.type ?? 'txt',
          raw_text: parsedFile.text,
          parsed_data: parsedResume as unknown as Record<string, unknown>,
        })
        .select('id')
        .single();

      // Save analysis
      const { data: analysisRow } = await supabase
        .from('analyses')
        .insert({
          resume_id: resumeRow?.id ?? null,
          resume_name: parsedFile.fileName.replace(/\.(pdf|docx|txt)$/i, ''),
          job_title: jobTitle,
          company,
          job_description: jobDescription,
          ats_score: result.atsScore,
          category_scores: result.categoryScores as unknown as Record<string, unknown>,
          matched_skills: result.matchedSkills,
          missing_skills: result.missingSkills,
          semantic_similarity: result.semanticSimilarity,
          keywords_found: result.keywordsFound,
          keywords_missing: result.keywordsMissing,
          recommendations: result.recommendations as unknown as Record<string, unknown>,
          interview_questions: result.interviewQuestions as unknown as Record<string, unknown>,
          parsed_resume: parsedResume as unknown as Record<string, unknown>,
        })
        .select('id')
        .single();

      // Try AI enhancement (non-blocking — local fallback always works)
      checkAIAvailability().then((available) => {
        if (available) {
          getAIEnhancement(parsedResume, jobDescription, domain, result).then(setAiEnhancement);
        } else {
          setAiEnhancement(localFallbackEnhancement(parsedResume, domain, result));
        }
      });

      setAnalysis(result);
      setStep('done');

      if (analysisRow?.id) {
        // Navigate to full report after a short delay so user sees the result
        setTimeout(() => navigate(`/report/${analysisRow.id}`), 1500);
      }
    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStep('error');
    }
  }

  if (step === 'analyzing') {
    return <AnalyzingState />;
  }

  if (step === 'done' && analysis) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="inline-flex w-20 h-20 rounded-full bg-emerald-50 items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Analysis Complete</h1>
        <p className="mt-2 text-slate-600">
          Your ATS compatibility score is ready. Redirecting to your full report...
        </p>
        <div className="mt-8 inline-flex items-center gap-2 text-blue-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading report</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analyze a Resume</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload your resume and target job description to get an instant ATS analysis.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {['Upload', 'Job Details', 'Results'].map((label, i) => {
          const stepNum = step === 'upload' ? 0 : step === 'job' ? 1 : 2;
          const active = i <= stepNum;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm ${active ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                {label}
              </span>
              {i < 2 && <div className={`flex-1 h-0.5 ${active ? 'bg-blue-600' : 'bg-slate-200'}`} />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card className="p-6">
          <label
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            {parsing ? (
              <>
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="mt-4 text-sm font-medium text-slate-700">Parsing your resume...</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-blue-600" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-900">
                  Drop your resume here or click to browse
                </p>
                <p className="mt-1 text-xs text-slate-500">PDF, DOCX, or TXT · Max 10 MB</p>
                <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileInput} />
              </>
            )}
          </label>

          {parseError && (
            <div className="mt-4 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{parseError}</p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <FileText className="w-4 h-4" />
            Your file is processed entirely in your browser. Nothing is uploaded to a third party.
          </div>
        </Card>
      )}

      {/* Step 2: Job details */}
      {step === 'job' && parsedFile && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{parsedFile.fileName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {parsedFile.text.length.toLocaleString()} characters extracted
                </p>
                <button onClick={resetFile} className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600">
                  <X className="w-3.5 h-3.5" /> Remove and upload a different file
                </button>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Job title</label>
                <input
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company (optional)</label>
                <input
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe"
                />
              </div>
            </div>

            <Select label="Career domain" value={domain} onChange={(e) => setDomain(e.target.value as CareerDomain)}>
              {DOMAINS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </Select>

            <Textarea
              label="Job description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={10}
            />
            <p className="text-xs text-slate-500">
              Tip: Include the full requirements and responsibilities section for the most accurate analysis.
            </p>

            <div className="flex items-center justify-between pt-2">
              <Badge color="blue">
                <Sparkles className="w-3 h-3 mr-1 inline" />
                AI enhancement will be applied
              </Badge>
              <Button onClick={runAnalysis} size="lg" disabled={jobDescription.trim().length < 30}>
                <FileSearch className="w-5 h-5" />
                Run Analysis
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {step === 'error' && (
        <Card className="p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-900">Something went wrong</p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <Button onClick={() => setStep('job')} className="mt-4">Try again</Button>
        </Card>
      )}
    </div>
  );
}

function AnalyzingState() {
  const steps = [
    'Parsing resume structure...',
    'Extracting skills and experience...',
    'Computing semantic similarity...',
    'Calculating ATS compatibility score...',
    'Generating recommendations...',
    'Preparing interview questions...',
  ];
  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        <FileSearch className="absolute inset-0 m-auto w-8 h-8 text-blue-600" />
      </div>
      <h2 className="mt-6 text-xl font-bold text-slate-900">Analyzing your resume</h2>
      <p className="mt-2 text-sm text-slate-500">This usually takes a few seconds.</p>
      <div className="mt-8 space-y-3 text-left">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" style={{ animationDelay: `${i * 200}ms` }} />
            <span className="text-sm text-slate-600">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function localFallbackEnhancement(resume: ParsedResume, domain: CareerDomain, _result: AnalysisResult): AIEnhancement {
  return {
    summary: '',
    rewrittenBullets: [],
    coverLetter: '',
    learningRoadmap: [],
    available: false,
  };
}
