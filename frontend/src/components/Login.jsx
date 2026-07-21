import React, { useState } from 'react';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

export default function Login({ setAuth, API_URL }) {
  const [email, setEmail] = useState('23691a3340@mits.ac.in');
  const [password, setPassword] = useState('password123');
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isRegister ? '/auth/register/' : '/auth/login/';
    const bodyData = isRegister 
      ? { email, password, firstName, lastName, rollNumber, phoneNumber }
      : { email, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      localStorage.setItem('csms_token', data.token);
      localStorage.setItem('csms_user', JSON.stringify(data.user));
      setAuth(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '23691a3340@mits.ac.in', password: 'password123' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('csms_token', data.token);
      localStorage.setItem('csms_user', JSON.stringify(data.user));
      setAuth(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'chethan@csms', password: 'password123' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Admin login failed');
      localStorage.setItem('csms_token', data.token);
      localStorage.setItem('csms_user', JSON.stringify(data.user));
      setAuth(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Decorative animated cosmic background */}
      <div className="cosmic-bg">
        <div className="aurora-wave"></div>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
      </div>

      {/* Left Portion: Branding Header and Bottom Caption Info */}
      <div style={styles.leftPanel}>
        <div style={styles.topBranding}>
          <div style={styles.logoTag}>CSMS Platform</div>
          <h1 style={styles.brandTitle}>Cheta Students Management System</h1>
        </div>
        <div style={styles.bottomBranding}>
          <p style={styles.brandDesc}>
            A tribute to MITS students from a senior.<br /><br />
            Bridging the gap between training and placements. Seamlessly track worksheets, log check-in attendance, and analyze mock drives in real-time.
          </p>
          <div style={styles.badgesRow}>
            <span style={styles.brandBadge}>Interactive Batches</span>
            <span style={styles.brandBadge}>Attendance Tracker</span>
          </div>
          <div style={styles.developerCredit}>
            Designed & Developed by: Chethan, Nichitha, Aftab
          </div>
        </div>
      </div>

      {/* Right Portion: Centered Login details on a semi-transparent panel */}
      <div style={styles.rightPanel} className="glass-panel-glow">
        <div style={styles.formCard}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={styles.formHeader}>{isRegister ? 'Create an Account' : 'Welcome back'}</h2>
            <p style={styles.formSubheader}>
              {isRegister ? 'Join the community today' : 'Sign in to your account'}
            </p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            {isRegister && (
              <>
                <div style={styles.nameRow}>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>First Name</label>
                    <input 
                      type="text" 
                      className="custom-input" 
                      placeholder="Nichitha" 
                      value={firstName} 
                      onChange={e => setFirstName(e.target.value)} 
                      required
                    />
                  </div>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>Last Name</label>
                    <input 
                      type="text" 
                      className="custom-input" 
                      placeholder="Sree" 
                      value={lastName} 
                      onChange={e => setLastName(e.target.value)} 
                      required
                    />
                  </div>
                </div>

                <div style={styles.nameRow}>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>Roll Number</label>
                    <input 
                      type="text" 
                      className="custom-input" 
                      placeholder="23691A3340" 
                      value={rollNumber} 
                      onChange={e => setRollNumber(e.target.value)} 
                    />
                  </div>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>Phone Number</label>
                    <input 
                      type="tel" 
                      className="custom-input" 
                      placeholder="9908322634" 
                      value={phoneNumber} 
                      onChange={e => setPhoneNumber(e.target.value)} 
                    />
                  </div>
                </div>
              </>
            )}

            <div style={styles.inputWrapper}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputIconContainer}>
                <Mail size={18} style={styles.inputIcon} />
                <input 
                  type="email" 
                  className="custom-input" 
                  placeholder="name@mits.ac.in" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  style={{ paddingLeft: 44 }}
                  required
                />
              </div>
            </div>

            <div style={styles.inputWrapper}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputIconContainer}>
                <Lock size={18} style={styles.inputIcon} />
                <input 
                  type="password" 
                  className="custom-input" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  style={{ paddingLeft: 44 }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
              <LogIn size={18} />
            </button>
          </form>

          {!isRegister && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleDemoLogin} 
                style={{ flex: 1, justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '10px 8px', fontSize: 12 }}
              >
                Demo Student
                <ArrowRight size={14} />
              </button>

              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleDemoAdminLogin} 
                style={{ flex: 1, justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '10px 8px', fontSize: 12 }}
              >
                Demo Admin
                <ArrowRight size={14} />
              </button>
            </div>
          )}


          <div style={styles.toggleContainer}>
            <span style={{ color: '#9ca3af', fontSize: 14 }}>
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button 
              type="button" 
              style={styles.toggleBtn}
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
            >
              {isRegister ? 'Sign in instead' : 'Create one now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.65)), url("/mits_campus.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box',
    position: 'relative',
  },
  leftPanel: {
    flex: 1.2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '60px 48px',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 2,
    '@media (max-width: 900px)': {
      display: 'none',
    }
  },
  topBranding: {
    width: '100%',
  },
  bottomBranding: {
    width: '100%',
  },
  logoTag: {
    color: '#60a5fa',
    fontWeight: 800,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
    display: 'inline-block',
    background: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(96, 165, 250, 0.35)',
    padding: '6px 16px',
    borderRadius: 99,
    textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: 900,
    lineHeight: '1.2',
    color: '#ffffff',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
    whiteSpace: 'nowrap',
  },
  brandDesc: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 1.6,
    marginBottom: 28,
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
    fontWeight: '500',
    maxWidth: 600,
  },
  badgesRow: {
    display: 'flex',
    gap: 12,
  },
  brandBadge: {
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 99,
    padding: '8px 16px',
    fontSize: 13,
    color: '#e5e7eb',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
  },
  rightPanel: {
    flex: 0.8,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 2,
    '@media (max-width: 900px)': {
      flex: 1,
      background: 'rgba(15, 23, 42, 0.85)',
    }
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    background: 'transparent',
  },
  formHeader: {
    fontSize: 28,
    color: '#ffffff',
    marginBottom: 6,
  },
  formSubheader: {
    color: '#9ca3af',
    fontSize: 14,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  nameRow: {
    display: 'flex',
    gap: 16,
  },
  inputWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    color: '#d1d5db',
    fontSize: 13,
    fontWeight: 600,
  },
  inputIconContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  submitBtn: {
    width: '100%',
    justifyContent: 'center',
    marginTop: 6,
  },
  toggleContainer: {
    textAlign: 'center',
    marginTop: 24,
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14,
    marginLeft: 4,
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#fca5a5',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 14,
    marginBottom: 20,
  },
  developerCredit: {
    display: 'inline-block',
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(251, 191, 36, 0.4)',
    padding: '8px 20px',
    borderRadius: 99,
    marginTop: 28,
    color: '#fbbf24',
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
  }
};
