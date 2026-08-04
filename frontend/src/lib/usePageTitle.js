import { useEffect } from "react";

// Keeps the browser tab, history, and bookmarks distinguishable per page --
// without this every page shows the same generic "MediConnect" title.
export function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · MediConnect` : "MediConnect";
    return () => {
      document.title = previous;
    };
  }, [title]);
}