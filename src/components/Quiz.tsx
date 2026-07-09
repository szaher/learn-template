"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/types";

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export default function Quiz({ questions, onComplete }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[currentIndex];
  const isCorrect = selected === q.correctIndex;

  const handleSubmit = () => {
    if (selected === null) return;
    const correct = selected === q.correctIndex;
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);
    setSubmitted(true);

    if (currentIndex === questions.length - 1) {
      setFinished(true);
      onComplete(newScore);
    }
  };

  const handleNext = () => {
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setSubmitted(false);
  };

  const handleRetry = () => {
    setSelected(null);
    setSubmitted(false);
  };

  if (finished) {
    return (
      <div className="my-6 p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
        <h3 className="text-lg font-semibold mb-2">Quiz Complete</h3>
        <p className="text-[var(--text-secondary)]">
          You got {score} out of {questions.length} correct.
        </p>
      </div>
    );
  }

  const feedbackForOption = (i: number): string | null => {
    if (!submitted) return null;
    if (i === q.correctIndex) return q.explanation || "Correct.";
    if (i === selected && q.distractorExplanations?.[i]) return q.distractorExplanations[i];
    if (i === selected) return q.explanation || "Incorrect.";
    return null;
  };

  return (
    <div className="my-6 p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
      <div className="text-xs text-[var(--text-secondary)] mb-3">
        Question {currentIndex + 1} of {questions.length}
      </div>

      <fieldset>
        <legend className="text-base font-medium mb-4">{q.question}</legend>

        <div className="space-y-2 mb-4">
          {q.options.map((opt, i) => {
            let style = "border-[var(--border)] hover:border-[var(--border-hover)]";
            let indicator = "";
            if (submitted && i === q.correctIndex) {
              style = "border-[var(--accent-green)] bg-[var(--accent-green)]/10";
              indicator = "✓ Correct";
            } else if (submitted && i === selected && !isCorrect) {
              style = "border-[var(--accent-red)] bg-[var(--accent-red)]/10";
              indicator = "✗ Incorrect";
            } else if (!submitted && i === selected) {
              style = "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10";
            }

            const feedback = feedbackForOption(i);

            return (
              <div key={i}>
                <label
                  className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer ${style} ${submitted ? "cursor-default" : ""}`}
                >
                  <input
                    type="radio"
                    name={`quiz-q-${currentIndex}`}
                    value={i}
                    checked={selected === i}
                    onChange={() => !submitted && setSelected(i)}
                    disabled={submitted}
                    className="accent-[var(--accent-blue)]"
                  />
                  <span className="flex-1">{opt}</span>
                  {indicator && (
                    <span className="text-xs font-medium shrink-0">{indicator}</span>
                  )}
                </label>
                {feedback && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1 ml-10 p-2 rounded bg-[var(--bg-tertiary)]">
                    {feedback}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite" className="sr-only">
        {submitted && (
          isCorrect
            ? "Correct answer."
            : `Incorrect. The correct answer is: ${q.options[q.correctIndex]}.`
        )}
      </div>

      <div className="flex justify-end gap-2">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--accent-blue)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Submit
          </button>
        ) : (
          <>
            {!isCorrect && !finished && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-colors"
              >
                Retry
              </button>
            )}
            {currentIndex < questions.length - 1 && !finished && (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--accent-blue)] text-white hover:opacity-90 transition-opacity"
              >
                Next
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
