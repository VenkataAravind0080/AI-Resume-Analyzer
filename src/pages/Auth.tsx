import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ScanText, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button, Input } from '@/components/ui';

export function Auth() {
  const [params] = useSearchParams();
  const isSignup = params.get('mode') === 'signup';
  const [mode, setMode] = useState<'signin' | 'signup'>(isSignup ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
      } else {
        setSuccess('Account created! Redirecting to your dashboard...');
        setTimeout(() => navigate('/dashboard'), 800);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        navigate('/dashboard');
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" aria-hidden />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" aria-hidden />
        <div className="relative flex flex-col justify-between p-12 text-white">
          <Link to="/" className="inline-flex items-center gap-2.5 w-fit">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ScanText className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold">ResumeAI</span>
          </Link>
          <div>
            <h2 className="text-4xl font-bold leading-tight">
              Optimize your resume
              <br />
              for the ATS era.
            </h2>
            <p className="mt-4 text-lg text-blue-100 max-w-md leading-relaxed">
              Get instant ATS scores, semantic analysis, and AI-powered
              recommendations to land more interviews.
            </p>
            <div className="mt-8 space-y-3">
              {['9-category ATS scoring', 'Semantic similarity analysis', 'AI-generated improvements', 'Track progress over time'].map(
                (item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span className="text-blue-50">{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
          <p className="text-sm text-blue-200">Your data is private and secure.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <ScanText className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">ResumeAI</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {mode === 'signup'
              ? 'Start analyzing and optimizing your resumes today.'
              : 'Sign in to access your dashboard and analysis history.'}
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mt-6 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              required
            />
            <Button type="submit" size="lg" loading={loading} className="w-full">
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setError('');
                setSuccess('');
              }}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
