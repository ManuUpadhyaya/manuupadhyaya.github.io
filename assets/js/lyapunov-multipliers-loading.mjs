export function toggleZeroMask(mask, component) {
  if (!Number.isInteger(mask) || mask < 0 || mask > 127 || !Number.isInteger(component) || component < 0 || component > 6) {
    throw new Error("Invalid multiplier zero selection");
  }
  return mask ^ (1 << component);
}

export function createDatasetSelection(loadDataset) {
  const cache = new Map();
  let revision = 0;
  const load = (key) => {
    if (!cache.has(key)) {
      const promise = Promise.resolve().then(() => loadDataset(key));
      cache.set(key, promise);
      promise.catch(() => {
        if (cache.get(key) === promise) cache.delete(key);
      });
    }
    return cache.get(key);
  };
  return {
    invalidate() {
      revision += 1;
    },
    async select(keys) {
      const selectedRevision = ++revision;
      try {
        const values = await Promise.all(keys.map(load));
        return { current: selectedRevision === revision, datasets: Object.fromEntries(keys.map((key, index) => [key, values[index]])) };
      } catch (error) {
        return { current: selectedRevision === revision, error };
      }
    },
  };
}

export async function fetchJsonDataset(url, compressed = false) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Multiplier data request failed (${response.status})`);
  if (!compressed || response.headers.get("content-encoding")?.includes("gzip")) return response.json();
  if (typeof DecompressionStream !== "function") throw new Error("Compressed multiplier data is unsupported in this browser");
  return new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).json();
}

export function createFixedExpressionControl(loadDataset, onChange = () => {}) {
  const selection = createDatasetSelection(() => loadDataset());
  let state = { mask: 0, selected: false, loading: false, data: null, error: null };
  const getState = () => ({ ...state });
  const clear = (mask) => {
    selection.invalidate();
    state = { mask, selected: false, loading: false, data: null, error: null };
    onChange();
  };
  return {
    getState,
    setMask(mask) {
      if (!Number.isInteger(mask) || mask < 0 || mask > 127) throw new Error("Invalid multiplier zero selection");
      if (mask !== state.mask) clear(mask);
    },
    async toggle() {
      if (state.mask !== 74) return getState();
      if (state.selected) {
        clear(state.mask);
        return getState();
      }
      state = { ...state, selected: true, loading: true, data: null, error: null };
      onChange();
      const result = await selection.select(["fixed"]);
      if (!result.current) return getState();
      state = { ...state, loading: false, data: result.datasets?.fixed ?? null, error: result.error ?? null };
      onChange();
      return getState();
    },
  };
}
