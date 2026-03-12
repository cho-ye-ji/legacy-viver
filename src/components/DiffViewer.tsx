"use client";

import dynamic from "next/dynamic";

import type { ComponentType } from "react";
import type { ReactDiffViewerProps } from "react-diff-viewer-next";

const ReactDiffViewer = dynamic(
  () =>
    import("react-diff-viewer-next").then(
      (mod) => mod.default as unknown as ComponentType<ReactDiffViewerProps>
    ),
  { ssr: false }
);

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  isDark?: boolean;
}

export default function DiffViewer({ oldCode, newCode, isDark = false }: DiffViewerProps) {
  return (
    <div className={`rounded-xl overflow-hidden border text-sm ${isDark ? "border-zinc-700" : "border-slate-200"}`}>
      <ReactDiffViewer
        oldValue={oldCode}
        newValue={newCode}
        splitView={true}
        leftTitle="원본 (Legacy)"
        rightTitle="변환 결과 (React + TypeScript)"
        useDarkTheme={isDark}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        styles={{
          variables: {
            light: {
              // 추가된 줄: 초록 배경 + 진한 초록 텍스트
              addedBackground: "#dcfce7",
              addedColor: "#14532d",
              wordAddedBackground: "#86efac",
              addedGutterBackground: "#bbf7d0",
              addedGutterColor: "#166534",
              // 삭제된 줄: 빨간 배경 + 진한 빨간 텍스트
              removedBackground: "#fee2e2",
              removedColor: "#7f1d1d",
              wordRemovedBackground: "#fca5a5",
              removedGutterBackground: "#fecaca",
              removedGutterColor: "#991b1b",
              // 기본 배경
              diffViewerBackground: "#ffffff",
              gutterBackground: "#f8fafc",
              gutterBackgroundDark: "#f1f5f9",
              gutterColor: "#94a3b8",
              highlightBackground: "#f1f5f9",
              highlightGutterBackground: "#e2e8f0",
              diffViewerTitleBackground: "#f8fafc",
              diffViewerTitleColor: "#334155",
              diffViewerTitleBorderColor: "#e2e8f0",
            },
            dark: {
              // 추가된 줄: 진한 초록 배경 + 밝은 초록 텍스트
              addedBackground: "#14532d",
              addedColor: "#bbf7d0",
              wordAddedBackground: "#166534",
              addedGutterBackground: "#14532d",
              addedGutterColor: "#86efac",
              // 삭제된 줄: 진한 빨간 배경 + 밝은 빨간 텍스트
              removedBackground: "#450a0a",
              removedColor: "#fecaca",
              wordRemovedBackground: "#7f1d1d",
              removedGutterBackground: "#450a0a",
              removedGutterColor: "#fca5a5",
              // 기본 배경
              diffViewerBackground: "#18181b",
              gutterBackground: "#27272a",
              gutterBackgroundDark: "#18181b",
              gutterColor: "#71717a",
              highlightBackground: "#3f3f46",
              highlightGutterBackground: "#3f3f46",
              diffViewerTitleBackground: "#27272a",
              diffViewerTitleColor: "#e4e4e7",
              diffViewerTitleBorderColor: "#3f3f46",
            },
          },
        } as any}
      />
    </div>
  );
}
