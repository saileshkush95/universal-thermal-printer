import type { TextLine } from "./utils";

export function ImageBlock({ line, pw }: { line: TextLine; pw: number }) {
  return (
    <div className="flex justify-center my-1">
      <img src={line.img!} style={{ width: Math.min(pw - 24, line.imgW ?? 200), maxHeight: 160 }} className="object-contain" alt="" />
    </div>
  );
}
