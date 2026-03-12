import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { login } from "@/lib/api";
import { authApi } from "@/api/auth.api";
import { setCookie } from "@/lib/cookies";
import { RocketLogo } from "@/components/logo/RocketLogo";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "@/state/user.store";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setAuthenticated } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    const result = await login({ email, password });
    
    if (result.success && result.data) {
      const access = result.data.access;
      const refresh = result.data.refresh;

      // Store tokens in all names used by the app (How_it_works.md §4: access + refresh)
      localStorage.setItem("propella_token", access);
      localStorage.setItem("access_token", access);
      localStorage.setItem("auth_token", access);
      localStorage.setItem("propella_refresh_token", refresh);
      localStorage.setItem("refresh_token", refresh);

      authApi.setToken(access);
      authApi.setRefreshToken(refresh);

      // Cookies for cross-subdomain (e.g. dashboard.propella.ng)
      setCookie("auth_token", access, 7);
      setCookie("access_token", access, 7);
      setCookie("refresh_token", refresh, 7);

      // Fetch current user and persist in store (so login state survives reload)
      try {
        const me = await authApi.getMe();
        const userData = {
          user_id: String(me.id),
          email: me.email ?? email,
          username: me.username ?? undefined,
          nickname: me.nickname ?? me.username ?? email.split("@")[0],
        };
        setUser(userData);
        localStorage.setItem("propella_user_id", String(me.id));
      } catch (err) {
        console.warn("[Login] getMe failed, using form email:", err);
        setUser({ email, nickname: email.split("@")[0] });
      }

      setAuthenticated(true);
      
      toast.success("Login successful!");
      setIsLoading(false);
      
      // Check if there's a return URL (for payment callbacks, etc)
      const returnTo = location.state?.returnTo || 
                       sessionStorage.getItem("return_after_login") ||
                       "/dashboard";
      
      // Clear the stored return URL
      sessionStorage.removeItem("return_after_login");
      
      console.log("[Login] Navigating to:", returnTo);
      
      // Longer delay to ensure Zustand state is persisted and propagated
      // This prevents the redirect loop caused by race conditions
      setTimeout(() => {
        navigate(returnTo, { replace: true });
      }, 500);
    } else {
      setIsLoading(false);
      toast.error(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0F0C15]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1A1625] rounded-2xl border border-white/10 p-8"
      >
        <div className="text-center mb-6">
          <RocketLogo className="w-16 h-16 mx-auto" />
          <h1 className="text-2xl font-bold mt-4">Welcome Back</h1>
          <p className="text-gray-400 text-sm">
            Log in to your PROPELLA account
          </p>
        </div>

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

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
            {isLoading ? "Logging in..." : "Log In"}
            {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
          >
            Join the waitlist
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
