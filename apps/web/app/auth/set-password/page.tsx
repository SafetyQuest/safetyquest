"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";

export default function SetPasswordPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password validation state
  const [validations, setValidations] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
    passwordsMatch: false
  });

  // Validate password in real-time
  useEffect(() => {
    setValidations({
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*]/.test(newPassword),
      passwordsMatch: newPassword === confirmPassword && newPassword.length > 0
    });
  }, [newPassword, confirmPassword]);

  const isPasswordValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Please meet all password requirements");
      return;
    }

    setIsLoading(true);

    try {
      // Call API to change password
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      // Update session to reflect password change
      await update({ mustChangePassword: false });

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        // Determine redirect based on role
        const legacyAdmin = session?.user?.role === 'ADMIN';
        const hasAdminPermissions = session?.user?.roleModel?.permissions?.some(
          (p: any) => !['programs.view', 'courses.view', 'lessons.view', 'quizzes.view', 'badges.view'].includes(p.name)
        );
        
        if (legacyAdmin || hasAdminPermissions) {
          router.push('/admin');
        } else {
          router.push('/learn/dashboard');
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <div className="mb-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Changed Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your password has been updated. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="text-3xl font-bold text-blue-600">TETRA PAK</div>
            <div className="text-sm text-gray-600 mt-1">Safety Training Platform</div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Set Your Password</h1>
          <p className="text-gray-600 mt-2">
            For security, please create a new password
          </p>
        </div>

        {/* Alert Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <Lock className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
            <div className="text-sm text-yellow-700">
              <strong>Required:</strong> You must change your temporary password before accessing the system.
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <XCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</p>
            <div className="space-y-2">
              <ValidationItem
                text="At least 8 characters"
                isValid={validations.minLength}
              />
              <ValidationItem
                text="One uppercase letter"
                isValid={validations.hasUppercase}
              />
              <ValidationItem
                text="One lowercase letter"
                isValid={validations.hasLowercase}
              />
              <ValidationItem
                text="One number"
                isValid={validations.hasNumber}
              />
              <ValidationItem
                text="One special character (!@#$%^&*)"
                isValid={validations.hasSpecial}
              />
              <ValidationItem
                text="Passwords match"
                isValid={validations.passwordsMatch}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isPasswordValid || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors
              ${isPasswordValid && !isLoading
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-gray-300 cursor-not-allowed'
              }`}
          >
            {isLoading ? 'Changing Password...' : 'Set New Password'}
          </button>
        </form>

        {/* User Info */}
        {session?.user && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Logged in as: <strong>{session.user.email}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ValidationItem({ text, isValid }: { text: string; isValid: boolean }) {
  return (
    <div className="flex items-center space-x-2">
      {isValid ? (
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
      )}
      <span className={`text-sm ${isValid ? 'text-green-700' : 'text-gray-600'}`}>
        {text}
      </span>
    </div>
  );
}