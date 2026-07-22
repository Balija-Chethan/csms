import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, TrendingUp, Calendar, ClipboardList } from 'lucide-react';

export default function Dashboard({ data, refreshData, API_URL, token, setActiveTab }) {
  const { 
    student = {}, 
    batch = {}, 
    taskCompletion = { doneRate: 0, completed: 0, pending: 0, notSubmitted: 0 }, 
    leaderboard = { rank: 'N/A' }, 
    attendance = { totalDays: 0, rate: 0, present: 0, leave: 0 }, 
    checkInState = { isCheckedIn: false, isCheckedOut: false, sessionDuration: 0 }, 
    recentActivities = [],
    mockDrives = [],
    gradeTrend = []
  } = data || {};
  const [checkingIn, setCheckingIn] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(checkInState ? (checkInState.sessionDuration || 0) : 0);

  // Timer effect for check-in duration
  useEffect(() => {
    let interval = null;
    if (checkInState.isCheckedIn && !checkInState.isCheckedOut) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setTimerSeconds(checkInState.sessionDuration);
    }
    return () => clearInterval(interval);
  }, [checkInState.isCheckedIn, checkInState.isCheckedOut, checkInState.sessionDuration]);

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const renderChart = () => {
    const points = gradeTrend || [];
    if (points.length === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, color: '#9ca3af', textAlign: 'center', width: '100%' }}>
          <TrendingUp size={36} style={{ marginBottom: 12, color: '#4b5563' }} />
          <span style={{ fontSize: 14, fontWeight: '500' }}>No graded tasks available</span>
          <span style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Complete and get your first graded task to see your performance trend.</span>
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const paddingX = 45;
    const paddingY = 25;
    const plotWidth = width - 2 * paddingX;
    const plotHeight = height - 2 * paddingY;

    // Calculate coordinates
    const coords = points.map((p, idx) => {
      const x = points.length === 1 
        ? width / 2 
        : paddingX + (idx / (points.length - 1)) * plotWidth;
      const y = height - paddingY - (p.percentage / 100) * plotHeight;
      return { x, y, ...p };
    });

    // Build path for line
    let linePath = "";
    let areaPath = "";
    if (coords.length > 1) {
      linePath = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ");
      areaPath = linePath + ` L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`;
    }

    return (
      <div style={{ width: '100%', overflowX: 'auto', padding: '10px 0' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal grid lines for 0%, 50%, 100% */}
          {[0, 50, 100].map(val => {
            const y = height - paddingY - (val / 100) * plotHeight;
            return (
              <g key={val}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <text x={paddingX - 8} y={y + 4} fill="#6b7280" fontSize="9" textAnchor="end">{val}%</text>
              </g>
            );
          })}

          {/* Fill Area (2+ points) */}
          {coords.length > 1 && (
            <path d={areaPath} fill="url(#chartGrad)" />
          )}

          {/* Connection Line (2+ points) */}
          {coords.length > 1 && (
            <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Data points (circles & labels) */}
          {coords.map((c, idx) => (
            <g key={idx}>
              <circle cx={c.x} cy={c.y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <text x={c.x} y={c.y - 10} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                {Math.round(c.percentage)}%
              </text>
              <text x={c.x} y={height - 6} fill="#9ca3af" fontSize="9" textAnchor="middle" title={c.task_title}>
                T{idx + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const handleCheckInOut = async () => {
    setCheckingIn(true);
    const action = checkInState.isCheckedIn ? 'checkout' : 'checkin';
    try {
      const res = await fetch(`${API_URL}/student/checkin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      
      alert(resData.status);
      refreshData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (taskCompletion.doneRate / 100) * circumference;

  return (
    <div style={styles.container}>
      {/* Student ID Card */}
      <div style={styles.topSection}>
        <div className="glass-card" style={styles.idCard}>
          <div style={styles.cardHeader}>
            <div style={styles.idBadge}>STUDENT ID CARD (CSMS PORTAL, WFH)</div>
            <div style={styles.checkInStatus}>
              {checkInState.isCheckedOut ? (
                <span style={{ color: '#ef4444' }}>Checked Out</span>
              ) : checkInState.isCheckedIn ? (
                <span style={{ color: '#10b981' }}>● checked in</span>
              ) : (
                <span style={{ color: '#f59e0b' }}>Checked Out</span>
              )}
            </div>
          </div>
          
          <div style={styles.idContent}>
            <div style={styles.avatarWrapper}>
              <div className="avatar-container border-none" style={{ width: 88, height: 88 }}>
                <img 
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${student.first_name || 'Nichitha'}`} 
                  alt="avatar" 
                  className="avatar-image" 
                />
              </div>
            </div>

            <div style={styles.idDetails}>
              <h2 style={styles.studentName}>
                {student.first_name} {student.last_name}
              </h2>
              <div style={styles.idRow}>
                <span style={styles.idLabel}>Roll No:</span>
                <span style={styles.idVal}>{student.roll_number || 'N/A'}</span>
              </div>
              <div style={styles.idRow}>
                <span style={styles.idLabel}>Email:</span>
                <span style={styles.idVal}>{student.email}</span>
              </div>
              <div style={styles.idRow}>
                <span style={styles.idLabel}>Phone:</span>
                <span style={styles.idVal}>{student.phone_number || 'N/A'}</span>
              </div>
              <div style={styles.idRow}>
                <span style={styles.idLabel}>Duration:</span>
                <span style={{ ...styles.idVal, fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {formatTime(timerSeconds)}
                </span>
              </div>
            </div>

            <div style={styles.checkInAction}>
              <button 
                className="btn-primary" 
                onClick={handleCheckInOut} 
                disabled={checkingIn}
                style={{ 
                  backgroundColor: (checkInState.isCheckedIn && !checkInState.isCheckedOut) ? '#ef4444' : '#ffffff',
                  color: (checkInState.isCheckedIn && !checkInState.isCheckedOut) ? '#ffffff' : '#3b82f6',
                  fontWeight: 'bold',
                }}
              >
                <Clock size={16} />
                {checkingIn ? 'Processing...' : (checkInState.isCheckedIn && !checkInState.isCheckedOut) ? 'Check Out (WFH)' : 'Check In (WFH)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Dashboard Widgets */}
      <div style={styles.grid}>
        {/* Widget 1: Task Completion */}
        <div className="glass-card interactive" style={styles.widget} onClick={() => setActiveTab('tasks')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>Task Completion</h3>
            <span style={styles.widgetSub}>Your progress overview</span>
          </div>
          <div style={styles.progressContainer}>
            <div style={styles.svgWrapper}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="transparent" />
                <circle 
                  cx="60" cy="60" r={radius} 
                  stroke="#3b82f6" strokeWidth="10" 
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                <text x="60" y="65" fill="#fff" fontSize="18" fontWeight="bold" textAnchor="middle">
                  Done {taskCompletion.doneRate}%
                </text>
              </svg>
            </div>
            <div style={styles.statsCol}>
              <div style={styles.statLabel}>Completed: <strong style={{ color: '#10b981' }}>{taskCompletion.completed}</strong></div>
              <div style={styles.statLabel}>Pending Graded: <strong style={{ color: '#f59e0b' }}>{taskCompletion.pending}</strong></div>
              <div style={styles.statLabel}>Not Submitted: <strong style={{ color: '#ef4444' }}>{taskCompletion.notSubmitted}</strong></div>
            </div>
          </div>
        </div>

        {/* Widget 2: Leaderboard */}
        <div className="glass-card interactive" style={styles.widget} onClick={() => setActiveTab('leaderboard')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>Academic Standing</h3>
          </div>
          <div style={styles.centeredCol}>
            <div style={styles.largeRank}>#{leaderboard.rank}</div>
            <p style={styles.motivateText}>Current Rank in Batch</p>
            <button className="btn-secondary" style={{ marginTop: 16 }}>Compare with peers</button>
          </div>
        </div>

        {/* Widget 3: Academic Insights */}
        <div className="glass-card interactive" style={styles.widget} onClick={() => setActiveTab('grades')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>Performance Insights</h3>
          </div>
          <div style={styles.insightsContent}>
            <div style={styles.insightRow}>
              <span>Avg Score:</span>
              <strong style={{ color: '#10b981' }}>100%</strong>
            </div>
            <div style={styles.insightRow}>
              <span>Trend:</span>
              <strong style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                Improving <TrendingUp size={16} />
              </strong>
            </div>
            <div style={styles.insightRow}>
              <span>Total Grades:</span>
              <strong>{taskCompletion.completed} Total</strong>
            </div>
            <button className="btn-secondary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
              View Academic Reports
            </button>
          </div>
        </div>

        {/* Widget 4: Mock Drives */}
        <div className="glass-card interactive" style={styles.widget} onClick={() => setActiveTab('grades')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>Mock Placement Drives</h3>
          </div>
          {mockDrives && mockDrives.length > 0 ? (
            <div style={styles.insightsContent}>
              <div style={styles.insightRow}>
                <span>Latest Test:</span>
                <strong>{mockDrives[0].test_name}</strong>
              </div>
              <div style={styles.insightRow}>
                <span>Total Score:</span>
                <strong style={{ color: '#f59e0b' }}>
                  {(mockDrives[0].total_score / 10).toFixed(1)}% (Grade: {mockDrives[0].grade})
                </strong>
              </div>
              <div style={styles.insightRow}>
                <span>Attempts:</span>
                <strong>{mockDrives.length} Attempt(s)</strong>
              </div>
              <button className="btn-secondary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                View Test Details
              </button>
            </div>
          ) : (
            <div style={styles.insightsContent}>
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontWeight: '500' }}>
                No attempts yet
              </div>
            </div>
          )}
        </div>

        {/* Widget 5: Attendance */}
        <div className="glass-card interactive" style={styles.widget} onClick={() => setActiveTab('attendance')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>Attendance Summary</h3>
            <span style={styles.widgetSub}>{attendance.totalDays} Days Tracked</span>
          </div>
          <div style={styles.insightsContent}>
            <div style={{ ...styles.largeRank, fontSize: 36, color: '#10b981', textAlign: 'center', margin: '12px 0' }}>
              {attendance.rate}%
            </div>
            <div style={styles.insightRow}>
              <span>Present:</span>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>{attendance.present} Days</span>
            </div>
            <div style={styles.insightRow}>
              <span>Leaves Approved:</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{attendance.leave} Days</span>
            </div>
            <button className="btn-secondary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
              View Full Attendance
            </button>
          </div>
        </div>

        {/* Widget 6: Active Batch */}
        <div className="glass-card interactive" style={styles.widget} onClick={() => setActiveTab('chat')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>My Active Batch</h3>
          </div>
          <div style={styles.insightsContent}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6', marginBottom: 8 }}>{batch.name}</div>
            <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>{batch.description}</p>
            <div style={styles.insightRow}>
              <span>Status:</span>
              <span className="badge badge-success">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score History and Recent Activities Grid */}
      <div style={styles.bottomGrid}>
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: 20 }}>Score Grades Trend</h3>
          {renderChart()}
          {gradeTrend && gradeTrend.length > 0 && (
            <span style={{ fontSize: 12, color: '#9ca3af', marginTop: 12, display: 'block' }}>
              {gradeTrend.length === 1 
                ? "Performance trend from your first graded task."
                : `Performance trend across ${gradeTrend.length} graded tasks.`
              }
            </span>
          )}
        </div>

        <div className="glass-card" style={{ flex: 1 }}>
          <h3 style={{ marginBottom: 20 }}>Recent Activities</h3>
          <div style={styles.activitiesFeed}>
            {recentActivities.map((act, index) => (
              <div key={index} style={styles.activityItem}>
                <div style={styles.activityDot}></div>
                <div style={styles.activityInfo}>
                  <div style={styles.activityTitle}>{act.title}</div>
                  <div style={styles.activityDetail}>{act.detail}</div>
                  <div style={styles.activityTime}>{new Date(act.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
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
    width: '100%',
  },
  topSection: {
    width: '100%',
  },
  idCard: {
    background: 'linear-gradient(135deg, rgba(22, 28, 45, 0.9) 0%, rgba(14, 18, 30, 0.9) 100%)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  idBadge: {
    fontFamily: 'var(--font-header)',
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 1.5,
    color: '#3b82f6',
  },
  checkInStatus: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  idContent: {
    display: 'flex',
    gap: 24,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  avatarWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  idDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 260,
  },
  studentName: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 6,
  },
  idRow: {
    display: 'flex',
    fontSize: 14,
  },
  idLabel: {
    width: 90,
    color: '#9ca3af',
  },
  idVal: {
    color: '#ffffff',
  },
  checkInAction: {
    display: 'flex',
    alignItems: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  },
  widget: {
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
  },
  widgetHeader: {
    marginBottom: 16,
  },
  widgetTitle: {
    fontSize: 18,
    color: '#ffffff',
  },
  widgetSub: {
    fontSize: 12,
    color: '#9ca3af',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  svgWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#d1d5db',
  },
  centeredCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  largeRank: {
    fontSize: 48,
    fontFamily: 'var(--font-header)',
    fontWeight: 800,
    color: '#ffffff',
  },
  motivateText: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
  },
  insightsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  insightRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
  },
  bottomGrid: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
  },
  chartMock: {
    height: 140,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'flex-end',
    gap: 12,
    paddingBottom: 4,
  },
  activitiesFeed: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  activityItem: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#3b82f6',
    marginTop: 6,
    boxShadow: '0 0 8px #3b82f6',
  },
  activityInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  activityTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  activityDetail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityTime: {
    fontSize: 10,
    color: '#6b7280',
  }
};
