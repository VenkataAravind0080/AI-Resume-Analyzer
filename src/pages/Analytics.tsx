import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Award,
  Brain,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Legend,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Card, ScoreRing, Badge } from '@/components/ui';
import type { ScoreBreakdown } from '@/engine/types';

interface AnalysisRow {
  id: string;
  resume_name: string;
  job_title: string;
  ats_score: number;
  semantic_similarity: number;
  category_scores: ScoreBreakdown;
  matched_skills: string[];
  missing_skills: string[];
  created_at: string;
}

export function Analytics() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('analyses')
        .select('id, resume_name, job_title, ats_score, semantic_similarity, category_scores, matched_skills, missing_skills, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      setAnalyses((data ?? []) as unknown as AnalysisRow[]);
      setLoading(false);
    }
    load();
  }, [user]);

  const trendData = useMemo(
    () =>
      analyses.map((a, i) => ({
        name: `#${i + 1}`,
        ats: a.ats_score,
        semantic: Number(a.semantic_similarity),
        date: new Date(a.created_at).toLocaleDateString(),
      })),
    [analyses]
  );

  const radarData = useMemo(() => {
    if (analyses.length === 0) return [];
    const latest = analyses[analyses.length - 1];
    const c = latest.category_scores;
    return [
      { category: 'Skills', score: c.skillAlignment.score },
      { category: 'Semantic', score: c.semanticRelevance.score },
      { category: 'Keywords', score: c.keywordOptimization.score },
      { category: 'Experience', score: c.experience.score },
      { category: 'Projects', score: c.projects.score },
      { category: 'Complete', score: c.completeness.score },
      { category: 'Education', score: c.education.score },
      { category: 'Certs', score: c.certifications.score },
      { category: 'Format', score: c.formatting.score },
    ];
  }, [analyses]);

  const skillComparison = useMemo(() => {
    if (analyses.length === 0) return [];
    const latest = analyses[analyses.length - 1];
    return [
      { name: 'Matched', count: latest.matched_skills.length, fill: '#22c55e' },
      { name: 'Missing', count: latest.missing_skills.length, fill: '#ef4444' },
    ];
  }, [analyses]);

  const stats = useMemo(() => {
    if (analyses.length === 0) return { total: 0, avg: 0, best: 0, latest: 0, trend: 0 };
    const scores = analyses.map((a) => a.ats_score);
    const avg = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
    const best = Math.max(...scores);
    const latest = scores[scores.length - 1];
    const first = scores[0];
    const trend = latest - first;
    return { total: analyses.length, avg, best, latest, trend };
  }, [analyses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
          <TrendingUp className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">No analytics yet</h2>
        <p className="mt-1 text-sm text-slate-500">Run a few analyses to see your progress over time.</p>
        <Link to="/analyze" className="mt-4 inline-block">
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
            Run your first analysis
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">Track your ATS scores and skill coverage over time.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <Target className="w-8 h-8 text-blue-500" />
            <span className="text-3xl font-bold text-slate-900">{stats.latest}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">Latest Score</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <Award className="w-8 h-8 text-amber-500" />
            <span className="text-3xl font-bold text-slate-900">{stats.best}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">Best Score</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            <span className="text-3xl font-bold text-slate-900">{stats.avg}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">Average Score</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <Brain className="w-8 h-8 text-slate-400" />
            <span className={`text-3xl font-bold ${stats.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.trend >= 0 ? '+' : ''}{stats.trend}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">Improvement</p>
        </Card>
      </div>

      {/* Trend chart */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Score Trend Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="ats" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} name="ATS Score" />
            <Line type="monotone" dataKey="semantic" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} name="Semantic Similarity" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Category Breakdown (Latest)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Skill comparison */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Skill Coverage (Latest)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={skillComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {skillComparison.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* History list */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Analysis History</h3>
        <div className="space-y-2">
          {analyses.slice().reverse().map((a) => (
            <Link
              key={a.id}
              to={`/report/${a.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
            >
              <ScoreRing score={a.ats_score} size={52} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{a.resume_name}</p>
                <p className="text-sm text-slate-500 truncate">{a.job_title || 'Untitled role'}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(a.created_at).toLocaleDateString()} · {a.matched_skills.length} matched · {a.missing_skills.length} missing
                </p>
              </div>
              <Badge color={a.ats_score >= 75 ? 'green' : a.ats_score >= 50 ? 'amber' : 'red'}>
                {a.ats_score >= 75 ? 'Strong' : a.ats_score >= 50 ? 'Moderate' : 'Weak'}
              </Badge>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
