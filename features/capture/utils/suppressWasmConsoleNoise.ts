const WASM_NOISE =
  /TensorFlow Lite|XNNPACK|Created TensorFlow|TFLite delegate/i;

let installs = 0;
let previousConsoleError: typeof console.error | null = null;

function isWasmNoise(args: unknown[]) {
  const text = args
    .map((arg) => (typeof arg === "string" ? arg : String(arg)))
    .join(" ");
  return WASM_NOISE.test(text);
}

/** Swallow MediaPipe/TFLite INFO lines that Next.js dev treats as console errors. */
export function installWasmConsoleNoiseFilter() {
  if (typeof window === "undefined") return;

  installs += 1;
  if (installs > 1) return;

  previousConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (isWasmNoise(args)) return;
    previousConsoleError!(...args);
  };
}

export function uninstallWasmConsoleNoiseFilter() {
  if (typeof window === "undefined" || installs === 0) return;

  installs -= 1;
  if (installs > 0 || !previousConsoleError) return;

  console.error = previousConsoleError;
  previousConsoleError = null;
}
