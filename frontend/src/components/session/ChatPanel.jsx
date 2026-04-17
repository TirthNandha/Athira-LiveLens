import { useState, useRef, useEffect } from "react";

export default function ChatPanel({ messages, onSend }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      <div className="px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-500">Chat</span>
      </div>
      <div className="flex-1 overflow-auto px-3 py-2 space-y-2 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.isOwn ? "text-right" : ""}`}>
            <span className="text-xs text-gray-400 block">{m.sender}</span>
            <span
              className={`inline-block px-2.5 py-1 rounded-lg text-sm ${
                m.isOwn
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 cursor-pointer"
        >
          Send
        </button>
      </form>
    </div>
  );
}
