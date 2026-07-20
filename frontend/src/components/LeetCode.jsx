import React, { useState, useEffect } from 'react';
import { Award, Flame, ExternalLink, Send } from 'lucide-react';

export default function LeetCode({ API_URL, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitUrl, setSubmitUrl] = useState({});
  const [submitting, setSubmitting] = useState({});

  const fetchLeetcodeData = async () => {
    try {
      const res = await fetch(`${API_URL}/student/leetcode/`, {
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

  useEffect(() => {
    fetchLeetcodeData();
  }, []);

  const handleSubmit = async (challengeId) => {
    const url = submitUrl[challengeId];
    if (!url) return alert('Please enter your submission URL');

    setSubmitting(prev => ({ ...prev, [challengeId]: true }));
    try {
      const res = await fetch(`${API_URL}/student/leetcode/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ challengeId, submissionUrl: url })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      alert('Leetcode solution submitted successfully!');
      fetchLeetcodeData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(prev => ({ ...prev, [challengeId]: false }));
    }
  };

  if (loading || !data) return <div style={{ color: '#fff' }}>Loading LeetCode challenge logs...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.statsRow}>
        <div className="glass-card" style={styles.statCard}>
          <Flame size={32} style={{ color: '#ef4444' }} />
          <div>
            <div style={styles.statVal}>{data.streak} Days</div>
            <div style={styles.statLabel}>Current Streak</div>
          </div>
        </div>
        <div className="glass-card" style={styles.statCard}>
          <Award size={32} style={{ color: '#eab308' }} />
          <div>
            <div style={styles.statVal}>{data.solved} Solved</div>
            <div style={styles.statLabel}>Problems Completed</div>
          </div>
        </div>
      </div>

      <h2 style={styles.header}>Daily LeetCode Challenges</h2>

      <div style={styles.grid}>
        {data.challenges.map(ch => (
          <div key={ch.id} className="glass-card" style={styles.card}>
            <h3 style={styles.title}>{ch.title}</h3>
            
            <a href={ch.url} target="_blank" rel="noopener noreferrer" style={styles.problemLink}>
              View Problem on LeetCode <ExternalLink size={14} />
            </a>

            <div style={styles.deadline}>Deadline: {new Date(ch.deadline).toLocaleString()}</div>

            {ch.submission ? (
              <div style={styles.subStatus}>
                <span className="badge badge-success">Completed</span>
                <a href={ch.submission.submission_url} target="_blank" rel="noopener noreferrer" style={styles.subLink}>
                  View Submission <ExternalLink size={12} />
                </a>
              </div>
            ) : (
              <div style={styles.submitSection}>
                <input 
                  type="url" 
                  className="custom-input" 
                  placeholder="https://leetcode.com/problems/.../submissions/..."
                  value={submitUrl[ch.id] || ''}
                  onChange={e => setSubmitUrl(prev => ({ ...prev, [ch.id]: e.target.value }))}
                  style={{ marginBottom: 12 }}
                />
                <button 
                  className="btn-primary" 
                  onClick={() => handleSubmit(ch.id)}
                  disabled={submitting[ch.id]}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {submitting[ch.id] ? 'Submitting...' : 'Submit Leetcode URL'}
                  <Send size={14} />
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
  statsRow: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    minWidth: 200,
  },
  statVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  header: {
    color: '#ffffff',
    fontSize: 22,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 8,
  },
  problemLink: {
    color: '#3b82f6',
    fontSize: 13,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  deadline: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subLink: {
    color: '#9ca3af',
    fontSize: 12,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  }
};
