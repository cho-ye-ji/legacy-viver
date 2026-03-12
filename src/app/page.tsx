"use client";

import { useState, useCallback } from "react";
import { Zap, Code2, ArrowRight, RotateCcw, Copy, Check, AlertCircle, Sparkles, Sun, Moon } from "lucide-react";
import DiffViewer from "@/components/DiffViewer";
import type { Source, Target } from "@/lib/groq";

const EXAMPLE_CODE = `// jQuery 예시 코드
$(document).ready(function() {
  var count = 0;

  $('#increment-btn').on('click', function() {
    count++;
    $('#counter').text('Count: ' + count);
    if (count >= 10) {
      $('#counter').css('color', 'red');
    }
  });

  $('#reset-btn').on('click', function() {
    count = 0;
    $('#counter').text('Count: 0').css('color', 'black');
  });

  $.ajax({
    url: '/api/data',
    method: 'GET',
    success: function(data) {
      $('#result').html('<ul>' +
        data.items.map(function(item) {
          return '<li>' + item.name + '</li>';
        }).join('') +
      '</ul>');
    },
    error: function(err) {
      $('#result').text('Error: ' + err.statusText);
    }
  });
});`;

// 각 소스/타겟의 라벨, 색상, 아이콘 정의
const SOURCE_CONFIG: Record<Source, { label: string; color: string; activeDark: string; activeLight: string; icon: React.ReactNode }> = {
  legacy: {
    label: "Legacy JS",
    color: "#f59e0b",
    activeDark: "bg-zinc-800 text-amber-400 border border-amber-500/30",
    activeLight: "bg-white text-amber-600 border border-amber-400/50",
    icon: <span className="font-bold text-xs">jQuery</span>,
  },
  react: {
    label: "React",
    color: "#61dafb",
    activeDark: "bg-zinc-800 text-[#61dafb] border border-[#61dafb]/30",
    activeLight: "bg-white text-[#087ea4] border border-[#61dafb]/40",
    icon: (
      <svg viewBox="-11.5 -10.232 23 20.463" className="w-4 h-4" fill="currentColor">
        <circle r="2.05" />
        <g stroke="currentColor" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    ),
  },
  vue: {
    label: "Vue 3",
    color: "#42b883",
    activeDark: "bg-zinc-800 text-[#42b883] border border-[#42b883]/30",
    activeLight: "bg-white text-[#2d7a5f] border border-[#42b883]/40",
    icon: (
      <svg viewBox="0 0 261.76 226.69" className="w-4 h-4" fill="currentColor">
        <path d="M161.096.001l-30.225 52.351L100.647.001H-.005l130.876 226.689L261.749.001z" opacity=".7" />
        <path d="M161.096.001l-30.225 52.351L100.647.001H52.346l78.523 136.01L209.398.001z" />
      </svg>
    ),
  },
};

const TARGET_CONFIG: Record<Target, { label: string; activeDark: string; activeLight: string; icon: React.ReactNode }> = {
  react: {
    label: "React",
    activeDark: "bg-zinc-800 text-[#61dafb] border border-[#61dafb]/30",
    activeLight: "bg-white text-[#087ea4] border border-[#61dafb]/40",
    icon: SOURCE_CONFIG.react.icon,
  },
  vue: {
    label: "Vue 3",
    activeDark: "bg-zinc-800 text-[#42b883] border border-[#42b883]/30",
    activeLight: "bg-white text-[#2d7a5f] border border-[#42b883]/40",
    icon: SOURCE_CONFIG.vue.icon,
  },
};

