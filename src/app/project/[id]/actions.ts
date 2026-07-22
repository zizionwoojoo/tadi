"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analyzeMeetingMinutes, extractCategories, generateCategoryTaskList } from "@/lib/ai";

const titleSchema = z.string().trim().min(1, "프로젝트 이름을 입력해주세요.").max(60, "60자 이내로 입력해주세요.");

async function requireProjectOwnership(projectId: string) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== session.user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다.");
  }

  return project;
}

export type AnalyzeState = { error?: string } | undefined;

export async function analyzeMinutesAction(
  projectId: string,
  _prevState: AnalyzeState,
  formData: FormData
): Promise<AnalyzeState> {
  const project = await requireProjectOwnership(projectId);

  const titleResult = titleSchema.safeParse(formData.get("title"));
  if (!titleResult.success) {
    return { error: titleResult.error.issues[0]?.message ?? "프로젝트 이름을 입력해주세요." };
  }

  const minutes = String(formData.get("minutes") ?? "").trim();
  if (minutes.length < 20) {
    return { error: "회의록 내용을 20자 이상 입력해주세요." };
  }

  let agendas;
  try {
    agendas = await analyzeMeetingMinutes(minutes);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "AI 분석 중 오류가 발생했습니다.",
    };
  }

  await prisma.$transaction([
    prisma.project.update({
      where: { id: project.id },
      data: { status: "kanban", meetingMinutes: minutes, title: titleResult.data },
    }),
    ...agendas.map((agenda, index) =>
      prisma.agenda.create({
        data: {
          projectId: project.id,
          order: index,
          title: agenda.title,
          originalSummary: agenda.summary,
          currentSummary: agenda.summary,
          aiSuggestion: agenda.suggestion,
          issues: JSON.stringify(agenda.issues),
        },
      })
    ),
  ]);

  revalidatePath(`/project/${project.id}`);
}

export async function openAgendaReviewAction(agendaId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const agenda = await prisma.agenda.findUnique({
    where: { id: agendaId },
    include: { project: true },
  });
  if (!agenda || agenda.project.ownerId !== session.user.id) {
    throw new Error("안건을 찾을 수 없습니다.");
  }

  if (agenda.status === "pending") {
    const updated = await prisma.agenda.update({
      where: { id: agendaId },
      data: { status: "reviewing" },
    });
    return { status: updated.status };
  }

  return { status: agenda.status };
}

export type ResolveResolution = "direct_edit" | "ai_applied" | "original_kept";

export async function resolveAgendaAction(
  agendaId: string,
  resolution: ResolveResolution,
  editedSummary?: string
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const agenda = await prisma.agenda.findUnique({
    where: { id: agendaId },
    include: { project: true },
  });
  if (!agenda || agenda.project.ownerId !== session.user.id) {
    throw new Error("안건을 찾을 수 없습니다.");
  }

  let currentSummary = agenda.currentSummary;
  if (resolution === "ai_applied") {
    currentSummary = agenda.aiSuggestion;
  } else if (resolution === "original_kept") {
    currentSummary = agenda.originalSummary;
  } else if (resolution === "direct_edit") {
    currentSummary = (editedSummary ?? agenda.currentSummary).trim();
    if (!currentSummary) {
      throw new Error("수정한 내용을 입력해주세요.");
    }
  }

  const updated = await prisma.agenda.update({
    where: { id: agendaId },
    data: { currentSummary, status: "done", resolution },
  });

  return {
    id: updated.id,
    currentSummary: updated.currentSummary,
    status: updated.status,
    resolution: updated.resolution,
  };
}

async function createCategoriesFromAgendas(projectId: string) {
  const agendas = await prisma.agenda.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });

  const categoryNames = await extractCategories(
    agendas.map((a) => ({ title: a.title, summary: a.currentSummary }))
  );

  await prisma.category.createMany({
    data: categoryNames.map((name, index) => ({ projectId, name, order: index })),
  });
}

export async function advanceProjectAction(projectId: string) {
  const project = await requireProjectOwnership(projectId);

  const remaining = await prisma.agenda.count({
    where: { projectId: project.id, status: { not: "done" } },
  });
  if (remaining > 0) {
    throw new Error("아직 검토가 끝나지 않은 안건이 있습니다.");
  }

  await prisma.project.update({
    where: { id: project.id },
    data: { status: "dashboard" },
  });

  const existingCategories = await prisma.category.count({ where: { projectId: project.id } });
  if (existingCategories === 0) {
    try {
      await createCategoriesFromAgendas(project.id);
    } catch {
      // AI categorization failed; the dashboard offers a retry action.
    }
  }

  redirect(`/project/${project.id}`);
}

