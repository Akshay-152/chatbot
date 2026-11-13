import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const initialSchedule = `### Context
*   **Institution:** College of Engineering, Chengannur (Department of Computer Engineering).
*   **Purpose:** It is a list of dates, times, and specific student roll numbers for an upcoming test or examination.

### Columns
| Column | Description |
|--------|-------------|
| DATE | The specific calendar date |
| TIME | The specific time window |
| ROLL NUMBER | Student ID |

### Schedule
**Session 1 (16/11/26 - Monday):**
- Time: 9:30 AM to 12:30 PM
- Roll Numbers: 1, 4, 6, 14, 57, 55, 61, 66
- Absentees: 8, 10

**Session 2 (17/11/26 - Tuesday):**
- Time: 9:30 AM to 12:30 PM
- Roll Numbers: 26–36

**Session 3 (18/11/26 - Wednesday):**
- Time: 1:00 PM to 4:00 PM
- Roll Numbers: 37–48
- Absentees: 43
- Continued: 5, 49–59, 60–69`;

const historyStorageKey = "schedule-viewer-history-v1";
const maxHistoryEntries = 10;

type HistoryEntry = {
  id: string;
  content: string;
  createdAt: string;
};

type SpeechResult = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechResult>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function readStoredHistory(): HistoryEntry[] {
  const saved = window.localStorage.getItem(historyStorageKey);
  if (!saved) return [];

  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter(
    (entry): entry is HistoryEntry =>
      Boolean(
        entry &&
          typeof entry.id === "string" &&
          typeof entry.content === "string" &&
          typeof entry.createdAt === "string",
      ),
  ).slice(0, maxHistoryEntries);
}

