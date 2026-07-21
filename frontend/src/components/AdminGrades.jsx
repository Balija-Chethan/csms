import React, { useState, useEffect } from 'react';
import { Award, ExternalLink, Send, CheckCircle2, Filter } from 'lucide-react';

export default function AdminGrades({ API_URL, token }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'graded'
  const [gradeInput, setGradeInput] = useState({});
  const [feedbackInput, setFeedbackInput] = useState({});
  const [grading, setGrading] = useState({});

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/submissions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSubmissions(data);
      
      const grades = {};
      const feedbacks = {};
      data.forEach(sub => {
        grades[sub.id] = sub.grade || '';
        feedbacks[sub.id] = sub.feedback || '';
      });
      setGradeInput(grades);
      setFeedbackInput(feedbacks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleGrade = async (submissionId) => {
    const grade = gradeInput[submissionId];
    const feedback = feedbackInput[submissionId] || '';
    if (!grade || !grade.trim()) return alert('Please enter a grade score (e.g. 10/10)');

    setGrading(prev => ({ ...prev, [submissionId]: true }));
    try {
      const res = await fetch(`${API_URL}/admin/grade-submission/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submissionId, grade: grade.trim(), feedback: feedback.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Local state update for instant feedback
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, grade: grade.trim(), feedback: feedback.trim() } : s));
      alert('Submission graded successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setGrading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  if (loading) return <div style={{ color: '#fff', padding: 24 }}>Loading student submissions...</div>;

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'pending') return !sub.grade;
    if (filter === 'graded') return !!sub.grade;
    return true;
  });

  const pendingCount = submissions.filter(s => !s.grade).length;
  const gradedCount = submissions.filter(s => !!s.grade).length;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>
        <Award size={28} style={{ color: '#3b82f6' }} /> Grade Student Submissions
      </h2>
      <p style={styles.subheader}>
        Review student task uploads, verify GitHub repositories, award grades, and provide feedback.
      </p>

      {/* Filter Tabs */}
      <div style={styles.tabRow}>
        <button 
          style={filter === 'all' ? styles.tabActive : styles.tab}
          onClick={() => setFilter('all')}
        >
          All Submissions ({submissions.length})
        </button>
        <button 
          style={filter === 'pending' ? styles.tabActiveYellow : styles.tab}
          onClick={() => setFilter('pending')}
        >
          Pending Review ({pendingCount})
        </button>
        <button 
          style={filter === 'graded' ? styles.tabActiveGreen : styles.tab}
          onClick={() => setFilter('graded')}
        >
          Graded ({gradedCount})
        </button>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="glass-card" style={{ padding: 36, textAlign: 'center' }}>
          <h3>No submissions in this category</h3>
          <p style={{ color: '#9ca3af', marginTop: 8 }}>
            {filter === 'pending' ? 'All student submissions have been reviewed and graded!' : 'No student uploads recorded yet.'}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredSubmissions.map(sub => (
            <div key={sub.id} className="glass-card" style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.taskTitle}>{sub.task_title}</h3>
                  <span style={styles.studentName}>
                    {sub.student_name || 'Student'} ({sub.student_roll || 'No Roll'})
                  </span>
                </div>
                <div>
                  {sub.grade ? (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> Graded ({sub.grade})
                    </span>
                  ) : (
                    <span className="badge badge-warning">Pending Review</span>
                  )}
                </div>
              </div>

              <div style={styles.bodyRow}>
                <a href={sub.github_url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  View GitHub Code <ExternalLink size={14} />
                </a>
                <span style={styles.date}>Uploaded: {new Date(sub.submitted_at).toLocaleDateString()}</span>
              </div>

              <div style={styles.gradingSection}>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Award Grade (e.g. 10/10, 5/5)</label>
                  <input 
                    type="text" 
                    className="custom-input" 
                    placeholder="10/10"
                    value={gradeInput[sub.id] || ''}
                    onChange={e => setGradeInput(prev => ({ ...prev, [sub.id]: e.target.value }))}
                  />
                </div>

                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Feedback Comments</label>
                  <textarea 
                    className="custom-input" 
                    placeholder="Good modular styling, clean code..."
                    value={feedbackInput[sub.id] || ''}
                    onChange={e => setFeedbackInput(prev => ({ ...prev, [sub.id]: e.target.value }))}
                    style={{ minHeight: 60, resize: 'vertical' }}
                  />
                </div>

                <button 
                  className="btn-primary" 
                  onClick={() => handleGrade(sub.id)}
                  disabled={grading[sub.id]}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                >
                  <Send size={14} /> {grading[sub.id] ? 'Saving...' : 'Save Grade & Feedback'}
                </button>
              </div>
            </div>
          ))}
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
  tabRow: {
    display: 'flex',
    gap: 10,
    background: 'rgba(255,255,255,0.02)',
    padding: 6,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  tab: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    padding: '10px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 13,
    transition: 'all 0.2s',
  },
  tabActive: {
    flex: 1,
    background: 'rgba(59, 130, 246, 0.15)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#3b82f6',
    padding: '10px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tabActiveYellow: {
    flex: 1,
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    color: '#fbbf24',
    padding: '10px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tabActiveGreen: {
    flex: 1,
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    padding: '10px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 13,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 20,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 20,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitle: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  studentName: {
    fontSize: 13,
    color: '#9ca3af',
    display: 'block',
    marginTop: 3,
  },
  bodyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    alignItems: 'center',
    background: 'rgba(0,0,0,0.18)',
    padding: 12,
    borderRadius: 8,
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 'bold',
  },
  date: {
    color: '#9ca3af',
    fontSize: 12,
  },
  gradingSection: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#d1d5db',
    fontWeight: 'bold',
  }
};
