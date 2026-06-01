import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Check, Lock, ArrowRight } from "lucide-react";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const checks = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const strength = Object.values(checks).filter(Boolean).length;
  const strengthColor =
    strength <= 1 ? "bg-red" : strength <= 2 ? "bg-amber" : "bg-cyan";
  const match = password.length > 0 && password === confirm;
  const canContinue = strength >= 3 && match;

  return (
    <div className="min-h-screen bg-void flex flex-col px-4 py-8">
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-cyan/10 rounded-full flex items-center justify-center">
            <span className="text-cyan font-mono text-xs font-bold">03</span>
          </div>
          <span className="font-mono text-xs text-text-secondary">of 3</span>
        </div>
        <h1 className="font-heading text-2xl text-text-primary">Create Password</h1>
        <p className="mt-2 text-text-secondary text-sm">
          This password will encrypt your wallet locally.
        </p>
      </div>

      <div className="max-w-md mx-auto w-full mt-8 space-y-6">
        {/* Password Input */}
        <div>
          <label className="block font-mono text-xs text-text-secondary mb-2">
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-obsidian border border-white/10 pl-10 pr-10 py-3 text-text-primary font-mono text-sm placeholder:text-text-tertiary focus:outline-none focus:border-cyan"
              placeholder="Enter password"
            />
            <button
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Strength Meter */}
        <div>
          <div className="flex gap-1 h-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex-1 transition-colors ${
                  i <= strength ? strengthColor : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 font-mono text-xs text-text-secondary">
            {strength <= 1
              ? "Weak"
              : strength <= 2
              ? "Fair"
              : strength === 3
              ? "Good"
              : "Strong"}
          </p>
        </div>

        {/* Requirements */}
        <div className="space-y-2">
          {[
            { label: "At least 8 characters", pass: checks.length },
            { label: "One uppercase letter", pass: checks.upper },
            { label: "One number", pass: checks.number },
            { label: "One special character", pass: checks.symbol },
          ].map((req) => (
            <div key={req.label} className="flex items-center gap-2">
              <div
                className={`w-4 h-4 border flex items-center justify-center ${
                  req.pass ? "border-cyan bg-cyan/10" : "border-white/20"
                }`}
              >
                {req.pass && <Check size={10} className="text-cyan" />}
              </div>
              <span
                className={`font-mono text-xs ${
                  req.pass ? "text-text-primary" : "text-text-tertiary"
                }`}
              >
                {req.label}
              </span>
            </div>
          ))}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block font-mono text-xs text-text-secondary mb-2">
            Confirm Password
          </label>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-obsidian border border-white/10 px-4 py-3 text-text-primary font-mono text-sm placeholder:text-text-tertiary focus:outline-none focus:border-cyan"
            placeholder="Confirm password"
          />
          {confirm.length > 0 && !match && (
            <p className="mt-1 text-red text-xs font-mono">Passwords do not match</p>
          )}
        </div>
      </div>

      {/* Continue */}
      <div className="max-w-md mx-auto w-full mt-auto pt-8">
        {canContinue ? (
          <Link
            to="/success"
            className="flex items-center justify-center gap-2 w-full py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all"
          >
            Continue
            <ArrowRight size={16} />
          </Link>
        ) : (
          <button
            disabled
            className="w-full py-4 bg-white/5 text-text-tertiary font-mono text-sm cursor-not-allowed"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
