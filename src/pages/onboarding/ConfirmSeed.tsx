import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Check, X, RotateCcw } from "lucide-react";

const CORRECT_ORDER = [
  "quantum", "nebula", "cipher", "vertex", "prism", "oracle",
  "lattice", "epoch", "radix", "flux", "nexus", "cipher",
];

export default function ConfirmSeed() {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState(false);

  const shuffled = useMemo(
    () => [...CORRECT_ORDER].sort(() => Math.random() - 0.5),
    []
  );

  const handleWordClick = (word: string) => {
    if (selected.includes(word)) {
      setSelected((prev) => prev.filter((w) => w !== word));
      setError(false);
      return;
    }
    if (selected.length >= 12) return;
    const next = [...selected, word];
    setSelected(next);
    if (next.length === 12) {
      const isCorrect = next.every((w, i) => w === CORRECT_ORDER[i]);
      setError(!isCorrect);
    }
  };

  const handleReset = () => {
    setSelected([]);
    setError(false);
  };

  const isComplete = selected.length === 12;
  const isCorrect = isComplete && !error;

  return (
    <div className="min-h-screen bg-void flex flex-col px-4 py-8">
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-cyan/10 rounded-full flex items-center justify-center">
            <span className="text-cyan font-mono text-xs font-bold">02</span>
          </div>
          <span className="font-mono text-xs text-text-secondary">of 3</span>
        </div>
        <h1 className="font-heading text-2xl text-text-primary">Verify Your Backup</h1>
        <p className="mt-2 text-text-secondary text-sm">
          Tap the words in the correct order to confirm you've saved your seed phrase.
        </p>
      </div>

      {/* Selected Slots */}
      <div className="max-w-md mx-auto w-full mt-8">
        <div className="grid grid-cols-3 gap-2 min-h-[160px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`border p-3 text-center transition-colors ${
                selected[i]
                  ? error && i >= selected.length - 1
                    ? "border-red/50 bg-red/5"
                    : "border-cyan/50 bg-cyan/5"
                  : "border-white/5 bg-obsidian"
              }`}
            >
              <span className="font-mono text-[10px] text-text-tertiary block">
                {i + 1}
              </span>
              {selected[i] && (
                <span className="font-mono text-sm text-text-primary">{selected[i]}</span>
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-2 text-red text-xs font-mono flex items-center gap-1">
            <X size={12} /> Incorrect order. Try again.
          </p>
        )}
        {isCorrect && (
          <p className="mt-2 text-cyan text-xs font-mono flex items-center gap-1">
            <Check size={12} /> Perfect! Your backup is verified.
          </p>
        )}
      </div>

      {/* Word Chips */}
      <div className="max-w-md mx-auto w-full mt-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {shuffled.map((word, i) => {
            const isSelected = selected.includes(word);
            return (
              <button
                key={`${word}-${i}`}
                onClick={() => handleWordClick(word)}
                className={`px-4 py-2 font-mono text-sm border transition-all ${
                  isSelected
                    ? "border-cyan/30 bg-cyan/5 text-cyan"
                    : "border-white/10 bg-obsidian text-text-secondary hover:border-white/20"
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="max-w-md mx-auto w-full mt-auto pt-8 flex gap-3">
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 px-6 py-4 border border-white/10 text-text-secondary font-mono text-sm hover:border-white/20 transition-all"
        >
          <RotateCcw size={14} />
          Start Over
        </button>
        {isCorrect ? (
          <Link
            to="/set-password"
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all"
          >
            Continue
          </Link>
        ) : (
          <button
            disabled
            className="flex-1 py-4 bg-white/5 text-text-tertiary font-mono text-sm cursor-not-allowed"
          >
            Confirm
          </button>
        )}
      </div>
    </div>
  );
}
