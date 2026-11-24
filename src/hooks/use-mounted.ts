import * as React from "react";

const noop = () => () => {};

/** False during SSR and hydration, true afterwards. Use it for values only known in the browser. */
export function useMounted() {
  return React.useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
