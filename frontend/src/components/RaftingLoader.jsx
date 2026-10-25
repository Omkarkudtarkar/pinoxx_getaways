import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePageLoading } from "../lib/PageLoadingContext";

export function RaftingLoader() {
  const location = useLocation();
  const { isLoading } = usePageLoading();
  const [routeLoading, setRouteLoading] = useState(true);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const renderedRef = useRef(false);
  const showTimer = useRef(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    setRouteLoading(true);
    const timer = window.setTimeout(() => setRouteLoading(false), 320);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  const active = routeLoading || isLoading;

  useEffect(() => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);

    if (active) {
      showTimer.current = window.setTimeout(() => {
        renderedRef.current = true;
        setRendered(true);
        window.requestAnimationFrame(() => setVisible(true));
      }, 140);
    } else if (renderedRef.current) {
      setVisible(false);
      hideTimer.current = window.setTimeout(() => {
        renderedRef.current = false;
        setRendered(false);
      }, 380);
    }

    return () => {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
    };
  }, [active]);

  useEffect(() => {
    if (!rendered) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [rendered]);

  if (!rendered) return null;

  return (
    <div
      className={`rafting-loader${visible ? " rafting-loader--visible" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Navigating the rapids. Your adventure is loading."
      aria-hidden={!visible}
    >
      <div className="rafting-loader__content">
        <div className="rafting-scene" aria-hidden="true">
          <svg className="rafting-scene__icon" viewBox="0 0 180 150" role="presentation">
            <path d="m122 22-53 99" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d="M68 117q-14 8-20 23l13 7q13-10 15-25z" />
            <circle cx="83" cy="38" r="11" />
            <path d="M75 48q-13 4-17 20l-4 23 27 7 16-25-5-18-9-7z" />
            <path d="m66 61 25 14 28-48" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            <path d="M17 91q73 16 146 0l-11 25q-62 19-124 0z" />
          </svg>
        </div>
        <p className="rafting-loader__title">Navigating the Rapids<span className="rafting-loader__ellipsis">…</span></p>
        <p className="rafting-loader__caption">Getting your adventure ready</p>
      </div>
    </div>
  );
}
