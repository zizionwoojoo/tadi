import Groq from "groq-sdk";
import { z } from "zod";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const agendaAnalysisSchema = z.object({
  agendas: z
    .array(
      z.object({
        title: z.string().min(1),
        summary: z.string().min(1),
        issues: z.array(z.string()),
        suggestion: z.string().min(1),
      })
    )
    .min(1),
});

export type AnalyzedAgenda = z.infer<typeof agendaAnalysisSchema>["agendas"][number];

const SYSTEM_PROMPT = `당신은 회의록을 분석해서 실행 가능한 안건 목록으로 정리하는 어시스턴트입니다.
사용자가 제공하는 회의록 텍스트에서 논의된 핵심 안건들을 추출하세요 (최소 1개, 최대 8개).

프로젝트명 소개, 참여자 소개, 프로젝트 전체 개요/배경 설명처럼 후속 업무로 이어지지 않는 내용은 안건으로 뽑지 마세요.
실제로 결정되었거나, 논의 중이거나, 이후 실행할 업무가 필요한 구체적인 주제만 안건으로 추출하세요.

각 안건에 대해 다음 필드를 작성하세요:
- title: 안건 제목 (15자 내외의 간결한 문구)
- summary: 안건 내용을 3~5문장으로 정리한 요약
- issues: summary에서 발견되는 논리적 문제점 (앞뒤가 맞지 않는 내용, 근거 부족, 담당자/기한 불명확 등). 문제가 없으면 빈 배열을 반환하세요.
- suggestion: issues에서 지적한 문제를 보완한 더 명확한 요약문. issues가 비어 있으면 summary와 동일하게 작성하세요.

다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{"agendas": [{"title": "...", "summary": "...", "issues": ["..."], "suggestion": "..."}]}`;

async function callGroqJson(systemPrompt: string, userContent: string): Promise<unknown> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY가 설정되어 있지 않습니다.");
  }

  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("AI로부터 응답을 받지 못했습니다.");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("AI 응답을 해석하지 못했습니다. 다시 시도해주세요.");
  }
}

export async function analyzeMeetingMinutes(minutes: string): Promise<AnalyzedAgenda[]> {
  const parsedJson = await callGroqJson(SYSTEM_PROMPT, minutes);

  const result = agendaAnalysisSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new Error("AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.");
  }

  return result.data.agendas;
}

type AgendaRef = { title: string; summary: string };

function formatAgendasForPrompt(agendas: AgendaRef[]): string {
  return agendas.map((a, i) => `${i + 1}. ${a.title}\n${a.summary}`).join("\n\n");
}

const categorySchema = z.object({
  categories: z.array(z.string().trim().min(1)).min(2).max(6),
});

const CATEGORY_SYSTEM_PROMPT = `당신은 프로젝트 매니저입니다. 회의에서 확정된 안건 목록을 보고, 실행을 위해 팀을 나눌 역할/업무 카테고리를 정확히 4개로 그룹화하세요.
프로젝트 성격에 맞는 카테고리명을 만드세요 (예: 프론트엔드, 백엔드, 디자인, 마케팅, 기획/QA 등). 카테고리명은 6자 내외로 간결하게 작성하세요.
다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{"categories": ["...", "...", "...", "..."]}`;

export async function extractCategories(agendas: AgendaRef[]): Promise<string[]> {
  const parsedJson = await callGroqJson(CATEGORY_SYSTEM_PROMPT, formatAgendasForPrompt(agendas));

  const result = categorySchema.safeParse(parsedJson);
  if (!result.success) {
    throw new Error("카테고리 추출에 실패했습니다. 다시 시도해주세요.");
  }

  return result.data.categories.slice(0, 4);
}

const categoryTaskListSchema = z.object({
  tasks: z.array(z.string().trim().min(1)).min(1).max(12),
});

const CATEGORY_TASK_LIST_SYSTEM_PROMPT_TEMPLATE = (categoryName: string) => `당신은 프로젝트 매니저입니다. 아래는 회의에서 확정된 안건 목록입니다. "${categoryName}" 카테고리 관점에서 실제로 필요한 구체적이고 실행 가능한 할 일을 나열하세요.
배정된 인원 수와는 무관하게, 꼭 필요한 업무만 적정 개수(보통 4~10개)로 작성하세요. 인원이 많다고 불필요하게 업무를 세분화하거나 개수를 늘리지 마세요.
다른 설명 없이 아래 JSON 형식으로만 응답하세요:
{"tasks": ["...", "..."]}`;

export async function generateCategoryTaskList(params: {
  categoryName: string;
  agendas: AgendaRef[];
}): Promise<string[]> {
  const parsedJson = await callGroqJson(
    CATEGORY_TASK_LIST_SYSTEM_PROMPT_TEMPLATE(params.categoryName),
    formatAgendasForPrompt(params.agendas)
  );

  const result = categoryTaskListSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new Error("업무 생성에 실패했습니다. 다시 시도해주세요.");
  }

  return result.data.tasks;
}
