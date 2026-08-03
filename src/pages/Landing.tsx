import { Link } from 'react-router-dom';
import {
  ScanText,
  FileSearch,
  Brain,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Download,
  Target,
  ArrowRight,
  CheckCircle2,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <ScanText className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">ResumeAI</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Get started <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-white" />
        <div
          className="absolute top-20 right-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"
          aria-hidden
        />
        <div
          className="absolute top-40 left-10 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700 mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered ATS Analysis
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1]">
            Beat the bots.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              Land the interview.
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Upload your resume, paste a job description, and get an instant ATS
            compatibility score, skill-gap analysis, and AI-driven recommendations
            to optimize your application.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={user ? '/analyze' : '/auth?mode=signup'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30"
            >
              {user ? 'Analyze a Resume' : 'Start Free Analysis'}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 text-slate-700 text-base font-semibold rounded-xl hover:bg-slate-50 transition-all"
            >
              See how it works
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            {['PDF & DOCX support', '9-category scoring', 'Semantic analysis', 'PDF reports'].map(
              (item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {item}
                </span>
              )
            )}
          </div>
        </div>

        {/* Score preview mockup */}
        <div className="relative max-w-4xl mx-auto mt-16">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-300/40 p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                      cx="64"
                      cy="64"
                      r="52"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="10"
                      strokeDasharray={327}
                      strokeDashoffset={82}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-blue-600">75</span>
                    <span className="text-xs text-slate-500">ATS Score</span>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-emerald-600">Strong match</p>
              </div>
              <div className="md:col-span-2 space-y-4">
                {[
                  { label: 'Skill Alignment', score: 82, color: 'bg-emerald-500' },
                  { label: 'Semantic Relevance', score: 71, color: 'bg-blue-500' },
                  { label: 'Keyword Optimization', score: 68, color: 'bg-amber-500' },
                  { label: 'Experience', score: 78, color: 'bg-emerald-500' },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{row.label}</span>
                      <span className="text-slate-500">{row.score}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.color}`}
                        style={{ width: `${row.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Everything you need to optimize your resume
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From parsing to semantic matching to AI-generated improvements —
              a complete toolkit for modern job seekers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Three steps to a stronger resume
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative text-center">
                  <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white items-center justify-center shadow-lg shadow-blue-600/20">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 text-5xl font-bold text-slate-100 -z-10 select-none">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" aria-hidden />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl" aria-hidden />
          <h2 className="relative text-3xl md:text-4xl font-bold text-white">
            Ready to optimize your resume?
          </h2>
          <p className="relative mt-4 text-lg text-blue-100 max-w-xl mx-auto">
            Join job seekers using AI to bridge the gap between their resume and
            the ATS.
          </p>
          <Link
            to={user ? '/analyze' : '/auth?mode=signup'}
            className="relative mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-600 text-base font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg"
          >
            {user ? 'Analyze a Resume' : 'Get started — it\'s free'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ScanText className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900">ResumeAI</span>
          </div>
          <p className="text-sm text-slate-500">
            AI Resume Analyzer & Career Assistance Platform
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: FileSearch,
    title: 'Smart Resume Parsing',
    desc: 'Upload PDF or DOCX and we extract your skills, experience, education, projects, and certifications into structured data.',
  },
  {
    icon: Brain,
    title: 'Semantic Similarity',
    desc: 'TF-IDF weighted cosine similarity measures how contextually aligned your resume is with the job description — not just keyword matches.',
  },
  {
    icon: Target,
    title: '9-Category ATS Scoring',
    desc: 'A transparent, weighted score across skill alignment, experience, keywords, formatting, and more — with a full breakdown.',
  },
  {
    icon: Sparkles,
    title: 'AI Recommendations',
    desc: 'Get specific, prioritized suggestions: missing skills, certifications to earn, stronger action verbs, and quantified achievements.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Track your ATS scores over time, compare resumes, and visualize skill distribution and keyword coverage.',
  },
  {
    icon: Download,
    title: 'PDF Reports',
    desc: 'Export a complete analysis report with scores, matched skills, recommendations, and interview prep questions.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private',
    desc: 'Your data is protected with row-level security. Only you can see your resumes and analysis history.',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    desc: 'Analysis runs in seconds, entirely in your browser. No waiting for server processing.',
  },
  {
    icon: TrendingUp,
    title: 'Career Roadmaps',
    desc: 'Get a personalized learning roadmap based on your skill gaps and target career domain.',
  },
];

const steps = [
  {
    icon: FileSearch,
    title: 'Upload your resume',
    desc: 'Drop a PDF or DOCX file and paste the job description you\'re targeting.',
  },
  {
    icon: Brain,
    title: 'Get your analysis',
    desc: 'Receive an instant ATS score, skill gap analysis, and prioritized recommendations.',
  },
  {
    icon: TrendingUp,
    title: 'Improve & export',
    desc: 'Apply the AI suggestions, download a PDF report, and track your progress over time.',
  },
];
