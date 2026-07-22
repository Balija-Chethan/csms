import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';

export default function Leaderboard({ API_URL, token }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/student/leaderboard/?_cb=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) return <div style={{ color: '#fff' }}>Loading leaderboard standings...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.header}>Batch Leaderboard</h2>
          <p style={styles.subheader}>Review academic rankings of students based on task grades and mock scores.</p>
        </div>
        <div style={styles.filterGroup}>
          <select className="custom-input" style={{ width: 180, height: 44 }}>
            <option>PYTHON-FSD</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th}>Rank</th>
              <th style={styles.th}>Student Name</th>
              <th style={styles.th}>Tasks Score</th>
              <th style={styles.th}>Mocks Score</th>
              <th style={styles.th}>Overall Score</th>
            </tr>
          </thead>
          <tbody>
            {students.map((stud) => (
              <tr 
                key={stud.id} 
                style={{ 
                  ...styles.tr, 
                  backgroundColor: stud.is_me ? 'rgba(59,130,246,0.08)' : 'transparent',
                  borderLeft: stud.is_me ? '4px solid #3b82f6' : '4px solid transparent'
                }}
              >
                <td style={{ ...styles.td, fontWeight: 'bold' }}>
                  {stud.rank === 1 ? '🥇 1' : stud.rank === 2 ? '🥈 2' : stud.rank === 3 ? '🥉 3' : stud.rank}
                </td>
                <td style={styles.td}>
                  <div style={styles.studentCol}>
                    <span style={{ fontWeight: 'bold', color: '#ffffff' }}>
                      {stud.name}
                    </span>
                    {stud.is_me && <span style={styles.meTag}>(You)</span>}
                  </div>
                </td>
                <td style={styles.td}>{stud.tasksScore}</td>
                <td style={styles.td}>{stud.mocksScore.toFixed(0)}</td>
                <td style={{ ...styles.td, fontWeight: 'bold', color: '#3b82f6' }}>{stud.overallScore.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 20,
  },
  header: {
    color: '#ffffff',
    fontSize: 26,
    marginBottom: 6,
  },
  subheader: {
    color: '#9ca3af',
    fontSize: 14,
  },
  filterGroup: {
    alignSelf: 'center',
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
    padding: '16px 20px',
    color: '#9ca3af',
    fontWeight: 'bold',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    transition: 'background 0.2s',
  },
  td: {
    padding: '16px 20px',
    fontSize: 14,
    color: '#e5e7eb',
    verticalAlign: 'middle',
  },
  studentCol: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  meTag: {
    background: 'rgba(59,130,246,0.15)',
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: 'bold',
    padding: '2px 6px',
    borderRadius: 4,
  }
};
