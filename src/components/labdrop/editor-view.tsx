// Browser-only module: CodeMirror needs the DOM. Always load it lazily behind
// <ClientOnly>, never import it from an SSR route module.
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { sql } from "@codemirror/lang-sql";
import { json } from "@codemirror/lang-json";
import { StreamLanguage } from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import type { Extension } from "@codemirror/state";

function extensionsFor(language: string): Extension[] {
  switch (language) {
    case "c":
    case "cpp":
      return [cpp()];
    case "java":
      return [java()];
    case "python":
      return [python()];
    case "javascript":
      return [javascript()];
    case "html":
      return [html()];
    case "css":
      return [css()];
    case "sql":
      return [sql()];
    case "json":
      return [json()];
    case "bash":
      return [StreamLanguage.define(shell)];
    default:
      return [];
  }
}

const theme = EditorView.theme({
  "&": { fontSize: "13px", backgroundColor: "transparent" },
  ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
  "&.cm-focused": { outline: "none" },
});

export type EditorViewProps = {
  value: string;
  language: string;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
};

export default function LabDropEditor({
  value,
  language,
  readOnly = false,
  minHeight = "220px",
  maxHeight,
  placeholder,
  onChange,
}: EditorViewProps) {
  return (
    <CodeMirror
      value={value}
      readOnly={readOnly}
      editable={!readOnly}
      placeholder={placeholder}
      minHeight={minHeight}
      {...(maxHeight ? { maxHeight } : {})}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
        foldGutter: false,
        autocompletion: false,
      }}
      extensions={[...extensionsFor(language), theme, EditorView.lineWrapping]}
      onChange={onChange ?? (() => {})}
    />
  );
}
