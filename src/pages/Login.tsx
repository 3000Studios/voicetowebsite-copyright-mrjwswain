import React from "react";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Github, LogIn } from "lucide-react";

export const Login = () => {
  const {
    loginWithGoogle,
    loginWithGithub,
    loginWithEmail,
    registerWithEmail,
    authError,
    user,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = React.useState<"signin" | "create">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    setMode(params.get("mode") === "create" ? "create" : "signin");
  }, [location.search]);

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (mode === "signin") {
      await loginWithEmail(email, password);
    } else {
      await registerWithEmail({ email, password, phone, username });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-white/5 backdrop-blur-3xl border border-white/10 p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
        <h2 className="text-3xl md:text-4xl font-black text-white mb-3 uppercase tracking-tight">
          Account Access
        </h2>
        <p className="text-slate-400 mb-8">
          Sign in with Google, GitHub, or email. New users can create an account
          with phone, email, and password. Create-account users can opt into
          weekly product updates and promotions.
        </p>

        <div className="flex mb-6 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              mode === "signin"
                ? "bg-indigo-500/30 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("create")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              mode === "create"
                ? "bg-indigo-500/30 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="grid gap-3 mb-6">
          <button
            onClick={loginWithGoogle}
            className="w-full py-3 bg-white text-black font-semibold flex items-center justify-center gap-3 rounded-lg hover:bg-slate-200 transition"
          >
            <LogIn size={18} />
            Continue with Google
          </button>
          <button
            onClick={loginWithGithub}
            className="w-full py-3 bg-slate-900 text-white font-semibold flex items-center justify-center gap-3 rounded-lg border border-white/20 hover:bg-slate-800 transition"
          >
            <Github size={18} />
            Continue with GitHub
          </button>
        </div>

        <form onSubmit={onEmailSubmit} className="space-y-3">
          {mode === "create" && (
            <>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Full name"
                required
                className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-indigo-400"
              />
            <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                required
                className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-indigo-400"
              />
              <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-indigo-500" />
                <span>
                  Email me weekly promotions, product updates, and launch tips.
                </span>
              </label>
            </>
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            required
            className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-indigo-400"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "create" ? "Create password" : "Password"}
            type="password"
            required
            className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-indigo-400"
          />
          <button
            disabled={submitting}
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition disabled:opacity-60"
          >
            {submitting
              ? "Please wait..."
              : mode === "signin"
                ? "Sign In with Email"
                : "Create Account"}
          </button>
        </form>

        {authError && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {authError}
          </div>
        )}
      </motion.div>
    </div>
  );
};
