import Editor from '@monaco-editor/react';
import { useState } from 'react';
import { LANGUAGES } from '../../constants/index.js';

// MonacoEditorWrapper — thin wrapper around @monaco-editor/react with a dark theme
// + language selector. Used by the Question Editor + Live Room.
// `value`/`onChange` make it a controlled component.
export default function MonacoEditorWrapper({
  value,
  onChange,
  language = 'javascript',
  readOnly = false,
  height = '100%',
  showLanguageSelector = true,
  onLanguageChange,
}) {
  const [lang, setLang] = useState(language);

  // Map backend language IDs to Monaco language IDs.
  const monacoLang = LANGUAGES.find((l) => l.id === lang)?.monaco || 'plaintext';

  const handleLanguageChange = (e) => {
    const next = e.target.value;
    setLang(next);
    onLanguageChange?.(next);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      {showLanguageSelector && (
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-3 py-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            language
          </span>
          <select
            value={lang}
            onChange={handleLanguageChange}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-brand-indigo focus:outline-none"
            disabled={readOnly}
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="monaco-wrap flex-1">
        <Editor
          height={height}
          theme="vs-dark"
          language={monacoLang}
          value={value}
          onChange={(v) => onChange?.(v ?? '')}
          loading={<div className="grid h-full place-items-center text-xs text-slate-500">Loading editor…</div>}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            tabSize: 2,
            automaticLayout: true,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'all',
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
}
