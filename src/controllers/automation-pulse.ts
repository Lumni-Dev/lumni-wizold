let pulse: () => void = () => {};

export function bindAutomationPulse(fn: () => void): () => void {
  pulse = fn;
  return () => {
    if (pulse === fn) pulse = () => {};
  };
}

export function requestAutomationPulse(): void {
  pulse();
}
