"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  MessageSquarePlus,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { findGame, nid } from "../../lib/engine";
import { hhmm, ymd } from "../../lib/format";
import { getQuizForMarket, type QuizQuestion } from "../../lib/quizData";
import { useStore } from "../../lib/store";
import type { Nav } from "../nav";
import { Header, useSession } from "../ui";

export function QuizSection({
  nav,
  gameId,
  title,
}: {
  nav: Nav;
  gameId?: number;
  title?: string;
}) {
  const { state } = useStore();
  const { toast } = useSession();
  const game = gameId ? findGame(state, gameId) : undefined;
  const quizTitle = title || (game ? `${game.name} Quiz` : state.settings.quizTitle || "Educational Quiz");

  const totalTime = state.settings.quizTimeLimit || 90;
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    getQuizForMarket(game?.name, 10)
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [submitted, setSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Countdown timer
  useEffect(() => {
    if (submitted) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [submitted]);

  const fmtTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleSelect = (optIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      finishQuiz();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
    }
  };

  const finishQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);
    toast("Quiz completed! View your score below.", "ok");
  };

  const restartQuiz = () => {
    setQuestions(getQuizForMarket(game?.name, 10));
    setAnswers({});
    setCurrentIdx(0);
    setTimeLeft(totalTime);
    setSubmitted(false);
    setShowReview(false);
  };

  // Score calculation
  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answerIndex) {
        correct++;
      }
    });
    return correct;
  }, [questions, answers]);

  const percentage = Math.round((score / questions.length) * 100);

  const currentQ = questions[currentIdx];
  const selectedOpt = answers[currentIdx];

  return (
    <>
      <Header
        title={submitted ? "Quiz Result" : "Quiz Section"}
        onBack={() => {
          if (!submitted && Object.keys(answers).length > 0) {
            if (window.confirm("Do you want to quit the current quiz?")) {
              nav.back();
            }
          } else {
            nav.back();
          }
        }}
      />

      <div className="px-3 pt-3 pb-8 max-w-lg mx-auto">
        {!submitted ? (
          <div className="space-y-4">
            {/* Header info box */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#13306f]">{quizTitle}</h2>
                  <div className="text-xs text-slate-500 mt-0.5">Test your market analysis & logic</div>
                </div>
                {/* Red Timer badge as shown in reference */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs tracking-wider shadow-sm animate-pulse">
                  <Clock size={14} />
                  <span>Time left: {fmtTimer(timeLeft)}</span>
                </div>
              </div>

              {/* Progress bar and question count */}
              <div className="mt-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
                  <span className="text-blue-700 font-bold">
                    Questions {currentIdx + 1} of {questions.length}
                  </span>
                  <span>{Math.round(((currentIdx + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">
                Question {currentIdx + 1}
              </div>
              <h3 className="text-base font-bold text-slate-800 leading-snug">
                {currentQ.question}
              </h3>

              {/* Options list matching Google Play style */}
              <div className="mt-5 space-y-2.5">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedOpt === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelect(optIdx)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-center justify-between text-sm font-medium ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-sm"
                          : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {currentIdx > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm shadow-sm active:scale-95 transition"
                >
                  Previous
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#13306f] to-[#1f45a8] text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>{currentIdx === questions.length - 1 ? "Submit Quiz" : "Next"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Result Screen */
          <div className="space-y-4 fadein">
            <div
              className="rounded-3xl p-6 text-white text-center shadow-lg relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0d2463, #1f45a8)" }}
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-3 text-[#f5c542]">
                {percentage >= 70 ? (
                  <Trophy size={36} />
                ) : percentage >= 40 ? (
                  <Award size={36} />
                ) : (
                  <Sparkles size={36} />
                )}
              </div>

              <div className="text-xs font-semibold text-blue-200 uppercase tracking-widest">
                Quiz Summary
              </div>
              <h2 className="text-2xl font-black mt-1">
                {percentage >= 80
                  ? "Master Analyst! 🎯"
                  : percentage >= 50
                  ? "Good Performance! 👏"
                  : "Keep Practicing! 📚"}
              </h2>
              <p className="text-xs text-white/80 mt-1">{quizTitle}</p>

              <div className="my-5 flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-[#f5c542]">{score}</div>
                  <div className="text-[11px] text-blue-100 uppercase tracking-wider">Score</div>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-white">{percentage}%</div>
                  <div className="text-[11px] text-blue-100 uppercase tracking-wider">Accuracy</div>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-white">{questions.length}</div>
                  <div className="text-[11px] text-blue-100 uppercase tracking-wider">Total Qs</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={restartQuiz}
                  className="py-2.5 px-4 rounded-xl bg-white text-[#13306f] font-bold text-xs shadow hover:bg-white/90 active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} /> Play Again
                </button>
                <button
                  type="button"
                  onClick={() => setShowReview(!showReview)}
                  className="py-2.5 px-4 rounded-xl bg-white/15 text-white font-bold text-xs border border-white/20 hover:bg-white/25 active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <BookOpen size={14} /> {showReview ? "Hide Answers" : "Review Answers"}
                </button>
              </div>
            </div>

            {/* Answers Review */}
            {showReview && (
              <div className="space-y-3 fadein">
                <h3 className="text-sm font-bold text-slate-800 px-1 flex items-center gap-1.5">
                  <HelpCircle size={16} className="text-blue-600" /> Question Explanations
                </h3>
                {questions.map((q, idx) => {
                  const userAns = answers[idx];
                  const isCorrect = userAns === q.answerIndex;
                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-800">
                          {idx + 1}. {q.question}
                        </span>
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold shrink-0 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 size={13} /> Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-600 font-bold shrink-0 bg-rose-50 px-2 py-0.5 rounded-md">
                            <XCircle size={13} /> Wrong
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl space-y-1">
                        <div className="text-slate-600">
                          <b>Your Answer:</b>{" "}
                          <span className={isCorrect ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                            {userAns !== undefined ? q.options[userAns] : "Not answered"}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="text-slate-700">
                            <b>Correct Answer:</b>{" "}
                            <span className="text-emerald-600 font-semibold">{q.options[q.answerIndex]}</span>
                          </div>
                        )}
                        <div className="text-slate-500 pt-1 border-t border-slate-200 mt-1 italic">
                          💡 {q.explanation}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Next Steps */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => nav.push({ name: "submitIdea" })}
                className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-sm hover:bg-slate-50 active:scale-95 transition"
              >
                <Lightbulb size={20} className="mx-auto text-amber-500 mb-1" />
                <div className="text-xs font-bold text-slate-800">Submit Idea</div>
                <div className="text-[10px] text-slate-500">Suggest new questions</div>
              </button>
              <button
                type="button"
                onClick={() => nav.reset({ name: "home" })}
                className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-sm hover:bg-slate-50 active:scale-95 transition"
              >
                <Award size={20} className="mx-auto text-blue-600 mb-1" />
                <div className="text-xs font-bold text-slate-800">Explore Markets</div>
                <div className="text-[10px] text-slate-500">More quiz categories</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function SubmitIdea({ nav }: { nav: Nav }) {
  const { update } = useStore();
  const { user, toast } = useSession();
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("Quiz Topic");
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    "Quiz Topic",
    "New Question Suggestion",
    "Market Timing Accuracy",
    "App Feedback",
    "Other",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      toast("Please enter your note or suggestion", "bad");
      return;
    }

    update((d) => {
      d.ideas.push({
        id: nid(d),
        userId: user.id,
        userName: user.name || "Student / User",
        userMobile: user.mobile || "",
        note: note.trim(),
        category,
        date: ymd(),
        time: hhmm(),
      });
    });

    setSubmitted(true);
    setNote("");
    toast("Thank you! Your idea has been submitted to the admin team.", "ok");
  };

  return (
    <>
      <Header title="Submit Idea" onBack={nav.back} />
      <div className="px-3 pt-3 pb-8 max-w-lg mx-auto">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Lightbulb size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Submit Your Note / Idea</h2>
              <p className="text-xs text-slate-500">
                Help us improve educational content and quiz questions
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Idea Submitted Successfully!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Our educational review team will check your suggestion. Thank you for contributing!
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="py-2.5 px-6 rounded-xl bg-[#13306f] text-white font-bold text-xs shadow active:scale-95 transition"
                >
                  Submit Another Idea
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        category === c
                          ? "bg-[#13306f] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Enter Your Note / Idea
                </label>
                <textarea
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Type your feedback, quiz questions, market calculation ideas here..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm text-slate-800 placeholder-slate-400 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#13306f] to-[#1f45a8] text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <Send size={16} /> Submit Idea
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export function QuizInstructions({ nav }: { nav: Nav }) {
  return (
    <>
      <Header title="Quiz Guidelines" onBack={nav.back} />
      <div className="px-3 pt-3 pb-8 max-w-lg mx-auto space-y-3 text-slate-700 text-xs">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-[#13306f] font-bold text-sm">
            <BookOpen size={18} /> How To Play Quizzes
          </div>
          <p className="leading-relaxed text-slate-600">
            Welcome to the Educational Quiz Platform! Our goal is to test and improve your understanding of market math, analytical indicators, timing schedules, and chart evaluations.
          </p>

          <div className="space-y-2.5 pt-2">
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
              <span>Select any market or category to start a 10-question educational test.</span>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
              <span>Answer each multiple-choice question within the countdown timer (90 seconds).</span>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
              <span>Tap Next to proceed. When done, view your final score and detailed explanations for each answer.</span>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
              <span>Submit new questions and suggestions via the <b>Submit Idea</b> section.</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-xs">
            <AlertCircle size={15} className="text-amber-600" /> Educational Disclaimer
          </div>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            This quiz application is strictly designed for educational, knowledge testing, and mathematical analysis purposes only. No real money gambling or bidding is supported in Quiz Mode.
          </p>
        </div>
      </div>
    </>
  );
}
