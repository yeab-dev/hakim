import { useEffect, useState } from "react";

// The value, but only once it has stopped changing for `delay` ms. Used as
// part of an SWR key, it turns "a request per keystroke" into "a request per
// pause".
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
