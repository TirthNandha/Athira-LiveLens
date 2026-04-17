import { useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";

function uint8ToBase64(bytes) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export default function CodeEditor({ send, on, onRun, running }) {
  const ydocRef = useRef(null);
  const bindingRef = useRef(null);
  const editorRef = useRef(null);
  const sendRef = useRef(send);
  sendRef.current = send;

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    ydoc.on("update", (update, origin) => {
      if (origin !== "remote") {
        try {
          const b64 = uint8ToBase64(update);
          sendRef.current("yjs:sync", b64);
        } catch (e) {
          console.warn("yjs send error:", e);
        }
      }
    });

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      ydoc.destroy();
      ydocRef.current = null;
    };
  }, []);

  useEffect(() => {
    const off = on("yjs:sync", (data) => {
      const ydoc = ydocRef.current;
      if (!ydoc) return;
      try {
        const update = base64ToUint8(data);
        Y.applyUpdate(ydoc, update, "remote");
      } catch (e) {
        console.warn("yjs sync error:", e);
      }
    });
    return off;
  }, [on]);

  useEffect(() => {
    const off = on("yjs:full-state", (data) => {
      const ydoc = ydocRef.current;
      if (!ydoc) return;
      try {
        const state = base64ToUint8(data);
        Y.applyUpdate(ydoc, state, "remote");
      } catch (e) {
        console.warn("yjs full-state error:", e);
      }
    });
    return off;
  }, [on]);

  useEffect(() => {
    const off = on("yjs:request-sync", () => {
      const ydoc = ydocRef.current;
      if (!ydoc) return;
      try {
        const state = Y.encodeStateAsUpdate(ydoc);
        const b64 = uint8ToBase64(state);
        sendRef.current("yjs:full-state", b64);
      } catch (e) {
        console.warn("yjs request-sync error:", e);
      }
    });
    return off;
  }, [on]);

  useEffect(() => {
    const off = on("user:joined", () => {
      const ydoc = ydocRef.current;
      if (!ydoc) return;
      try {
        const state = Y.encodeStateAsUpdate(ydoc);
        const b64 = uint8ToBase64(state);
        sendRef.current("yjs:full-state", b64);
      } catch (e) {
        console.warn("yjs user:joined sync error:", e);
      }
    });
    return off;
  }, [on]);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
    const ydoc = ydocRef.current;
    if (!ydoc) return;

    const ytext = ydoc.getText("monaco");
    const model = editor.getModel();

    if (ytext.length === 0) {
      ytext.insert(0, "# Write your Python code here\nprint('Hello, Athira!')\n");
    }

    model.setValue(ytext.toString());

    bindingRef.current = new MonacoBinding(
      ytext,
      model,
      new Set([editor])
    );

    // Request state from anyone already in the room
    sendRef.current("yjs:request-sync", {});
  }, []);

  const handleRun = () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      onRun(code);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-400">
          Python Editor
        </span>
        <button
          onClick={handleRun}
          disabled={running}
          className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {running ? "Running…" : "▶ Run"}
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="python"
          defaultValue=""
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 8 },
            lineNumbers: "on",
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
