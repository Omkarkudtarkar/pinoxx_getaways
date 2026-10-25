import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const PageLoadingContext = createContext(null);

export function PageLoadingProvider({ children }) {
  const requests = useRef(new Set());
  const nextRequestId = useRef(0);
  const [pendingCount, setPendingCount] = useState(0);

  const beginLoading = useCallback(() => {
    const requestId = nextRequestId.current++;
    requests.current.add(requestId);
    setPendingCount(requests.current.size);

    return () => {
      if (!requests.current.delete(requestId)) return;
      setPendingCount(requests.current.size);
    };
  }, []);

  const value = useMemo(() => ({ isLoading: pendingCount > 0, beginLoading }), [pendingCount, beginLoading]);

  return <PageLoadingContext.Provider value={value}>{children}</PageLoadingContext.Provider>;
}

export function usePageLoading() {
  const context = useContext(PageLoadingContext);
  if (!context) {
    throw new Error("usePageLoading must be used within a PageLoadingProvider.");
  }
  return context;
}
