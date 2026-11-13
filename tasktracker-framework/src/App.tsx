// Routes. A page the role cannot open shows "Not allowed" (the backend refuses it too).
import type { FC } from 'react';
import { useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { Card, PageHead } from './components/ui';
import { canOpen } from './nav';
import { Activity } from './pages/Activity';
import { Admin } from './pages/Admin';
import { AssignmentsPage } from './pages/Assignments';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Leave } from './pages/Leave';
import { Locks } from './pages/Locks';
import { Login } from './pages/Login';
import { Reports } from './pages/Reports';
import { Setup } from './pages/Setup';
import { Link, useRouter } from './router';

const PAGES: Record<string, FC> = {
  '/': Dashboard,
  '/activity': Activity,
  '/leave': Leave,
  '/setup': Setup,
  '/assignments': AssignmentsPage,
  '/reports': Reports,
  '/locks': Locks,
  '/admin': Admin,
};

export function App() {
  const { user } = useAuth();
  const { path } = useRouter();
  if (!user) return <Login />;
  const Page = PAGES[path];
  let body;
  if (!Page) body = <Message title="Page not found" text="This page does not exist." />;
  else if (!canOpen(user.role, path)) body = <Message title="Not allowed" text="Your role cannot open this page." />;
  else body = <Page />;
  return <Layout>{body}</Layout>;
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <>
      <PageHead title={title} />
      <Card>
        <p>{text}</p>
        <Link to="/" className="link">Go to the dashboard</Link>
      </Card>
    </>
  );
}
