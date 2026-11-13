// Sign in (FR-001): brand panel on the left, email + password card on the right.
import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useMock } from '../api/client';
import { AwsLogo, Icon } from '../components/Icons';
import { ErrorBox } from '../components/ui';
import { APP_VERSION } from '../config';
import { useAction } from '../hooks';

// Mock mode only: one-click sign-in as each role (sample data has no passwords).
const SAMPLES = [
  { email: 'aisha.rahman@awsys-i.com', who: 'Aisha Rahman', role: 'Employee' },
  { email: 'dana.lopez@awsys-i.com', who: 'Dana Lopez', role: 'Team lead' },
  { email: 'eli.park@awsys-i.com', who: 'Eli Park', role: 'Manager' },
  { email: 'fay.ong@awsys-i.com', who: 'Fay Ong', role: 'Admin' },
];

// "Remember me" keeps only the email address in this browser, never a password or session.
const REMEMBER_KEY = 'tt.email';
const remembered = (): string => {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
};
const remember = (email: string | null) => {
  try {
    if (email) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Storage blocked: nothing to remember.
  }
};

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(remembered);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [keep, setKeep] = useState(() => remembered() !== '');
  const [help, setHelp] = useState<string | null>(null);
  const { run, error, busy } = useAction();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await signIn(email, password);
      remember(keep ? email.trim().toLowerCase() : null);
    });
  };

  return (
    <div className="login">
      <aside className="lbrand">
        <span className="llogo"><AwsLogo /></span>
        <div className="lpitch">
          <h1>Task Tracker</h1>
          <p>Log your hours, follow your assignments and keep every timesheet in one place.</p>
        </div>
        <small>© 2026 AWSYS-I · Version {APP_VERSION}</small>
      </aside>

      <main className="lside">
        <form className="lcard" onSubmit={submit}>
          <div>
            <h2>Welcome Back</h2>
            <p className="mut">Sign in to continue to the platform</p>
          </div>

          <label className="lfld">
            <span>Email Address</span>
            <span className="lin">
              {Icon.mail}
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" autoComplete="username" autoFocus />
            </span>
          </label>

          <label className="lfld">
            <span>Password</span>
            <span className="lin">
              {Icon.lock}
              <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
              <button type="button" className="leye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
                {show ? Icon.eyeOff : Icon.eye}
              </button>
            </span>
          </label>

          <div className="lrow">
            <label className="lchk">
              <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
              Remember me
            </label>
            <button type="button" className="llink" onClick={() => setHelp('To reset your password, contact DX Support.')}>Forgot password?</button>
          </div>

          <ErrorBox msg={error} />
          {help && <p className="lhelp" role="status">{help}</p>}

          <button className="btn wide lgo" disabled={busy}>
            {Icon.arrow}
            {busy ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="lfoot">
            Need help signing in?{' '}
            <button type="button" className="llink" onClick={() => setHelp('Contact DX Support through your usual support channel for sign-in help.')}>Contact DX Support</button>
          </p>
        </form>

        {useMock && (
          <div className="samples">
            <span className="small mut">Sample accounts (mock mode, no password needed)</span>
            {SAMPLES.map((s) => (
              <button key={s.email} type="button" className="sample" onClick={() => run(() => signIn(s.email, 'sample'))} disabled={busy}>
                <b>{s.who}</b>
                <span>{s.role}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
