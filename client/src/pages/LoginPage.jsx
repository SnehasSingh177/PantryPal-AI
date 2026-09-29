import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { AvocadoDoodle, KawaiiBackgroundDoodles, StrawberryDoodle } from '../components/common/KawaiiDoodles';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { signIn, resetPassword, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to receive password reset instructions.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kawaii-cream flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Floating Kawaii Doodles */}
      <KawaiiBackgroundDoodles />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-kawaii-mint/60 border border-kawaii-forest/20 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <AvocadoDoodle className="w-8 h-8" />
          </div>
          <span className="font-display font-bold text-3xl text-kawaii-forest">PantryPal AI</span>
        </Link>
        <h2 className="mt-6 text-2xl font-display font-bold tracking-tight text-kawaii-espresso">
          Welcome back, Chef! 🥑
        </h2>
        <p className="mt-2 text-sm text-[#343A35]">
          Or{' '}
          <Link to="/register" className="font-bold text-kawaii-terracotta hover:underline">
            create a cozy free account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="card-kawaii bg-white py-8 px-6 sm:px-10 border-kawaii-border shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-kawaii-terracotta/15 border border-kawaii-terracotta/30 text-kawaii-terracotta text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {resetSent && (
            <div className="mb-5 p-3.5 rounded-2xl bg-kawaii-mint/60 border border-kawaii-forest/30 text-kawaii-forest text-xs flex items-center gap-2 animate-fade-in shadow-xs">
              <Sparkles className="w-4 h-4 shrink-0 text-kawaii-forest" />
              <span className="font-bold">Password reset instructions have been sent to your email!</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#66736A]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chef@example.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest transition-colors shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-kawaii-terracotta hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#66736A]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest transition-colors shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-sm font-semibold cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Kitchen ✨</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Button */}
          <div className="mt-6 pt-6 border-t border-kawaii-border/60 text-center">
            <Link
              to="/dashboard"
              className="text-xs font-bold text-[#315C45] hover:text-[#1E2E24] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-kawaii-cream transition-colors"
            >
              <span>Explore Dashboard in Demo Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

