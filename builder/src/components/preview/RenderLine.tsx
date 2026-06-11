import type { TextLine } from "./utils";
import type { PaperFormat } from "../../types";
import { TextRenderer } from "./TextRenderer";
import { TableBlock } from "./TableBlock";
import { MultiColumnBlock } from "./MultiColumnBlock";
import { ImageBlock } from "./ImageBlock";
import { QrBlock } from "./QrBlock";
import { BarcodeBlock } from "./BarcodeBlock";
import { CutBlock } from "./CutBlock";
import { CharLineBlock } from "./CharLineBlock";

export function RenderLine({ line, pw, format }: { line: TextLine; pw: number; format: PaperFormat }) {
  if (line.table) return <TableBlock line={line} format={format} />;
  if (line.mc) return <MultiColumnBlock line={line} />;
  if (line.img) return <ImageBlock line={line} pw={pw} />;
  if (line.qr) return <QrBlock line={line} pw={pw} />;
  if (line.barcode) return <BarcodeBlock line={line} />;
  if (line.cut) return <CutBlock line={line} />;
  if (line.ch) return <CharLineBlock ch={line.ch} />;
  return <TextRenderer line={line} />;
}
