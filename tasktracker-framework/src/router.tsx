// A small router (history API) so the app needs no extra packages.
import { createContext, useContext, useEffect, useState, type ReactNode, type MouseEvent } from 'react';

interface Loc {
  path: string;
  query: URLSearchParams;
  navigate: (to: string) => void;
}

const RouterCtx = createContext<Loc | null>(null);

export function Router({ children }: { children: ReactNode }) {
  const [href, setHref] = useState(window.location.pathname + window.location.search);
  useEffect(() => {
    const on = () => setHref(window.location.pathname + window.location.search);
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  const url = new URL(href, window.location.origin);
  const navigate = (to: string) => {
    window.history.pushState(null, '', to);
    setHref(to);
    window.scrollTo(0, 0);
  };
  return <RouterCtx.Provider value={{ path: url.pathname, query: url.searchParams, navigate }}>{children}</RouterCtx.Provider>;
}

export function useRouter(): Loc {
  const ctx = useContext(RouterCtx);
  if (!ctx) throw new Error('useRouter must be inside <Router>');
  return ctx;
}

export function Link({ to, className, children, ...rest }: { to: string; className?: string; children: ReactNode; 'aria-current'?: 'page' }) {
  const { navigate } = useRouter();
  const onClick = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}
