import type { CourseModule, ModuleId } from "@/lib/content";

export type ModuleFilter = "all" | ModuleId;
export type PracticeMode = "mixed" | "mcq" | "written";
export type PracticeDifficulty = "all" | "starter" | "core" | "challenge";
export type PracticeQuestionKind = "mcq" | "written";
export type ReviewQueue = "all" | "due";

export type LearningStat = {
  attempts: number;
  correct: number;
  streak: number;
  lapses: number;
  intervalDays: number;
  ease: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
};

export type PracticeSessionRecord = {
  id: string;
  date: string;
  module: ModuleFilter;
  mode: PracticeMode;
  total: number;
  correct: number;
  accuracy: number;
  durationSeconds: number;
  questionIds: string[];
  topicIds: string[];
};

export type LearningProgress = {
  topicStats: Record<string, LearningStat>;
  cardStats: Record<string, LearningStat>;
  sessions: PracticeSessionRecord[];
};

export type StudyQuestion = {
  id: string;
  lessonId: string;
  moduleId: ModuleId;
  moduleTitle: string;
  lessonTitle: string;
  kind: PracticeQuestionKind;
  difficulty: Exclude<PracticeDifficulty, "all">;
  prompt: string;
  options?: string[];
  answerIndex?: number;
  answerText: string;
  explanation: string;
  sourceText: string;
};

export type StudyCard = {
  id: string;
  lessonId: string;
  moduleId: ModuleId;
  moduleTitle: string;
  lessonTitle: string;
  kind: "concept" | "formula" | "example";
  front: string;
  back: string;
};

