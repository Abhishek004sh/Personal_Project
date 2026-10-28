import { useCallback, useEffect, useRef, useState } from 'react';

// Loads data when the screen opens and whenever `deps` change.
// Ignores answers that arrive late for an older request.
export function useLoad(fn, deps) {
  const [state, setState] = useState({ data: null, error: '', loading: true });
  const seq = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fn()
      .then((data) => {
        if (id === seq.current) setState({ data, error: '', loading: false });
      })
      .catch((err) => {
        if (id === seq.current) setState((s) => ({ data: s.data, error: err.message, loading: false }));
      });
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

export function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}
