import { useRef, useState, useCallback, useEffect } from "react";

export default function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState(null);
  const chunksRef = useRef([]);
  const onChunkRef = useRef(null);
  const chunkTimerRef = useRef(null);
  const shouldRestart = useRef(false);
  const networkFailCount = useRef(0);

  const CHUNK_INTERVAL_MS = 30000;
  const MAX_NETWORK_RETRIES = 3;

  const flushChunk = useCallback(() => {
    if (chunksRef.current.length === 0) return;
    const chunkText = chunksRef.current.join(" ").trim();
    if (chunkText && onChunkRef.current) {
      onChunkRef.current(chunkText, Date.now());
    }
    chunksRef.current = [];
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Use Chrome or Edge.");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    setError(null);
    networkFailCount.current = 0;
    shouldRestart.current = true;
    setIsListening(true);

    const createRecognition = () => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const text = result[0].transcript.trim();
            if (text) {
              setTranscript((prev) => (prev ? prev + " " + text : text));
              chunksRef.current.push(text);
            }
          } else {
            interim += result[0].transcript;
          }
        }
        setInterimText(interim);
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        if (event.error === "network") {
          networkFailCount.current++;
          if (networkFailCount.current >= MAX_NETWORK_RETRIES) {
            shouldRestart.current = false;
            setIsListening(false);
            setError("Speech recognition can't reach Google's servers. Check your internet connection and try again.");
          }
          return;
        }
        if (event.error === "not-allowed") {
          shouldRestart.current = false;
          setIsListening(false);
          setError("Microphone access denied. Allow microphone in browser settings.");
          return;
        }
        shouldRestart.current = false;
        setIsListening(false);
        setError(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        if (!shouldRestart.current) {
          setIsListening(false);
          return;
        }
        setTimeout(() => {
          if (!shouldRestart.current) {
            setIsListening(false);
            return;
          }
          const next = createRecognition();
          recognitionRef.current = next;
          try {
            next.start();
          } catch {
            setIsListening(false);
            shouldRestart.current = false;
            setError("Failed to restart speech recognition.");
          }
        }, 200);
      };

      return recognition;
    };

    const recognition = createRecognition();
    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      setError(`Failed to start speech recognition: ${e.message}`);
      recognitionRef.current = null;
      shouldRestart.current = false;
      setIsListening(false);
    }

    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    chunkTimerRef.current = setInterval(flushChunk, CHUNK_INTERVAL_MS);
  }, [flushChunk]);

  const stop = useCallback(() => {
    shouldRestart.current = false;
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
    flushChunk();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText("");
  }, [flushChunk]);

  const addNote = useCallback((text) => {
    if (!text.trim()) return;
    setTranscript((prev) => (prev ? prev + " " + text.trim() : text.trim()));
    chunksRef.current.push(text.trim());
  }, []);

  const onChunk = useCallback((handler) => {
    onChunkRef.current = handler;
  }, []);

  const getFullTranscript = useCallback(() => transcript, [transcript]);

  const getRecentTranscript = useCallback(
    (seconds = 60) => {
      const words = transcript.split(" ");
      const approxWordsPerSecond = 2.5;
      const count = Math.ceil(seconds * approxWordsPerSecond);
      return words.slice(-count).join(" ");
    },
    [transcript]
  );

  useEffect(() => {
    return () => {
      shouldRestart.current = false;
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimText,
    error,
    start,
    stop,
    addNote,
    onChunk,
    getFullTranscript,
    getRecentTranscript,
  };
}
