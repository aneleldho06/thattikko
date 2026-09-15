export type LanguageId =
  | "c"
  | "cpp"
  | "java"
  | "python"
  | "javascript"
  | "html"
  | "css"
  | "sql"
  | "json"
  | "bash"
  | "text";

export const LANGUAGES: { id: LanguageId; label: string; ext: string }[] = [
  { id: "c", label: "C", ext: "c" },
  { id: "cpp", label: "C++", ext: "cpp" },
  { id: "java", label: "Java", ext: "java" },
  { id: "python", label: "Python", ext: "py" },
  { id: "javascript", label: "JavaScript", ext: "js" },
  { id: "html", label: "HTML", ext: "html" },
  { id: "css", label: "CSS", ext: "css" },
  { id: "sql", label: "SQL", ext: "sql" },
  { id: "json", label: "JSON", ext: "json" },
  { id: "bash", label: "Bash", ext: "sh" },
  { id: "text", label: "Plain text", ext: "txt" },
];

export function languageLabel(id: string | null | undefined): string {
  return LANGUAGES.find((l) => l.id === id)?.label ?? "Plain text";
}

/** Best-effort language guess from the source itself. */
export function detectLanguage(source: string): LanguageId {
  const s = source.trim();
  if (!s) return "text";
  const trimmed = s.slice(0, 4000);

  if (/^\s*[[{][\s\S]*[\]}]\s*$/.test(s)) {
    try {
      JSON.parse(s);
      return "json";
    } catch {
      /* not JSON */
    }
  }
  if (/^\s*#!.*\b(bash|sh|zsh)\b/.test(trimmed)) return "bash";
  if (/<\/(html|div|body|head|p|span)>|<!DOCTYPE html>/i.test(trimmed)) return "html";
  if (/^[^{}]*\{[^{}]*:[^{};]*;[\s\S]*\}/.test(trimmed) && /(color|margin|padding|font-size|display)\s*:/.test(trimmed))
    return "css";
  if (/\b(public\s+class|System\.out\.println|import\s+java\.)/.test(trimmed)) return "java";
  if (/#include\s*<(iostream|vector|string|bits\/stdc\+\+\.h)>|std::|cout\s*<</.test(trimmed)) return "cpp";
  if (/#include\s*<[\w./]+>|printf\s*\(|scanf\s*\(/.test(trimmed)) return "c";
  if (/^\s*(def|class)\s+\w+|^\s*import\s+\w+$|print\s*\(/m.test(trimmed)) return "python";
  if (/\b(function|const|let|=>|console\.log|document\.)\b/.test(trimmed)) return "javascript";
  if (/\b(SELECT|INSERT INTO|UPDATE|CREATE TABLE|DELETE FROM)\b/i.test(trimmed)) return "sql";
  if (/^\s*(echo|apt|sudo|cd|ls|grep|chmod)\b/m.test(trimmed)) return "bash";
  return "text";
}

export function extensionFor(id: string | null | undefined): string {
  return LANGUAGES.find((l) => l.id === id)?.ext ?? "txt";
}
