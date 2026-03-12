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
            dark: {
              diffViewerBackground: "#18181b",
              addedBackground: "#14532d",
              addedColor: "#bbf7d0",
              removedBackground: "#450a0a",
              removedColor: "#fecaca",
              wordAddedBackground: "#166534",
              wordRemovedBackground: "#7f1d1d",
              addedGutterBackground: "#14532d",
              removedGutterBackground: "#450a0a",
              gutterBackground: "#27272a",
              gutterBackgroundDark: "#18181b",
              highlightBackground: "#3f3f46",
              highlightGutterBackground: "#3f3f46",
              gutterColor: "#71717a",
              addedGutterColor: "#86efac",
              removedGutterColor: "#fca5a5",
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
