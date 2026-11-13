// Header (logo, profile menu) and role-based sidebar with a collapse toggle.
import { useState, type ReactNode } from 'react';
import { useAuth, useMe } from '../auth/AuthContext';
import { navFor } from '../nav';
import { Link, useRouter } from '../router';
import { ROLE_LABEL } from '../api/types';
import { APP_VERSION } from '../config';
import { initials } from '../utils/format';
import { AwsLogo, Icon } from './Icons';

export function Layout({ children }: { children: ReactNode }) {
  const me = useMe();
  const { signOut } = useAuth();
  const { path, navigate } = useRouter();
  const [open, setOpen] = useState(true);
  const items = navFor(me.role);
  const active = (p: string) => (p === '/' ? path === '/' : path.startsWith(p));

  return (
    <div className={`shell ${open ? '' : 'collapsed'}`}>
      <header className="top">
        <div className="brand">
          <AwsLogo />
          <span>Task Tracker</span>
        </div>
        <div className="me">
          <button className="mebtn" aria-haspopup="menu">
            <span className="av">{initials(me.name)}</span>
            <span className="mename">
              <b>{me.name}</b>
              <span>{ROLE_LABEL[me.role]}</span>
            </span>
            {Icon.chevron}
          </button>
          <div className="menu" role="menu" aria-label="Account">
            <div className="panel">
              <button className="mi" role="menuitem">{Icon.user}Profile</button>
              <button className="mi" role="menuitem" onClick={() => signOut().then(() => navigate('/'))}>{Icon.logout}Log out</button>
              <div className="ver">Version {APP_VERSION}</div>
            </div>
          </div>
        </div>
      </header>
      <nav className="side" aria-label="Main">
        {items.map((n) => (
          <Link key={n.key} to={n.path} className={`nav ${active(n.path) ? 'on' : ''}`} aria-current={active(n.path) ? 'page' : undefined}>
            {Icon[n.key]}
            <span className="lbl">{n.label}</span>
          </Link>
        ))}
        <button className="nav tgl" aria-expanded={open} onClick={() => setOpen(!open)}>
          {Icon.toggle}
          <span className="lbl">Toggle sidebar</span>
        </button>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
