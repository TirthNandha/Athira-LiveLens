let pyodide = null;

async function loadPyodideRuntime() {
  if (pyodide) return pyodide;
  importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
  pyodide = await loadPyodide();
  return pyodide;
}

self.onmessage = async (e) => {
  const { id, code } = e.data;
  try {
    const py = await loadPyodideRuntime();

    py.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);

    try {
      py.runPython(code);
    } catch (err) {
      const stderr = py.runPython("sys.stderr.getvalue()");
      self.postMessage({
        id,
        stdout: "",
        stderr: stderr || err.message,
        error: null,
      });
      return;
    }

    const stdout = py.runPython("sys.stdout.getvalue()");
    const stderr = py.runPython("sys.stderr.getvalue()");

    self.postMessage({ id, stdout, stderr, error: null });
  } catch (err) {
    self.postMessage({ id, stdout: "", stderr: "", error: err.message });
  }
};
