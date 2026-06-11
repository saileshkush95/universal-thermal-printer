import type { PrintSection } from "../types";
import { V } from "./section-editor/V";

interface Props {
  section: PrintSection;
  index: number;
  onChange: (i: number, s: PrintSection) => void;
  onRemove: (i: number) => void;
  onMove: (i: number, d: -1 | 1) => void;
  onDragStart?: (e: React.DragEvent, i: number) => void;
  onDragOverSection?: (e: React.DragEvent, i: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function SectionEditor({ section, index, onChange, onRemove, onMove, onDragStart, onDragOverSection, onDragEnd }: Props) {
  return (
    <div draggable={section.type !== "Init"}
      onDragStart={(e) => onDragStart?.(e, index)}
      onDragOver={(e) => onDragOverSection?.(e, index)}
      onDragEnd={onDragEnd}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-700 text-[10px]">
        <span className="text-slate-400">#{index + 1}</span>
        <strong className="text-slate-600 dark:text-slate-300">{section.type}</strong>
        <div className="ml-auto flex gap-0.5">
          {section.type !== "Init" && <>
            <button onClick={() => onMove(index, -1)} disabled={index === 0} title="Up"
              className="text-[10px] px-1 py-0.5 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded hover:bg-slate-100 dark:hover:bg-slate-500 disabled:opacity-30">↑</button>
            <button onClick={() => onMove(index, 1)} title="Down"
              className="text-[10px] px-1 py-0.5 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded hover:bg-slate-100 dark:hover:bg-slate-500">↓</button>
          </>}
          {section.type !== "Init" && <button onClick={() => onRemove(index)} title="Remove"
            className="text-[10px] px-1 py-0.5 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-500 rounded hover:bg-red-100 dark:hover:bg-red-800">✕</button>}
        </div>
      </div>
      <div className="p-2"><V section={section} onChange={(s) => onChange(index, s)} /></div>
    </div>
  );
}
