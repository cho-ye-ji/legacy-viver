"use client";

import { diffWords } from "diff";

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  isDark?: boolean;
}

type LineType = "added" | "removed" | "unchanged";

interface DiffLine {
  type: LineType;
  oldLineNum: number | null;
  newLineNum: number | null;
  content: string;
}

function computeDiff(oldCode: string, newCode: string): DiffLine[] {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const result: DiffLine[] = [];

  // Myers diff algorithm approximation: LCS-based line diff
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack to get diff
  const raw: { type: LineType; old?: string; new?: string }[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      raw.unshift({ type: "unchanged", old: oldLines[i - 1], new: newLines[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.unshift({ type: "added", new: newLines[j - 1] });
      j--;
    } else {
      raw.unshift({ type: "removed", old: oldLines[i - 1] });
      i--;
    }
  }

  let oldNum = 0, newNum = 0;
  for (const item of raw) {
    if (item.type === "unchanged") {
      oldNum++; newNum++;
      result.push({ type: "unchanged", oldLineNum: oldNum, newLineNum: newNum, content: item.old! });
    } else if (item.type === "removed") {
      oldNum++;
      result.push({ type: "removed", oldLineNum: oldNum, newLineNum: null, content: item.old! });
    } else {
      newNum++;
      result.push({ type: "added", oldLineNum: null, newLineNum: newNum, content: item.new! });
    }
  }
  return result;
}

// 단어 단위 하이라이트 (추가/삭제 라인 내부)
function WordDiff({ oldLine, newLine, isDark }: { oldLine: string; newLine: string; isDark: boolean }) {
  const parts = diffWords(oldLine, newLine);
  const oldParts = parts.filter(p => !p.added);
  const newParts = parts.filter(p => !p.removed);

  const renderParts = (partsToRender: typeof parts, type: "old" | "new") =>
    partsToRender.map((part, idx) => {
      const isChanged = type === "old" ? part.removed : part.added;
      if (!isChanged) return <span key={idx}>{part.value}</span>;
      return (
        <span
          key={idx}
          className={
            type === "old"
              ? isDark
                ? "bg-red-800 text-red-100 rounded-sm px-0.5"
                : "bg-red-300 text-red-900 rounded-sm px-0.5"
              : isDark
                ? "bg-green-800 text-green-100 rounded-sm px-0.5"
                : "bg-green-300 text-green-900 rounded-sm px-0.5"
          }
        >
          {part.value}
        </span>
      );
    });

  return { oldJsx: renderParts(oldParts, "old"), newJsx: renderParts(newParts, "new") };
}

export default function DiffViewer({ oldCode, newCode, isDark = false }: DiffViewerProps) {
  const lines = computeDiff(oldCode, newCode);

  // 제거된 줄과 추가된 줄을 매칭해서 단어 diff 적용
  const removedLines = lines.filter(l => l.type === "removed");
  const addedLines = lines.filter(l => l.type === "added");
  const wordDiffMap = new Map<string, { oldJsx: React.ReactNode[]; newJsx: React.ReactNode[] }>();
  const pairCount = Math.min(removedLines.length, addedLines.length);
  for (let k = 0; k < pairCount; k++) {
    const wd = WordDiff({ oldLine: removedLines[k].content, newLine: addedLines[k].content, isDark });
    wordDiffMap.set(`r-${removedLines[k].oldLineNum}`, wd);
    wordDiffMap.set(`a-${addedLines[k].newLineNum}`, wd);
  }

  // 스타일 클래스
  const th = {
    wrap:       isDark ? "bg-zinc-950 border-zinc-700 text-zinc-300" : "bg-white border-slate-200 text-zinc-700",
    header:     isDark ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-slate-100 border-slate-200 text-zinc-500",
    lineAdded:  isDark ? "bg-green-950 border-l-2 border-green-600" : "bg-green-50 border-l-2 border-green-500",
    lineRemoved:isDark ? "bg-red-950 border-l-2 border-red-700"     : "bg-red-50 border-l-2 border-red-400",
    lineNormal: isDark ? "bg-zinc-950"                               : "bg-white",
    gutterAdded:  isDark ? "bg-green-900/60 text-green-400 select-none" : "bg-green-100 text-green-700 select-none",
    gutterRemoved:isDark ? "bg-red-900/60 text-red-400 select-none"    : "bg-red-100 text-red-700 select-none",
    gutterNormal: isDark ? "bg-zinc-900 text-zinc-600 select-none"     : "bg-slate-50 text-zinc-400 select-none",
    numAdded:   isDark ? "text-green-500" : "text-green-600",
    numRemoved: isDark ? "text-red-500"   : "text-red-500",
    numNormal:  isDark ? "text-zinc-600"  : "text-zinc-400",
    codeAdded:  isDark ? "text-green-200" : "text-green-900",
    codeRemoved:isDark ? "text-red-200"   : "text-red-800",
    codeNormal: isDark ? "text-zinc-300"  : "text-zinc-700",
    divider:    isDark ? "border-zinc-700" : "border-slate-200",
    emptyCell:  isDark ? "bg-zinc-900/50" : "bg-slate-50/80",
  };

  // split view 용으로 줄 쌍 만들기
  const leftLines:  (DiffLine | null)[] = [];
  const rightLines: (DiffLine | null)[] = [];

  let li = 0;
  while (li < lines.length) {
    const line = lines[li];
    if (line.type === "unchanged") {
      leftLines.push(line);
      rightLines.push(line);
      li++;
    } else {
      // 연속된 removed / added 블록을 짝지음
      const removedBlock: DiffLine[] = [];
      const addedBlock:   DiffLine[] = [];
      while (li < lines.length && lines[li].type !== "unchanged") {
        if (lines[li].type === "removed") removedBlock.push(lines[li]);
        else addedBlock.push(lines[li]);
        li++;
      }
      const maxLen = Math.max(removedBlock.length, addedBlock.length);
      for (let k = 0; k < maxLen; k++) {
        leftLines.push(removedBlock[k] ?? null);
        rightLines.push(addedBlock[k] ?? null);
      }
    }
  }

  const renderCell = (line: DiffLine | null, side: "left" | "right") => {
    if (!line) {
      return <td colSpan={2} className={`px-3 py-0.5 ${th.emptyCell}`} />;
    }
    const isAdded   = line.type === "added";
    const isRemoved = line.type === "removed";
    const lineClass = isAdded ? th.lineAdded : isRemoved ? th.lineRemoved : th.lineNormal;
    const gutterClass = isAdded ? th.gutterAdded : isRemoved ? th.gutterRemoved : th.gutterNormal;
    const numClass  = isAdded ? th.numAdded : isRemoved ? th.numRemoved : th.numNormal;
    const codeClass = isAdded ? th.codeAdded : isRemoved ? th.codeRemoved : th.codeNormal;
    const prefix    = isAdded ? "+" : isRemoved ? "−" : " ";
    const lineNum   = side === "left" ? line.oldLineNum : line.newLineNum;

    // 단어 diff 적용
    const wdKey = isRemoved ? `r-${line.oldLineNum}` : isAdded ? `a-${line.newLineNum}` : null;
    const wd = wdKey ? wordDiffMap.get(wdKey) : null;
    const content = wd
      ? (side === "left" ? wd.oldJsx : wd.newJsx)
      : <span>{line.content}</span>;

    return (
      <>
        <td className={`w-10 text-right pr-2 pl-1 text-xs font-mono ${gutterClass} ${numClass}`}>
          {prefix} {lineNum ?? ""}
        </td>
        <td className={`pl-3 pr-4 py-0.5 font-mono text-xs whitespace-pre-wrap break-all ${lineClass} ${codeClass}`}>
          {content}
        </td>
      </>
    );
  };

  return (
    <div className={`rounded-xl overflow-hidden border text-sm ${th.wrap}`}>
      {/* 헤더 */}
      <div className={`grid grid-cols-2 border-b text-xs font-medium ${th.header} ${th.divider}`}>
        <div className="px-4 py-2.5 border-r border-inherit flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
          원본 (Legacy)
        </div>
        <div className="px-4 py-2.5 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
          변환 결과 (React + TypeScript)
        </div>
      </div>

      {/* 범례 */}
      <div className={`flex gap-4 px-4 py-2 border-b text-xs ${th.header} ${th.divider}`}>
        <span className={`flex items-center gap-1.5 ${isDark ? "text-green-400" : "text-green-700"}`}>
          <span className={`inline-block w-3 h-3 rounded-sm ${isDark ? "bg-green-900 border border-green-600" : "bg-green-100 border border-green-400"}`} />
          추가된 코드
        </span>
        <span className={`flex items-center gap-1.5 ${isDark ? "text-red-400" : "text-red-600"}`}>
          <span className={`inline-block w-3 h-3 rounded-sm ${isDark ? "bg-red-900 border border-red-700" : "bg-red-50 border border-red-400"}`} />
          삭제된 코드
        </span>
        <span className={`flex items-center gap-1.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
          <span className={`inline-block w-3 h-3 rounded-sm ${isDark ? "bg-green-800 border border-green-500" : "bg-green-300 border border-green-500"}`} />
          변경된 단어
        </span>
      </div>

      {/* Diff 테이블 */}
      <div className="overflow-auto max-h-[640px]">
        <table className="w-full border-collapse">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-12" />
            <col />
          </colgroup>
          <tbody>
            {leftLines.map((leftLine, idx) => {
              const rightLine = rightLines[idx];
              const isEvenRow = idx % 2 === 0;
              const baseRow = !leftLine && !rightLine ? "" :
                (leftLine?.type === "unchanged" && (isDark
                  ? isEvenRow ? "bg-zinc-950" : "bg-zinc-900/30"
                  : isEvenRow ? "bg-white" : "bg-slate-50/50")) || "";
              return (
                <tr key={idx} className={baseRow}>
                  {renderCell(leftLine, "left")}
                  <td className={`w-px ${th.divider} border-l`} />
                  {renderCell(rightLine, "right")}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
