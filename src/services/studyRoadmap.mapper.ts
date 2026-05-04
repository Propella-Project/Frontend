import type { RoadmapDay, Subject, Task, TaskType } from "@/types";
import type {
  RoadmapProgress,
  RoadmapResponse,
  StudyRoadmapPhase,
  StudyRoadmapPhaseTask,
} from "@/types/api.types";

function normalizeTaskType(raw: string | undefined): TaskType {
  const t = (raw ?? "study").toLowerCase();
  if (t.includes("quiz")) return "quiz";
  if (t.includes("revision")) return "revision";
  if (t === "assignment") return "assignment";
  if (t === "reinforcement") return "reinforcement";
  return "study";
}

function resolveSubject(subjects: Subject[], hint: string | undefined): Subject {
  if (!subjects.length) {
    throw new Error("studyRoadmap.mapper: no subjects");
  }
  if (!hint?.trim()) return subjects[0];
  const h = hint.toLowerCase().trim();
  const byId = subjects.find((s) => s.id === h);
  if (byId) return byId;
  const byName = subjects.find(
    (s) =>
      s.name.toLowerCase() === h ||
      s.code.toLowerCase() === h ||
      s.id.toLowerCase() === h,
  );
  if (byName) return byName;
  const fuzzy = subjects.find(
    (s) =>
      h.includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(h) ||
      h.includes(s.id),
  );
  return fuzzy ?? subjects[0];
}

function resolveTopicId(subject: Subject, topicHint: string | undefined): string {
  if (!topicHint?.trim()) return subject.topics[0]?.id ?? "";
  const t = topicHint.toLowerCase().trim();
  const topic =
    subject.topics.find(
      (x) =>
        x.id === topicHint ||
        x.name.toLowerCase() === t ||
        x.name.toLowerCase().includes(t),
    ) ?? subject.topics[0];
  return topic?.id ?? "";
}

function mapOneTask(
  raw: StudyRoadmapPhaseTask,
  dayId: string,
  subjects: Subject[],
  defaultSubject: Subject,
  index: number,
): Task {
  const subj = raw.subject || raw.subject_id
    ? resolveSubject(subjects, raw.subject ?? raw.subject_id)
    : defaultSubject;
  const duration = Math.max(5, raw.duration ?? raw.duration_minutes ?? 25);
  return {
    id: String(raw.id ?? `${dayId}_task_${index}`),
    dayId,
    type: normalizeTaskType(raw.type),
    title: raw.title?.trim() || "Study session",
    description: raw.description?.trim() || "",
    subjectId: subj.id,
    topicId: resolveTopicId(subj, raw.topic ?? raw.topic_id),
    duration,
    status: "pending",
    order: index,
    resources: [],
  };
}

function fallbackTasksForPhase(
  phase: StudyRoadmapPhase,
  dayId: string,
  subjects: Subject[],
  dayNumber: number,
  dailyStudyHours: number,
): Task[] {
  const prioritized = [...subjects].sort((a, b) => {
    const aw = a.topics[0]?.abilityScore ?? 50;
    const bw = b.topics[0]?.abilityScore ?? 50;
    return aw - bw;
  });
  const subject = prioritized[(dayNumber - 1) % prioritized.length] ?? subjects[0];
  const studyMinutes = Math.max(30, dailyStudyHours * 30);
  const tasks: Task[] = [
    {
      id: `${dayId}_focus`,
      dayId,
      type: "study",
      title: phase.title,
      description: phase.description,
      subjectId: subject.id,
      topicId: subject.topics[0]?.id ?? "",
      duration: studyMinutes,
      status: "pending",
      order: 0,
      resources: [],
    },
    {
      id: `${dayId}_quiz`,
      dayId,
      type: "quiz",
      title: `Practice quiz — ${subject.name}`,
      description: "Test your knowledge",
      subjectId: subject.id,
      topicId: subject.topics[0]?.id ?? "",
      duration: 20,
      status: "pending",
      order: 1,
      resources: [],
    },
  ];
  if (dayNumber > 1) {
    tasks.push({
      id: `${dayId}_revision`,
      dayId,
      type: "revision",
      title: "Quick revision",
      description: "Review recent topics",
      subjectId: subject.id,
      topicId: subject.topics[0]?.id ?? "",
      duration: 15,
      status: "pending",
      order: tasks.length,
      resources: [],
    });
  }
  return tasks;
}

