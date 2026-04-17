import { useState, useCallback, useEffect } from "react";
import api from "../../api/axios";
import TranscriptPanel from "./TranscriptPanel";
import ConceptCards from "./ConceptCards";
import WaitWhatPanel from "./WaitWhatPanel";

export default function AISidebar({ userRole, subject, send, on, speech }) {
  const {
    isListening,
    transcript,
    interimText,
    error: speechError,
    start,
    stop,
    addNote,
    onChunk,
    getRecentTranscript,
  } = speech;

  const [concepts, setConcepts] = useState([]);
  const [conceptsLoading, setConceptsLoading] = useState(false);
  const [waitWhatResponse, setWaitWhatResponse] = useState(null);
  const [waitWhatLoading, setWaitWhatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("transcript");

  const handleToggleListening = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  useEffect(() => {
    onChunk(async (chunkText) => {
      if (chunkText.split(" ").length < 5) return;
      setConceptsLoading(true);
      try {
        const res = await api.post("/ai/concepts", {
          transcript_chunk: chunkText,
          subject: subject || "",
        });
        if (res.data?.concepts?.length) {
          setConcepts((prev) => [...res.data.concepts, ...prev]);
        }
      } catch (err) {
        console.warn("Concept extraction failed:", err);
      } finally {
        setConceptsLoading(false);
      }
    });
  }, [onChunk, subject]);

  const handleWaitWhat = useCallback(
    async (studentQuestion) => {
      const recent = getRecentTranscript(60);
      if (!recent || recent.trim().length < 10) {
        setWaitWhatResponse({
          explanation: "Not enough recent transcript to analyze. Keep talking!",
          analogy: "",
          follow_up: "",
        });
        return;
      }
      setWaitWhatLoading(true);
      try {
        const res = await api.post("/ai/wait-what", {
          transcript_chunk: recent,
          subject: subject || "",
          student_question: studentQuestion || "",
        });
        setWaitWhatResponse(res.data);

        send("chat:message", {
          text: `[Wait, What?] ${studentQuestion || "Student is confused about the last topic"}`,
          sender: "AI Assistant",
        });
      } catch (err) {
        console.warn("Wait-What failed:", err);
        setWaitWhatResponse({
          explanation: "Couldn't get AI help right now. Try again in a moment.",
          analogy: "",
          follow_up: "",
        });
      } finally {
        setWaitWhatLoading(false);
      }
    },
    [getRecentTranscript, subject, send]
  );

  useEffect(() => {
    const off = on("confusion:alert", (data) => {
      setWaitWhatResponse(data);
      setActiveTab("confusion");
    });
    return off;
  }, [on]);

  const tabs = [
    { id: "transcript", label: "Transcript" },
    { id: "concepts", label: `Concepts${concepts.length ? ` (${concepts.length})` : ""}` },
    { id: "confusion", label: "Wait, What?" },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex border-b border-gray-200 bg-white shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === "transcript" && (
          <TranscriptPanel
            transcript={transcript}
            interimText={interimText}
            isListening={isListening}
            error={speechError}
            onToggle={handleToggleListening}
            onAddNote={addNote}
          />
        )}
        {activeTab === "concepts" && (
          <ConceptCards concepts={concepts} loading={conceptsLoading} />
        )}
        {activeTab === "confusion" && (
          <WaitWhatPanel
            onTrigger={handleWaitWhat}
            response={waitWhatResponse}
            loading={waitWhatLoading}
            userRole={userRole}
          />
        )}
      </div>
    </div>
  );
}
