import type { ReactNode } from "react";
import type { PrintSection } from "../../types";
import { TextEditor } from "./TextEditor";
import { AlignEditor } from "./AlignEditor";
import { SizeEditor } from "./SizeEditor";
import { FontEditor } from "./FontEditor";
import { CutEditor } from "./CutEditor";
import { DrawerEditor } from "./DrawerEditor";
import { BeepEditor } from "./BeepEditor";
import { BarcodeEditor } from "./BarcodeEditor";
import { QrEditor } from "./QrEditor";
import { LineEditor } from "./LineEditor";
import { NumberEditor } from "./NumberEditor";
import { LetterSpacingEditor } from "./LetterSpacingEditor";
import { TableEditor } from "./TableEditor";
import { MultiColumnEditor } from "./MultiColumnEditor";
import { ImageEditor } from "./ImageEditor";

export const TOGGLE_TYPES = new Set(["Bold", "Underline", "Italic", "Invert", "Rotate", "UpsideDown"]);
export const NUMERIC_TYPES = new Set(["Feed", "FeedDots", "CodePage"]);

type EditorProps = { s: PrintSection; onChange: (s: PrintSection) => void };
type EditorComponent = (props: EditorProps) => ReactNode;

export const EDITORS: Record<string, EditorComponent> = {
  Text: (p) => <TextEditor {...p} />,
  Align: (p) => <AlignEditor {...p} />,
  Size: (p) => <SizeEditor {...p} />,
  Font: (p) => <FontEditor {...p} />,
  Cut: (p) => <CutEditor {...p} />,
  Drawer: (p) => <DrawerEditor {...p} />,
  Beep: (p) => <BeepEditor {...p} />,
  Barcode: (p) => <BarcodeEditor {...p} />,
  Qr: (p) => <QrEditor {...p} />,
  Line: (p) => <LineEditor {...p} />,
  LineHeight: (p) => <NumberEditor {...p} min={0} max={255} />,
  LetterSpacing: (p) => <LetterSpacingEditor {...p} />,
  Table: (p) => <TableEditor {...p} />,
  MultiColumn: (p) => <MultiColumnEditor {...p} />,
  Image: (p) => <ImageEditor {...p} />,
  Init: () => <span className="text-slate-400 dark:text-slate-500 text-[10px] italic">No params</span>,
  ResetStyle: () => <span className="text-slate-400 dark:text-slate-500 text-[10px] italic">No params</span>,
};
