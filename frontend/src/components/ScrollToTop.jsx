import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// On every route change, scroll back to the top of the page. Without this,
// React Router preserves the previous scroll position, so navigating "Home"
// (or between any two routes) can leave you stranded mid-page — which is what
// made the logo/Home link feel unreliable. Mount this once inside the router.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
