let counter = 0;

export function generateId(prefix = "id"): string {
  counter += 1;
  const tail = Math.random().toString(36).slice(2, 6);
  return prefix + "_" + Date.now().toString(36) + "_" + counter.toString(36) + tail;
}
