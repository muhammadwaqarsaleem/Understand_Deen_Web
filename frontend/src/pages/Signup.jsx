// =============================================================
// pages/Signup.jsx
// Registration form with full validation + auto-login on success
// =============================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// ---- Inline SVG Icons ----
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 1L14.09 7.26L20.7 7.27L15.45 11.27L17.18 17.53L12 14L6.82 17.53L8.55 11.27L3.3 7.27L9.91 7.26L12 1Z"/>
  </svg>
);

// ---- Password Strength Rules ----
const passwordRules = [
  { label: 'At least 8 characters',   test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',     test: (p) => /[A-Z]/.test(p) },
  { label: 'One number',               test: (p) => /\d/.test(p) },
];

// ---- Full Validation ----
const validateSignup = ({ fullName, email, password, confirmPassword }) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!fullName.trim() || fullName.trim().length < 2)
    errors.fullName = 'Full name must be at least 2 characters.';

  if (!email.trim())
    errors.email = 'Email is required.';
  else if (!emailRegex.test(email))
    errors.email = 'Please enter a valid email address.';

  const pwErrors = passwordRules.filter(r => !r.test(password));
  if (pwErrors.length > 0)
    errors.password = `Password must include: ${pwErrors.map(r => r.label.toLowerCase()).join(', ')}.`;

  if (!confirmPassword)
    errors.confirmPassword = 'Please confirm your password.';
  else if (password !== confirmPassword)
    errors.confirmPassword = 'Passwords do not match.';

  return errors;
};

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm]             = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors]         = useState({});
  const [showPw, setShowPw]         = useState(false);
  const [showConfirmPw, setShowCPw] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [serverError, setServerErr] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (serverError)  setServerErr('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateSignup(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setServerErr('');

    try {
      const { data } = await axios.post(`${API_BASE}/auth/signup`, {
        fullName: form.fullName.trim(),
        email:    form.email.trim(),
        password: form.password,
      });

      // Persist token and user info
      localStorage.setItem('ud_token', data.token);
      localStorage.setItem('ud_user',  JSON.stringify(data.user));

      navigate('/dashboard', { replace: true });

    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      setServerErr(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Live password rule feedback
  const pwRuleStatus = passwordRules.map(rule => ({
    ...rule,
    passed: rule.test(form.password),
  }));
  const showPwRules = form.password.length > 0;

  return (
    <div className="min-h-screen flex font-body">

      {/* ======================================================
          LEFT PANEL — Branding
          ====================================================== */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[44%] islamic-pattern flex-col justify-between p-12 relative overflow-hidden">

        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white">
              <StarIcon />
            </div>
            <span className="font-display text-white text-xl font-semibold tracking-wide">
              Understand Deen
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <p className="font-arabic text-white/70 text-2xl mb-6 text-right" dir="rtl">
            أَهْلًا وَسَهْلًا
          </p>
          <h1 className="font-display text-white text-4xl xl:text-5xl font-semibold leading-tight mb-5">
            Begin Your<br />
            Journey of<br />
            Knowledge.
          </h1>
          <p className="text-white/65 font-body text-base leading-relaxed">
            Join thousands of Muslims using a single, trusted platform for Quranic study, Hadith research, and daily worship.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { num: '6,236', label: 'Ayat' },
              { num: '4',     label: 'Madhabs' },
              { num: '100%',  label: 'Ad-Free' },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <p className="font-display text-white text-2xl font-semibold">{num}</p>
                <p className="text-white/50 text-xs font-body mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <p className="font-arabic text-white/50 text-lg text-right leading-relaxed" dir="rtl">
            ﴿ اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ ﴾
          </p>
          <p className="text-white/40 text-xs mt-1 text-right font-body">— Al-Alaq 96:1</p>
        </div>

        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full border border-white/[0.07] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full border border-white/[0.07] pointer-events-none" />
      </div>

      {/* ======================================================
          RIGHT PANEL — Signup Form
          ====================================================== */}
      <div className="flex-1 flex items-center justify-center bg-parchment-50 px-6 py-10">
        <div className="w-full max-w-[420px] animate-fade-in-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-7 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-deen-800 flex items-center justify-center text-white">
              <StarIcon />
            </div>
            <span className="font-display text-deen-900 text-lg font-semibold">Understand Deen</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="font-display text-stone-900 text-3xl font-semibold mb-1.5">
              Create account
            </h2>
            <p className="text-stone-500 text-sm font-body">
              Free forever. No ads. Just knowledge.
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 animate-fade-in">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-red-600 text-sm font-body">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-stone-700 mb-1.5">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Ahmad Al-Rashid"
                className={`deen-input ${errors.fullName ? 'deen-input-error' : ''}`}
              />
              {errors.fullName && (
                <p className="field-error">
                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`deen-input ${errors.email ? 'deen-input-error' : ''}`}
              />
              {errors.email && (
                <p className="field-error">
                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className={`deen-input pr-11 ${errors.password ? 'deen-input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-0.5"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Live password rule checklist */}
              {showPwRules && (
                <div className="mt-2.5 space-y-1.5 animate-fade-in">
                  {pwRuleStatus.map(({ label, passed }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${passed ? 'bg-deen-700 text-white' : 'bg-stone-200 text-stone-400'}`}>
                        <CheckIcon />
                      </div>
                      <span className={`text-xs font-body transition-colors duration-200 ${passed ? 'text-deen-700 font-medium' : 'text-stone-400'}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {errors.password && !showPwRules && (
                <p className="field-error">
                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={`deen-input pr-11 ${errors.confirmPassword ? 'deen-input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-0.5"
                  aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="field-error">
                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <>
                    <div className="spinner" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </div>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-stone-400 text-xs font-body">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Login link */}
          <p className="text-center text-stone-500 text-sm font-body">
            Already have an account?{' '}
            <Link to="/login" className="deen-link">
              Sign in
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}
