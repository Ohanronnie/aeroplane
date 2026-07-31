import { javascript } from "@codemirror/lang-javascript";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import type { FunctionRuntime } from "../../../shared/service-functions";

const functionSourceHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#71717a" },
  { tag: tags.string, color: "#34d399" },
  { tag: [tags.number, tags.bool, tags.null], color: "#f59e0b" },
  { tag: tags.propertyName, color: "#f4f4f5" },
  { tag: tags.keyword, color: "#e879f9" },
  { tag: tags.function(tags.variableName), color: "#f4f4f5" },
  { tag: tags.punctuation, color: "#71717a" }
]);

const functionSourceEditorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#09090b",
      color: "#f4f4f5",
      fontSize: "13px"
    },
    "&.cm-focused": {
      outline: "none"
    },
    ".cm-scroller": {
      backgroundColor: "#09090b",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    },
    ".cm-content": {
      padding: "14px",
      caretColor: "#f4f4f5",
      minHeight: "100%"
    },
    ".cm-line": {
      padding: "0"
    },
    ".cm-cursor": {
      borderLeftColor: "#f4f4f5"
    },
    ".cm-placeholder": {
      color: "#71717a"
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(255, 255, 255, 0.14)"
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(39, 39, 42, 0.42)"
    },
    ".cm-gutters": {
      borderRight: "1px solid #27272a",
      backgroundColor: "#09090b",
      color: "#71717a"
    }
  },
  { dark: true }
);

const functionSourceBasicSetup = {
  foldGutter: true,
  highlightActiveLine: true,
  highlightActiveLineGutter: false,
  autocompletion: false,
  searchKeymap: true,
  foldKeymap: true,
  completionKeymap: false
};

export function FunctionSourceEditor({
  runtime,
  value,
  onChange,
  disabled = false,
  height = "460px"
}: {
  runtime: FunctionRuntime;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  height?: string;
}) {
  const extensions = useMemo(() => {
    return [
      ...(runtime === "python" ? [] : [javascript()]),
      syntaxHighlighting(functionSourceHighlightStyle),
      EditorView.editable.of(!disabled),
      EditorView.contentAttributes.of({
        autocapitalize: "off",
        autocomplete: "off",
        autocorrect: "off",
        spellcheck: "false"
      }),
      functionSourceEditorTheme
    ];
  }, [disabled, runtime]);

  return (
    <div className="overflow-hidden border border-white/15 bg-zinc-950" style={{ height }}>
      <CodeMirror
        value={value}
        height="100%"
        basicSetup={functionSourceBasicSetup}
        extensions={extensions}
        onChange={onChange}
        theme="dark"
        className="bg-zinc-950 [&_.cm-content]:bg-zinc-950 [&_.cm-editor]:bg-zinc-950 [&_.cm-scroller]:bg-zinc-950"
      />
    </div>
  );
}
