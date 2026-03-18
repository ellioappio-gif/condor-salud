"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string; // data-url for images
}

export interface FileUploadProps {
  /** Currently uploaded files */
  files: UploadedFile[];
  /** Called when files are added */
  onChange: (files: UploadedFile[]) => void;
  /** Accepted MIME types (default: spreadsheets, PDFs, images) */
  accept?: string;
  /** Max files allowed (default: 10) */
  maxFiles?: number;
  /** Max file size in bytes (default: 10 MB) */
  maxSize?: number;
  /** Label shown above the drop zone */
  label?: string;
  /** Helper text below the drop zone */
  hint?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show camera capture button on mobile (default: false) */
  enableCamera?: boolean;
  className?: string;
}

// ─── Defaults ────────────────────────────────────────────────

const DEFAULT_ACCEPT = [
  ".xlsx,.xls,.csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  ".pdf",
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
].join(",");

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const FILE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  "application/pdf": { label: "PDF", color: "bg-red-100 text-red-700" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    label: "XLSX",
    color: "bg-green-100 text-green-700",
  },
  "application/vnd.ms-excel": { label: "XLS", color: "bg-green-100 text-green-700" },
  "text/csv": { label: "CSV", color: "bg-blue-100 text-blue-700" },
  "image/png": { label: "PNG", color: "bg-purple-100 text-purple-700" },
  "image/jpeg": { label: "JPG", color: "bg-purple-100 text-purple-700" },
  "image/webp": { label: "WEBP", color: "bg-purple-100 text-purple-700" },
};

// ─── Helpers ─────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeBadge(mimeType: string) {
  return FILE_TYPE_LABELS[mimeType] ?? { label: "FILE", color: "bg-gray-100 text-gray-700" };
}

function generateId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Component ───────────────────────────────────────────────

export function FileUpload({
  files,
  onChange,
  accept = DEFAULT_ACCEPT,
  maxFiles = 10,
  maxSize = DEFAULT_MAX_SIZE,
  label,
  hint,
  disabled,
  enableCamera,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError(null);
      const newFiles: UploadedFile[] = [];
      const existingCount = files.length;

      for (const file of Array.from(incoming)) {
        if (existingCount + newFiles.length >= maxFiles) {
          setError(`Máximo ${maxFiles} archivos permitidos`);
          break;
        }
        if (file.size > maxSize) {
          setError(`"${file.name}" excede el límite de ${formatFileSize(maxSize)}`);
          continue;
        }

        const entry: UploadedFile = {
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
        };

        // Generate preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            entry.preview = e.target?.result as string;
            // Trigger re-render
            onChange([...files, ...newFiles]);
          };
          reader.readAsDataURL(file);
        }

        newFiles.push(entry);
      }

      if (newFiles.length) {
        onChange([...files, ...newFiles]);
      }
    },
    [files, onChange, maxFiles, maxSize],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      processFiles(e.dataTransfer.files);
    },
    [disabled, processFiles],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [processFiles],
  );

  const removeFile = useCallback(
    (id: string) => {
      onChange(files.filter((f) => f.id !== id));
    },
    [files, onChange],
  );

  return (
    <div className={cn("space-y-3", className)}>
      {label && <label className="block text-sm font-medium text-ink">{label}</label>}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label={label || "Subir archivos"}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste-dark focus-visible:ring-offset-2",
          isDragging
            ? "border-celeste-dark bg-celeste-50 scale-[1.01]"
            : "border-gray-300 bg-gray-50/50 hover:border-celeste hover:bg-celeste-50/30",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {/* Upload icon */}
        <svg
          className={cn("h-10 w-10 mb-3", isDragging ? "text-celeste-dark" : "text-gray-400")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>

        <p className="text-sm font-medium text-ink">
          {isDragging ? "Soltá los archivos acá" : "Arrastrá archivos o hacé clic para subir"}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          XLSX, CSV, PDF, PNG, JPG — máx. {formatFileSize(maxSize)}
        </p>

        {/* Camera button (mobile) */}
        {enableCamera && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cameraRef.current?.click();
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-celeste-200 bg-white px-4 py-2 text-sm font-medium text-celeste-dark hover:bg-celeste-50 transition"
            aria-label="Tomar foto con la cámara"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
              />
            </svg>
            Tomar foto
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleInputChange}
          className="sr-only"
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Hidden camera input for mobile capture */}
        {enableCamera && (
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleInputChange}
            className="sr-only"
            disabled={disabled}
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
      </div>

      {hint && <p className="text-xs text-ink-muted">{hint}</p>}

      {error && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2" aria-label="Archivos subidos">
          {files.map((f) => {
            const badge = getFileTypeBadge(f.type);
            return (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                {/* Preview or type badge */}
                {f.preview ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- data-URL preview; next/image doesn't support blob URLs */
                  <img src={f.preview} alt={f.name} className="h-10 w-10 rounded-md object-cover" />
                ) : (
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold",
                      badge.color,
                    )}
                  >
                    {badge.label}
                  </span>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{f.name}</p>
                  <p className="text-xs text-ink-muted">{formatFileSize(f.size)}</p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(f.id);
                  }}
                  className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  aria-label={`Eliminar ${f.name}`}
                  disabled={disabled}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