type ViewMode = "diff" | "code";

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [source, setSource] = useState<Source>("legacy");
  const [target, setTarget] = useState<Target>("react");
  const [inputCode, setInputCode] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("diff");
  const [copied, setCopied] = useState(false);

  // 소스 변경 시 같은 타겟이면 자동 전환
  const handleSourceChange = useCallback((s: Source) => {
    setSource(s);
    if (s !== "legacy" && s === target) {
      setTarget(s === "react" ? "vue" : "react");
    }
    setConvertedCode("");
    setError("");
  }, [target]);

  const handleConvert = useCallback(async () => {
    if (!inputCode.trim()) {
      setError("변환할 코드를 입력해주세요.");
      return;
    }
    setIsLoading(true);
    setError("");
    setConvertedCode("");
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inputCode, source, target }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "변환 중 오류가 발생했습니다.");
      setConvertedCode(data.converted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [inputCode, source, target]);

  const handleCopy = useCallback(async () => {
    if (!convertedCode) return;
    await navigator.clipboard.writeText(convertedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [convertedCode]);

  const handleReset = useCallback(() => {
    setInputCode("");
    setConvertedCode("");
    setError("");
  }, []);

  const rightTitle = target === "vue"
    ? "변환 결과 (Vue 3 + TypeScript)"
    : "변환 결과 (React + TypeScript)";

  const convertLabel = `${SOURCE_CONFIG[source].label} → ${TARGET_CONFIG[target].label}`;

  // 테마
  const t = {
    page:        isDark ? "bg-zinc-950 text-zinc-100"           : "bg-slate-50 text-zinc-900",
    header:      isDark ? "border-zinc-800 bg-zinc-900/80"      : "border-slate-200 bg-white/90",
    subtitle:    isDark ? "text-zinc-500"                       : "text-zinc-400",
    badge:       isDark ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-slate-100 border-slate-200 text-zinc-500",
    banner:      isDark ? "from-violet-950/50 to-indigo-950/50 border-violet-800/30" : "from-violet-50 to-indigo-50 border-violet-200",
    bannerTitle: isDark ? "text-violet-300"  : "text-violet-700",
    bannerText:  isDark ? "text-zinc-400"    : "text-zinc-500",
    dotText:     isDark ? "text-zinc-500"    : "text-zinc-400",
    label:       isDark ? "text-zinc-300"    : "text-zinc-600",
    icon:        isDark ? "text-zinc-400"    : "text-zinc-400",
    exampleBtn:  isDark ? "text-violet-400 border-violet-800/50 bg-violet-950/30 hover:border-violet-700"
                        : "text-violet-600 border-violet-300 bg-violet-50 hover:border-violet-400",
    textarea:    isDark ? "bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:border-violet-600 focus:ring-violet-600/50"
                        : "bg-white border-slate-300 text-zinc-800 placeholder-zinc-400 focus:border-violet-500 focus:ring-violet-500/30",
    clearBtn:    isDark ? "text-zinc-600 hover:text-zinc-400"   : "text-zinc-400 hover:text-zinc-600",
    selectorBg:  isDark ? "bg-zinc-900 border-zinc-700"         : "bg-slate-100 border-slate-200",
    inactive:    isDark ? "text-zinc-500 hover:text-zinc-300"   : "text-zinc-400 hover:text-zinc-600",
    tabBar:      isDark ? "bg-zinc-800"                         : "bg-slate-100",
    tabActive:   isDark ? "bg-zinc-700 text-zinc-100"           : "bg-white text-zinc-900 shadow-sm",
    tabInactive: isDark ? "text-zinc-400 hover:text-zinc-300"   : "text-zinc-500 hover:text-zinc-700",
    actionBtn:   isDark ? "text-zinc-300 border-zinc-700 bg-zinc-800/50 hover:text-zinc-100 hover:border-zinc-600"
                        : "text-zinc-600 border-slate-200 bg-white hover:text-zinc-900 hover:border-slate-300",
    successBg:   isDark ? "text-green-400 bg-green-950/30 border-green-800/40" : "text-green-700 bg-green-50 border-green-200",
    errorBg:     isDark ? "text-red-400 bg-red-950/30 border-red-800/50"       : "text-red-600 bg-red-50 border-red-200",
    codePre:     isDark ? "bg-zinc-900 border-zinc-700 text-zinc-200"          : "bg-slate-50 border-slate-200 text-zinc-800",
    footer:      isDark ? "border-zinc-800 text-zinc-600"                      : "border-slate-200 text-zinc-400",
    toggleBtn:   isDark ? "bg-zinc-800 border-zinc-700 text-yellow-400 hover:bg-zinc-700"
                        : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200",
    arrowDivider:isDark ? "text-zinc-600" : "text-zinc-400",
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${t.page}`}>
      {/* 헤더 */}
      <header className={`border-b backdrop-blur-sm sticky top-0 z-10 ${t.header}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Legacy Reviver</h1>
              <p className={`text-xs ${t.subtitle}`}>jQuery · React · Vue 3 상호 변환 도구</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-md border ${t.badge}`}>
              Powered by Groq · llama-3.3-70b
            </span>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg border transition-colors ${t.toggleBtn}`}
              title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* 배너 */}
        <div className={`bg-gradient-to-r border rounded-xl p-4 flex items-start gap-3 ${t.banner}`}>
          <Sparkles className={`w-5 h-5 mt-0.5 shrink-0 ${isDark ? "text-violet-400" : "text-violet-500"}`} />
          <div>
            <p className="text-sm">
              <span className={`font-semibold ${t.bannerTitle}`}>AI 기반 코드 마이그레이션 도구</span>
              <span className={t.bannerText}> — Legacy JS, React, Vue 3 사이를 자유롭게 변환합니다. TypeScript + Tailwind CSS 적용.</span>
            </p>
            <div className="flex gap-4 mt-2">
              <span className={`text-xs flex items-center gap-1 ${t.dotText}`}>
                <span className="w-2 h-2 bg-red-500/70 rounded-sm inline-block" />
                빨간색 = 제거된 코드
              </span>
              <span className={`text-xs flex items-center gap-1 ${t.dotText}`}>
                <span className="w-2 h-2 bg-green-500/70 rounded-sm inline-block" />
                초록색 = 추가된 코드
              </span>
            </div>
          </div>
        </div>

        {!convertedCode ? (
          <div className="flex flex-col gap-4">
            {/* 소스 → 타겟 선택 */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* 소스 */}
              <div className="flex flex-col gap-1">
                <span className={`text-xs font-medium ${t.label}`}>변환할 코드</span>
                <div className={`flex items-center gap-1 p-1 rounded-xl border ${t.selectorBg}`}>
                  {(["legacy", "react", "vue"] as Source[]).map((s) => {
                    const cfg = SOURCE_CONFIG[s];
                    const isActive = source === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleSourceChange(s)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                          isActive
                            ? isDark ? cfg.activeDark : cfg.activeLight
                            : `${t.inactive} shadow-none`
                        }`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 화살표 */}
              <div className={`flex flex-col gap-1`}>
                <span className="text-xs invisible">–</span>
                <div className={`flex items-center px-2 pt-1 ${t.arrowDivider}`}>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              {/* 타겟 */}
              <div className="flex flex-col gap-1">
                <span className={`text-xs font-medium ${t.label}`}>변환 결과</span>
                <div className={`flex items-center gap-1 p-1 rounded-xl border ${t.selectorBg}`}>
                  {(["react", "vue"] as Target[]).map((tgt) => {
                    const cfg = TARGET_CONFIG[tgt];
                    const isActive = target === tgt;
                    const isDisabled = source !== "legacy" && source === tgt;
                    return (
                      <button
                        key={tgt}
                        onClick={() => !isDisabled && setTarget(tgt)}
                        disabled={isDisabled}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          isDisabled
                            ? "opacity-30 cursor-not-allowed"
                            : isActive
                              ? isDark ? cfg.activeDark : cfg.activeLight
                              : t.inactive
                        }`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className={`w-4 h-4 ${t.icon}`} />
                <span className={`text-sm font-medium ${t.label}`}>코드 입력</span>
              </div>
              {source === "legacy" && (
                <button onClick={() => { setInputCode(EXAMPLE_CODE); setConvertedCode(""); setError(""); }}
                  className={`text-xs transition-colors border px-3 py-1.5 rounded-md ${t.exampleBtn}`}>
                  예시 코드 불러오기
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                value={inputCode}
                onChange={(e) => { setInputCode(e.target.value); if (error) setError(""); }}
                placeholder={
                  source === "legacy" ? "// jQuery 또는 Vanilla JS 코드를 여기에 붙여넣으세요..."
                  : source === "react" ? "// React 컴포넌트 코드를 여기에 붙여넣으세요..."
                  : "<!-- Vue 3 SFC 코드를 여기에 붙여넣으세요... -->"
                }
                className={`w-full h-[440px] border rounded-xl px-4 py-4 focus:outline-none focus:ring-1 transition-all ${t.textarea}`}
              />
              {inputCode && (
                <button onClick={() => setInputCode("")} className={`absolute top-3 right-3 transition-colors ${t.clearBtn}`} title="지우기">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {error && (
              <div className={`flex items-center gap-2 text-sm border rounded-lg px-4 py-3 ${t.errorBg}`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleConvert}
              disabled={isLoading || !inputCode.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-zinc-400 disabled:to-zinc-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Groq AI 변환 중...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  {convertLabel}로 변환하기
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`flex gap-1 rounded-lg p-1 ${t.tabBar}`}>
                <button onClick={() => setViewMode("diff")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "diff" ? t.tabActive : t.tabInactive}`}>
                  Diff 비교
                </button>
                <button onClick={() => setViewMode("code")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "code" ? t.tabActive : t.tabInactive}`}>
                  변환된 코드
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopy} className={`flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-lg transition-all ${t.actionBtn}`}>
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "복사됨!" : "코드 복사"}
                </button>
                <button onClick={handleReset} className={`flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-lg transition-all ${t.actionBtn}`}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  새로 변환
                </button>
              </div>
            </div>

            <div className={`flex items-center gap-2 text-sm border rounded-lg px-4 py-2.5 ${t.successBg}`}>
              <Check className="w-4 h-4 shrink-0" />
              변환 완료! ({convertLabel})
            </div>

            {viewMode === "diff" ? (
              <DiffViewer oldCode={inputCode} newCode={convertedCode} isDark={isDark} rightTitle={rightTitle} />
            ) : (
              <pre className={`border rounded-xl p-5 overflow-auto text-sm leading-relaxed max-h-[600px] font-mono ${t.codePre}`}>
                {convertedCode}
              </pre>
            )}
          </div>
        )}
      </main>

      <footer className={`border-t py-4 ${t.footer}`}>
        <p className="text-center text-xs">
          Legacy Reviver · Built with Next.js, Groq AI, and Tailwind CSS
        </p>
      </footer>
    </div>
  );
}
