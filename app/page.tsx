"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { modules, flashcards, quizzes, comparisons, codeExamples, type ModuleId, type Lesson } from "@/lib/content";

type View = "home" | "notes" | "quiz" | "cards" | "planner" | "compare" | "code";
type Task = { id: string; title: string; day: string; minutes: number; module: ModuleId; done: boolean };
type Saved = { completed: string[]; tasks: Task[]; hours: number; goal: string };
const KEY = "dip-studio-progress-v1";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const accent: Record<ModuleId, string> = { M1: "violet", M2: "cyan", M3: "amber", M4: "rose", M5: "green" };
const emptyState: Saved = { completed: [], tasks: [], hours: 2, goal: "GATE + university exams" };

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
  const [comparisonId, setComparisonId] = useState(comparisons[0].id);
  const [codeModule, setCodeModule] = useState<"all" | ModuleId>("all");
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
        const data = JSON.parse(raw) as Saved;
        setSaved({ ...emptyState, ...data });
        setHours(data.hours ?? 2);
        setGoal(data.goal ?? emptyState.goal);
      }
    } catch {
      setToast("Saved progress could not be read. The existing browser data was not changed.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify({ ...saved, hours, goal }));
  }, [saved, hours, goal, ready]);

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
  const activeCards = flashcards.filter((card) => cardModule === "all" || card.module === cardModule);
  const currentCard = activeCards[cardIndex % Math.max(activeCards.length, 1)];
  const activeQuiz = quizzes.filter((question) => quizModule === "all" || question.module === quizModule);
  const currentQuestion = activeQuiz[quizIndex % Math.max(activeQuiz.length, 1)];
  const currentComparison = comparisons.find((item) => item.id === comparisonId) ?? comparisons[0];
  const filteredCode = codeExamples.filter((item) => codeModule === "all" || item.module === codeModule);
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
    setQuizModule(value); setQuizIndex(0); setAnswer(null); setChecked(false); setScore(0); setAnswered(0);
  }
  function checkAnswer() {
    if (answer === null || checked) return;
    setChecked(true);
    setAnswered((count) => count + 1);
    if (answer === currentQuestion.answer) setScore((count) => count + 1);
  }
  function nextQuestion() {
    setQuizIndex((index) => (index + 1) % activeQuiz.length);
    setAnswer(null); setChecked(false);
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
      setSaved({ ...emptyState, ...data });
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
            <button className="avatar" onClick={exportProgress} title="Export progress">C</button>
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
              <div className="stat"><span>REVISION CARDS</span><strong>{flashcards.length}</strong><small>Ready for active recall</small><button onClick={()=>navigate("cards")}>Start revising ↗</button></div>
              <div className="stat"><span>QUIZ QUESTIONS</span><strong>{quizzes.length}</strong><small>Check what you actually know</small><button onClick={()=>navigate("quiz")}>Test yourself ↗</button></div>
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
            <PageIntro eyebrow="RETRIEVAL PRACTICE" title={<>Test your <em>understanding.</em></>} desc="Short, focused questions across the full DIP syllabus. Check the explanation after each answer." />
            <div className="toolbar"><span>QUESTION SET</span><div className="pills"><button className={quizModule==="all"?"active":""} onClick={()=>resetQuizModule("all")}>All modules</button>{modules.map((module)=><button key={module.id} className={quizModule===module.id?"active":""} onClick={()=>resetQuizModule(module.id)}>{module.number}</button>)}</div><small>{activeQuiz.length} QUESTIONS</small></div>
            <div className="quiz-layout"><section className="quiz-card"><div className="quiz-meta"><span className={"tag "+currentQuestion.module.toLowerCase()}>{currentQuestion.module} · {modules.find((module)=>module.id===currentQuestion.module)?.title}</span><small>QUESTION {quizIndex+1} / {activeQuiz.length}</small></div><div className="track"><i style={{width:((quizIndex+1)/activeQuiz.length*100)+"%"}} /></div><h2>{currentQuestion.question}</h2><div className="answers">{currentQuestion.options.map((option,index)=><button key={option} disabled={checked} className={(answer===index?"chosen ":"")+(checked&&index===currentQuestion.answer?"correct ":"")+(checked&&answer===index&&index!==currentQuestion.answer?"wrong":"")} onClick={()=>setAnswer(index)}><i>{String.fromCharCode(65+index)}</i><span>{option}</span><b>{checked&&index===currentQuestion.answer?"✓":answer===index?"●":""}</b></button>)}</div>{checked&&<div className={"feedback "+(answer===currentQuestion.answer?"good":"bad")}><b>{answer===currentQuestion.answer?"That's right.":"Not quite — review the concept."}</b><p>{currentQuestion.explanation}</p></div>}<div className="quiz-footer"><small>{answered>0?"SESSION SCORE "+score+" / "+answered:"SELECT ONE ANSWER"}</small>{!checked?<button className="primary" disabled={answer===null} onClick={checkAnswer}>Check answer →</button>:<button className="primary" onClick={nextQuestion}>Next question →</button>}</div></section><aside className="quiz-note"><span>✳</span><h3>Recall first.<br /><em>Then check.</em></h3><p>Try retrieving the answer before reading the explanation. This is more useful than only rereading a note.</p><hr /><small>YOUR SESSION</small><strong>{score}<i> / {answered}</i></strong><div className="track"><i style={{width:(answered?score/answered*100:0)+"%"}} /></div><button onClick={()=>{setQuizIndex(0);setAnswer(null);setChecked(false);setScore(0);setAnswered(0);}}>Reset session ↻</button></aside></div>
          </>}

          {view === "cards" && <>
            <PageIntro eyebrow="ACTIVE RECALL" title={<>Remember what <em>matters.</em></>} desc="Revisit definitions, formulas and core differences without looking at the answer first." />
            <div className="toolbar"><div className="pills"><button className={cardModule==="all"?"active":""} onClick={()=>{setCardModule("all");setCardIndex(0);setFlipped(false);}}>All cards</button>{modules.map((module)=><button key={module.id} className={cardModule===module.id?"active":""} onClick={()=>{setCardModule(module.id);setCardIndex(0);setFlipped(false);}}>{module.number}</button>)}</div><small>{activeCards.length} CARDS IN THIS DECK</small></div>
            <div className="flash-stage"><small className="flash-count">{String(cardIndex+1).padStart(2,"0")} <i>/ {String(activeCards.length).padStart(2,"0")}</i></small><button className={"flashcard "+(flipped?"flipped":"")} onClick={()=>setFlipped((value)=>!value)}><div className="flash-meta"><span>{currentCard.module} · {modules.find((module)=>module.id===currentCard.module)?.title}</span><span>{flipped?"ANSWER":"PROMPT"}</span></div>{flipped?<div className="flash-body"><small>THE EXPLANATION</small><p>{currentCard.back}</p></div>:<div className="flash-body"><small>QUICK RECALL</small><h2>{currentCard.front}</h2></div>}<div className="flash-meta bottom"><span>CLICK TO {flipped?"VIEW QUESTION":"REVEAL ANSWER"}</span><span>↻</span></div></button><div className="flash-actions"><button onClick={()=>{setCardIndex((index)=>(index-1+activeCards.length)%activeCards.length);setFlipped(false);}}>← Previous</button><button className="primary" onClick={()=>{setCardIndex((index)=>(index+1)%activeCards.length);setFlipped(false);}}>Next card →</button></div><p className="flash-tip">Try to say the answer out loud before you flip the card.</p></div>
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
            <div className="toolbar"><div className="pills"><button className={codeModule==="all"?"active":""} onClick={()=>setCodeModule("all")}>All snippets</button>{modules.map((module)=><button key={module.id} className={codeModule===module.id?"active":""} onClick={()=>setCodeModule(module.id)}>{module.number}</button>)}</div><small>{filteredCode.length} SNIPPETS</small></div>
            <div className="code-grid">{filteredCode.map((item)=><article className="code-card" key={item.id}><div className="code-meta"><span className={"tag "+item.module.toLowerCase()}>{item.module}</span><small>PYTHON · OPENCV</small></div><h3>{item.title}</h3><p>{item.description}</p><pre>{item.code}</pre><button onClick={()=>copy(item.code)}>Copy snippet ↗</button></article>)}</div>
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
