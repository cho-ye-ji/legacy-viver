import { NextRequest, NextResponse } from "next/server";
import { groq, PROMPTS, type Source, type Target } from "@/lib/groq";

const SOURCE_LABEL: Record<Source, string> = {
  legacy: "Legacy jQuery/Vanilla JS",
  react:  "React (TypeScript)",
  vue:    "Vue 3 SFC (TypeScript)",
};

const TARGET_LABEL: Record<Target, string> = {
  react: "React 함수형 컴포넌트 (TypeScript + Tailwind CSS)",
  vue:   "Vue 3 SFC (Composition API + TypeScript + Tailwind CSS)",
};

export async function POST(request: NextRequest) {
  try {
    const { code, source = "legacy", target = "react" } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "코드를 입력해주세요." }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const key = `${source}_${target}` as keyof typeof PROMPTS;
    const systemPrompt = PROMPTS[key] ?? PROMPTS.legacy_react;

    const isVueTarget = target === "vue";
    const userMessage = isVueTarget
      ? `Convert the following ${SOURCE_LABEL[source as Source]} code to ${TARGET_LABEL.vue}.\nDo NOT use React. Output only .vue SFC format starting with <script setup lang="ts">.\n\nSource code:\n${code}`
      : `다음 ${SOURCE_LABEL[source as Source]} 코드를 ${TARGET_LABEL.react}로 변환해주세요:\n\n${code}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    const converted = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ converted });
  } catch (error) {
    console.error("Groq API error:", error);
    return NextResponse.json({ error: "변환 중 오류가 발생했습니다." }, { status: 500 });
  }
}
