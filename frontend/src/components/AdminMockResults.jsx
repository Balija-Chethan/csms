import React, { useState, useEffect } from 'react';
import { Award, PlusCircle, Calendar, Send } from 'lucide-react';

export default function AdminMockResults({ API_URL, token }) {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [testName, setTestName] = useState('');
  const [aptitudeScore, setAptitudeScore] = useState(25);
  const [techScore, setTechScore] = useState(25);
  const [codingScore, setCodingScore] = useState(30);
  const [techHrScore, setTechHrScore] = useState(10);
  const [hrScore, setHrScore] = useState(10);
  const [grade, setGrade] = useState('A');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [resResults, resStudents] = await Promise.all([
        fetch(`${API_URL}/admin/mock-results/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/users/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const dataResults = await resResults.json();
      const dataUsers = await resStudents.json();
      
      const studentUsers = dataUsers.filter(u => u.role === 'student');
      setResults(dataResults);
      setStudents(studentUsers);
      if (studentUsers.length > 0) {
        setSelectedStudentId(studentUsers[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMockResult = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !testName) return alert('Select a student and enter Test Name');

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/mock-results/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          testName,
          aptitudeScore: parseInt(aptitudeScore) || 0,
          techScore: parseInt(techScore) || 0,
          codingScore: parseInt(codingScore) || 0,
          techHrScore: parseInt(techHrScore) || 0,
          hrScore: parseInt(hrScore) || 0,
          grade,
          date
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Mock Drive test scores posted successfully!');
      setTestName('');
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ color: '#fff', padding: 24 }}>Loading Mock Test Scores manager...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>
        <Award size={28} style={{ color: '#eab308' }} /> Mock Placement Test Scores Manager
      </h2>
      <p style={styles.subheader}>
        Assign and publish student scores for mock placement drives (Aptitude, Technical, Coding & HR rounds).
      </p>

      <div style={styles.layout}>
        {/* Create Score Form */}
        <div className="glass-card" style={styles.formCard}>
          <h3 style={styles.formHeader}>
            <PlusCircle size={18} style={{ color: '#eab308' }} /> Post Student Mock Score
          </h3>

          <form onSubmit={handleCreateMockResult} style={styles.form}>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Select Student</label>
              <select 
                className="custom-input" 
                value={selectedStudentId} 
                onChange={e => setSelectedStudentId(e.target.value)}
                required
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.roll_number || s.username}) - {s.batch}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputWrapper}>
              <label style={styles.label}>Mock Drive / Test Name</label>
              <input 
                type="text" 
                className="custom-input" 
                placeholder="e.g. Mock Drive 3 - Accenture Assessment"
                value={testName} 
                onChange={e => setTestName(e.target.value)} 
                required 
              />
            </div>

            <div style={styles.scoreGrid}>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Aptitude Score</label>
                <input type="number" className="custom-input" value={aptitudeScore} onChange={e => setAptitudeScore(e.target.value)} min="0" max="100" />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Tech Score</label>
                <input type="number" className="custom-input" value={techScore} onChange={e => setTechScore(e.target.value)} min="0" max="100" />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Coding Score</label>
                <input type="number" className="custom-input" value={codingScore} onChange={e => setCodingScore(e.target.value)} min="0" max="100" />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Tech HR Score</label>
                <input type="number" className="custom-input" value={techHrScore} onChange={e => setTechHrScore(e.target.value)} min="0" max="100" />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>HR Score</label>
                <input type="number" className="custom-input" value={hrScore} onChange={e => setHrScore(e.target.value)} min="0" max="100" />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Overall Grade</label>
                <select className="custom-input" value={grade} onChange={e => setGrade(e.target.value)}>
                  <option value="S">S (Superior)</option>
                  <option value="A">A (Excellent)</option>
                  <option value="B">B (Good)</option>
                  <option value="C">C (Average)</option>
                  <option value="F">F (Needs Improvement)</option>
                </select>
              </div>
            </div>

            <div style={styles.inputWrapper}>
              <label style={styles.label}>Test Date</label>
              <input type="date" className="custom-input" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting} style={{ justifyContent: 'center' }}>
              <Send size={16} /> {submitting ? 'Posting Scores...' : 'Post Test Score'}
            </button>
          </form>
        </div>

        {/* Existing Scores Table */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: '#fff' }}>Student Mock Drive Records ({results.length})</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Test Name</th>
                  <th style={styles.th}>Total Score</th>
                  <th style={styles.th}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>{r.date}</td>
                    <td style={styles.td}>{r.student_name} ({r.student_roll})</td>
                    <td style={styles.td}>{r.test_name}</td>
                    <td style={styles.td}>{r.total_score} pts</td>
                    <td style={styles.td}>
                      <span className={`badge ${r.grade === 'S' || r.grade === 'A' ? 'badge-success' : r.grade === 'B' ? 'badge-warning' : 'badge-danger'}`}>
                        Grade {r.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.4fr',
    gap: 24,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    }
  },
  formCard: {
    padding: 24,
  },
  formHeader: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  scoreGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
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
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  theadRow: {
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
  },
  th: {
    padding: '14px 18px',
    color: '#9ca3af',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  td: {
    padding: '14px 18px',
    fontSize: 13,
    color: '#e5e7eb',
  }
};
