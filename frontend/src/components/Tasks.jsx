import React, { useState, useEffect } from 'react';
import { ClipboardList, ExternalLink, Send, Check } from 'lucide-react';

export default function Tasks({ API_URL, token }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitUrl, setSubmitUrl] = useState({});
  const [submitting, setSubmitting] = useState({});

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/student/tasks/?_cb=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Dynamic polling for pending/grading submissions
  useEffect(() => {
    if (!tasks || !Array.isArray(tasks)) return;
    const hasPendingOrGrading = tasks.some(task => 
      task.submission && 
      (task.submission.evaluation_status === 'pending' || task.submission.evaluation_status === 'grading')
    );

    if (hasPendingOrGrading) {
      const timer = setTimeout(() => {
        fetchTasks();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [tasks]);

  const handleSubmit = async (taskId) => {
    const url = submitUrl[taskId];
    if (!url) return alert('Please enter a GitHub URL');

    setSubmitting(prev => ({ ...prev, [taskId]: true }));
    try {
      const res = await fetch(`${API_URL}/student/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskId, githubUrl: url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Task submitted successfully!');
      fetchTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(prev => ({ ...prev, [taskId]: false }));
    }
  };

  if (loading) return <div style={{ color: '#fff' }}>Loading tasks...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>
        <ClipboardList size={28} style={{ color: '#3b82f6' }} /> My Assigned Tasks
      </h2>
      <div style={styles.grid}>
        {tasks.map(task => (
          <div key={task.id} className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.title}>{task.title}</h3>
              <span className="badge badge-warning" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                {task.batch_name || 'Batch Task'}
              </span>
            </div>
            
            <div style={styles.desc}>
              <div style={{ whiteSpace: 'pre-line' }}>{task.description}</div>
            </div>

            <div style={styles.dueDate}>Due Date: {task.due_date}</div>

            {task.submission ? (
              <div style={styles.subStatus}>
                <div style={styles.statusRow}>
                  <span>Status: </span>
                  {task.submission.evaluation_status === 'grading' ? (
                    <span className="badge badge-warning">Auto Grading...</span>
                  ) : task.submission.evaluation_status === 'completed' || task.submission.grade ? (
                    <span className="badge badge-success">Graded ({task.submission.grade})</span>
                  ) : (
                    <span className="badge badge-warning">Awaiting Review</span>
                  )}
                </div>
                
                {task.submission.evaluation_status === 'completed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#9ca3af', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                    {task.submission.quality_score !== null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Quality Score:</span>
                        <strong style={{ color: '#60a5fa' }}>{task.submission.quality_score}%</strong>
                      </div>
                    )}
                    {task.submission.evaluation_time && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Evaluation Date:</span>
                        <strong>{new Date(task.submission.evaluation_time).toLocaleDateString()}</strong>
                      </div>
                    )}
                  </div>
                )}

                <div style={styles.subLinkRow}>
                  <a href={task.submission.github_url} target="_blank" rel="noopener noreferrer" style={styles.extLink}>
                    View Submitted Work <ExternalLink size={14} />
                  </a>
                </div>
                {task.submission.feedback && (
                  <div style={styles.feedbackBox}>
                    <strong>Auto-Grading Report:</strong>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: 6, maxHeight: 150, overflowY: 'auto', fontSize: 12, lineHeight: 1.5 }}>
                      {task.submission.feedback}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.submitSection}>
                <input 
                  type="url" 
                  className="custom-input" 
                  placeholder="https://github.com/yourusername/repo"
                  value={submitUrl[task.id] || ''}
                  onChange={e => setSubmitUrl(prev => ({ ...prev, [task.id]: e.target.value }))}
                  style={{ marginBottom: 12 }}
                />
                <button 
                  className="btn-primary" 
                  onClick={() => handleSubmit(task.id)}
                  disabled={submitting[task.id]}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {submitting[task.id] ? 'Submitting...' : 'Submit Task'}
                  <Send size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    position: 'relative',
    zIndex: 2,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: '#ffffff',
    fontFamily: 'var(--font-header)',
    fontSize: 26,
    fontWeight: 800,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: 24,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'var(--font-header)',
    fontWeight: 700,
    color: '#ffffff',
  },
  desc: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 1.6,
    flex: 1,
    marginBottom: 20,
    padding: '16px',
    background: 'rgba(3, 7, 18, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
  },
  dueDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 20,
  },
  submitSection: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 20,
  },
  subStatus: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
  },
  subLinkRow: {
    fontSize: 13,
  },
  extLink: {
    color: '#60a5fa',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: '600',
  },
  feedbackBox: {
    background: 'rgba(3, 7, 18, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: 14,
    fontSize: 13,
    color: '#d1d5db',
  }
};
