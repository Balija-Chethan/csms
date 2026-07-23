import React, { useState, useEffect } from 'react';
import { Award, Flame, ExternalLink, Send, Lock, CheckCircle2, Calendar, Users, Sparkles } from 'lucide-react';

export default function LeetCode({ API_URL, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitUrl, setSubmitUrl] = useState({});
  const [submitting, setSubmitting] = useState({});

  const fetchLeetcodeData = async () => {
    try {
      const res = await fetch(`${API_URL}/student/leetcode/?_cb=${Date.now()}`, {
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

  const getLockMessage = (availDateStr) => {
    try {
      const availDate = new Date(availDateStr);
      const today = new Date();
      availDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      const diffTime = availDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return "Unlocks in 1 day";
      } else if (diffDays > 1 && diffDays <= 7) {
        return `Unlocks in ${diffDays} days`;
      } else {
        const options = { month: 'long', day: 'numeric' };
        return `Available on ${availDate.toLocaleDateString('en-US', options)}`;
      }
    } catch (err) {
      return `Unlocks on ${availDateStr}`;
    }
  };

  if (loading || !data) return <div style={{ color: '#fff', padding: 24 }}>Loading LeetCode challenge logs & 10-day roadmap...</div>;

  const todayChallenge = data.challenges.find(c => c.is_today || (c.is_unlocked && !c.submission));

  return (
    <div style={styles.container}>
      {/* Top Metrics Row */}
      <div style={styles.statsRow}>
        <div className="glass-card glow-card-red" style={styles.statCard}>
          <Flame size={32} style={{ color: '#ef4444' }} />
          <div>
            <div style={styles.statVal}>{data.streak} Days</div>
            <div style={styles.statLabel}>Current Coding Streak</div>
          </div>
        </div>
        <div className="glass-card glow-card-gold" style={styles.statCard}>
          <Award size={32} style={{ color: '#eab308' }} />
          <div>
            <div style={styles.statVal}>{data.solved} / {data.challenges.length} Solved</div>
            <div style={styles.statLabel}>Total Problems Completed</div>
          </div>
        </div>
        <div className="glass-card glow-card-blue" style={styles.statCard}>
          <Users size={32} style={{ color: '#3b82f6' }} />
          <div>
            <div style={styles.statVal}>
              <span className="live-dot-inline"></span> {data.onlineStudents || 1} Online
            </div>
            <div style={styles.statLabel}>Active Peers Concurrent</div>
          </div>
        </div>
      </div>

      {/* Spotlight Header Banner for Today's Unlocked Problem */}
      {todayChallenge && (
        <div className="glass-card spotlight-card" style={styles.spotlightCard}>
          <div style={styles.spotlightHeader}>
            <div className="spotlight-tag">
              <Sparkles size={14} /> TODAY'S ACTIVE CHALLENGE (1 CODE / DAY)
            </div>
            <span className="badge badge-success">Unlocked Today</span>
          </div>

          <h2 style={styles.spotlightTitle}>Day {todayChallenge.day_number}: {todayChallenge.title}</h2>
          
          <p style={styles.spotlightSub}>
            Complete today's coding problem to maintain your daily streak. Submissions close at midnight.
          </p>

          <div style={styles.spotlightActions}>
            {todayChallenge.url && (
              <a href={todayChallenge.url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none' }}>
                Open Problem on LeetCode <ExternalLink size={16} />
              </a>
            )}

            {todayChallenge.submission ? (
              <div style={styles.completedBanner}>
                <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                <span>Submitted: Ready for Evaluation</span>
                <a href={todayChallenge.submission.submission_url} target="_blank" rel="noopener noreferrer" style={styles.subLinkInline}>
                  View Solution Link <ExternalLink size={14} />
                </a>
              </div>
            ) : (
              <div style={styles.spotlightInputGroup}>
                <input 
                  type="url" 
                  className="custom-input" 
                  placeholder="Paste LeetCode submission URL (e.g. https://leetcode.com/submissions/...)"
                  value={submitUrl[todayChallenge.id] || ''}
                  onChange={e => setSubmitUrl(prev => ({ ...prev, [todayChallenge.id]: e.target.value }))}
                  style={{ flex: 1 }}
                />
                <button 
                  className="btn-primary" 
                  onClick={() => handleSubmit(todayChallenge.id)}
                  disabled={submitting[todayChallenge.id]}
                >
                  <Send size={16} />
                  {submitting[todayChallenge.id] ? 'Submitting...' : 'Submit Code'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10-Day Curriculum Roadmap Grid */}
      <div>
        <h3 style={styles.sectionTitle}>
          <Calendar size={20} style={{ color: '#3b82f6', verticalAlign: 'middle', marginRight: 8 }} />
          10-Day LeetCode Release Roadmap
        </h3>
        <p style={styles.sectionSubtitle}>
          Challenges are released strictly 1 problem per day. Future days remain locked until their scheduled date.
        </p>

        <div className="leetcode-grid">
          {data.challenges.map(ch => {
            const isCompleted = !!ch.submission;
            const isUnlocked = ch.is_unlocked;
            const isToday = ch.is_today;

            return (
              <div 
                key={ch.id} 
                className={`leetcode-card ${
                  isToday ? 'active-today-border' : ''
                } ${
                  isCompleted ? 'completed-border' : (!isUnlocked ? 'locked-border' : '')
                }`}
              >
                {/* Header Row */}
                <div className="leetcode-card-header">
                  <span 
                    className={`day-badge ${isUnlocked ? 'day-badge-open' : 'day-badge-locked'}`} 
                    style={{ 
                      background: isUnlocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(75, 85, 99, 0.15)', 
                      color: isUnlocked ? '#10b981' : '#9ca3af',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    Day {ch.day_number}
                  </span>
                  
                  {isCompleted ? (
                    <span className="badge badge-success" style={{ fontWeight: 'bold' }}>
                      <CheckCircle2 size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Solved
                    </span>
                  ) : isUnlocked ? (
                    <span className="badge badge-warning" style={{ fontWeight: 'bold' }}>Active</span>
                  ) : (
                    <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 'bold' }}>
                      <Lock size={12} /> Locked
                    </span>
                  )}
                </div>

                {/* Problem Title */}
                <h4 className="leetcode-card-title" title={ch.title}>
                  {ch.title}
                </h4>

                {/* Middle Content Section */}
                <div className="leetcode-card-content">
                  <div className="leetcode-card-middle">
                    {!isUnlocked ? (
                      /* Locked Card Middle Content */
                      <div style={inlineStyles.centeredMiddle}>
                        <div style={inlineStyles.lockIconContainer}>
                          <Lock size={28} style={{ color: '#9ca3af' }} />
                        </div>
                        <div style={inlineStyles.unlockCountdown}>
                          {getLockMessage(ch.available_date)}
                        </div>
                        <div style={inlineStyles.helperTextCenter}>
                          1 problem released per day
                        </div>
                      </div>
                    ) : (
                      /* Unlocked Card Middle Content */
                      <>
                        <a 
                          href={ch.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={inlineStyles.problemLink}
                          onMouseEnter={e => e.target.style.color = '#60a5fa'}
                          onMouseLeave={e => e.target.style.color = '#3b82f6'}
                        >
                          View on LeetCode <ExternalLink size={13} />
                        </a>
                        
                        <div style={inlineStyles.dateMeta}>
                          Available Since: {ch.available_date}
                        </div>
                        
                        <div style={isCompleted ? inlineStyles.helperTextSuccess : inlineStyles.helperTextMuted}>
                          {isCompleted ? 'Solved & Submitted' : 'Enter submission URL below'}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Bottom Action Area (Inputs & Buttons) */}
                  <div className="leetcode-card-bottom">
                    {!isUnlocked ? (
                      /* Locked Button */
                      <button className="leetcode-btn" disabled style={inlineStyles.lockedButton}>
                        <Lock size={14} /> Locked
                      </button>
                    ) : isCompleted ? (
                      /* Completed Form & Button */
                      <>
                        <input 
                          type="url" 
                          className="custom-input leetcode-input" 
                          value={ch.submission.submission_url} 
                          disabled 
                          style={{ opacity: 0.5, cursor: 'not-allowed', backgroundColor: 'rgba(255,255,255,0.03)' }}
                        />
                        <button className="leetcode-btn" disabled style={inlineStyles.completedButton}>
                          <CheckCircle2 size={14} style={{ color: '#10b981' }} /> Solved
                        </button>
                      </>
                    ) : (
                      /* Active Form & Button */
                      <>
                        <input 
                          type="url" 
                          className="custom-input leetcode-input" 
                          placeholder="Paste LeetCode submission URL..."
                          value={submitUrl[ch.id] || ''}
                          onChange={e => setSubmitUrl(prev => ({ ...prev, [ch.id]: e.target.value }))}
                        />
                        <button 
                          className="btn-primary leetcode-btn" 
                          onClick={() => handleSubmit(ch.id)}
                          disabled={submitting[ch.id]}
                        >
                          <span>{submitting[ch.id] ? 'Submitting...' : 'Submit URL'}</span>
                          <Send size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
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
    minWidth: 220,
    padding: 20,
  },
  statVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  spotlightCard: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    boxShadow: '0 0 25px rgba(59, 130, 246, 0.15)',
    padding: 28,
    borderRadius: 16,
  },
  spotlightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  spotlightTitle: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  spotlightSub: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
  },
  spotlightActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  spotlightInputGroup: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  completedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    padding: '12px 18px',
    borderRadius: 10,
    color: '#ffffff',
  },
  subLinkInline: {
    color: '#60a5fa',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    marginLeft: 'auto',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: 20,
    position: 'relative',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 1.4,
  },
  problemLink: {
    color: '#3b82f6',
    fontSize: 13,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  dateMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 14,
  },
  submitSection: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 14,
    marginTop: 'auto',
  },
  subStatus: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 14,
    marginTop: 'auto',
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
  },
  lockedBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    border: '1px dashed rgba(255,255,255,0.1)',
    marginTop: 'auto',
  },
  lockMsg: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#d1d5db',
    marginTop: 4,
  },
  lockSubMsg: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  }
};

const inlineStyles = {
  centeredMiddle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    width: '100%',
  },
  lockIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    marginBottom: '12px',
  },
  unlockCountdown: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '4px',
  },
  helperTextCenter: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  problemLink: {
    color: '#3b82f6',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '8px',
    transition: 'color 0.2s ease',
  },
  dateMeta: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  helperTextMuted: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '8px',
  },
  helperTextSuccess: {
    fontSize: '12px',
    color: '#34d399',
    fontWeight: '600',
    marginTop: '8px',
  },
  lockedButton: {
    backgroundColor: 'rgba(75, 85, 99, 0.1)',
    color: '#9ca3af',
    border: '1px solid rgba(255,255,255,0.05)',
    cursor: 'not-allowed',
  },
  completedButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    cursor: 'not-allowed',
  }
};

