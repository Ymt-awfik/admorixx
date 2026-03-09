'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const { signup, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pw)) return 'Password must include an uppercase letter';
    if (!/[a-z]/.test(pw)) return 'Password must include a lowercase letter';
    if (!/[0-9]/.test(pw)) return 'Password must include a number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pwError = validatePassword(formData.password);
    if (pwError) { toast.error(pwError); return; }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...signupData } = formData;
      await signup(signupData);
      toast.success('Account created! Let\'s connect your ad accounts.');
      router.push('/connect-ad-accounts');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = () => {
    const pw = formData.password;
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthScore = pwStrength();
  const strengthLabel = strengthScore === null ? null : strengthScore <= 2 ? 'Weak' : strengthScore <= 3 ? 'Fair' : strengthScore <= 4 ? 'Good' : 'Strong';
  const strengthColor = strengthScore === null ? '' : strengthScore <= 2 ? 'bg-red-400' : strengthScore <= 3 ? 'bg-yellow-400' : strengthScore <= 4 ? 'bg-blue-400' : 'bg-green-500';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="public" />
      <div className="flex items-center justify-center py-12 px-4">
        <div className="card max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-500 text-sm">Start optimizing your ad campaigns with AI</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input type="text" name="firstName" className="input" placeholder="John" value={formData.firstName} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input type="text" name="lastName" className="input" placeholder="Doe" value={formData.lastName} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="label">Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" className="input" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
            </div>

            <div>
              <label className="label">Password <span className="text-red-500">*</span></label>
              <input type="password" name="password" className="input" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={8} />
              {/* Strength bar */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`flex-1 rounded-full ${strengthScore && strengthScore >= i ? strengthColor : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${strengthScore! <= 2 ? 'text-red-500' : strengthScore! <= 3 ? 'text-yellow-600' : strengthScore! <= 4 ? 'text-blue-600' : 'text-green-600'}`}>
                    {strengthLabel} — Min 8 chars, uppercase, lowercase, number
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm Password <span className="text-red-500">*</span></label>
              <input type="password" name="confirmPassword" className="input" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 && (
                <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading || (formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword)}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-primary-600 hover:underline font-medium">Log in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
