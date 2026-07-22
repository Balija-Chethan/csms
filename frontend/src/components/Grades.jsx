import React, { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle } from 'lucide-react';

export default function Grades({ API_URL, token }) {
  const [data, setData] = useState({ grades: [], mockDrives: [] });
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('academic'); // 'academic' or 'mockDrives'

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await fetch(`${API_URL}/student/grades/?_cb=${Date.now()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await res.json();
        setData(resData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) return <div style={{ color: '#fff' }}>Loading academic reports...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.header}>My Academic Reports</h2>
          <p style={styles.subheader}>Review your performance across assignments and mock placement drives</p>
        </div>
      </div>

      <div style={styles.tabsRow}>
        <button 
          style={activeSubTab === 'academic' ? styles.activeTabBtn : styles.tabBtn} 
          onClick={() => setActiveSubTab('academic')}
        >
          Assignment Grades ({data.grades.length})
        </button>
        <button 
          style={activeSubTab === 'mockDrives' ? styles.activeTabBtn : styles.tabBtn} 
          onClick={() => setActiveSubTab('mockDrives')}
        >
          Mock Placement Drives ({data.mockDrives.length})
        </button>
      </div>

      {activeSubTab === 'academic' ? (
        <div style={styles.grid}>
          {data.grades.map(grade => (
            <div key={grade.id} className="glass-card" style={styles.gradeCard}>
              <div style={styles.gradeCardTop}>
                <div style={styles.scoreCircle}>
                  <div style={styles.scoreVal}>{grade.grade}</div>
                  <div style={styles.scoreSub}>Score</div>
                </div>
                <div style={styles.badgeCol}>
                  <span className="badge badge-success">Outstanding!</span>
                  <span style={styles.date}>Graded on {new Date(grade.graded_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <h3 style={styles.taskTitle}>{grade.task_title}</h3>
              
              {grade.feedback && (
                <div style={styles.feedbackBox}>
                  <strong>Instructor Feedback:</strong>
                  <p style={{ marginTop: 4, color: '#d1d5db' }}>{grade.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.grid}>
          {data.mockDrives && data.mockDrives.length > 0 ? (
            data.mockDrives.map(drive => (
              <div key={drive.id} className="glass-card" style={styles.mockCard}>
                <div style={styles.mockHeader}>
                  <div>
                    <h3 style={styles.driveTitle}>{drive.test_name}</h3>
                    <span style={styles.date}>Drive Date: {drive.date}</span>
                  </div>
                  <div style={styles.gradeBadge}>
                    <div style={styles.gradeCircle}>{drive.grade}</div>
                    <div style={{ fontSize: 11, textAlign: 'center', marginTop: 4 }}>GRADE</div>
                  </div>
                </div>

                <div style={styles.breakdown}>
                  <h4 style={styles.breakdownHeader}>Marks Breakdown</h4>
                  
                  <div style={styles.breakdownRow}>
                    <span>MCQ - Aptitude</span>
                    <strong>{drive.aptitude_score} / 150</strong>
                  </div>
                  <div style={styles.breakdownRow}>
                    <span>MCQ - Tech</span>
                    <strong>{drive.tech_score} / 300</strong>
                  </div>
                  <div style={styles.breakdownRow}>
                    <span>Coding Round</span>
                    <strong>{drive.coding_score} / 400</strong>
                  </div>
                  <div style={styles.breakdownRow}>
                    <span>Tech HR Marks</span>
                    <strong>{drive.tech_hr_score} / 50</strong>
                  </div>
                  <div style={styles.breakdownRow}>
                    <span>HR Marks</span>
                    <strong>{drive.hr_score} / 100</strong>
                  </div>
                  
                  <div style={styles.totalRow}>
                    <span>Percentage Score</span>
                    <strong>{drive.total_score / 10}% ({drive.total_score} / 1000)</strong>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', width: '100%', gridColumn: '1 / -1' }}>
              No mock drive attempted yet.
            </div>
          )}
        </div>
      )}
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
  tabsRow: {
    display: 'flex',
    gap: 12,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 8,
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: 15,
    fontFamily: 'var(--font-header)',
    fontWeight: 'bold',
  },
  activeTabBtn: {
    background: 'rgba(59,130,246,0.1)',
    border: 'none',
    color: '#3b82f6',
    borderRadius: 8,
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: 15,
    fontFamily: 'var(--font-header)',
    fontWeight: 'bold',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: 20,
  },
  gradeCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  gradeCardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(16,185,129,0.1)',
    border: '2px solid #10b981',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  scoreSub: {
    fontSize: 9,
    color: '#9ca3af',
  },
  badgeCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  date: {
    fontSize: 11,
    color: '#9ca3af',
  },
  taskTitle: {
    fontSize: 18,
    color: '#ffffff',
  },
  feedbackBox: {
    background: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
  },
  mockCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  mockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  driveTitle: {
    fontSize: 18,
    color: '#ffffff',
  },
  gradeBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  gradeCircle: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#1e293b',
    border: '2px solid #eab308',
    color: '#eab308',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  breakdown: {
    background: 'rgba(0,0,0,0.15)',
    padding: 16,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  breakdownHeader: {
    fontSize: 14,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 8,
    marginBottom: 4,
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    color: '#9ca3af',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 10,
    marginTop: 4,
    color: '#ffffff',
  }
};
