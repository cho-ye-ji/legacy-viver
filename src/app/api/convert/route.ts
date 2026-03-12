import { NextRequest, NextResponse } from "next/server";
import { groq, SYSTEM_PROMPTS, type Framework } from "@/lib/groq";

export async function POST(request: NextRequest) {
  try {
    const { code, framework = "react" } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "코드를 입력해주세요." }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const systemPrompt = SYSTEM_PROMPTS[framework as Framework] ?? SYSTEM_PROMPTS.react;
    const userMessage = framework === "vue"
      ? `Convert the following legacy code to a Vue 3 SFC (.vue file).\nDo NOT use React. Use <script setup lang="ts">, ref(), onMounted(), and Vue directives.\n\nLegacy code:\n${code}`
      : `다음 레거시 코드를 React 함수형 컴포넌트(TypeScript + Tailwind CSS)로 변환해주세요:\n\n${code}`;

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
