import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  MessageSquare,
  Target,
  FileText,
  Loader2,
  Brain,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Card, Badge, ScoreRing, ProgressBar, Button } from '@/components/ui';
import { generateReport } from '@/lib/reportGenerator';
import { getAIEnhancement, checkAIAvailability, type AIEnhancement } from '@/lib/aiService';
import type { AnalysisResult, ScoreBreakdown, Recommendation, InterviewQuestion, ParsedResume } from '@/engine/types';

interface AnalysisRow {
  id: string;
  resume_name: string;
  job_title: string;
  company: string;
  job_description: string;
  ats_score: number;
  category_scores: ScoreBreakdown;
  matched_skills: string[];
  missing_skills: string[];
  semantic_similarity: number;
  keywords_found: string[];
  keywords_missing: string[];
  recommendations: Recommendation[];
  interview_questions: InterviewQuestion[];
  parsed_resume: ParsedResume;
}

export function Report() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<AnalysisRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState<AIEnhancement | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'recommendations' | 'interview' | 'ai'>('overview');

  useEffect(() => {
    async function load() {
      if (!id || !user) return;
      const { data: row } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (row) {
        setData(row as unknown as AnalysisRow);
      }
      setLoading(false);
    }
    load();
  }, [id, user]);

  async function loadAI() {
    if (!data || aiData || aiLoading) return;
    setAiLoading(true);
    const available = await checkAIAvailability();
    const result: AnalysisResult = {
      atsScore: data.ats_score,
      categoryScores: data.category_scores,
      matchedSkills: data.matched_skills,
      missingSkills: data.missing_skills,
      semanticSimilarity: data.semantic_similarity,
      keywordsFound: data.keywords_found,
      keywordsMissing: data.keywords_missing,
      recommendations: data.recommendations,
      interviewQuestions: data.interview_questions,
      parsedResume: data.parsed_resume,
    };
    const enhancement = await getAIEnhancement(data.parsed_resume, data.job_description, 'general', result);
    setAiData(enhancement);
    setAiLoading(false);
  }

  function handleDownload() {
    if (!data) return;
    const result: AnalysisResult = {
      atsScore: data.ats_score,
      categoryScores: data.category_scores,
      matchedSkills: data.matched_skills,
      missingSkills: data.missing_skills,
      semanticSimilarity: data.semantic_similarity,
      keywordsFound: data.keywords_found,
      keywordsMissing: data.keywords_missing,
      recommendations: data.recommendations,
      interviewQuestions: data.interview_questions,
      parsedResume: data.parsed_resume,
    };
    generateReport(result, data.job_title, data.company, 'general', aiData);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600">Analysis not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  const cats = data.category_scores;
  const scoreRating = data.ats_score >= 75 ? 'Strong match' : data.ats_score >= 50 ? 'Moderate match' : 'Needs improvement';
  const scoreColor = data.ats_score >= 75 ? 'text-emerald-600' : data.ats_score >= 50 ? 'text-amber-600' : 'text-red-600';

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Target },
    { id: 'skills' as const, label: 'Skills & Keywords', icon: Brain },
    { id: 'recommendations' as const, label: 'Recommendations', icon: Lightbulb },
    { id: 'interview' as const, label: 'Interview Prep', icon: MessageSquare },
    { id: 'ai' as const, label: 'AI Assistant', icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{data.resume_name}</h1>
            <p className="text-sm text-slate-500">
              {data.job_title || 'Untitled role'}
              {data.company ? ` · ${data.company}` : ''}
            </p>
          </div>
        </div>
        <Button onClick={handleDownload}>
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      {/* Score summary */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-center justify-center">
          <ScoreRing score={data.ats_score} size={140} label="ATS Score" />
          <p className={`mt-3 text-sm font-semibold ${scoreColor}`}>{scoreRating}</p>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Score Breakdown</h3>
          <div className="space-y-3">
            {([
              ['Skill Alignment', cats.skillAlignment],
              ['Semantic Relevance', cats.semanticRelevance],
              ['Keyword Optimization', cats.keywordOptimization],
              ['Experience', cats.experience],
              ['Projects', cats.projects],
              ['Completeness', cats.completeness],
              ['Education', cats.education],
              ['Certifications', cats.certifications],
              ['Formatting', cats.formatting],
            ] as [string, { score: number; details: string }][]).map(([label, cat]) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">{label}</span>
                  <span className="text-slate-500">{cat.score}/100</span>
                </div>
                <ProgressBar
                  value={cat.score}
                  color={cat.score >= 75 ? 'green' : cat.score >= 50 ? 'amber' : 'red'}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'ai') loadAI();
              }}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Semantic Similarity Analysis</h3>
            <div className="flex items-center gap-6">
              <ScoreRing score={Number(data.semantic_similarity)} size={100} label="Similarity" />
              <div className="flex-1">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your resume shares {Number(data.semantic_similarity)}% contextual overlap with the job
                  description. This measures how closely the language and terminology in your resume
                  align with what the job posting asks for — beyond simple keyword matching.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">Keywords found</p>
                    <p className="text-lg font-bold text-slate-900">{data.keywords_found.length}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">Keywords missing</p>
                    <p className="text-lg font-bold text-slate-900">{data.keywords_missing.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Extracted Resume Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoRow label="Name" value={data.parsed_resume.personalInfo.name} />
              <InfoRow label="Email" value={data.parsed_resume.personalInfo.email} />
              <InfoRow label="Experience entries" value={String(data.parsed_resume.experience.length)} />
              <InfoRow label="Education entries" value={String(data.parsed_resume.education.length)} />
              <InfoRow label="Projects" value={String(data.parsed_resume.projects.length)} />
              <InfoRow label="Certifications" value={String(data.parsed_resume.certifications.length)} />
              <InfoRow label="Skills detected" value={String(data.parsed_resume.skills.length)} />
              <InfoRow label="Achievements" value={String(data.parsed_resume.achievements.length)} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Matched Skills ({data.matched_skills.length})
            </h3>
            {data.matched_skills.length === 0 ? (
              <p className="text-sm text-slate-500">No skills from the job description were found in your resume.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.matched_skills.map((s) => (
                  <Badge key={s} color="green">{s}</Badge>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Missing Skills ({data.missing_skills.length})
            </h3>
            {data.missing_skills.length === 0 ? (
              <p className="text-sm text-emerald-600">Great coverage — no missing skills detected!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.missing_skills.map((s) => (
                  <Badge key={s} color="red">{s}</Badge>
                ))}
              </div>
            )}
          </Card>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Keywords Found</h3>
              <div className="flex flex-wrap gap-2">
                {data.keywords_found.length === 0 ? (
                  <p className="text-sm text-slate-500">None detected.</p>
                ) : (
                  data.keywords_found.map((k) => <Badge key={k} color="blue">{k}</Badge>)
                )}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Keywords Missing</h3>
              <div className="flex flex-wrap gap-2">
                {data.keywords_missing.length === 0 ? (
                  <p className="text-sm text-emerald-600">All key terms covered.</p>
                ) : (
                  data.keywords_missing.map((k) => <Badge key={k} color="amber">{k}</Badge>)
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {data.recommendations.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-slate-500">No recommendations — your resume looks strong!</p>
            </Card>
          ) : (
            data.recommendations.map((rec, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    rec.priority === 'high' ? 'bg-red-50 text-red-600' :
                    rec.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{rec.title}</h4>
                      <Badge color={rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'amber' : 'slate'}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'interview' && (
        <div className="space-y-4">
          {data.interview_questions.map((q, i) => (
            <Card key={i} className="p-5">
              <Badge color="blue" className="mb-3">{q.category}</Badge>
              <h4 className="text-sm font-semibold text-slate-900">{q.question}</h4>
              <div className="mt-3 p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 mb-1">Sample answer approach</p>
                <p className="text-sm text-slate-700 leading-relaxed">{q.sampleAnswer}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          {aiLoading && (
            <Card className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="mt-3 text-sm text-slate-600">Generating AI enhancements...</p>
            </Card>
          )}

          {!aiLoading && aiData && (
            <>
              {!aiData.available && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    AI enhancement is using local algorithms. Connect a Gemini API key to unlock
                    LLM-powered summaries, cover letters, and roadmaps.
                  </p>
                </div>
              )}

              {aiData.summary && (
                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Suggested Professional Summary
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{aiData.summary}</p>
                </Card>
              )}

              {aiData.rewrittenBullets.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Rewritten Experience Bullets</h3>
                  <div className="space-y-4">
                    {aiData.rewrittenBullets.map((b, i) => (
                      <div key={i}>
                        <p className="text-xs font-medium text-slate-400 mb-1">Original</p>
                        <p className="text-sm text-slate-600 line-through opacity-70">{b.original}</p>
                        <p className="text-xs font-medium text-emerald-600 mt-2 mb-1">Improved</p>
                        <p className="text-sm text-slate-900 font-medium">{b.improved}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {aiData.coverLetter && (
                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Generated Cover Letter</h3>
                  <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                    {aiData.coverLetter}
                  </pre>
                </Card>
              )}

              {aiData.learningRoadmap.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Learning Roadmap</h3>
                  <div className="space-y-4">
                    {aiData.learningRoadmap.map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{item.skill}</h4>
                          <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
                          <p className="mt-1 text-sm text-slate-500"><span className="font-medium">Next step:</span> {item.resource}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {!aiLoading && !aiData && (
            <Card className="p-8 text-center">
              <Sparkles className="w-10 h-10 text-blue-500 mx-auto" />
              <p className="mt-3 text-sm font-medium text-slate-900">AI Assistant</p>
              <p className="mt-1 text-sm text-slate-500">Click the AI Assistant tab to generate enhancements.</p>
              <Button onClick={loadAI} className="mt-4">
                <Sparkles className="w-4 h-4" />
                Generate enhancements
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 truncate max-w-[60%]">{value || '—'}</span>
    </div>
  );
}