export type RetryCategorizeState = { error?: string } | undefined;

export async function retryCategorizeAction(projectId: string): Promise<RetryCategorizeState> {
  const project = await requireProjectOwnership(projectId);

  try {
    await createCategoriesFromAgendas(project.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "카테고리 추출 중 오류가 발생했습니다.",
    };
  }

  revalidatePath(`/project/${project.id}`);
}

export type MemberPayload = { id: string; name: string };

export async function addMemberToCategoryAction(
  categoryId: string,
  input: { existingMemberId?: string; newName?: string }
): Promise<MemberPayload> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { project: true },
  });
  if (!category || category.project.ownerId !== session.user.id) {
    throw new Error("카테고리를 찾을 수 없습니다.");
  }

  let memberId = input.existingMemberId;
  if (!memberId) {
    const name = (input.newName ?? "").trim();
    if (!name) {
      throw new Error("팀원 이름을 입력해주세요.");
    }
    const created = await prisma.member.create({
      data: { projectId: category.projectId, name },
    });
    memberId = created.id;
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { members: { connect: { id: memberId } } },
  });

  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId } });
  return { id: member.id, name: member.name };
}

export type TaskPayload = {
  id: string;
  text: string;
  completed: boolean;
  memberId: string;
  order: number;
};

function toTaskPayload(task: {
  id: string;
  text: string;
  completed: boolean;
  memberId: string;
  order: number;
}): TaskPayload {
  return {
    id: task.id,
    text: task.text,
    completed: task.completed,
    memberId: task.memberId,
    order: task.order,
  };
}

export async function generateCategoryTasksAction(categoryId: string): Promise<TaskPayload[]> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      project: { include: { agendas: true } },
      members: true,
      tasks: { orderBy: { order: "asc" } },
    },
  });
  if (!category || category.project.ownerId !== session.user.id) {
    throw new Error("카테고리를 찾을 수 없습니다.");
  }

  if (category.members.length === 0) {
    throw new Error("먼저 팀원을 배치해주세요.");
  }

  // Category-wide task list is generated once and stays fixed in size — it
  // does not grow just because more members join. Adding a member only
  // re-splits the still-incomplete work across everyone.
  if (category.tasks.length === 0) {
    const taskTexts = await generateCategoryTaskList({
      categoryName: category.name,
      agendas: category.project.agendas.map((a) => ({ title: a.title, summary: a.currentSummary })),
    });

    const rows = taskTexts.map((text, i) => ({
      categoryId,
      memberId: category.members[i % category.members.length].id,
      text,
      order: i,
    }));

    if (rows.length === 0) {
      throw new Error("AI가 업무를 생성하지 못했습니다. 다시 시도해주세요.");
    }

    await prisma.task.createMany({ data: rows });
    const created = await prisma.task.findMany({ where: { categoryId }, orderBy: { order: "asc" } });
    return created.map(toTaskPayload);
  }

  const membersWithTasks = new Set(category.tasks.map((t) => t.memberId));
  const membersNeedingTasks = category.members.filter((m) => !membersWithTasks.has(m.id));

  if (membersNeedingTasks.length === 0) {
    return category.tasks.map(toTaskPayload);
  }

  const incompleteTasks = category.tasks.filter((t) => !t.completed);
  if (incompleteTasks.length === 0) {
    // Nothing left unfinished to hand to the new member — leave as-is
    // rather than manufacturing extra work.
    return category.tasks.map(toTaskPayload);
  }

  await prisma.$transaction(
    incompleteTasks.map((task, i) =>
      prisma.task.update({
        where: { id: task.id },
        data: { memberId: category.members[i % category.members.length].id },
      })
    )
  );

  const updated = await prisma.task.findMany({ where: { categoryId }, orderBy: { order: "asc" } });
  return updated.map(toTaskPayload);
}

export async function toggleTaskAction(taskId: string, completed: boolean): Promise<TaskPayload> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { category: { include: { project: true } } },
  });
  if (!task || task.category.project.ownerId !== session.user.id) {
    throw new Error("작업을 찾을 수 없습니다.");
  }

  const updated = await prisma.task.update({ where: { id: taskId }, data: { completed } });

  const remaining = await prisma.task.count({
    where: { category: { projectId: task.category.projectId }, completed: false },
  });
  if (remaining === 0) {
    await prisma.project.update({
      where: { id: task.category.projectId },
      data: { status: "done" },
    });
  } else if (task.category.project.status === "done") {
    await prisma.project.update({
      where: { id: task.category.projectId },
      data: { status: "dashboard" },
    });
  }

  return toTaskPayload(updated);
}
