import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, CheckCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Step = 'email' | 'otp' | 'done';

export function ForgotPasswordPage() {
  const { forgotPassword, verifyOtpAndResetPassword, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600" />
      </div>
    );
  }

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await forgotPassword(email);
      addToast('OTP sent to your email', 'success');
      setStep('otp');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send OTP');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await verifyOtpAndResetPassword(email, otp, newPassword);
      addToast('Password reset successfully', 'success');
      setStep('done');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reset password');
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
            {step === 'email' ? (
              <Mail className="h-7 w-7 text-emerald-600" />
            ) : step === 'otp' ? (
              <KeyRound className="h-7 w-7 text-emerald-600" />
            ) : (
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {step === 'email' ? 'Reset Password' : step === 'otp' ? 'Verify OTP' : 'Done!'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === 'email'
              ? 'Enter your email to receive an OTP'
              : step === 'otp'
                ? 'Enter the OTP and your new password'
                : 'Password has been reset successfully'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
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
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="reset-otp" className="mb-1.5 block text-sm font-medium text-slate-700">
                OTP Code
              </label>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-center text-lg tracking-[0.5em] font-bold"
              />
            </div>

            <div>
              <label htmlFor="reset-new-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                New Password
              </label>
              <input
                id="reset-new-password"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-800">Password reset successfully!</p>
              <p className="mt-1 text-xs text-emerald-600">
                You can now sign in with your new password
              </p>
            </div>
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
