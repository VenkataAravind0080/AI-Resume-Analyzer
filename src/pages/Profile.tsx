import { useState, type FormEvent } from 'react';
import { User as UserIcon, Save, CheckCircle2, Palette, Target } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Card, Button, Input, Select, Badge } from '@/components/ui';

const COLORS = [
  { name: 'blue', class: 'bg-blue-600' },
  { name: 'emerald', class: 'bg-emerald-600' },
  { name: 'amber', class: 'bg-amber-500' },
  { name: 'rose', class: 'bg-rose-600' },
  { name: 'violet', class: 'bg-violet-600' },
  { name: 'slate', class: 'bg-slate-700' },
];

const DOMAINS = [
  { value: '', label: 'Not specified' },
  { value: 'software-engineering', label: 'Software Engineering' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'devops-cloud', label: 'DevOps & Cloud' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'ai-ml', label: 'AI & Machine Learning' },
  { value: 'general', label: 'General / Other' },
];

export function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [careerDomain, setCareerDomain] = useState(profile?.career_domain ?? '');
  const [avatarColor, setAvatarColor] = useState(profile?.avatar_color ?? 'blue');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    const { error } = await updateProfile({
      full_name: fullName,
      career_domain: careerDomain,
      avatar_color: avatarColor,
    });
    if (error) {
      setError(error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  const initials = (fullName || user?.email || '?')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  const selectedColor = COLORS.find((c) => c.name === avatarColor) ?? COLORS[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your account and career preferences.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${selectedColor.class} text-white flex items-center justify-center text-xl font-bold`}>
            {initials || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{fullName || 'Your name'}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <Badge color="blue" className="mt-1">
              {DOMAINS.find((d) => d.value === careerDomain)?.label ?? 'No domain set'}
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserIcon className="w-4 h-4 text-blue-600" />
            Personal Information
          </div>

          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
          />

          <Input
            label="Email"
            value={user?.email ?? ''}
            disabled
            className="bg-slate-50 text-slate-500"
          />

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 pt-2">
            <Target className="w-4 h-4 text-emerald-600" />
            Career Preferences
          </div>

          <Select label="Career domain" value={careerDomain} onChange={(e) => setCareerDomain(e.target.value)}>
            {DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </Select>
          <p className="text-xs text-slate-500 -mt-2">
            Your domain helps tailor skill recommendations and certification suggestions.
          </p>

          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-slate-400" />
              Avatar color
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setAvatarColor(c.name)}
                  className={`w-10 h-10 rounded-xl ${c.class} transition-all ${
                    avatarColor === c.name ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              Profile saved successfully.
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving}>
              <Save className="w-4 h-4" />
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
