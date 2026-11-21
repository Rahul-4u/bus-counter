import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, ShieldCheck } from 'lucide-react';
import { PublicLayout } from '../../components/website/PublicLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';

export function AuthPage({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const { profile, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.role === 'admin') navigate('/admin', { replace: true });
      else if (profile.role === 'owner') navigate('/owner', { replace: true });
      else navigate('/passenger', { replace: true });
    }
  }, [profile, navigate]);

  const handleGoogleSignIn = async () => {
    setBusy(true);
    try {
      const p = await signInWithGoogle();
      if (p) {
        notify(`Welcome, ${p.displayName}`, 'success');
      }
    } catch (err) {
      notify('Sign-in failed', 'error', err instanceof Error ? err.message : 'Please allow popups and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicLayout>
      <section className="bg-slate-50 py-16 min-h-[75vh] flex items-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-[#0B1F3A] text-orange-400 flex items-center justify-center mx-auto">
                <Bus className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-950 font-display">
                {mode === 'register'
                  ? 'Create Your DeshLine Account'
                  : mode === 'forgot'
                    ? 'Account Recovery'
                    : 'Sign In to DeshLine'}
              </h1>
              <p className="text-sm text-slate-600">
                {mode === 'forgot'
                  ? 'DeshLine uses secure Google Sign-In. Manage or recover your Google password directly via Google Account Recovery.'
                  : 'Access your e-tickets, live seat bookings, or fleet management dashboard with verified Google Sign-In.'}
              </p>
            </div>

            {mode !== 'forgot' && (
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogleSignIn}
                className="w-full h-12 rounded-xl bg-[#0B1F3A] hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-orange-400" />
                {busy ? 'Authenticating...' : 'Continue with Google'}
              </button>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-800">Role-Based Access Control</p>
              <p>
                New accounts start as <strong>Passenger</strong>. Bus Owners and Counter Staff are granted fleet/counter permissions by an Administrator in the Operations Console.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              {mode === 'login' ? (
                <>
                  <Link to="/register" className="font-semibold text-orange-600 hover:underline">
                    Create account
                  </Link>
                  <Link to="/forgot-password" className="hover:underline">
                    Password help
                  </Link>
                </>
              ) : (
                <Link to="/login" className="font-semibold text-orange-600 hover:underline">
                  Back to Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
