import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => navigate("/welcome"), 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, navigate]);

  return (
    <div className="fixed inset-0 bg-void flex flex-col items-center justify-center">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="relative">
        <div className="w-24 h-24 animate-pulse-glow rounded-full flex items-center justify-center">
          <img
            src="data:image/svg+xml,%3Csvg width='128' height='128' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='sg' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%2306F5D6'/%3E%3Cstop offset='100%25' stop-color='%230EA5E9'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='32' cy='32' r='30' fill='%230A1628'/%3E%3Ccircle cx='32' cy='32' r='29' fill='none' stroke='url(%23sg)' stroke-width='1.5' opacity='0.5'/%3E%3Ctext x='32' y='42' text-anchor='middle' font-family='Arial Black,sans-serif' font-weight='900' font-size='32' fill='url(%23sg)'%3EN%3C/text%3E%3C/svg%3E" alt="Nautica"
            className="w-20 h-20 object-contain animate-float"
          />
        </div>
        {/* Orbiting ring */}
        <div
          className="absolute inset-0 border border-cyan/20 rounded-full"
          style={{ animation: "spin 4s linear infinite" }}
        />
      </div>

      {/* Text */}
      <h1 className="mt-8 font-heading text-2xl tracking-widest text-text-primary">
        NAUTICA
      </h1>
      <p className="mt-2 font-mono text-xs text-text-secondary tracking-wider">
        Initializing secure enclave...
      </p>

      {/* Progress bar */}
      <div className="mt-8 w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 font-mono text-[10px] text-text-tertiary">
        {progress}%
      </p>
    </div>
  );
}
