import type { TextLine } from "./utils";

export function CutBlock({ line }: { line: TextLine }) {
  const partial = line.cut === "partial";
  return (
    <div className="mt-2">
      <div className="flex items-center gap-1 text-[10px] text-slate-300 dark:text-slate-500">
        <span className={`flex-1 border-t-2 ${partial ? "border-dashed" : ""} border-slate-400 dark:border-slate-500`} />
        <span className="whitespace-nowrap">{partial ? "partial cut" : "full cut"}</span>
        <span className={`flex-1 border-t-2 ${partial ? "border-dashed" : ""} border-slate-400 dark:border-slate-500`} />
      </div>
    </div>
  );
}