export function createEmptyLearningProgress(): LearningProgress {
  return { topicStats: {}, cardStats: {}, sessions: [] };
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function uniqueText(items: Array<string | undefined>): string[] {
  return Array.from(new Set(items.map((item) => item?.trim()).filter((item): item is string => Boolean(item))));
}

function makeChoices(correct: string, candidates: string[], limit = 4): { options: string[]; answerIndex: number } | null {
  const distractors = shuffle(uniqueText(candidates).filter((item) => item !== correct)).slice(0, limit - 1);
  if (distractors.length < 2) return null;
  const options = shuffle([correct, ...distractors]);
  return { options, answerIndex: options.indexOf(correct) };
}

function reviewPriority(stat: LearningStat | undefined, now: number): number {
  if (!stat || !stat.nextReviewAt) return 5;
  const dueAt = Date.parse(stat.nextReviewAt);
  const daysOverdue = Number.isFinite(dueAt) ? Math.max(0, (now - dueAt) / 86_400_000) : 0;
  const errorRate = stat.attempts ? 1 - stat.correct / stat.attempts : 0.5;
  return (daysOverdue * 2) + (errorRate * 4) + (stat.lapses * 0.2);
}

/**
 * Builds a fresh question pool from the actual lesson summaries, key takeaways,
 * formulas, examples and learning points. No fixed quiz array is used.
 */
export function buildQuestionPool(
  courseModules: CourseModule[],
  moduleFilter: ModuleFilter,
  mode: PracticeMode,
  difficulty: PracticeDifficulty,
  topicStats: Record<string, LearningStat>,
  recentlyAsked: string[] = [],
  now = Date.now(),
): StudyQuestion[] {
  const allLessons = courseModules.flatMap((module) =>
    module.topics.map((lesson) => ({ lesson, moduleId: module.id, moduleTitle: module.title }))
  );
  const selectedLessons = allLessons.filter(({ moduleId }) => moduleFilter === "all" || moduleId === moduleFilter);
  const questions: StudyQuestion[] = [];
  const includeMcq = mode !== "written";
  const includeWritten = mode !== "mcq";

  for (const item of selectedLessons) {
    const { lesson, moduleId, moduleTitle } = item;
    const other = allLessons.filter((candidate) => candidate.lesson.id !== lesson.id);
    const makeQuestion = (
      suffix: string,
      targetDifficulty: Exclude<PracticeDifficulty, "all">,
      prompt: string,
      correct: string,
      candidates: string[],
      answerText: string,
      explanation: string,
      sourceText: string,
    ) => {
      if (difficulty !== "all" && difficulty !== targetDifficulty) return;
      const choices = makeChoices(correct, candidates);
      if (!choices) return;
      questions.push({
        id: lesson.id + ":" + suffix,
        lessonId: lesson.id,
        moduleId,
        moduleTitle,
        lessonTitle: lesson.title,
        kind: "mcq",
        difficulty: targetDifficulty,
        prompt,
        options: choices.options,
        answerIndex: choices.answerIndex,
        answerText,
        explanation,
        sourceText,
      });
    };

    if (includeMcq) {
      makeQuestion(
        "description",
        "starter",
        "A learner describes a concept as: “" + lesson.summary + "” Which topic matches that description?",
        lesson.title,
        other.map((candidate) => candidate.lesson.title),
        lesson.title,
        "This description belongs to " + lesson.title + ". " + lesson.takeaway,
        lesson.summary,
      );

      makeQuestion(
        "takeaway",
        "core",
        "Which key takeaway belongs to “" + lesson.title + "”?",
        lesson.takeaway,
        other.map((candidate) => candidate.lesson.takeaway),
        lesson.takeaway,
        "The lesson's stated takeaway is: " + lesson.takeaway,
        lesson.points.join(" "),
      );

      if (lesson.formula) {
        makeQuestion(
          "formula",
          "challenge",
          "Which equation or mathematical relationship is associated with “" + lesson.title + "”?",
          lesson.formula,
          other.map((candidate) => candidate.lesson.formula).filter((value): value is string => Boolean(value)),
          lesson.formula,
          "This is the formula shown in " + lesson.title + ". " + lesson.takeaway,
          lesson.formula,
        );
      }

      if (lesson.example) {
        makeQuestion(
          "example",
          "challenge",
          "Which worked example is used to illustrate “" + lesson.title + "”?",
          lesson.example,
          other.map((candidate) => candidate.lesson.example).filter((value): value is string => Boolean(value)),
          lesson.example,
          "The example in this topic is: " + lesson.example,
          lesson.example,
        );
      }
    }

    if (includeWritten) {
      const writtenDifficulty: Exclude<PracticeDifficulty, "all"> =
        difficulty === "all" ? "core" : difficulty;
      const corePoints = lesson.points.slice(0, 3).map((point, index) => (index + 1) + ". " + point).join("\n");
      const answer = [
        lesson.summary,
        corePoints,
        lesson.formula ? "Key equation: " + lesson.formula : "",
        lesson.example ? "Example: " + lesson.example : "",
        "Key takeaway: " + lesson.takeaway,
      ].filter(Boolean).join("\n\n");
      const prompt = writtenDifficulty === "starter"
        ? "In one or two sentences, state the main idea of “" + lesson.title + "”."
        : writtenDifficulty === "challenge"
          ? "Explain “" + lesson.title + "” and connect its main idea to a formula, worked example or practical consequence from the lesson."
          : "Without looking at your notes, explain “" + lesson.title + "” in your own words. Include the central idea and at least two important details.";
      questions.push({
        id: lesson.id + ":written",
        lessonId: lesson.id,
        moduleId,
        moduleTitle,
        lessonTitle: lesson.title,
        kind: "written",
        difficulty: writtenDifficulty,
        prompt,
        answerText: answer,
        explanation: "Compare your response with the lesson guide. Look for the central idea, the key points and the takeaway.",
        sourceText: lesson.summary,
      });
    }
  }

  const recent = new Set(recentlyAsked);
  let available = questions.filter((question) => !recent.has(question.id));
  if (!available.length) available = questions;

  // Weak and overdue topics appear earlier, while shuffling keeps sessions varied.
  return shuffle(available).sort((a, b) =>
    reviewPriority(topicStats[b.lessonId], now) - reviewPriority(topicStats[a.lessonId], now)
  );
}

/**
 * Generates active-recall cards from every lesson plus its formula and example.
 * Every card has its own review schedule.
 */
export function buildStudyCards(
  courseModules: CourseModule[],
  moduleFilter: ModuleFilter,
  cardStats: Record<string, LearningStat>,
  queue: ReviewQueue,
  now = Date.now(),
): StudyCard[] {
  const cards: StudyCard[] = [];

  for (const module of courseModules) {
    if (moduleFilter !== "all" && moduleFilter !== module.id) continue;

    for (const lesson of module.topics) {
      const conceptBack = [
        lesson.summary,
        ...lesson.points.map((point, index) => (index + 1) + ". " + point),
        lesson.formula ? "Key equation:\n" + lesson.formula : "",
        lesson.example ? "Worked example:\n" + lesson.example : "",
        "Remember: " + lesson.takeaway,
      ].filter(Boolean).join("\n\n");

      cards.push({
        id: lesson.id + ":concept",
        lessonId: lesson.id,
        moduleId: module.id,
        moduleTitle: module.title,
        lessonTitle: lesson.title,
        kind: "concept",
        front: "Explain “" + lesson.title + "” without looking at your notes.",
        back: conceptBack,
      });

      if (lesson.formula) {
        cards.push({
          id: lesson.id + ":formula",
          lessonId: lesson.id,
          moduleId: module.id,
          moduleTitle: module.title,
          lessonTitle: lesson.title,
          kind: "formula",
          front: "From memory, write the key formula associated with “" + lesson.title + "”.",
          back: lesson.formula + "\n\n" + lesson.takeaway,
        });
      }

      if (lesson.example) {
        cards.push({
          id: lesson.id + ":example",
          lessonId: lesson.id,
          moduleId: module.id,
          moduleTitle: module.title,
          lessonTitle: lesson.title,
          kind: "example",
          front: "Give the example used to explain “" + lesson.title + "”.",
          back: lesson.example + "\n\n" + lesson.takeaway,
        });
      }
    }
  }

  const isDue = (card: StudyCard) => {
    const nextReview = cardStats[card.id]?.nextReviewAt;
    return !nextReview || Date.parse(nextReview) <= now;
  };

  return cards
    .filter((card) => queue === "all" || isDue(card))
    .sort((a, b) => {
      const aStat = cardStats[a.id];
      const bStat = cardStats[b.id];
      const aDue = isDue(a);
      const bDue = isDue(b);
      if (aDue !== bDue) return aDue ? -1 : 1;
      const aNext = aStat?.nextReviewAt ? Date.parse(aStat.nextReviewAt) : 0;
      const bNext = bStat?.nextReviewAt ? Date.parse(bStat.nextReviewAt) : 0;
      return aNext - bNext;
    });
}

/** SM-2-inspired scheduling for learner-rated recall quality (0–5). */
export function updateLearningStat(
  stats: Record<string, LearningStat>,
  id: string,
  quality: number,
  now = Date.now(),
): Record<string, LearningStat> {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  const previous = stats[id] ?? {
    attempts: 0,
    correct: 0,
    streak: 0,
    lapses: 0,
    intervalDays: 0,
    ease: 2.5,
    lastReviewedAt: null,
    nextReviewAt: null,
  };

  const ease = Math.max(
    1.3,
    previous.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  let intervalDays: number;
  if (q < 3) intervalDays = 1;
  else if (previous.attempts === 0) intervalDays = q === 5 ? 4 : 1;
  else if (previous.streak === 1) intervalDays = q === 3 ? 2 : 3;
  else {
    const multiplier = q === 3 ? 0.75 : q === 5 ? 1.3 : 1;
    intervalDays = Math.max(1, Math.round(Math.max(1, previous.intervalDays) * ease * multiplier));
  }

  const nextReviewAt = new Date(now + intervalDays * 86_400_000).toISOString();
  return {
    ...stats,
    [id]: {
      attempts: previous.attempts + 1,
      correct: previous.correct + (q >= 3 ? 1 : 0),
      streak: q >= 3 ? previous.streak + 1 : 0,
      lapses: previous.lapses + (q < 3 ? 1 : 0),
      intervalDays,
      ease,
      lastReviewedAt: new Date(now).toISOString(),
      nextReviewAt,
    },
  };
}