function App() {
  const [input, setInput] = useState(initialSchedule);
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Ready · Markdown preview updates as you edit");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const isListeningRef = useRef(false);
  const speechConstructor = (window as WindowWithSpeechRecognition).SpeechRecognition
    ?? (window as WindowWithSpeechRecognition).webkitSpeechRecognition;

  const saveHistoryEntry = useCallback((content: string) => {
    if (!content.trim() || historyRef.current[0]?.content === content) return;

    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      content,
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...historyRef.current.filter((item) => item.content !== content)]
      .slice(0, maxHistoryEntries);
    historyRef.current = next;
    setHistory(next);

    try {
      window.localStorage.setItem(historyStorageKey, JSON.stringify(next));
    } catch {
      setStatus("History could not be saved in this browser");
    }
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    if (historyTimerRef.current !== null) {
      window.clearTimeout(historyTimerRef.current);
    }
    historyTimerRef.current = window.setTimeout(() => saveHistoryEntry(value), 900);
  }, [saveHistoryEntry]);

  useEffect(() => {
    try {
      const saved = readStoredHistory();
      historyRef.current = saved;
      setHistory(saved);
    } catch {
      setStatus("Saved history could not be read");
    }
  }, []);

  useEffect(() => {
    if (!speechConstructor) {
      setStatus("Voice input is not supported in this browser");
    }
  }, [handleInputChange, speechConstructor]);

  useEffect(() => {
    if (!speechConstructor) return;

    const recognition = new speechConstructor();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript.trim())
        .filter(Boolean)
        .join(" ");

      if (transcript) {
        const current = inputRef.current?.value ?? "";
        handleInputChange(`${current}${current && !current.endsWith("\n") ? "\n" : ""}${transcript}`);
        setStatus("Voice input added to the schedule");
      }
    };
    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        "not-allowed": "Allow microphone access in your browser to use voice input",
        "no-speech": "No speech was detected · try again",
        "audio-capture": "No microphone was found",
      };
      setStatus(messages[event.error] || "Voice input failed · try again");
    };
    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      if (isListeningRef.current) recognition.stop();
      recognitionRef.current = null;
    };
  }, [speechConstructor]);

  useEffect(() => () => {
    if (historyTimerRef.current !== null) {
      window.clearTimeout(historyTimerRef.current);
    }
  }, []);

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`${label} copied`);
    } catch {
      setStatus("Clipboard access failed · allow clipboard permission and try again");
    }
  }

  function toggleEditing() {
    if (isEditing) {
      if (historyTimerRef.current !== null) {
        window.clearTimeout(historyTimerRef.current);
        historyTimerRef.current = null;
      }
      saveHistoryEntry(input);
      setIsEditing(false);
      setStatus("Input saved to history");
      return;
    }

    setIsEditing(true);
    saveHistoryEntry(input);
    setStatus("Editing input · preview updates live");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function toggleVoiceInput() {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setStatus("Voice input is not supported in this browser");
      return;
    }

    if (isListening) {
      recognition.stop();
      isListeningRef.current = false;
      setIsListening(false);
      setStatus("Voice input stopped");
      return;
    }

    setIsEditing(true);
    saveHistoryEntry(input);
    try {
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
      setStatus("Listening… speak to add text to the input");
    } catch {
      isListeningRef.current = false;
      setStatus("Voice input could not start · check microphone permission");
    }
  }

  function openHistory() {
    if (isEditing) saveHistoryEntry(input);
    setIsHistoryOpen(true);
  }

  function restoreHistory(entry: HistoryEntry) {
    if (isEditing) saveHistoryEntry(input);
    setInput(entry.content);
    setIsEditing(true);
    setIsHistoryOpen(false);
    setStatus(`Restored version from ${new Date(entry.createdAt).toLocaleString()}`);
  }

  return (
    <main className="min-h-screen bg-[#f5f6fa] text-slate-800">
      <header className="border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a className="flex items-center gap-3" href="#" aria-label="Schedule Studio home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">S</span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-slate-900">Schedule Studio</span>
              <span className="block text-xs text-slate-500">Exam schedule formatter</span>
            </span>
          </a>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Schedule controls">
            <button
              className="toolbar-button"
              onClick={() => void copyText(input, "Output")}
              type="button"
              title="Copy the formatted output as Markdown"
            >
              <CopyIcon />
              <span>Copy output</span>
            </button>
            <button
              className="toolbar-button"
              onClick={() => void copyText(input, "Input")}
              type="button"
            >
              <CopyIcon />
              <span>Copy input</span>
            </button>
            <button
              className={`toolbar-button ${isEditing ? "toolbar-button-active" : ""}`}
              onClick={toggleEditing}
              type="button"
              aria-pressed={isEditing}
            >
              <EditIcon />
              <span>{isEditing ? "Finish editing" : "Edit input"}</span>
            </button>
            <button
              className="toolbar-button"
              onClick={openHistory}
              type="button"
              aria-haspopup="dialog"
            >
              <HistoryIcon />
              <span>History</span>
              {history.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {history.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-8 pt-7 sm:px-8 sm:pt-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Schedule workspace</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Examination schedule</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Paste or dictate schedule details on the left. The formatted preview updates as you work.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Markdown preview ready
          </span>
        </div>

        <section className="grid min-h-[620px] gap-5 lg:grid-cols-2" aria-label="Schedule input and output">
          <article className="panel-card flex min-h-[560px] flex-col">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Input</h2>
                <p className="panel-subtitle">Markdown source · edit or dictate</p>
              </div>
              <span className={`mode-badge ${isEditing ? "mode-badge-editing" : ""}`}>
                {isEditing ? <EditIcon /> : <LockIcon />}
                {isEditing ? "Editing" : "Read only"}
              </span>
            </div>
            <div className="relative flex flex-1 flex-col p-4 sm:p-5">
              <textarea
                ref={inputRef}
                className="min-h-[450px] w-full flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50/70 p-4 font-mono text-[13px] leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 read-only:cursor-default read-only:focus:border-slate-200 read-only:focus:bg-slate-50/70 read-only:focus:ring-0"
                value={input}
                onChange={(event) => handleInputChange(event.target.value)}
                onBlur={() => {
                  if (historyTimerRef.current !== null) {
                    window.clearTimeout(historyTimerRef.current);
                    historyTimerRef.current = null;
                  }
                  if (isEditing) saveHistoryEntry(input);
                }}
                readOnly={!isEditing}
                spellCheck={false}
                aria-label="Schedule Markdown input"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  {input.length.toLocaleString()} characters · Markdown and GFM tables supported
                </p>
                <button
                  className={`voice-button ${isListening ? "voice-button-listening" : ""}`}
                  onClick={toggleVoiceInput}
                  type="button"
                  disabled={!speechConstructor}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                  title={speechConstructor ? "Add speech to the input" : "Voice input is not supported in this browser"}
                >
                  <MicrophoneIcon />
                  <span>{isListening ? "Stop listening" : "Voice input"}</span>
                </button>
              </div>
            </div>
          </article>

          <article className="panel-card flex min-h-[560px] flex-col">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Structured output</h2>
                <p className="panel-subtitle">Live preview · headings, tables, lists, and emphasis</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <DocumentIcon />
              </span>
            </div>
            <div className="min-h-[450px] flex-1 overflow-auto p-5 sm:p-7">
              {input.trim() ? (
                <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h3:mb-3 prose-h3:mt-7 prose-h3:text-base prose-strong:text-slate-900 prose-th:bg-slate-50 prose-th:text-slate-700 prose-td:text-slate-600 prose-table:text-sm prose-a:text-indigo-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{input}</ReactMarkdown>
                </div>
              ) : (
                <div className="grid h-full min-h-[380px] place-items-center text-center">
                  <div className="max-w-xs">
                    <DocumentIcon />
                    <p className="mt-3 font-semibold text-slate-700">Your preview will appear here</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Enter Markdown in the input panel to format the schedule.</p>
                  </div>
                </div>
              )}
            </div>
          </article>
        </section>

        <footer className="mt-5 flex min-h-11 flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-1 pt-4">
          <p className="flex items-center gap-2 text-xs text-slate-500" role="status" aria-live="polite">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            {status}
          </p>
          <p className="text-xs text-slate-400">History is stored in this browser only</p>
        </footer>
      </div>

      {isHistoryOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsHistoryOpen(false);
          }}
        >
          <aside
            className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 id="history-title" className="text-lg font-bold text-slate-900">Input history</h2>
                <p className="mt-1 text-sm text-slate-500">Your 10 most recent saved versions</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setIsHistoryOpen(false)}
                type="button"
                aria-label="Close history"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
                  <HistoryIcon />
                  <p className="mt-3 text-sm font-medium text-slate-700">No saved versions yet</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Edit the input to automatically save previous versions here.</p>
                </div>
              ) : (
                history.map((entry) => (
                  <button
                    className="history-entry"
                    key={entry.id}
                    onClick={() => restoreHistory(entry)}
                    type="button"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <time className="text-xs font-medium text-indigo-600" dateTime={entry.createdAt}>
                        {new Date(entry.createdAt).toLocaleString()}
                      </time>
                      <span className="text-xs font-semibold text-slate-400">Restore</span>
                    </span>
                    <span className="mt-2 line-clamp-4 block whitespace-pre-wrap text-left font-mono text-xs leading-5 text-slate-600">
                      {entry.content}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <rect x="7" y="6" width="9" height="11" rx="1.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.5 6V4.8A1.8 1.8 0 0 0 10.7 3H5.8A1.8 1.8 0 0 0 4 4.8v7.4A1.8 1.8 0 0 0 5.8 14H7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m12.8 4.2 3 3m-9.9 9.1-3.1.6.6-3.1 8.8-8.8a2.1 2.1 0 0 1 3 3l-8.3 8.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M3.3 8a6.8 6.8 0 1 1 .6 5.2M3 4.3v4h4m3-1.8V10l2.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <rect x="7" y="2.5" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5m-3 0h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
      <rect x="4" y="8.5" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 8.5v-2a3.5 3.5 0 0 1 7 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="M5.5 2.8h6l3.7 3.7v10.7H5.5a1.7 1.7 0 0 1-1.7-1.7V4.5a1.7 1.7 0 0 1 1.7-1.7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11.5 3v4h4m-7 3h4m-4 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default App;
