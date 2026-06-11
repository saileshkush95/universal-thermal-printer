import type { PrintSection } from "../../types";
import { ToggleEditor } from "./ToggleEditor";
import { NumberEditor } from "./NumberEditor";
import { TOGGLE_TYPES, NUMERIC_TYPES, EDITORS } from "./registry";

export function V({ section, onChange }: { section: PrintSection; onChange: (s: PrintSection) => void }) {
  if (TOGGLE_TYPES.has(section.type)) return <ToggleEditor s={section} onChange={onChange} />;
  if (NUMERIC_TYPES.has(section.type)) return <NumberEditor s={section} onChange={onChange} />;
  const Editor = EDITORS[section.type];
  if (Editor) return Editor({ s: section, onChange });
  return <span className="text-slate-400 dark:text-slate-500 text-[10px] italic">—</span>;
}
