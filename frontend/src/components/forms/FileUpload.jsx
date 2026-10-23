import { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';

// FileUpload — drag-and-drop OR click-to-browse. Accepts a single file by
// default. Caller passes `accept` (e.g. 'image/*') + `onFile(file)`.
export default function FileUpload({
  label,
  accept = '*',
  onFile,
  hint,
  className = '',
  multiple = false,
}) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (list) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    if (multiple) onFile?.(arr);
    else onFile?.(arr[0]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const clear = () => {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = '';
    onFile?.(multiple ? null : null);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <p className="block text-sm font-medium text-slate-200">{label}</p>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition ${
          dragging
            ? 'border-brand-indigo bg-brand-indigo/5'
            : 'border-slate-700 bg-slate-950 hover:border-slate-600'
        }`}
      >
        <Upload className="h-5 w-5 text-slate-400" />
        <p className="text-xs text-slate-400">
          Drag &amp; drop or <span className="text-brand-indigo">browse</span>
        </p>
        {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-md bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300"
            >
              <span className="flex items-center gap-2 truncate">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate">{f.name}</span>
                <span className="text-slate-500">({Math.round(f.size / 1024)} KB)</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clear();
                }}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-rose-400"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
