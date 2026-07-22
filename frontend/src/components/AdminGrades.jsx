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
        grades[sub.id] = sub.obtained_marks !== null ? sub.obtained_marks.toString() : '';
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

  const handleAction = async (submissionId, actionType, extraData = {}) => {
    setGrading(prev => ({ ...prev, [submissionId]: true }));
    try {
      const body = { submissionId, action: actionType, ...extraData };
      const res = await fetch(`${API_URL}/admin/grade-submission/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetchSubmissions();
      alert(data.status || 'Operation successful!');
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
                  {sub.evaluation_status === 'grading' ? (
                    <span className="badge badge-warning">Auto Grading...</span>
                  ) : sub.evaluation_status === 'completed' || sub.grade ? (
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', margin: '12px 0', fontSize: 13, background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 8 }}>
                <div>Max Marks: <strong style={{ color: '#ffffff' }}>{sub.task_max_marks || 10}</strong></div>
                <div>Obtained Marks: <strong style={{ color: '#ffffff' }}>{sub.obtained_marks !== null ? sub.obtained_marks : 'N/A'}</strong></div>
                <div>Quality Score: <strong style={{ color: '#60a5fa' }}>{sub.quality_score !== null ? `${sub.quality_score}%` : 'N/A'}</strong></div>
                <div>Evaluation Status: 
                  <strong style={{ marginLeft: 6, color: sub.evaluation_status === 'completed' ? '#10b981' : '#f59e0b' }}>
                    {sub.evaluation_status ? sub.evaluation_status.toUpperCase() : 'PENDING'}
                  </strong>
                </div>
                {sub.is_approved && (
                  <div style={{ gridColumn: '1 / -1', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <CheckCircle2 size={12} /> Marks Approved
                  </div>
                )}
              </div>

              <div style={styles.gradingSection}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => handleAction(sub.id, 'approve')}
                    disabled={sub.is_approved || grading[sub.id] || sub.evaluation_status !== 'completed'}
                    style={{ flex: 1, fontSize: 12, padding: '8px 4px', justifyContent: 'center' }}
                  >
                    Approve Marks
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => handleAction(sub.id, 'reevaluate')}
                    disabled={grading[sub.id]}
                    style={{ flex: 1, fontSize: 12, padding: '8px 4px', justifyContent: 'center' }}
                  >
                    Re-evaluate
                  </button>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                  <label style={styles.label}>Override Marks (Out of {sub.task_max_marks || 10})</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <input 
                      type="number" 
                      className="custom-input" 
                      placeholder="e.g. 8"
                      value={gradeInput[sub.id] || ''}
                      onChange={e => setGradeInput(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      style={{ width: 80 }}
                    />
                    <span style={{ color: '#9ca3af', fontSize: 14 }}>/ {sub.task_max_marks || 10}</span>
                  </div>
                </div>

                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Feedback Comments</label>
                  <textarea 
                    className="custom-input" 
                    placeholder="Provide evaluation notes..."
                    value={feedbackInput[sub.id] || ''}
                    onChange={e => setFeedbackInput(prev => ({ ...prev, [sub.id]: e.target.value }))}
                    style={{ minHeight: 60, resize: 'vertical' }}
                  />
                </div>

                <button 
                  className="btn-primary" 
                  onClick={() => handleAction(sub.id, 'override', { obtainedMarks: gradeInput[sub.id], feedback: feedbackInput[sub.id] })}
                  disabled={grading[sub.id]}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                >
                  <Send size={14} /> {grading[sub.id] ? 'Saving...' : 'Override Marks'}
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
