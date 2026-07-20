import React, { useState, useEffect } from 'react';
import { Award, ExternalLink, MessageSquare, Send } from 'lucide-react';

export default function AdminGrades({ API_URL, token }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
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
      
      // Initialize inputs
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
    const feedback = feedbackInput[submissionId];
    if (!grade) return alert('Please enter a grade score (e.g. 10/10)');

    setGrading(prev => ({ ...prev, [submissionId]: true }));
    try {
      const res = await fetch(`${API_URL}/admin/grade-submission/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submissionId, grade, feedback })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Submission graded successfully!');
      fetchSubmissions();
    } catch (err) {
      alert(err.message);
    } finally {
      setGrading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  if (loading) return <div style={{ color: '#fff' }}>Loading student submissions...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>
        <Award size={28} style={{ color: '#3b82f6' }} /> Grade Submissions
      </h2>
      <p style={styles.subheader}>
        Review student task uploads, verify coding links on GitHub, assign grades, and input developer feedback.
      </p>

      {submissions.length === 0 ? (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
          <h3>No submissions logged yet</h3>
          <p style={{ color: '#9ca3af', marginTop: 8 }}>Tasks assigned to active batches have not received uploads.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {submissions.map(sub => (
            <div key={sub.id} className="glass-card" style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.taskTitle}>{sub.task_title}</h3>
                  <span style={styles.studentName}>{sub.student_name} ({sub.student_roll})</span>
                </div>
                <div>
                  {sub.grade ? (
                    <span className="badge badge-success">Graded ({sub.grade})</span>
                  ) : (
                    <span className="badge badge-warning">Pending Review</span>
                  )}
                </div>
              </div>

              <div style={styles.bodyRow}>
                <a href={sub.github_url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  View Student GitHub Code <ExternalLink size={14} />
                </a>
                <span style={styles.date}>Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</span>
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
                  <Send size={14} /> {grading[sub.id] ? 'Submitting grade...' : 'Save Grade & Feedback'}
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
  },
  subheader: {
    fontSize: 14,
    color: '#9ca3af',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 20,
    marginTop: -8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: 20,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitle: {
    fontSize: 18,
    color: '#ffffff',
  },
  studentName: {
    fontSize: 13,
    color: '#9ca3af',
    display: 'block',
    marginTop: 2,
  },
  bodyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    alignItems: 'center',
    background: 'rgba(0,0,0,0.15)',
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
