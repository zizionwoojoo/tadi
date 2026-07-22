export type AgendaStatus = "pending" | "reviewing" | "done";

export type AgendaCardData = {
  id: string;
  title: string;
  currentSummary: string;
  originalSummary: string;
  aiSuggestion: string;
  issues: string[];
  status: AgendaStatus;
  resolution: string | null;
  order: number;
};

export type MemberData = {
  id: string;
  name: string;
};

export type TaskData = {
  id: string;
  text: string;
  completed: boolean;
  memberId: string;
  order: number;
};

export type CategoryData = {
  id: string;
  name: string;
  order: number;
  members: MemberData[];
  tasks: TaskData[];
};
