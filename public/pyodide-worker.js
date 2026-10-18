// Runs submissions in the browser, so the judge needs no server and works on a
// serverless deploy. A worker rather than the page: an infinite loop can only be
// stopped by terminating the thread it runs on.
importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");

const HARNESS = `
import copy, io, json, time, traceback, contextlib

def _run(code, fn_name, params, tests):
    ns = {"__name__": "__main__"}
    out = io.StringIO()
    try:
        with contextlib.redirect_stdout(out):
            exec(compile(code, "solution.py", "exec"), ns)
    except BaseException:
        return {"error": traceback.format_exc(limit=0), "stdout": out.getvalue()}
    if "Solution" not in ns:
        return {"error": "No class named Solution was defined.", "stdout": out.getvalue()}
    results = []
    for t in tests:
        buf = io.StringIO()
        row = {"args": t["args"], "expected": t["expected"]}
        try:
            fn = getattr(ns["Solution"](), fn_name)
            args = [copy.deepcopy(t["args"][p]) for p in params]
            with contextlib.redirect_stdout(buf):
                t0 = time.perf_counter()
                got = fn(*args)
                row["ms"] = round((time.perf_counter() - t0) * 1000, 2)
            row["got"] = got
            row["pass"] = got == t["expected"]
        except BaseException:
            tb = traceback.format_exc().splitlines()
            # drop the harness frames, keep the ones in solution.py
            keep = [l for i, l in enumerate(tb) if i == 0 or "solution.py" in l or not l.startswith("  File")]
            row["error"] = "\\n".join(keep)
            row["pass"] = False
        row["stdout"] = buf.getvalue()
        results.append(row)
    return {"results": results, "stdout": out.getvalue()}

def run(payload):
    p = json.loads(payload)
    return json.dumps(_run(p["code"], p["functionName"], p["params"], p["tests"]), default=repr)
`;

const ready = (async () => {
  const py = await loadPyodide();
  py.runPython(HARNESS);
  self.postMessage({ type: "ready" });
  return py;
})().catch((e) => {
  self.postMessage({ type: "fatal", error: String(e) });
  throw e;
});

self.onmessage = async (e) => {
  const py = await ready;
  try {
    const out = py.globals.get("run")(JSON.stringify(e.data));
    self.postMessage({ type: "result", ...JSON.parse(out) });
  } catch (err) {
    self.postMessage({ type: "result", error: String(err) });
  }
};
