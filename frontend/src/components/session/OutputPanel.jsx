export default function OutputPanel({ outputs, running }) {
  return (
    <div className="bg-gray-950 rounded-lg border border-gray-800 flex flex-col h-full min-h-[140px]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-400">Output</span>
        {running && (
          <span className="text-xs text-yellow-400 animate-pulse">
            Running…
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto p-3 font-mono text-sm">
        {outputs.length === 0 ? (
          <span className="text-gray-600">
            Run code to see output here.
          </span>
        ) : (
          outputs.map((o, i) => (
            <div key={i} className="mb-2">
              {o.stdout && (
                <pre className="text-green-400 whitespace-pre-wrap">{o.stdout}</pre>
              )}
              {o.stderr && (
                <pre className="text-red-400 whitespace-pre-wrap">{o.stderr}</pre>
              )}
              {o.error && (
                <pre className="text-red-500 whitespace-pre-wrap">{o.error}</pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