function phaseDate(phase: StudyRoadmapPhase, index: number): Date {
  if (phase.date) {
    const d = new Date(phase.date);
    return Number.isNaN(d.getTime()) ? addDaysFromToday(index) : d;
  }
  return addDaysFromToday(index);
}

function addDaysFromToday(index: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + index);
  return d;
}

function estimateHoursFromTasks(tasks: Task[]): number {
  const mins = tasks.reduce((s, t) => s + t.duration, 0);
  return Math.max(1, Math.round(mins / 60) || 1);
}

export function mapPhaseToRoadmapDay(
  phase: StudyRoadmapPhase,
  subjects: Subject[],
  userId: string,
  dailyStudyHours: number,
): RoadmapDay {
  const dayNumber = phase.order;
  const dayId = phase.date
    ? `day_${phase.date}_${dayNumber}`
    : `day_${dayNumber}`;
  const date = phaseDate(phase, dayNumber - 1);

  let tasks: Task[];
  if (phase.is_rest) {
    tasks = [
      {
        id: `${dayId}_rest`,
        dayId,
        type: "study",
        title: "Rest day",
        description: phase.description || phase.title || "Light recovery",
        subjectId: subjects[0]?.id ?? "general",
        topicId: subjects[0]?.topics[0]?.id ?? "",
        duration: 15,
        status: "pending",
        order: 0,
        resources: [],
      },
    ];
  } else if (phase.tasks && phase.tasks.length > 0) {
    tasks = phase.tasks.map((t, i) =>
      mapOneTask(t, dayId, subjects, subjects[i % subjects.length], i),
    );
  } else {
    tasks = fallbackTasksForPhase(phase, dayId, subjects, dayNumber, dailyStudyHours);
  }

  const quizRequired = tasks.some((t) => t.type === "quiz");

  return {
    id: dayId,
    userId,
    date,
    dayNumber,
    tasks,
    isUnlocked: false,
    isCompleted: false,
    quizRequired,
    quizCompleted: false,
    quizScore: null,
    minimumMasteryRequired: 50,
    estimatedHours: estimateHoursFromTasks(tasks),
  };
}

export function mapStudyResponseToRoadmapDays(
  res: RoadmapResponse,
  subjects: Subject[],
  userId: string,
  dailyStudyHours: number,
): RoadmapDay[] {
  const sorted = [...(res.phases ?? [])].sort((a, b) => a.order - b.order);
  return sorted.map((p) =>
    mapPhaseToRoadmapDay(p, subjects, userId, dailyStudyHours),
  );
}

export function applyPhaseProgressToDays(
  days: RoadmapDay[],
  progress: RoadmapProgress | null | undefined,
): RoadmapDay[] {
  if (!progress) {
    return days.map((d, i) => ({
      ...d,
      isUnlocked: i === 0,
      isCompleted: false,
    }));
  }

  const done = new Set(progress.completed_phase_orders ?? []);
  const cur = progress.current_phase_order;

  return days.map((day) => {
    const order = day.dayNumber;
    const isCompleted = done.has(order);
    const isUnlocked =
      order === 1 ||
      done.has(order) ||
      done.has(order - 1) ||
      cur === order;

    if (!isCompleted) {
      return { ...day, isCompleted: false, isUnlocked };
    }

    return {
      ...day,
      isCompleted: true,
      isUnlocked: true,
      tasks: day.tasks.map((t) => ({
        ...t,
        status: t.status === "completed" ? t.status : ("completed" as const),
      })),
      quizCompleted: day.quizRequired ? true : day.quizCompleted,
      quizScore: day.quizScore,
    };
  });
}

export function buildGoalString(
  dailyStudyHours: number,
  subjectScoresJson?: string,
  weakHint?: string,
): string {
  const parts = [
    `JAMB preparation. Daily study: ${dailyStudyHours} hours.`,
    weakHint ? `Focus: ${weakHint}` : "",
    subjectScoresJson ? `Performance: ${subjectScoresJson}` : "",
  ];
  return parts.filter(Boolean).join(" ");
}
