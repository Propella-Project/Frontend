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
import { useStore } from "@/store";

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
      const body = result.data as {
        data?: {
          access: string;
          refresh: string;
          user?: { id: number; email: string; username?: string };
          onboarding?: boolean;
        };
        access?: string;
        refresh?: string;
        onboarding?: boolean;
      };
      const payload = body?.data ?? body;
      const access = payload.access;
      const refresh = payload.refresh;
      const userFromApi = payload.user;
      const onboardingComplete = payload.onboarding ?? (body as { onboarding?: boolean }).onboarding ?? false;

      // Access token in cookie only – 24h expiry; when cookie expires, user is redirected to login
      setCookie("access_token", access, 1);
      setCookie("auth_token", access, 1);
      setCookie("refresh_token", refresh, 7);

      localStorage.setItem("propella_refresh_token", refresh);
      localStorage.setItem("refresh_token", refresh);
      authApi.setRefreshToken(refresh);
      // Sync token to localStorage for same-origin reads (getToken() prefers cookie; cookie expiry = 24h)
      authApi.setToken(access);

      if (userFromApi) {
        const userFromServer = userFromApi as Record<string, unknown>;
        const emailVal = (userFromApi.email ?? email) as string;
        const nicknameVal = (userFromServer.nickname as string) ?? (userFromApi.username as string) ?? email.split("@")[0];
        const userData = {
          user_id: String(userFromApi.id),
          email: emailVal,
          username: (userFromServer.username ?? userFromApi.username) as string | undefined,
          nickname: nicknameVal,
        };
        setUser(userData);
        localStorage.setItem("propella_user_id", String(userFromApi.id));
        authApi.saveUserAfterLogin({ id: userFromApi.id, email: emailVal, ...userFromServer });
      } else {
        try {
          const me = await authApi.getMe();
          if (me) {
            const userData = {
              user_id: String(me.id),
              email: me.email ?? email,
              username: me.username ?? undefined,
              nickname: me.nickname ?? me.username ?? email.split("@")[0],
            };
            setUser(userData);
            localStorage.setItem("propella_user_id", String(me.id));
            authApi.saveUserAfterLogin({ id: me.id, email: me.email, username: me.username, nickname: me.nickname });
          } else {
            setUser({ email, nickname: email.split("@")[0] });
          }
        } catch (err) {
          console.warn("[Login] getMe failed, using form email:", err);
          setUser({ email, nickname: email.split("@")[0] });
        }
      }

      setAuthenticated(true);

      if (onboardingComplete) {
        useStore.getState().setOnboardingComplete(true);
      }

      toast.success("Login successful!");
      setIsLoading(false);

      const returnTo =
        onboardingComplete
          ? "/dashboard"
          : (location.state?.returnTo ||
             sessionStorage.getItem("return_after_login") ||
             "/onboarding");

      sessionStorage.removeItem("return_after_login");

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
