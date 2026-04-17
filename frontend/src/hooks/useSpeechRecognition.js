import { useRef, useState, useCallback, useEffect } from "react";

export default function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const chunksRef = useRef([]);
  const onChunkRef = useRef(null);
  const chunkTimerRef = useRef(null);
  const lastChunkTimeRef = useRef(Date.now());

  const CHUNK_INTERVAL_MS = 30000;

  const flushChunk = useCallback(() => {
    const now = Date.now();
    if (chunksRef.current.length === 0) return;
    const chunkText = chunksRef.current.join(" ").trim();
    if (chunkText && onChunkRef.current) {
      onChunkRef.current(chunkText, now);
    }
    chunksRef.current = [];
    lastChunkTimeRef.current = now;
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

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
      console.warn("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (recognitionRef.current === recognition) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

    chunkTimerRef.current = setInterval(flushChunk, CHUNK_INTERVAL_MS);
    lastChunkTimeRef.current = Date.now();
  }, [flushChunk]);

  const stop = useCallback(() => {
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
    flushChunk();
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null;
      try { ref.abort(); } catch {}
    }
    setIsListening(false);
    setInterimText("");
  }, [flushChunk]);

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
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimText,
    start,
    stop,
    onChunk,
    getFullTranscript,
    getRecentTranscript,
  };
}
