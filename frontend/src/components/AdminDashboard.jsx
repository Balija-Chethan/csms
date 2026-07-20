import React, { useState, useEffect } from 'react';
import { Users, BookOpen, ClipboardList, ShieldAlert } from 'lucide-react';

export default function AdminDashboard({ API_URL, token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/stats/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ color: '#fff' }}>Loading Admin stats...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.welcomeRow}>
        <h2 style={styles.header}>CSMS Admin Control Workspace</h2>
        <p style={styles.subheader}>Monitor batch allocations, manage course tasks, grade submissions, and review leave requests.</p>
      </div>

      <div style={styles.grid}>
        <div className="glass-card" style={styles.card}>
          <Users size={32} style={{ color: '#3b82f6' }} />
          <div>
            <div style={styles.statVal}>{stats.totalStudents}</div>
            <div style={styles.statLabel}>Total Students Registered</div>
          </div>
        </div>

        <div className="glass-card" style={styles.card}>
          <BookOpen size={32} style={{ color: '#10b981' }} />
          <div>
            <div style={styles.statVal}>{stats.activeBatches}</div>
            <div style={styles.statLabel}>Active Course Batches</div>
          </div>
        </div>

        <div className="glass-card" style={styles.card}>
          <ClipboardList size={32} style={{ color: '#f59e0b' }} />
          <div>
            <div style={styles.statVal}>{stats.pendingGrades}</div>
            <div style={styles.statLabel}>Submissions to Grade</div>
          </div>
        </div>

        <div className="glass-card" style={styles.card}>
          <ShieldAlert size={32} style={{ color: '#ef4444' }} />
          <div>
            <div style={styles.statVal}>{stats.pendingLeaves}</div>
            <div style={styles.statLabel}>Pending Leave Applications</div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={styles.infoBanner}>
        <h3>College Portal Administrator Rules</h3>
        <ul style={{ marginLeft: 20, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li><strong>Student Onboarding</strong>: Newly signed up accounts start in a pending unassigned state. You must allocate them to a training batch (e.g., Python-FSD) under the **Batch Allocation** tab before they can access worksheets.</li>
          <li><strong>Attendance check-in auditing</strong>: Check-in records are tracked dynamically. Logs can be downloaded and monitored under **Attendance Logs**.</li>
          <li><strong>Task Grading and Review</strong>: View submissions directly using student GitHub links, grade scores, and provide written developer feedback.</li>
        </ul>
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
  welcomeRow: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 20,
  },
  header: {
    fontSize: 26,
    color: '#ffffff',
    marginBottom: 6,
  },
  subheader: {
    fontSize: 14,
    color: '#9ca3af',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 20,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  statVal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  infoBanner: {
    padding: 32,
    color: '#d1d5db',
    lineHeight: 1.6,
  }
};
