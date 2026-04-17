import { useRef, useEffect, useState } from "react";

export default function TranscriptPanel({
  transcript,
  interimText,
  isListening,
  error,
  onToggle,
  onAddNote,
}) {
  const bottomRef = useRef(null);
  const [noteText, setNoteText] = useState("");
  const [mode, setMode] = useState("notes");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimText]);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(noteText.trim());
    setNoteText("");
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Transcript</span>
          {isListening && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-500 font-medium">REC</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMode("notes")}
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
              mode === "notes"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setMode("mic")}
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
              mode === "mic"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Mic
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 py-2 text-sm text-gray-700 leading-relaxed min-h-0">
        {error && mode === "mic" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-2">
            <p className="text-xs text-red-700">{error}</p>
            <button
              onClick={() => setMode("notes")}
              className="text-[10px] text-indigo-600 underline mt-1 cursor-pointer"
            >
              Switch to Notes mode instead
            </button>
          </div>
        )}
        {!transcript && !interimText && !error ? (
          <span className="text-gray-400 text-xs">
            {mode === "mic"
              ? isListening
                ? "Listening… speak to see transcript"
                : "Click Start to enable voice transcription"
              : "Type notes about what's being discussed. AI will use these for concept extraction and recaps."}
          </span>
        ) : (
          <>
            {transcript && <span>{transcript}</span>}
            {interimText && (
              <span className="text-gray-400 italic"> {interimText}</span>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {mode === "notes" && (
        <form onSubmit={handleAddNote} className="p-2 border-t border-gray-200 flex gap-1.5">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type what's being discussed…"
            className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-indigo-600 text-white text-[10px] font-medium rounded-lg hover:bg-indigo-700 cursor-pointer"
          >
            Add
          </button>
        </form>
      )}

      {mode === "mic" && (
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={onToggle}
            className={`w-full py-1.5 text-[10px] font-medium rounded-lg transition-colors cursor-pointer ${
              isListening
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {isListening ? "Stop Listening" : "Start Listening"}
          </button>
        </div>
      )}
    </div>
  );
}
