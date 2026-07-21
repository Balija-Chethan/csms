import React, { useState, useEffect } from 'react';
import { Award, PlusCircle, Building2, Layers, FileCode } from 'lucide-react';

export default function AdminPlacementPrep({ API_URL, token }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('company'); // 'company', 'round', 'resource'

  // Company Form
  const [companyName, setCompanyName] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Round Form
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [roundNum, setRoundNum] = useState(1);
  const [roundTitle, setRoundTitle] = useState('');
  const [roundDesc, setRoundDesc] = useState('');

  // Resource Form
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceFileUrl, setResourceFileUrl] = useState('');
  const [sampleQuestions, setSampleQuestions] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchPlacementPrep = async () => {
    try {
      const res = await fetch(`${API_URL}/student/placement-prep/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCompanies(data);
      if (data.length > 0) {
        setSelectedCompanyId(data[0].id);
        if (data[0].rounds && data[0].rounds.length > 0) {
          setSelectedRoundId(data[0].rounds[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacementPrep();
  }, []);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!companyName) return alert('Company Name is required');

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/company/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: companyName, description: companyDesc, logoUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Placement Company created successfully!');
      setCompanyName('');
      setCompanyDesc('');
      setLogoUrl('');
      fetchPlacementPrep();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    if (!selectedCompanyId || !roundTitle) return alert('Select a company and enter Round Title');

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/placement-round/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ companyId: selectedCompanyId, roundNum: parseInt(roundNum) || 1, title: roundTitle, description: roundDesc })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Hiring Round added successfully!');
      setRoundTitle('');
      setRoundDesc('');
      fetchPlacementPrep();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!selectedRoundId || !resourceTitle) return alert('Select a Round and enter Resource Title');

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/placement-resource/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roundId: selectedRoundId, title: resourceTitle, fileUrl: resourceFileUrl, sampleQuestions })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Round Resource created successfully!');
      setResourceTitle('');
      setResourceFileUrl('');
      setSampleQuestions('');
      fetchPlacementPrep();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ color: '#fff', padding: 24 }}>Loading Placement Prep Manager...</div>;

  const allRounds = companies.flatMap(c => c.rounds.map(r => ({ ...r, companyName: c.name })));

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>
        <Building2 size={28} style={{ color: '#38bdf8' }} /> Placement Prep Companies & Resources Manager
      </h2>
      <p style={styles.subheader}>
        Add hiring companies (Accenture, IBM, CTS, etc.), define placement rounds, and attach prep resources for students.
      </p>

      {/* Mode Switcher */}
      <div style={styles.toggleContainer}>
        <button 
          style={mode === 'company' ? styles.toggleBtnActive : styles.toggleBtn}
          onClick={() => setMode('company')}
        >
          <Building2 size={16} /> 1. Add Company
        </button>
        <button 
          style={mode === 'round' ? styles.toggleBtnActive : styles.toggleBtn}
          onClick={() => setMode('round')}
        >
          <Layers size={16} /> 2. Add Hiring Round
        </button>
        <button 
          style={mode === 'resource' ? styles.toggleBtnActive : styles.toggleBtn}
          onClick={() => setMode('resource')}
        >
          <FileCode size={16} /> 3. Add Prep Resource
        </button>
      </div>

      <div style={styles.layout}>
        {/* Form Panel */}
        <div className="glass-card" style={styles.formCard}>
          {mode === 'company' && (
            <form onSubmit={handleCreateCompany} style={styles.form}>
              <h3 style={styles.formTitle}>Add New Target Company</h3>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Company Name</label>
                <input type="text" className="custom-input" placeholder="e.g. Google, Accenture" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Company Overview / Description</label>
                <textarea className="custom-input" placeholder="Role description, CTC package info..." value={companyDesc} onChange={e => setCompanyDesc(e.target.value)} style={{ minHeight: 80 }} />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Logo URL (Optional)</label>
                <input type="url" className="custom-input" placeholder="https://api.dicebear.com/7.x/initials/svg?seed=AC" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ justifyContent: 'center' }}>
                {submitting ? 'Creating...' : 'Create Company'}
              </button>
            </form>
          )}

          {mode === 'round' && (
            <form onSubmit={handleCreateRound} style={styles.form}>
              <h3 style={styles.formTitle}>Add Placement Round to Company</h3>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Select Target Company</label>
                <select className="custom-input" value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)} required>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Round Number</label>
                <input type="number" className="custom-input" value={roundNum} onChange={e => setRoundNum(e.target.value)} min="1" max="10" required />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Round Title</label>
                <input type="text" className="custom-input" placeholder="e.g. Round 1: Online Technical Assessment" value={roundTitle} onChange={e => setRoundTitle(e.target.value)} required />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Round Instructions</label>
                <textarea className="custom-input" placeholder="Description of topics tested in this round..." value={roundDesc} onChange={e => setRoundDesc(e.target.value)} style={{ minHeight: 80 }} />
              </div>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ justifyContent: 'center' }}>
                {submitting ? 'Adding...' : 'Add Round to Company'}
              </button>
            </form>
          )}

          {mode === 'resource' && (
            <form onSubmit={handleCreateResource} style={styles.form}>
              <h3 style={styles.formTitle}>Attach Prep Resource / Questions</h3>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Select Hiring Round</label>
                <select className="custom-input" value={selectedRoundId} onChange={e => setSelectedRoundId(e.target.value)} required>
                  {allRounds.map(r => (
                    <option key={r.id} value={r.id}>{r.companyName} - Round {r.round_num}: {r.title}</option>
                  ))}
                </select>
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Resource Title</label>
                <input type="text" className="custom-input" placeholder="e.g. Accenture Aptitude Questions PDF" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} required />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Drive File URL</label>
                <input type="url" className="custom-input" placeholder="https://drive.google.com/file/d/.../view" value={resourceFileUrl} onChange={e => setResourceFileUrl(e.target.value)} />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Sample Questions / Practice Notes</label>
                <textarea className="custom-input" placeholder="Sample questions..." value={sampleQuestions} onChange={e => setSampleQuestions(e.target.value)} style={{ minHeight: 80 }} />
              </div>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ justifyContent: 'center' }}>
                {submitting ? 'Creating...' : 'Attach Resource'}
              </button>
            </form>
          )}
        </div>

        {/* Existing Companies & Rounds Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ color: '#fff' }}>Hiring Companies & Rounds ({companies.length})</h3>

          {companies.map(comp => (
            <div key={comp.id} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <img src={comp.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${comp.name}`} alt="logo" style={{ width: 36, height: 36, borderRadius: 8 }} />
                <div>
                  <h4 style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{comp.name}</h4>
                  <p style={{ color: '#9ca3af', fontSize: 13 }}>{comp.description || 'Target Hiring Partner'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                {comp.rounds.map(r => (
                  <div key={r.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#60a5fa' }}>Round {r.round_num}: {r.title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{r.description}</div>
                    <div style={{ fontSize: 11, color: '#34d399', marginTop: 4 }}>
                      Resources attached: {r.resources ? r.resources.length : 0} items
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: '#ffffff',
    fontSize: 24,
  },
  subheader: {
    fontSize: 14,
    color: '#9ca3af',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 20,
    marginTop: -8,
  },
  toggleContainer: {
    display: 'flex',
    gap: 10,
    background: 'rgba(255,255,255,0.02)',
    padding: 6,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  toggleBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    padding: '10px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toggleBtnActive: {
    flex: 1,
    background: 'rgba(56, 189, 248, 0.15)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: '#38bdf8',
    padding: '10px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.3fr',
    gap: 24,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    }
  },
  formCard: {
    padding: 24,
  },
  formTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: '#d1d5db',
    fontWeight: 'bold',
  }
};
