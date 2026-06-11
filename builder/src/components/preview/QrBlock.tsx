import type { TextLine } from "./utils";
import { QRImg } from "./QRImg";

export function QrBlock({ line, pw }: { line: TextLine; pw: number }) {
  return (
    <div className="flex justify-center my-1">
      <QRImg data={line.qr!.data} size={Math.min(pw - 24, Math.max(40, line.qr!.size))} />
    </div>
  );
}
