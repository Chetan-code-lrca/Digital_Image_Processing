"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { modules, comparisons, codeExamples, type ModuleId, type Lesson } from "@/lib/content";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  buildQuestionPool,
  buildStudyCards,
  createEmptyLearningProgress,
  updateLearningStat,
  type LearningProgress,
  type PracticeDifficulty,
  type PracticeMode,
  type StudyCard,
  type StudyQuestion,
} from "@/lib/learning-engine";

type View = "home" | "notes" | "quiz" | "cards" | "planner" | "compare" | "code";
type Task = { id: string; title: string; day: string; minutes: number; module: ModuleId; done: boolean };
type Saved = { completed: string[]; tasks: Task[]; hours: number; goal: string; learning: LearningProgress };
const KEY = "dip-studio-progress-v1";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const accent: Record<ModuleId, string> = { M1: "violet", M2: "cyan", M3: "amber", M4: "rose", M5: "green" };
const emptyState: Saved = {
  completed: [],
  tasks: [],
  hours: 2,
  goal: "GATE + university exams",
  learning: createEmptyLearningProgress(),
};

function normalizeSaved(data: Partial<Saved>): Saved {
  const learning = data.learning;
  return {
    ...emptyState,
    ...data,
    completed: Array.isArray(data.completed) ? data.completed : [],
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    learning: {
      ...createEmptyLearningProgress(),
      ...(learning ?? {}),
      topicStats: learning?.topicStats ?? {},
      cardStats: learning?.cardStats ?? {},
      sessions: Array.isArray(learning?.sessions) ? learning.sessions : [],
    },
  };
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [moduleId, setModuleId] = useState<ModuleId>("M1");
  const [topicId, setTopicId] = useState(modules[0].topics[0].id);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Saved>(emptyState);
  const [ready, setReady] = useState(false);
  const [cardModule, setCardModule] = useState<"all" | ModuleId>("all");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizModule, setQuizModule] = useState<"all" | ModuleId>("all");
  const [quizIndex, setQuizIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("mixed");
  const [practiceDifficulty, setPracticeDifficulty] = useState<PracticeDifficulty>("all");
  const [practiceCount, setPracticeCount] = useState(10);
  const [practiceQuestions, setPracticeQuestions] = useState<StudyQuestion[]>([]);
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [sessionStartMs, setSessionStartMs] = useState<number | null>(null);
  const [cardQueue, setCardQueue] = useState<"all" | "due">("due");
  const [comparisonId, setComparisonId] = useState(comparisons[0].id);
  const [codeModule, setCodeModule] = useState<"all" | ModuleId>("all");
  const [codeSearch, setCodeSearch] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [syncState, setSyncState] = useState<"local" | "syncing" | "synced" | "error" | "off">("local");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [newTask, setNewTask] = useState("");
  const [newTaskModule, setNewTaskModule] = useState<ModuleId>("M1");
  const [hours, setHours] = useState(2);
  const [goal, setGoal] = useState(emptyState.goal);
  const [toast, setToast] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw) as Partial<Saved>;
        setSaved(normalizeSaved(data));
        setHours(data.hours ?? 2);
        setGoal(data.goal ?? emptyState.goal);
      }
    } catch {
      setToast("Saved progress could not be read. The existing browser data was not changed.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      setSyncState("off");
      return;
    }

    let active = true;

    async function loadAccount(nextUser: User | null) {
      setUser(nextUser);
      setAccountOpen(false);

      if (!nextUser) {
        setCloudReady(false);
        setSyncState("local");
        try {
          const raw = localStorage.getItem(KEY);
          if (raw) {
            const data = JSON.parse(raw) as Partial<Saved>;
            setSaved(normalizeSaved(data));
            setHours(data.hours ?? 2);
            setGoal(data.goal ?? emptyState.goal);
          } else {
            setSaved(emptyState);
            setHours(2);
            setGoal(emptyState.goal);
          }
        } catch {
          setSyncState("error");
        }
        return;
      }

      const accountKey = KEY + ":" + nextUser.id;
      setCloudReady(false);
      setSyncState("syncing");
      const { data, error } = await supabase
        .from("user_progress")
        .select("progress")
        .eq("user_id", nextUser.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        const accountRaw = localStorage.getItem(accountKey);
        const guestRaw = accountRaw ? null : localStorage.getItem(KEY);
        const fallbackRaw = accountRaw ?? guestRaw;

        if (fallbackRaw) {
          try {
            const progress = JSON.parse(fallbackRaw) as Partial<Saved>;
            setSaved({
              ...emptyState,
              ...progress,
              completed: Array.isArray(progress.completed) ? progress.completed : [],
              tasks: Array.isArray(progress.tasks) ? progress.tasks : []
            });
            setHours(progress.hours ?? 2);
            setGoal(progress.goal ?? emptyState.goal);
            localStorage.setItem(accountKey, JSON.stringify({ ...emptyState, ...progress }));
          } catch {
            setSyncState("error");
          }
        } else {
          setSaved(emptyState);
          setHours(2);
          setGoal(emptyState.goal);
        }

        // Never leave an unscoped guest record available for another account.
        if (guestRaw) localStorage.removeItem(KEY);
        setCloudReady(false);
        setSyncState("error");
        notify("Account signed in, but cloud progress is not ready. Finish the database setup guide.");
        return;
      }

      if (data?.progress) {
        const progress = data.progress as Partial<Saved>;
        setSaved(normalizeSaved(progress));
        setHours(progress.hours ?? 2);
        setGoal(progress.goal ?? emptyState.goal);
        // Do not leave a shared guest record available to a different account on this device.
        localStorage.removeItem(KEY);
      } else {
        // Rehydrate this account's own browser cache first. Only the first account
        // on a device can claim the guest record; it is removed after migration.
        const accountRaw = localStorage.getItem(accountKey);
        const guestRaw = accountRaw ? null : localStorage.getItem(KEY);
        const raw = accountRaw ?? guestRaw;

        if (raw) {
          try {
            const progress = JSON.parse(raw) as Partial<Saved>;
            setSaved(normalizeSaved(progress));
            setHours(progress.hours ?? 2);
            setGoal(progress.goal ?? emptyState.goal);
            localStorage.setItem(accountKey, JSON.stringify({ ...emptyState, ...progress }));
          } catch {
            setSyncState("error");
          }
        } else {
          setSaved(emptyState);
          setHours(2);
          setGoal(emptyState.goal);
        }

        if (guestRaw) localStorage.removeItem(KEY);
      }

      setCloudReady(true);
      if (data?.progress || localStorage.getItem(accountKey)) setSyncState("synced");
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      void loadAccount(session?.user ?? null);
    });

    void supabase.auth.getUser().then((result: { data: { user: User | null } }) => {
      if (!active) return;
      setAuthReady(true);
      void loadAccount(result.data.user ?? null);
    }).catch(() => {
      if (active) {
        setAuthReady(true);
        setSyncState("error");
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!ready || !authReady) return;

    const progress = { ...saved, hours, goal };

    if (!user) {
      localStorage.setItem(KEY, JSON.stringify(progress));
      return;
    }

    const localKey = KEY + ":" + user.id;
    localStorage.setItem(localKey, JSON.stringify(progress));

    if (!cloudReady || !supabase) return;

    setSyncState("syncing");

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const { error } = await supabase.from("user_progress").upsert(
        {
          user_id: user.id,
          progress,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );
      if (!cancelled) setSyncState(error ? "error" : "synced");
    }, 650);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [saved, hours, goal, ready, user, authReady, cloudReady, supabase]);

  const allLessons = useMemo(() => modules.flatMap((module) => module.topics.map((topic) => ({ ...topic, moduleId: module.id, moduleTitle: module.title }))), []);
  const totalLessons = allLessons.length;
  const progress = Math.round((saved.completed.length / totalLessons) * 100);
  const currentModule = modules.find((module) => module.id === moduleId) ?? modules[0];
  const currentLesson: Lesson = currentModule.topics.find((topic) => topic.id === topicId) ?? currentModule.topics[0];
  const getModuleProgress = (id: ModuleId) => {
    const selected = modules.find((module) => module.id === id)!;
    return Math.round((selected.topics.filter((topic) => saved.completed.includes(topic.id)).length / selected.topics.length) * 100);
  };
  const nextLesson = allLessons.find((lesson) => !saved.completed.includes(lesson.id)) ?? allLessons[0];
  const filteredLessons = allLessons.filter((lesson) => (lesson.title + " " + lesson.summary + " " + lesson.moduleTitle).toLowerCase().includes(search.toLowerCase()));
  const visibleLessons = search ? filteredLessons : currentModule.topics.map((lesson) => ({ ...lesson, moduleId, moduleTitle: currentModule.title }));
  const activeCards = useMemo(
    () => buildStudyCards(modules, cardModule, saved.learning.cardStats, cardQueue),
    [cardModule, cardQueue, saved.learning.cardStats],
  );
  const allStudyCards = useMemo(
    () => buildStudyCards(modules, "all", saved.learning.cardStats, "all"),
    [saved.learning.cardStats],
  );
  const dueCardsCount = useMemo(
    () => buildStudyCards(modules, "all", saved.learning.cardStats, "due").length,
    [saved.learning.cardStats],
  );
  const currentCard: StudyCard | undefined = activeCards[cardIndex];
  const currentQuestion: StudyQuestion | undefined = practiceQuestions[quizIndex];
  const questionPoolSize = useMemo(
    () => buildQuestionPool(modules, quizModule, practiceMode, practiceDifficulty, saved.learning.topicStats).length,
    [quizModule, practiceMode, practiceDifficulty, saved.learning.topicStats],
  );
  const totalPracticeAttempts = Object.values(saved.learning.topicStats).reduce((sum, stat) => sum + stat.attempts, 0);
  const totalPracticeCorrect = Object.values(saved.learning.topicStats).reduce((sum, stat) => sum + stat.correct, 0);
  const practiceAccuracy = totalPracticeAttempts ? Math.round((totalPracticeCorrect / totalPracticeAttempts) * 100) : 0;
  const dueTopicsCount = Object.values(saved.learning.topicStats).filter(
    (stat) => !stat.nextReviewAt || Date.parse(stat.nextReviewAt) <= Date.now(),
  ).length;
  const recentQuestionIds = saved.learning.sessions.slice(-3).flatMap((session) => session.questionIds);
  const currentComparison = comparisons.find((item) => item.id === comparisonId) ?? comparisons[0];
  const filteredCode = codeExamples.filter((item) => {
    const moduleMatches = codeModule === "all" || item.module === codeModule;
    const query = codeSearch.trim().toLowerCase();
    const textMatches = !query || [item.title, item.description, item.file, ...item.tags].join(" ").toLowerCase().includes(query);
    return moduleMatches && textMatches;
  });
  const today = DAYS[(new Date().getDay() + 6) % 7];
  const todaysTasks = saved.tasks.filter((task) => task.day === today);

  function notify(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(""), 2400);
  }
  function openModule(id: ModuleId) {
    const selected = modules.find((module) => module.id === id)!;
    setModuleId(id);
    setTopicId(selected.topics[0].id);
    setSearch("");
    setView("notes");
  }
  function navigate(target: View) {
    setView(target);
    setSearch("");
    if (target === "cards") { setCardIndex(0); setFlipped(false); }
  }
  function markLesson(lesson: Lesson) {
    setSaved((previous) => ({
      ...previous,
      completed: previous.completed.includes(lesson.id) ? previous.completed.filter((id) => id !== lesson.id) : [...previous.completed, lesson.id]
    }));
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); notify("Copied to clipboard."); }
    catch { notify("Clipboard access was blocked by your browser."); }
  }
  function resetQuizModule(value: "all" | ModuleId) {
    setQuizModule(value);
    setPracticeStarted(false);
    setPracticeFinished(false);
    setPracticeQuestions([]);
    setQuizIndex(0);
    setAnswer(null);
    setChecked(false);
    setScore(0);
    setAnswered(0);
    setWrittenAnswer("");
    setShowModelAnswer(false);
  }

  function startPractice() {
    const generated = buildQuestionPool(
      modules,
      quizModule,
      practiceMode,
      practiceDifficulty,
      saved.learning.topicStats,
      recentQuestionIds,
    );
    const selected = practiceCount > 0 ? generated.slice(0, practiceCount) : generated;
    if (!selected.length) {
      notify("No questions match this selection. Try another module or question style.");
      return;
    }
    setPracticeQuestions(selected);
    setQuizIndex(0);
    setAnswer(null);
    setChecked(false);
    setScore(0);
    setAnswered(0);
    setWrittenAnswer("");
    setShowModelAnswer(false);
    setPracticeFinished(false);
    setPracticeStarted(true);
    setSessionStartMs(Date.now());
  }

  function completePracticeSession(finalAnswered: number, finalScore: number) {
    setPracticeFinished(true);
    const session = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      module: quizModule,
      mode: practiceMode,
      total: finalAnswered,
      correct: finalScore,
      accuracy: finalAnswered ? Math.round((finalScore / finalAnswered) * 100) : 0,
      durationSeconds: sessionStartMs ? Math.max(0, Math.round((Date.now() - sessionStartMs) / 1000)) : 0,
      questionIds: practiceQuestions.map((question) => question.id),
      topicIds: Array.from(new Set(practiceQuestions.map((question) => question.lessonId))),
    };
    setSaved((previous) => ({
      ...previous,
      learning: {
        ...previous.learning,
        sessions: [...previous.learning.sessions, session].slice(-50),
      },
    }));
  }

  function checkAnswer() {
    if (answer === null || checked || !currentQuestion || currentQuestion.kind !== "mcq") return;
    const isCorrect = answer === currentQuestion.answerIndex;
    setChecked(true);
    setAnswered((count) => count + 1);
    if (isCorrect) setScore((count) => count + 1);
    setSaved((previous) => ({
      ...previous,
      learning: {
        ...previous.learning,
        topicStats: updateLearningStat(previous.learning.topicStats, currentQuestion.lessonId, isCorrect ? 4 : 1),
      },
    }));
  }

  function nextQuestion() {
    if (quizIndex + 1 >= practiceQuestions.length) {
      completePracticeSession(answered, score);
      return;
    }
    setQuizIndex((index) => index + 1);
    setAnswer(null);
    setChecked(false);
    setWrittenAnswer("");
    setShowModelAnswer(false);
  }

  function markWrittenAnswer(gotIt: boolean) {
    if (!currentQuestion || currentQuestion.kind !== "written") return;
    const finalAnswered = answered + 1;
    const finalScore = score + (gotIt ? 1 : 0);
    setAnswered(finalAnswered);
    setScore(finalScore);
    setSaved((previous) => ({
      ...previous,
      learning: {
        ...previous.learning,
        topicStats: updateLearningStat(previous.learning.topicStats, currentQuestion.lessonId, gotIt ? 4 : 1),
      },
    }));
    if (quizIndex + 1 >= practiceQuestions.length) {
      completePracticeSession(finalAnswered, finalScore);
      return;
    }
    setQuizIndex((index) => index + 1);
    setWrittenAnswer("");
    setShowModelAnswer(false);
    setAnswer(null);
    setChecked(false);
  }

  function rateCard(quality: number) {
    if (!currentCard) return;
    setSaved((previous) => ({
      ...previous,
      learning: {
        ...previous.learning,
        topicStats: updateLearningStat(previous.learning.topicStats, currentCard.lessonId, quality),
        cardStats: updateLearningStat(previous.learning.cardStats, currentCard.id, quality),
      },
    }));
    setCardIndex(0);
    setFlipped(false);
    notify(quality < 3 ? "Card scheduled for another review soon." : "Review saved. Your next interval has been scheduled.");
  }
  function addTask() {
    if (!newTask.trim()) return;
    const task: Task = { id: crypto.randomUUID(), title: newTask.trim(), day: today, minutes: 45, module: newTaskModule, done: false };
    setSaved((previous) => ({ ...previous, tasks: [...previous.tasks, task] }));
    setNewTask("");
    notify("Study session added.");
  }
  function toggleTask(id: string) {
    setSaved((previous) => ({ ...previous, tasks: previous.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task) }));
  }
  function generatePlan() {
    const remaining = allLessons.filter((lesson) => !saved.completed.includes(lesson.id));
    if (!remaining.length) { notify("All lessons are completed. Add revision sessions instead."); return; }
    const currentDayIndex = (new Date().getDay() + 6) % 7;
    const perDay = Math.max(1, Math.floor((hours * 60) / 45));
    const generated: Task[] = remaining.slice(0, perDay * 7).map((lesson, index) => ({
      id: "auto-" + lesson.id,
      title: lesson.title,
      day: DAYS[(currentDayIndex + Math.floor(index / perDay)) % 7],
      minutes: lesson.duration,
      module: lesson.moduleId,
      done: false
    }));
    setSaved((previous) => ({ ...previous, tasks: [...previous.tasks.filter((task) => !task.id.startsWith("auto-") || task.done), ...generated] }));
    notify("A seven-day plan has been generated.");
  }
  async function signInWithGoogle() {
    if (!supabase) {
      notify("Google sign-in is not configured yet. Follow docs/auth-setup.md to connect Supabase.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" }
    });
    if (error) notify(error.message);
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) notify(error.message);
    else {
      setAccountOpen(false);
      notify("Signed out. Guest progress remains saved on this device.");
    }
  }

  function exportProgress() {
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), saved: { ...saved, hours, goal } }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "dip-studio-progress.json"; anchor.click();
    URL.revokeObjectURL(url);
  }
  async function importProgress(file?: File) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const data = payload.saved ?? payload;
      if (!Array.isArray(data.completed) || !Array.isArray(data.tasks)) throw new Error("Invalid backup");
      setSaved(normalizeSaved(data));
      setHours(data.hours ?? 2); setGoal(data.goal ?? emptyState.goal);
      notify("Progress backup imported.");
    } catch { notify("That file is not a valid DIP Studio backup."); }
    if (uploadRef.current) uploadRef.current.value = "";
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); navigate("home"); }}>
          <span className="brand-mark">D<span>·</span></span><span><b>DIP<span>studio</span></b><small>LEARN · PRACTISE · MASTER</small></span>
        </a>
        <div className="course-tag"><i /> CSE2571C <span>/</span> SEM V</div>
        <nav className="navigation">
          <div className="nav-caption">WORKSPACE</div>
          {([
            ["home", "◫", "Overview"], ["notes", "▤", "Study notes"], ["quiz", "⌁", "Quizzes"], ["cards", "▣", "Flashcards"],
            ["planner", "◷", "Study planner"], ["compare", "⇄", "Compare methods"], ["code", "</>", "Code lab"]
          ] as [View,string,string][]).map(([id, icon, label]) => <button key={id} className={"nav-link " + (view === id ? "active" : "")} onClick={() => navigate(id)}><span>{icon}</span>{label}</button>)}
          <div className="nav-caption course-caption">YOUR COURSE</div>
          {modules.map((module) => <button key={module.id} className={"course-link " + (view === "notes" && moduleId === module.id ? "selected" : "")} onClick={() => openModule(module.id)}><i className={module.id.toLowerCase()} /><small>{module.number}</small><span>{module.title.split(" ")[0] === "Image" ? module.title.replace("Image ", "") : module.title}</span><em>{getModuleProgress(module.id)}%</em></button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note"><span>◉</span><div><b>Saved on this device</b><small>Progress stays in this browser.</small></div></div>
          <button onClick={exportProgress} className="backup-link">↓ Export progress backup</button>
          <div className="sidebar-foot">DIGITAL IMAGE PROCESSING <span>v1.0</span></div>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div className="crumb"><span>Workspace</span><b>/</b><strong>{view === "home" ? "Overview" : view === "notes" ? "Study notes" : view === "quiz" ? "Knowledge check" : view === "cards" ? "Flashcards" : view === "planner" ? "Study planner" : view === "compare" ? "Method comparison" : "Code lab"}</strong></div>
          <div className="top-actions">
            <label className="search"><span>⌕</span><input value={search} onChange={(event) => { setSearch(event.target.value); if (event.target.value) setView("notes"); }} placeholder="Search notes, topics..." /></label>
            <div className="account-wrap">
              <button
                className="avatar"
                onClick={() => setAccountOpen((open) => !open)}
                aria-label="Open account menu"
                aria-expanded={accountOpen}
                title={user?.email ?? "Guest account"}
              >
                {user
                  ? String(user.user_metadata?.full_name ?? user.email ?? "U").trim().charAt(0).toUpperCase()
                  : "C"}
              </button>
              {accountOpen && (
                <div className="account-menu">
                  {user ? (
                    <>
                      <div className="account-heading">
                        <strong>{user.user_metadata?.full_name ?? "DIP learner"}</strong>
                        <small>{user.email}</small>
                      </div>
                      <div className="account-sync">
                        <i className={syncState === "synced" ? "online" : syncState === "error" ? "offline" : ""} />
                        {syncState === "synced" ? "Progress synced to your account" : syncState === "syncing" ? "Syncing progress…" : syncState === "error" ? "Cloud sync needs attention" : "Signed in"}
                      </div>
                      <button className="account-action" onClick={exportProgress}>↓ Export progress backup</button>
                      <button className="account-action account-signout" onClick={signOut}>Sign out</button>
                    </>
                  ) : (
                    <>
                      <div className="account-heading">
                        <strong>Continue as a learner</strong>
                        <small>Guest progress is stored only in this browser.</small>
                      </div>
                      <button className="google-signin" onClick={signInWithGoogle}>
                        <b>G</b> Continue with Google
                      </button>
                      <div className="account-footnote">
                        Sign in to keep your own progress across devices. Google sign-in requires the one-time setup in <a href="https://github.com/Chetan-code-lrca/Digital_Image_Processing/blob/main/docs/auth-setup.md" target="_blank" rel="noreferrer">the account setup guide</a>.
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          {view === "home" && <>
            <section className="hero">
              <div><div className="eyebrow"><i /> YOUR PERSONAL LEARNING SPACE</div><h1>Make every pixel<br /><em>make sense.</em></h1><p>A complete workspace for understanding Digital Image Processing — one concept, one experiment, one session at a time.</p><div className="hero-actions"><button className="primary" onClick={() => navigate("notes")}>Start learning <span>→</span></button><button className="quiet" onClick={() => navigate("planner")}>Plan my preparation</button></div></div>
              <div className="hero-visual" aria-hidden="true"><div className="orbit a" /><div className="orbit b" /><div className="pixels">{Array.from({length:25},(_,index)=><i key={index} style={{opacity: .2 + ((index*7)%8)/10}} />)}</div><div className="hero-core">D<span>IP</span></div><small>IMAGE → INFORMATION</small></div>
            </section>
            <section className="stats">
              <div className="stat"><span>COURSE PROGRESS</span><strong>{progress}<small>%</small></strong><div className="track"><i style={{width:progress+"%"}} /></div><small>{saved.completed.length} / {totalLessons} topics completed</small></div>
              <div className="stat"><span>LEARNING MODULES</span><strong>05</strong><small>Complete university syllabus</small><div className="mini-bars">{modules.map((module)=><i key={module.id} className={module.id.toLowerCase()} style={{height:Math.max(8,getModuleProgress(module.id)*.42)+"px"}} />)}</div></div>
              <div className="stat"><span>GENERATED REVIEW CARDS</span><strong>{allStudyCards.length}</strong><small>{dueCardsCount} due for review</small><button onClick={()=>navigate("cards")}>Start revising ↗</button></div>
              <div className="stat"><span>DYNAMIC QUESTION POOL</span><strong>{questionPoolSize}</strong><small>{totalPracticeAttempts} attempts · {practiceAccuracy}% accuracy</small><button onClick={()=>navigate("quiz")}>Practice now ↗</button></div>
            </section>
            <div className="section-head"><div><div className="eyebrow">THE LEARNING PATH</div><h2>Your five modules</h2><p>Follow the sequence or jump directly to a topic you need.</p></div><button className="quiet" onClick={()=>navigate("notes")}>Explore all notes ↗</button></div>
            <section className="module-grid">{modules.map((module)=><button key={module.id} className={"module-card "+module.id.toLowerCase()} onClick={()=>openModule(module.id)}><div className="module-meta"><span>MODULE {module.number}</span><b>↗</b></div><div className="module-art"><i /><i /><b>{module.number}</b></div><h3>{module.title}</h3><p>{module.subtitle}</p><div className="module-foot"><span>{module.topics.length} topics</span><span>{getModuleProgress(module.id)}% complete</span></div><div className="track"><i style={{width:getModuleProgress(module.id)+"%"}} /></div></button>)}</section>
            <section className="home-bottom">
              <div className="white-panel"><div className="panel-head"><div><div className="eyebrow">YOUR NEXT MOVE</div><h3>Today's focus</h3></div><span>◷</span></div>{todaysTasks.length ? todaysTasks.slice(0,4).map((task)=><button key={task.id} className="task-row" onClick={()=>toggleTask(task.id)}><i className={task.done?"done":""}>{task.done?"✓":""}</i><span>{task.title}</span><small>{task.minutes}m</small></button>) : <div className="empty"><b>No sessions planned for today.</b><small>Create a realistic study plan and start with one topic.</small></div>}<button className="inline-link" onClick={()=>navigate("planner")}>Open study planner ↗</button></div>
              <div className="white-panel"><div className="panel-head"><div><div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div><h3>Continue learning</h3></div><span>↗</span></div><div className="continue"><small>{nextLesson.moduleId} · {nextLesson.moduleTitle}</small><h4>{nextLesson.title}</h4><p>{nextLesson.summary}</p><button className="primary" onClick={()=>{setModuleId(nextLesson.moduleId);setTopicId(nextLesson.id);navigate("notes");}}>Resume lesson →</button></div></div>
            </section>
          </>}

          {view === "notes" && <>
            <PageIntro eyebrow="THE KNOWLEDGE BASE" title={<>Study <em>notes.</em></>} desc="Structured explanations, key equations, worked examples and code references for every module." />
            {search && <div className="search-hint">SEARCH RESULTS FOR “{search}” · {filteredLessons.length} TOPICS</div>}
            <div className="module-tabs">{modules.map((module)=><button key={module.id} className={moduleId===module.id?"selected "+module.id.toLowerCase():""} onClick={()=>{setModuleId(module.id);setTopicId(module.topics[0].id);setSearch("");}}>{module.number} <span>{module.title.replace("Image ","")}</span></button>)}</div>
            <div className="notes-layout">
              <aside className="topic-menu"><div className="topic-head">IN THIS MODULE <small>{currentModule.topics.length} topics</small></div>{visibleLessons.map((lesson,index)=><button key={lesson.id} className={lesson.id===currentLesson.id?"selected":""} onClick={()=>{setModuleId(lesson.moduleId);setTopicId(lesson.id);}}><small>{String(index+1).padStart(2,"0")}</small><span>{lesson.title}</span><b>{saved.completed.includes(lesson.id)?"✓":"›"}</b></button>)}{search && filteredLessons.length===0 && <div className="empty"><b>No matching topics</b><small>Try another search phrase.</small></div>}</aside>
              <article className="lesson">
                <div className="lesson-meta"><span className={"tag "+moduleId.toLowerCase()}>MODULE {currentModule.number}</span><span>{currentLesson.duration} MIN READ</span><span>·</span><span>CONCEPT NOTES</span></div>
                <h2>{currentLesson.title}</h2><p className="lesson-summary">{currentLesson.summary}</p><hr /><h3>Understand the concept</h3>
                {currentLesson.points.map((point,index)=><p className="lesson-point" key={index}>{point}</p>)}
                {currentLesson.formula && <div className="formula"><small>KEY EQUATION</small><pre>{currentLesson.formula}</pre></div>}
                {currentLesson.example && <div className="example"><small>✳ WORKED EXAMPLE / INTUITION</small><p>{currentLesson.example}</p></div>}
                {currentLesson.code && <div className="code-box"><div><b>PYTHON IMPLEMENTATION</b><button onClick={()=>copy(currentLesson.code!)}>Copy code ↗</button></div><pre>{currentLesson.code}</pre></div>}
                <div className="takeaway"><small>REMEMBER THIS</small><p>{currentLesson.takeaway}</p></div>
                <div className="lesson-actions"><button className={saved.completed.includes(currentLesson.id)?"complete completed":"complete"} onClick={()=>markLesson(currentLesson)}>{saved.completed.includes(currentLesson.id)?"✓ Completed":"Mark as completed"}</button><button className="next" onClick={()=>{const index=currentModule.topics.findIndex((topic)=>topic.id===currentLesson.id);setTopicId(currentModule.topics[(index+1)%currentModule.topics.length].id);}}>Next topic →</button></div>
              </article>
            </div>
          </>}

          {view === "quiz" && <>
            <PageIntro eyebrow="ADAPTIVE RETRIEVAL PRACTICE" title={<>Practice that <em>keeps changing.</em></>} desc="Questions are generated from the five module lessons, key points, formulas and worked examples. Your weak and overdue topics are prioritised in later sessions." />
            <section className="practice-setup">
              <div className="practice-setup-head">
                <div><div className="eyebrow">BUILD A PRACTICE SESSION</div><h2>Choose what to work on</h2><p>Every session is assembled from your course notes. Change the settings to create a different question set.</p></div>
                <span className="practice-spark">✳</span>
              </div>
              <div className="practice-controls">
                <label><span>MODULE</span><select value={quizModule} onChange={(event)=>resetQuizModule(event.target.value as "all" | ModuleId)}><option value="all">All five modules</option>{modules.map((module)=><option key={module.id} value={module.id}>{module.number} · {module.title}</option>)}</select></label>
                <label><span>QUESTION STYLE</span><select value={practiceMode} onChange={(event)=>setPracticeMode(event.target.value as PracticeMode)}><option value="mixed">Mixed · MCQ + written recall</option><option value="mcq">Multiple choice</option><option value="written">Written recall</option></select></label>
                <label><span>DIFFICULTY</span><select value={practiceDifficulty} onChange={(event)=>setPracticeDifficulty(event.target.value as PracticeDifficulty)}><option value="all">All levels</option><option value="starter">Starter · understanding</option><option value="core">Core · explain concepts</option><option value="challenge">Challenge · formulas and examples</option></select></label>
                <label><span>QUESTION COUNT</span><select value={practiceCount} onChange={(event)=>setPracticeCount(Number(event.target.value))}><option value={5}>5 questions</option><option value={10}>10 questions</option><option value={15}>15 questions</option><option value={20}>20 questions</option><option value={0}>All available</option></select></label>
              </div>
              <div className="practice-setup-footer">
                <div><strong>{questionPoolSize}</strong><span>questions available for this selection</span><small>Fresh option order · recent questions deprioritised · weaker topics first</small></div>
                <button className="primary" onClick={startPractice}>Generate practice session →</button>
              </div>
            </section>

            <div className="practice-insights">
              <div><small>QUESTIONS ATTEMPTED</small><strong>{totalPracticeAttempts}</strong></div>
              <div><small>OVERALL ACCURACY</small><strong>{practiceAccuracy}%</strong></div>
              <div><small>TOPICS DUE</small><strong>{dueTopicsCount}</strong></div>
              <div><small>COMPLETED SESSIONS</small><strong>{saved.learning.sessions.length}</strong></div>
            </div>

            {practiceStarted && practiceQuestions.length > 0 && (
              practiceFinished ? (
                <section className="practice-result">
                  <div className="eyebrow">SESSION COMPLETE</div>
                  <h2>{score} <span>/ {answered}</span></h2>
                  <p>{answered ? Math.round(score / answered * 100) : 0}% accuracy in this session. Your topic performance has been saved and will shape the next set.</p>
                  <div className="practice-result-actions">
                    <button className="primary" onClick={startPractice}>Generate another session ↗</button>
                    <button className="quiet" onClick={()=>navigate("cards")}>Review due cards</button>
                  </div>
                </section>
              ) : currentQuestion && (
                <div className="quiz-layout dynamic-quiz-layout">
                  <section className="quiz-card">
                    <div className="quiz-meta">
                      <span className={"tag "+currentQuestion.moduleId.toLowerCase()}>{currentQuestion.moduleId} · {currentQuestion.moduleTitle}</span>
                      <small>{String(quizIndex+1).padStart(2,"0")} / {practiceQuestions.length}</small>
                    </div>
                    <div className="track"><i style={{width:((quizIndex+1)/practiceQuestions.length*100)+"%"}} /></div>
                    <div className="question-context"><span>{currentQuestion.difficulty.toUpperCase()}</span><span>·</span><span>{currentQuestion.kind === "mcq" ? "MULTIPLE CHOICE" : "WRITTEN RECALL"}</span><span>·</span><span>{currentQuestion.lessonTitle}</span></div>
                    <h2>{currentQuestion.prompt}</h2>

                    {currentQuestion.kind === "mcq" ? (
                      <>
                        <div className="answers">{currentQuestion.options?.map((option,index)=><button key={option} disabled={checked} className={(answer===index?"chosen ":"")+(checked&&index===currentQuestion.answerIndex?"correct ":"")+(checked&&answer===index&&index!==currentQuestion.answerIndex?"wrong":"")} onClick={()=>setAnswer(index)}><i>{String.fromCharCode(65+index)}</i><span>{option}</span><b>{checked&&index===currentQuestion.answerIndex?"✓":answer===index?"●":""}</b></button>)}</div>
                        {checked && <div className={"feedback "+(answer===currentQuestion.answerIndex?"good":"bad")}><b>{answer===currentQuestion.answerIndex?"Correct.":"Review this topic."}</b><p>{currentQuestion.explanation}</p><small>LESSON SOURCE: {currentQuestion.sourceText}</small></div>}
                        <div className="quiz-footer"><small>{answered ? "SESSION SCORE "+score+" / "+answered : "SELECT ONE ANSWER"}</small>{!checked?<button className="primary" disabled={answer===null} onClick={checkAnswer}>Check answer →</button>:<button className="primary" onClick={nextQuestion}>{quizIndex+1===practiceQuestions.length?"Finish session":"Next question"} →</button>}</div>
                      </>
                    ) : (
                      <>
                        <textarea className="written-response" value={writtenAnswer} onChange={(event)=>setWrittenAnswer(event.target.value)} placeholder="Write your explanation here before revealing the lesson guide…" rows={5} />
                        {!showModelAnswer ? (
                          <button className="primary reveal-answer" onClick={()=>setShowModelAnswer(true)}>Reveal lesson guide →</button>
                        ) : (
                          <div className="written-guide"><small>COMPARE WITH THESE COURSE NOTES</small><pre>{currentQuestion.answerText}</pre><p>{currentQuestion.explanation}</p><div className="self-grade"><button onClick={()=>markWrittenAnswer(true)}>I could explain it <span>✓</span></button><button onClick={()=>markWrittenAnswer(false)}>Need to revise <span>↻</span></button></div></div>
                        )}
                      </>
                    )}
                    <div className="question-source"><span>BASED ON COURSE TOPIC</span><button onClick={()=>{setModuleId(currentQuestion.moduleId);setTopicId(currentQuestion.lessonId);setView("notes");}}>Open lesson notes ↗</button></div>
                  </section>
                  <aside className="quiz-note">
                    <span>✳</span><h3>Learn from<br /><em>each attempt.</em></h3>
                    <p>Correct answers increase the topic's mastery signal. Missed questions return sooner, and overdue topics are prioritised in future sessions.</p>
                    <hr /><small>THIS SESSION</small><strong>{score}<i> / {answered}</i></strong><div className="track"><i style={{width:(answered?score/answered*100:0)+"%"}} /></div>
                    <div className="session-topic"><small>CURRENT TOPIC</small><b>{currentQuestion.lessonTitle}</b><span>{currentQuestion.moduleTitle}</span></div>
                    <button onClick={()=>{setPracticeStarted(false);setPracticeFinished(false);}}>Exit session ↗</button>
                  </aside>
                </div>
              )
            )}

            {!practiceStarted && (
              <div className="practice-empty">
                <span>⌁</span><strong>Your next practice set is waiting.</strong>
                <p>Pick a module, select a question style and generate a new session from the complete lesson library.</p>
              </div>
            )}
          </>}

          {view === "cards" && <>
            <PageIntro eyebrow="SPACED REPETITION" title={<>A review deck that <em>adapts.</em></>} desc="Cards are built from every lesson, formula and worked example. Rate how well you recalled each one and the review scheduler sets the next interval." />
            <div className="toolbar review-toolbar">
              <div className="pills">
                <button className={cardQueue==="due"?"active":""} onClick={()=>{setCardQueue("due");setCardIndex(0);setFlipped(false);}}>Due now ({dueCardsCount})</button>
                <button className={cardQueue==="all"?"active":""} onClick={()=>{setCardQueue("all");setCardIndex(0);setFlipped(false);}}>All cards ({allStudyCards.length})</button>
                {modules.map((module)=><button key={module.id} className={cardModule===module.id?"active":""} onClick={()=>{setCardModule(module.id);setCardIndex(0);setFlipped(false);}}>{module.number}</button>)}
                <button className={cardModule==="all"?"active":""} onClick={()=>{setCardModule("all");setCardIndex(0);setFlipped(false);}}>All modules</button>
              </div>
              <small>{activeCards.length} CARDS IN THIS QUEUE</small>
            </div>
            {currentCard ? (
              <div className="flash-stage">
                <small className="flash-count">{String(cardIndex+1).padStart(2,"0")} <i>/ {String(activeCards.length).padStart(2,"0")}</i></small>
                <button className={"flashcard "+(flipped?"flipped":"")} onClick={()=>setFlipped((value)=>!value)}>
                  <div className="flash-meta"><span>{currentCard.moduleId} · {currentCard.moduleTitle}</span><span>{flipped?"ANSWER":currentCard.kind.toUpperCase()}</span></div>
                  <div className="flash-body">{flipped?<><small>LESSON GUIDE · {currentCard.lessonTitle}</small><p>{currentCard.back}</p></>:<><small>ACTIVE RECALL · {currentCard.lessonTitle}</small><h2>{currentCard.front}</h2></>}</div>
                  <div className="flash-meta bottom"><span>CLICK TO {flipped?"VIEW PROMPT":"REVEAL LESSON GUIDE"}</span><span>↻</span></div>
                </button>
                {flipped && <div className="flash-rating"><small>HOW WELL DID YOU RECALL IT?</small><div><button onClick={()=>rateCard(1)}><b>Again</b><span>1 day</span></button><button onClick={()=>rateCard(3)}><b>Hard</b><span>Short interval</span></button><button onClick={()=>rateCard(4)}><b>Good</b><span>Normal interval</span></button><button onClick={()=>rateCard(5)}><b>Easy</b><span>Long interval</span></button></div></div>}
                <p className="flash-tip">New cards and missed cards appear before topics you already know. Review records are saved with your learner progress.</p>
              </div>
            ) : (
              <div className="practice-empty"><span>✓</span><strong>No cards are due in this queue.</strong><p>Switch to All cards to study ahead. Your next review dates are saved automatically.</p><button className="primary" onClick={()=>{setCardQueue("all");setCardIndex(0);}}>Browse all cards →</button></div>
            )}
          </>}

          {view === "planner" && <>
            <PageIntro eyebrow="BUILD A CONSISTENT ROUTINE" title={<>Your study <em>planner.</em></>} desc="Turn the syllabus into realistic study sessions. Your plan is saved in this browser and can be backed up anytime." />
            <div className="planner-layout"><div className="planner-main"><section className="white-panel"><div className="panel-head"><div><div className="eyebrow">SMART START</div><h3>Build your next 7 days</h3></div><span>✳</span></div><p className="muted">Generate a plan from topics you have not marked complete. Adjust daily hours first.</p><div className="hours"><div><b>Daily study time</b><small>Keep it achievable alongside classes.</small></div><div><button onClick={()=>setHours((value)=>Math.max(1,value-1))}>−</button><strong>{hours}<small> hrs</small></strong><button onClick={()=>setHours((value)=>Math.min(8,value+1))}>+</button></div></div><button className="primary wide" onClick={generatePlan}>Generate 7-day plan →</button><div className="muted mono">{totalLessons-saved.completed.length} REMAINING TOPICS</div></section>
              <section className="white-panel"><div className="panel-head"><div><div className="eyebrow">YOUR SCHEDULE</div><h3>Weekly study sessions</h3></div><small>{saved.tasks.length} sessions</small></div><div className="week-grid">{DAYS.map((day,index)=>{const tasks=saved.tasks.filter((task)=>task.day===day);return <div key={day}><small className={day===today?"today":""}>{day}</small><b>{index+1}</b><div className="day-tasks">{tasks.length?tasks.map((task)=><button key={task.id} className={"day-task "+task.module.toLowerCase()+(task.done?" done":"")} onClick={()=>toggleTask(task.id)}><span>{task.done?"✓":"○"} {task.title}</span><small>{task.minutes}m</small></button>):<span className="no-task">—</span>}</div></div>;})}</div></section>
              <section className="white-panel"><div className="panel-head"><div><div className="eyebrow">MAKE IT YOURS</div><h3>Add a study session</h3></div></div><div className="add-form"><input value={newTask} onChange={(event)=>setNewTask(event.target.value)} placeholder="e.g. Revise DFT and solve PYQs" onKeyDown={(event)=>{if(event.key==="Enter")addTask();}}/><select value={newTaskModule} onChange={(event)=>setNewTaskModule(event.target.value as ModuleId)}>{modules.map((module)=><option key={module.id} value={module.id}>{module.number} · {module.title}</option>)}</select><button className="primary" onClick={addTask}>Add session +</button></div><div className="custom-tasks">{saved.tasks.filter((task)=>!task.id.startsWith("auto-")).map((task)=><div key={task.id}><button onClick={()=>toggleTask(task.id)}>{task.done?"✓":"○"}</button><span>{task.title}</span><small>{task.day} · {task.minutes}m</small><button onClick={()=>setSaved((previous)=>({...previous,tasks:previous.tasks.filter((item)=>item.id!==task.id)}))}>×</button></div>)}</div></section>
            </div><aside className="planner-aside"><section className="white-panel"><div className="eyebrow">YOUR CURRENT GOAL</div><h3>What are you preparing for?</h3><select value={goal} onChange={(event)=>setGoal(event.target.value)}><option>GATE + university exams</option><option>University end-semester exam</option><option>Practical and viva preparation</option><option>Computer vision foundations</option><option>Self-paced learning</option></select><p className="muted">This saves your planning context; it does not change quiz or note content.</p></section><section className="white-panel"><div className="eyebrow">SYLLABUS CHECKLIST</div><h3>Topic completion</h3>{modules.map((module)=><div className="progress-row" key={module.id}><div><span>{module.number} · {module.title}</span><b>{getModuleProgress(module.id)}%</b></div><div className="track"><i className={module.id.toLowerCase()} style={{width:getModuleProgress(module.id)+"%"}} /></div></div>)}</section><div className="backup-card"><b>◈ Keep your progress safe</b><p>Export a JSON backup before changing browsers or devices.</p><button onClick={exportProgress}>Export my progress ↗</button></div></aside></div>
          </>}

          {view === "compare" && <>
            <PageIntro eyebrow="UNDERSTAND THE DIFFERENCE" title={<>Compare the <em>methods.</em></>} desc="Side-by-side comparisons for concepts that are easy to mix up in exams and practicals." />
            <div className="compare-layout"><aside className="compare-menu"><small>COMPARISON SETS</small>{comparisons.map((item,index)=><button key={item.id} className={comparisonId===item.id?"selected":""} onClick={()=>setComparisonId(item.id)}><i>{String(index+1).padStart(2,"0")}</i>{item.title}<b>›</b></button>)}</aside><article className="compare-content"><small>CONCEPT COMPARISON</small><h2>{currentComparison.title}</h2><div className="compare-columns"><div><i>01</i><h3>{currentComparison.a}</h3></div><div><i>02</i><h3>{currentComparison.b}</h3></div></div><div className="compare-table">{currentComparison.rows.map((row)=><div key={row[0]}><small>{row[0]}</small><p>{row[1]}</p><p>{row[2]}</p></div>)}</div><div className="tip">✳ Exam tip: compare purpose, mathematical operation, output and limitation.</div></article></div>
          </>}

          {view === "code" && <>
            <PageIntro eyebrow="IMPLEMENT THE CONCEPT" title={<>The DIP <em>code lab.</em></>} desc="Runnable Python patterns for common image-processing tasks. Each snippet includes a practical purpose." />
            <div className="code-toolbar">
              <label className="code-search">
                <span>⌕</span>
                <input
                  value={codeSearch}
                  onChange={(event) => setCodeSearch(event.target.value)}
                  placeholder="Search algorithms, concepts or practicals…"
                  aria-label="Search code examples"
                />
              </label>
              <div className="pills">
                <button className={codeModule==="all"?"active":""} onClick={()=>setCodeModule("all")}>All modules</button>
                {modules.map((module)=><button key={module.id} className={codeModule===module.id?"active":""} onClick={()=>setCodeModule(module.id)}>{module.number}</button>)}
              </div>
              <small>{filteredCode.length} OF {codeExamples.length} PRACTICAL SNIPPETS</small>
            </div>
            {filteredCode.length ? (
              <div className="code-grid">
                {filteredCode.map((item)=>(
                  <article className="code-card" key={item.id}>
                    <div className="code-meta">
                      <span className={"tag "+item.module.toLowerCase()}>{item.module}</span>
                      <small>EXPERIMENT {item.practical} · PYTHON · OPENCV</small>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="code-tags">
                      <span>{item.difficulty}</span>
                      {item.tags.map((tag)=><span key={tag}>{tag}</span>)}
                    </div>
                    <pre><code>{item.code}</code></pre>
                    <div className="code-card-footer">
                      <small>{item.file}</small>
                      <button onClick={()=>copy(item.code)}>Copy snippet ↗</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="code-empty">
                <strong>No practicals match this filter.</strong>
                <span>Choose another module or clear your search.</span>
                <button className="quiet" onClick={()=>{setCodeModule("all");setCodeSearch("");}}>Clear filters</button>
              </div>
            )}
            <div className="repo-cta"><div><small>GO DEEPER</small><h3>Explore the complete implementation.</h3><p>The repository contains reusable functions for all five modules and 16 runnable practical scripts.</p></div><a href="https://github.com/Chetan-code-lrca/Digital_Image_Processing" target="_blank" rel="noreferrer">Open GitHub repository ↗</a></div>
          </>}
          <footer className="footer"><span>DIP STUDIO · CSE2571C DIGITAL IMAGE PROCESSING</span><span>Built for learning, not just last-minute memorising.</span></footer>
        </div>
      </section>
      {toast&&<div className="toast">{toast}</div>}
    </main>
  );
}

function PageIntro({eyebrow,title,desc}:{eyebrow:string;title:import("react").ReactNode;desc:string}) {
  return <div className="page-intro"><div className="eyebrow"><i /> {eyebrow}</div><h1>{title}</h1><p>{desc}</p></div>;
}
