import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, UserPlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Step = 'form' | 'otp';

export function RegisterPage() {
  const { user, loading: authLoading, register, verifyRegistrationOtp } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await register(name, email, password);
      addToast('OTP sent to admin email for verification', 'info');
      setStep('otp');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await verifyRegistrationOtp(name, email, password, otp);
      addToast('Account created successfully', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('OTP verification failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            {step === 'form' ? (
              <UserPlus className="h-7 w-7 text-emerald-600" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-emerald-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {step === 'form' ? 'Create Account' : 'Verify OTP'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === 'form'
              ? 'Register for a new account'
              : 'Enter the OTP sent to the admin email'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="reg-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reg-confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending request...
                </>
              ) : (
                'Register'
              )}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
                Sign in
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              An OTP has been sent to the clinic admin email. Ask the admin for the OTP to complete registration.
            </div>

            <div>
              <label htmlFor="reg-otp" className="mb-1.5 block text-sm font-medium text-slate-700">
                OTP Code
              </label>
              <input
                id="reg-otp"
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-center text-lg tracking-[0.5em] font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Create Account'
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Back to registration form
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
