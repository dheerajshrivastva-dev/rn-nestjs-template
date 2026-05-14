import React from 'react';

export const useDebounce = <T>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
