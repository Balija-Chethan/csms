import React, { useState, useEffect } from 'react';
import { ClipboardList, ExternalLink, Send, Check } from 'lucide-react';

export default function Tasks({ API_URL, token }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitUrl, setSubmitUrl] = useState({});
  const [submitting, setSubmitting] = useState({});

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/student/tasks/`, {
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
                  {task.submission.grade ? (
                    <span className="badge badge-success">Graded ({task.submission.grade})</span>
                  ) : (
                    <span className="badge badge-warning">Awaiting Review</span>
                  )}
                </div>
                <div style={styles.subLinkRow}>
                  <a href={task.submission.github_url} target="_blank" rel="noopener noreferrer" style={styles.extLink}>
                    View Submitted Work <ExternalLink size={14} />
                  </a>
                </div>
                {task.submission.feedback && (
                  <div style={styles.feedbackBox}>
                    <strong>Feedback:</strong> {task.submission.feedback}
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
    gap: 24,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: '#ffffff',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: 20,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    color: '#ffffff',
  },
  desc: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 1.6,
    flex: 1,
    marginBottom: 16,
    padding: 12,
    background: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
  },
  dueDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 16,
  },
  submitSection: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 16,
  },
  subStatus: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
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
    color: '#3b82f6',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  feedbackBox: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    color: '#d1d5db',
  }
};
