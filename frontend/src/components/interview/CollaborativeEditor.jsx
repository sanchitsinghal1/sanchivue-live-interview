import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { LANGUAGES } from '../../constants/index.js';

// CollaborativeEditor — Monaco wrapper that syncs code + language + cursors
// via the collab socket. Guards with `isApplyingRemoteRef` so incoming socket
// events don't echo back as new outgoing `code:change` emits.
export default function CollaborativeEditor({
  initialCode = '',
  initialLanguage = 'javascript',
  on,
  emit,
  roomCode,
  user,
  onCodeChange,
  onLanguageChange,
}) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [remoteCursors, setRemoteCursors] = useState({});

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const isApplyingRemoteRef = useRef(false);
  const codeRef = useRef(initialCode);
  const langRef = useRef(initialLanguage);

  // Keep refs fresh so the debounced emit can read the latest value.
  codeRef.current = code;
  langRef.current = language;

  // Debounced emit for `code:change`. We coalesce 3+ rapid keystrokes into one
  // outbound event so we don't flood slow connections.
  const emitTimer = useRef(null);
  const scheduleEmit = (nextCode) => {
    if (emitTimer.current) clearTimeout(emitTimer.current);
    emitTimer.current = setTimeout(() => {
      emit?.('code:change', {
        roomCode,
        code: nextCode,
        language: langRef.current,
        userId: user?.id,
      });
    }, 120);
  };

  // Subscribe to remote code + cursor + language events.
  useEffect(() => {
    if (!on) return undefined;
    const offCode = on('code:change', (payload) => {
      if (!payload || payload.userId === user?.id) return;
      isApplyingRemoteRef.current = true;
      setCode(payload.code || '');
      if (payload.language && payload.language !== langRef.current) {
        setLanguage(payload.language);
      }
      // Reset on next tick — Monaco fires its own onChange when we set value.
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 0);
    });
    const offLang = on('language:change', (payload) => {
      if (!payload || payload.userId === user?.id) return;
      setLanguage(payload.language);
    });
    const offCursor = on('cursor:move', (payload) => {
      if (!payload || payload.userId === user?.id) return;
      setRemoteCursors((prev) => ({
        ...prev,
        [payload.userId]: payload,
      }));
    });
    return () => {
      offCode?.();
      offLang?.();
      offCursor?.();
    };
  }, [on, user?.id]);

  // Render remote cursor decorations.
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const decos = Object.values(remoteCursors)
      .filter((c) => c.position)
      .map((c) => ({
        range: new monaco.Range(
          c.position.lineNumber,
          c.position.column,
          c.position.lineNumber,
          c.position.column + 1,
        ),
        options: {
          className: 'remote-cursor',
          beforeContentClassName: 'remote-cursor-line',
          hoverMessage: { value: `**${c.userName || 'Participant'}**` },
        },
      }));
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decos);
  }, [remoteCursors]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // Inject CSS for remote cursors once.
    if (!document.getElementById('remote-cursor-css')) {
      const style = document.createElement('style');
      style.id = 'remote-cursor-css';
      style.textContent = `
        .remote-cursor { background: rgba(99,102,241,0.5); width: 1px !important; }
        .remote-cursor-line { border-left: 2px solid #6366f1; }
      `;
      document.head.appendChild(style);
    }
    editor.onDidChangeCursorPosition((e) => {
      if (isApplyingRemoteRef.current) return;
      emit?.('cursor:move', {
        roomCode,
        userId: user?.id,
        userName: user?.name,
        position: { lineNumber: e.position.lineNumber, column: e.position.column },
      });
    });
  };

  const handleChange = (value) => {
    if (isApplyingRemoteRef.current) return;
    const next = value || '';
    setCode(next);
    scheduleEmit(next);
    // Bubble the latest code up to the parent so the test panel + AI co-pilot
    // drawer can read fresh code without re-subscribing to Monaco themselves.
    onCodeChange?.(next);
  };

  const handleLanguageChange = (e) => {
    const next = e.target.value;
    setLanguage(next);
    emit?.('language:change', { roomCode, language: next, userId: user?.id });
    onLanguageChange?.(next);
  };

  const monacoLang = LANGUAGES.find((l) => l.id === language)?.monaco || 'plaintext';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-3 py-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
          collaborative editor
        </span>
        <select
          value={language}
          onChange={handleLanguageChange}
          className="rounded border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs text-slate-200 focus:border-brand-indigo focus:outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <div className="monaco-wrap flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          language={monacoLang}
          value={code}
          onChange={handleChange}
          onMount={handleEditorMount}
          loading={
            <div className="grid h-full place-items-center text-xs text-slate-500">
              Loading editor…
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorSmoothCaretAnimation: 'on',
            tabSize: 2,
            automaticLayout: true,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}
