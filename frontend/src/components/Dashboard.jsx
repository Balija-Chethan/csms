import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, TrendingUp, Calendar, ClipboardList } from 'lucide-react';

export default function Dashboard({ data, refreshData, API_URL, token, setActiveTab }) {
  let { 
    student, 
    batch, 
    taskCompletion, 
    leaderboard, 
    attendance, 
    checkInState, 
    recentActivities,
    mockDrives,
    gradeTrend
  } = data || {};

  student = student || {};
  batch = batch || {};
  taskCompletion = taskCompletion || { doneRate: 0, completed: 0, pending: 0, notSubmitted: 0 };
  leaderboard = leaderboard || { rank: 'N/A' };
  attendance = attendance || { totalDays: 0, rate: 0, present: 0, leave: 0 };
  checkInState = checkInState || { isCheckedIn: false, isCheckedOut: false, sessionDuration: 0 };
  recentActivities = recentActivities || [];
  mockDrives = mockDrives || [];
  gradeTrend = gradeTrend || [];

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
          <span style={{ fontSize: 14, fontWeight: '600', fontFamily: 'var(--font-header)' }}>No graded tasks available</span>
          <span style={{ fontSize: 12, color: '#6b7280', marginTop: 4, maxWidth: 300 }}>Complete and get your first graded task to see your performance trend.</span>
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

    // Helper for smooth Bezier path
    const getBezierPath = (pts) => {
      if (pts.length < 2) return "";
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 2;
        const cpY1 = p0.y;
        const cpX2 = p0.x + (p1.x - p0.x) / 2;
        const cpY2 = p1.y;
        d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }
      return d;
    };

    // Build path for line
    let linePath = "";
    let areaPath = "";
    if (coords.length > 1) {
      linePath = getBezierPath(coords);
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
            <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          
          {/* Horizontal grid lines for 0%, 50%, 100% */}
          {[0, 50, 100].map(val => {
            const y = height - paddingY - (val / 100) * plotHeight;
            return (
              <g key={val}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <text x={paddingX - 8} y={y + 4} fill="#6b7280" fontSize="9" fontWeight="600" textAnchor="end">{val}%</text>
              </g>
            );
          })}

          {/* Fill Area (2+ points) */}
          {coords.length > 1 && (
            <path d={areaPath} fill="url(#chartGrad)" />
          )}

          {/* Connection Line (2+ points) */}
          {coords.length > 1 && (
            <path d={linePath} fill="none" stroke="url(#strokeGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Data points (circles & labels) */}
          {coords.map((c, idx) => (
            <g key={idx}>
              <circle cx={c.x} cy={c.y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
              <text x={c.x} y={c.y - 12} fill="#ffffff" fontSize="10" fontWeight="800" fontFamily="var(--font-mono)" textAnchor="middle">
                {Math.round(c.percentage)}%
              </text>
              <text x={c.x} y={height - 6} fill="#9ca3af" fontSize="9" fontWeight="600" textAnchor="middle" title={c.task_title}>
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
            <div style={styles.idBadge}>STUDENT PORTAL ID PASS (WORK FROM HOME)</div>
            <div style={styles.checkInStatus}>
              {checkInState.isCheckedOut ? (
                <span className="badge badge-danger">Checked Out</span>
              ) : checkInState.isCheckedIn ? (
                <span className="badge badge-success" style={{ textTransform: 'none' }}><span className="live-dot-inline"></span>Checked In</span>
              ) : (
                <span className="badge badge-warning">Offline</span>
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
                <span style={{ ...styles.idVal, fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)' }}>
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
                  background: (checkInState.isCheckedIn && !checkInState.isCheckedOut) 
                    ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' 
                    : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                  color: '#ffffff',
                  fontWeight: '700',
                  boxShadow: (checkInState.isCheckedIn && !checkInState.isCheckedOut)
                    ? '0 4px 12px rgba(239, 68, 68, 0.25)'
                    : '0 4px 12px rgba(16, 185, 129, 0.25)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
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
        <div className="glass-card interactive widget-task" style={styles.widget} onClick={() => setActiveTab('tasks')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>Task Completion</h3>
            <span style={styles.widgetSub}>Your progress overview</span>
          </div>
          <div style={styles.progressContainer}>
            <div style={styles.svgWrapper}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="taskProgressGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="60" cy="60" r={radius} 
                  stroke="url(#taskProgressGrad)" strokeWidth="8" 
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                />
                <text x="60" y="66" fill="#fff" fontSize="18" fontWeight="800" fontFamily="var(--font-header)" textAnchor="middle">
                  {Math.round(taskCompletion.doneRate)}%
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
        <div className="glass-card interactive widget-leaderboard" style={styles.widget} onClick={() => setActiveTab('leaderboard')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>Academic Standing</h3>
            <span style={styles.widgetSub}>Your active status</span>
          </div>
          <div style={styles.centeredCol}>
            <div style={styles.largeRank}>#{leaderboard.rank}</div>
            <p style={styles.motivateText}>Current Rank in Batch</p>
            <button className="btn-secondary" style={{ marginTop: 16, borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>Compare with peers</button>
          </div>
        </div>

        {/* Widget 3: Academic Insights */}
        <div className="glass-card interactive widget-performance" style={styles.widget} onClick={() => setActiveTab('grades')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>Performance Insights</h3>
            <span style={styles.widgetSub}>Real-time evaluations</span>
          </div>
          <div style={styles.insightsContent}>
            <div style={styles.insightRow}>
              <span>Avg Score:</span>
              <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>100%</strong>
            </div>
            <div style={styles.insightRow}>
              <span>Trend:</span>
              <strong style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                Improving <TrendingUp size={16} />
              </strong>
            </div>
            <div style={styles.insightRow}>
              <span>Total Grades:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{taskCompletion.completed} Total</strong>
            </div>
            <button className="btn-secondary" style={{ marginTop: 16, width: '100%', justifyContent: 'center', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
              View Academic Reports
            </button>
          </div>
        </div>

        {/* Widget 4: Mock Drives */}
        <div className="glass-card interactive widget-mock" style={styles.widget} onClick={() => setActiveTab('grades')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>Mock Placement Drives</h3>
            <span style={styles.widgetSub}>Aptitude & Technical</span>
          </div>
          {mockDrives && mockDrives.length > 0 ? (
            <div style={styles.insightsContent}>
              <div style={styles.insightRow}>
                <span>Latest Test:</span>
                <strong style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 150 }}>{mockDrives[0].test_name}</strong>
              </div>
              <div style={styles.insightRow}>
                <span>Total Score:</span>
                <strong style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                  {(mockDrives[0].total_score / 10).toFixed(1)}% (Grade: {mockDrives[0].grade})
                </strong>
              </div>
              <div style={styles.insightRow}>
                <span>Attempts:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{mockDrives.length} Attempt(s)</strong>
              </div>
              <button className="btn-secondary" style={{ marginTop: 16, width: '100%', justifyContent: 'center', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
                View Test Details
              </button>
            </div>
          ) : (
            <div style={styles.insightsContent}>
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontWeight: '500', fontSize: 13 }}>
                No attempts yet
              </div>
            </div>
          )}
        </div>

        {/* Widget 5: Attendance */}
        <div className="glass-card interactive widget-attendance" style={styles.widget} onClick={() => setActiveTab('attendance')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>Attendance Summary</h3>
            <span style={styles.widgetSub}>{attendance.totalDays} Days Tracked</span>
          </div>
          <div style={styles.insightsContent}>
            <div style={{ ...styles.largeRank, fontSize: 38, color: '#10b981', textAlign: 'center', margin: '8px 0', fontFamily: 'var(--font-header)' }}>
              {attendance.rate}%
            </div>
            <div style={styles.insightRow}>
              <span>Present:</span>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{attendance.present} Days</span>
            </div>
            <div style={styles.insightRow}>
              <span>Leaves Approved:</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{attendance.leave} Days</span>
            </div>
            <button className="btn-secondary" style={{ marginTop: 16, width: '100%', justifyContent: 'center', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
              View Full Attendance
            </button>
          </div>
        </div>

        {/* Widget 6: Active Batch */}
        <div className="glass-card interactive widget-analytics" style={styles.widget} onClick={() => setActiveTab('chat')}>
          <div style={styles.widgetHeader}>
            <h3 style={styles.widgetTitle}>My Active Batch</h3>
            <span style={styles.widgetSub}>Batch Group Room</span>
          </div>
          <div style={styles.insightsContent}>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#3b82f6', marginBottom: 6, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{batch.name}</div>
            <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 40, lineHeight: 1.5 }}>{batch.description}</p>
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
    gap: 32,
    width: '100%',
    position: 'relative',
    zIndex: 2,
  },
  topSection: {
    width: '100%',
  },
  idCard: {
    background: 'rgba(9, 13, 22, 0.45)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '24px',
    boxShadow: 'var(--shadow-lg), 0 0 40px rgba(59, 130, 246, 0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 18,
    marginBottom: 24,
    alignItems: 'center',
  },
  idBadge: {
    fontFamily: 'var(--font-header)',
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '1.5px',
    color: 'var(--primary)',
  },
  checkInStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  idContent: {
    display: 'flex',
    gap: 32,
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
    gap: 8,
    minWidth: 260,
  },
  studentName: {
    fontSize: 26,
    color: '#ffffff',
    fontFamily: 'var(--font-header)',
    fontWeight: 800,
    marginBottom: 6,
  },
  idRow: {
    display: 'flex',
    fontSize: 14,
  },
  idLabel: {
    width: 90,
    color: '#9ca3af',
    fontWeight: 500,
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
    gap: 24,
  },
  widget: {
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    borderRadius: '20px',
  },
  widgetHeader: {
    marginBottom: 16,
  },
  widgetTitle: {
    fontSize: 18,
    fontFamily: 'var(--font-header)',
    fontWeight: 700,
    color: '#ffffff',
  },
  widgetSub: {
    fontSize: 12,
    color: '#9ca3af',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  },
  svgWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
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
    padding: '8px 0',
  },
  largeRank: {
    fontSize: 54,
    fontFamily: 'var(--font-header)',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  motivateText: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  insightsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
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
    gap: 24,
    flexWrap: 'wrap',
    marginTop: 8,
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
    gap: 18,
  },
  activityItem: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--primary)',
    marginTop: 6,
    boxShadow: '0 0 8px var(--primary)',
  },
  activityInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  activityTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#ffffff',
  },
  activityDetail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityTime: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  }
};
