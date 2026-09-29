import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { AvocadoDoodle, KawaiiBackgroundDoodles } from '../components/common/KawaiiDoodles';

export const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, fullName);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
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
          Create your cozy kitchen 🍓
        </h2>
        <p className="mt-2 text-sm text-[#343A35]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-kawaii-terracotta hover:underline">
            Sign in here
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

          {success && (
            <div className="mb-5 p-3.5 rounded-2xl bg-kawaii-mint/60 border border-kawaii-forest/30 text-kawaii-forest text-xs flex items-center gap-2 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-kawaii-forest" />
              <span className="font-bold">Account created successfully! Preparing kitchen... 🎉</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#66736A]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Chef Aditya"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest transition-colors shadow-xs"
                />
              </div>
            </div>

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
              <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#66736A]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Free Account ✨</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

