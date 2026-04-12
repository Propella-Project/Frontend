import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authApi } from "@/api/auth.api";
import { RocketLogo } from "@/components/logo/RocketLogo";
import { useNavigate } from "react-router-dom";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast.success("Reset link sent to your email!");
      setEmailSent(true);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; error?: string; email?: string[] };
        };
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.response?.data?.email?.[0] ||
        "Failed to send reset link. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold mt-4">
            {emailSent ? "Check Your Email" : "Forgot Password?"}
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {emailSent
              ? `We've sent a password reset link to ${email}`
              : "Enter your email and we'll send you a link to reset your password"}
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 bg-[#0F0C15] border-white/10 focus:border-[#8B5CF6]"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] hover:from-[#7C3AED] hover:to-[#8B5CF6] text-white font-semibold rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div className="bg-[#0F0C15] rounded-xl p-4 text-left">
              <p className="text-sm text-gray-400 mb-2">
                A password reset link has been sent to:
              </p>
              <p className="text-white font-medium">{email}</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Click the link in the email to reset your password. The link
                will expire in 24 hours.
              </p>
              <button
                onClick={() => setEmailSent(false)}
                className="text-sm text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
              >
                Didn't receive it? Try again
              </button>
            </div>
          </div>
        )}

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

export default ForgotPasswordPage;
