import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  TrendingUp,
  Clock,
  ChevronRight,
  Award,
  Target,
  FileText,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Card, Badge, ScoreRing, Button } from '@/components/ui';

interface AnalysisRow {
  id: string;
  resume_name: string;
  job_title: string;
  company: string;
  ats_score: number;
  semantic_similarity: number;
  created_at: string;
}

export function Dashboard() {
  const { user, profile } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, bestScore: 0, resumeCount: 0 });

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('analyses')
        .select('id, resume_name, job_title, company, ats_score, semantic_similarity, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const rows = (data ?? []) as AnalysisRow[];
      setAnalyses(rows);
      const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.ats_score, 0) / rows.length) : 0;
      const best = rows.length ? Math.max(...rows.map((r) => r.ats_score)) : 0;
      setStats({ total: rows.length, avgScore: avg, bestScore: best, resumeCount: rows.length });

      const { count } = await supabase
        .from('resumes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setStats((s) => ({ ...s, resumeCount: count ?? 0 }));

      setLoading(false);
    }
    load();
  }, [user]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Here's an overview of your resume analysis activity.
          </p>
        </div>
        <Link to="/analyze">
          <Button size="md">
            <FileSearch className="w-4 h-4" />
            New Analysis
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Analyses Run', value: stats.total, icon: FileSearch, color: 'blue' },
          { label: 'Avg ATS Score', value: stats.avgScore, icon: Target, color: 'emerald' },
          { label: 'Best Score', value: stats.bestScore, icon: Award, color: 'amber' },
          { label: 'Resumes Stored', value: stats.resumeCount, icon: FileText, color: 'slate' },
        ].map((stat) => {
          const Icon = stat.icon;
          const colors = {
            blue: 'bg-blue-50 text-blue-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            amber: 'bg-amber-50 text-amber-600',
            slate: 'bg-slate-100 text-slate-600',
          };
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[stat.color as keyof typeof colors]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent analyses */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Analyses</h2>
            <Link to="/analytics" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                <FileSearch className="w-7 h-7 text-slate-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-900">No analyses yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Run your first resume analysis to see results here.
              </p>
              <Link to="/analyze" className="mt-4 inline-block">
                <Button size="sm">
                  <FileSearch className="w-4 h-4" />
                  Analyze a resume
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {analyses.map((a) => (
                <Link
                  key={a.id}
                  to={`/report/${a.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                >
                  <ScoreRing score={a.ats_score} size={56} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{a.resume_name}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {a.job_title || 'Untitled role'}
                      {a.company ? ` · ${a.company}` : ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(a.created_at).toLocaleDateString()} · Semantic: {Number(a.semantic_similarity)}%
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Quick actions / tip */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 border-0">
            <TrendingUp className="w-8 h-8 text-white" />
            <h3 className="mt-3 text-lg font-semibold text-white">Track your progress</h3>
            <p className="mt-2 text-sm text-blue-100">
              Compare your ATS scores over time and see how your resume improves with each iteration.
            </p>
            <Link to="/analytics">
              <button className="mt-4 w-full px-4 py-2.5 bg-white text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                View analytics
              </button>
            </Link>
          </Card>

          <Card className="p-6">
            <Clock className="w-8 h-8 text-amber-500" />
            <h3 className="mt-3 text-lg font-semibold text-slate-900">Quick tip</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Tailor your resume for each job application. Even small keyword
              adjustments can boost your ATS score by 10–15 points.
            </p>
            <Badge color="blue" className="mt-3">Pro tip</Badge>
          </Card>
        </div>
      </div>
    </div>
  );
}
