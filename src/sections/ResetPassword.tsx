import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authApi } from "@/api/auth.api";
import { RocketLogo } from "@/components/logo/RocketLogo";
import { useNavigate, useParams } from "react-router-dom";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { uid, token } = useParams<{ uid: string; token: string }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate uid and token exist
  useEffect(() => {
    if (!uid || !token) {
      toast.error("Invalid or missing reset credentials");
    }
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uid || !token) {
      toast.error("Invalid reset credentials");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(uid, token, {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success("Password reset successful!");
      setSuccess(true);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
            error?: string;
            new_password?: string[];
            confirm_password?: string[];
          };
        };
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.response?.data?.new_password?.[0] ||
        axiosError.response?.data?.confirm_password?.[0] ||
        "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0F0C15]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#1A1625] rounded-2xl border border-white/10 p-8 text-center"
        >
          <RocketLogo className="w-16 h-16 mx-auto mb-6" />
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">
            Password Reset Successful!
          </h1>
          <p className="text-gray-400 mb-8">
            Your password has been reset successfully. You can now log in with
            your new password.
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="w-full h-12 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] hover:from-[#7C3AED] hover:to-[#8B5CF6] text-white font-semibold rounded-xl"
          >
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  // Show error if no uid or token
  if (!uid || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0F0C15]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#1A1625] rounded-2xl border border-white/10 p-8 text-center"
        >
          <RocketLogo className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4 text-red-500">Invalid Link</h1>
          <p className="text-gray-400 mb-8">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Button
            onClick={() => navigate("/forgot-password")}
            className="w-full h-12 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] hover:from-[#7C3AED] hover:to-[#8B5CF6] text-white font-semibold rounded-xl"
          >
            Request New Link
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0F0C15]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1A1625] rounded-2xl border border-white/10 p-8"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to login</span>
        </button>

        <div className="text-center mb-6">
          <RocketLogo className="w-16 h-16 mx-auto" />
          <h1 className="text-2xl font-bold mt-4">Reset Password</h1>
          <p className="text-gray-400 text-sm mt-2">
            Create a new password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pl-10 bg-[#0F0C15] border-white/10 focus:border-[#8B5CF6]"
                required
                minLength={8}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pl-10 bg-[#0F0C15] border-white/10 focus:border-[#8B5CF6]"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="rounded border-gray-600 bg-[#0F0C15] text-[#8B5CF6] focus:ring-[#8B5CF6]"
            />
            <label htmlFor="showPassword" className="text-sm text-gray-400">
              Show password
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] hover:from-[#7C3AED] hover:to-[#8B5CF6] text-white font-semibold rounded-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
          >
            Log in
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default ResetPasswordPage;
