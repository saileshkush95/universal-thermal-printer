import type { TextLine } from "./utils";

export function BarcodeBlock({ line }: { line: TextLine }) {
  return (
    <div className="text-center text-[10px] my-1">
      <div className="text-slate-500 text-[12px] tracking-widest">||||||||||||||||||||||</div>
      <div>{line.barcode!.data}</div>
    </div>
  );
}
