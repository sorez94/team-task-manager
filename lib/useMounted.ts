import { useSyncExternalStore } from "react";

function subscribe() {
  // Mounted-ness never changes after the initial client render, so there's
  // nothing to subscribe to — this only exists to satisfy the hook's shape.
  return () => {};
}

/**
 * Returns `false` during server rendering and the initial client render,
 * then `true` afterwards. Used to defer portal-based UI (modals, toasts)
 * until `document.body` is available, without the extra render pass that
 * a `useState` + `useEffect` pair would cause.
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
