import { useRef, useEffect } from "react";

export default function TranscriptPanel({ transcript, interimText, isListening, onToggle }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimText]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Live Transcript</span>
          {isListening && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-500 font-medium">REC</span>
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
            isListening
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {isListening ? "Stop" : "Start"}
        </button>
      </div>
      <div className="flex-1 overflow-auto px-3 py-2 text-sm text-gray-700 leading-relaxed min-h-0">
        {!transcript && !interimText ? (
          <span className="text-gray-400 text-xs">
            {isListening
              ? "Listening… speak to see transcript"
              : "Press Start to enable live transcription"}
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
    </div>
  );
}
