import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, BarChart3, Users, 
  Settings, LogOut, ChevronDown, ChevronRight, ClipboardList, Clock, ShieldAlert, Award
} from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import LeetCode from './components/LeetCode';
import Notes from './components/Notes';
import Grades from './components/Grades';
import Leaderboard from './components/Leaderboard';
import Attendance from './components/Attendance';
import Leaves from './components/Leaves';
import Chat from './components/Chat';
import Profile from './components/Profile';
import PlacementPrep from './components/PlacementPrep';

// Admin components
import AdminDashboard from './components/AdminDashboard';
import AdminAllocation from './components/AdminAllocation';
import AdminTasks from './components/AdminTasks';
import AdminGrades from './components/AdminGrades';
import AdminLeaves from './components/AdminLeaves';
import AdminAttendance from './components/AdminAttendance';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('csms_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('csms_user')));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sidebar collapsibles
  const [learningOpen, setLearningOpen] = useState(true);
  const [performanceOpen, setPerformanceOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(true);

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/student/dashboard/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setDashboardData(data);
      if (data.student) {
        setUser(data.student);
        localStorage.setItem('csms_user', JSON.stringify(data.student));
      }
    } catch (err) {
      console.error("Error fetching dashboard details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Set default tabs based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setActiveTab('admin_dashboard');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [user]);

  const setAuth = (userData, userToken) => {
    setDashboardData(null);
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('csms_token');
    localStorage.removeItem('csms_user');
    setToken(null);
    setUser(null);
    setDashboardData(null);
  };

  const refreshUserData = () => {
    fetchDashboardData();
  };

  if (!token) {
    return <Login setAuth={setAuth} API_URL={API_URL} />;
  }

  if (loading && !dashboardData) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#fff' }}>
        <h2>Loading CSMS Portal...</h2>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#fff', flexDirection: 'column', gap: 16 }}>
        <h2>Error loading dashboard. Verify API server is running.</h2>
        <button className="btn-primary" onClick={fetchDashboardData}>Retry Load</button>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="theme-default" style={styles.appContainer}>
      {/* Decorative animated cosmic background blobs & visual effects */}
      <div className="cosmic-bg">
        <div className="aurora-wave"></div>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
      </div>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>CSMS <span style={styles.logoVersion}>3.0</span></div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.profileShowcase}>
            <div className="avatar-container border-none" style={{ width: 36, height: 36 }}>
              <img 
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.first_name || 'Admin'}`} 
                alt="avatar" 
                className="avatar-image" 
              />
            </div>
            <div style={styles.showcaseNames}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 'bold', color: '#ffffff' }}>
                  {user.first_name} {user.last_name}
                </span>
                <span style={{ 
                  ...styles.roleTag, 
                  backgroundColor: isAdmin ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                  color: isAdmin ? '#f87171' : '#60a5fa'
                }}>
                  {user.role.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>
                {isAdmin ? 'System Coordinator' : `Roll: ${user.roll_number || 'N/A'}`}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div style={styles.bodyLayout}>
        {/* Sidebar Panel */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            {isAdmin ? (
              // ADMIN SIDEBAR NAVIGATION
              <>
                <button 
                  style={activeTab === 'admin_dashboard' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_dashboard')}
                >
                  <LayoutDashboard size={18} />
                  Admin Dashboard
                </button>
                <button 
                  style={activeTab === 'admin_allocation' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_allocation')}
                >
                  <Users size={18} />
                  Batch Allocation
                </button>
                <button 
                  style={activeTab === 'admin_tasks' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_tasks')}
                >
                  <ClipboardList size={18} />
                  Assign Course Tasks
                </button>
                <button 
                  style={activeTab === 'admin_grades' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_grades')}
                >
                  <Award size={18} />
                  Grade Submissions
                </button>
                <button 
                  style={activeTab === 'admin_leaves' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_leaves')}
                >
                  <ShieldAlert size={18} />
                  Audit Leave Requests
                </button>
                <button 
                  style={activeTab === 'admin_attendance' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_attendance')}
                >
                  <Clock size={18} />
                  Attendance Logs
                </button>
              </>
            ) : (
              // STUDENT SIDEBAR NAVIGATION
              <>
                <button 
                  style={activeTab === 'dashboard' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>

                {dashboardData.status === 'allocated' && (
                  <>
                    {/* Learning Submenu */}
                    <div>
                      <button style={styles.submenuHeader} onClick={() => setLearningOpen(!learningOpen)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <BookOpen size={18} />
                          <span>Learning</span>
                        </div>
                        {learningOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      
                      {learningOpen && (
                        <div style={styles.submenuItems}>
                          <button 
                            style={activeTab === 'tasks' ? styles.subItemActive : styles.subItem}
                            onClick={() => setActiveTab('tasks')}
                          >
                            My Tasks
                          </button>
                          <button 
                            style={activeTab === 'leetcode' ? styles.subItemActive : styles.subItem}
                            onClick={() => setActiveTab('leetcode')}
                          >
                            LeetCode Challenges
                          </button>
                          <button 
                            style={activeTab === 'notes' ? styles.subItemActive : styles.subItem}
                            onClick={() => setActiveTab('notes')}
                          >
                            Study Notes
                          </button>
                          <button 
                            style={activeTab === 'placement_prep' ? styles.subItemActive : styles.subItem}
                            onClick={() => setActiveTab('placement_prep')}
                          >
                            Placement Prep
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Performance Submenu */}
                    <div>
                      <button style={styles.submenuHeader} onClick={() => setPerformanceOpen(!performanceOpen)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <BarChart3 size={18} />
                          <span>Performance</span>
                        </div>
                        {performanceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      {performanceOpen && (
                        <div style={styles.submenuItems}>
                          <button 
                            style={activeTab === 'grades' ? styles.subItemActive : styles.subItem}
                            onClick={() => setActiveTab('grades')}
                          >
                            My Grades & Mocks
                          </button>
                          <button 
                            style={activeTab === 'leaderboard' ? styles.subItemActive : styles.subItem}
                            onClick={() => setActiveTab('leaderboard')}
                          >
                            Leaderboard
                          </button>
                          <button 
                            style={activeTab === 'attendance' ? styles.subItemActive : styles.subItem}
                            onClick={() => setActiveTab('attendance')}
                          >
                            Attendance Tracker
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Chat */}
                    <button 
                      style={activeTab === 'chat' ? styles.navItemActive : styles.navItem}
                      onClick={() => setActiveTab('chat')}
                    >
                      <Users size={18} />
                      Batch Group Chat
                    </button>
                  </>
                )}

                {/* Account Settings always accessible */}
                <div>
                  <button style={styles.submenuHeader} onClick={() => setAccountOpen(!accountOpen)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Settings size={18} />
                      <span>Account</span>
                    </div>
                    {accountOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {accountOpen && (
                    <div style={styles.submenuItems}>
                      {dashboardData.status === 'allocated' && (
                        <button 
                          style={activeTab === 'leaves' ? styles.subItemActive : styles.subItem}
                          onClick={() => setActiveTab('leaves')}
                        >
                          Leave Application
                        </button>
                      )}
                      <button 
                        style={activeTab === 'profile' ? styles.subItemActive : styles.subItem}
                        onClick={() => setActiveTab('profile')}
                      >
                        My Profile
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          <button style={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </aside>

        {/* Content Pane */}
        <main style={styles.contentPane}>
          <div key={activeTab} className="animate-fade-in" style={{ minHeight: '100%' }}>
            {isAdmin ? (
              // ADMIN CONTENT ROUTING
              <>
                {activeTab === 'admin_dashboard' && <AdminDashboard API_URL={API_URL} token={token} />}
                {activeTab === 'admin_allocation' && <AdminAllocation API_URL={API_URL} token={token} />}
                {activeTab === 'admin_tasks' && <AdminTasks API_URL={API_URL} token={token} />}
                {activeTab === 'admin_grades' && <AdminGrades API_URL={API_URL} token={token} />}
                {activeTab === 'admin_leaves' && <AdminLeaves API_URL={API_URL} token={token} />}
                {activeTab === 'admin_attendance' && <AdminAttendance API_URL={API_URL} token={token} />}
              </>
            ) : (
              // STUDENT CONTENT ROUTING
              <>
                {dashboardData.status === 'awaiting_allocation' ? (
                  <div className="glass-card" style={{ padding: 48, textAlign: 'center', maxWidth: 640, margin: '40px auto' }}>
                    <Users size={48} style={{ color: '#f59e0b', marginBottom: 20 }} />
                    <h2 style={{ marginBottom: 12 }}>Awaiting Batch Allocation</h2>
                    <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>
                      Your CSMS account has been successfully registered! However, you have not been allocated to a training batch group yet.
                    </p>
                    <p style={{ color: '#9ca3af', marginTop: 12 }}>
                      Please coordinate with your college administrator to approve your enrollment and assign you to a class batch (e.g. PYTHON-FSD) to unlock tasks, worksheets, and chat rooms.
                    </p>
                    <button className="btn-secondary" onClick={fetchDashboardData} style={{ marginTop: 24 }}>
                      Check Status Refresh
                    </button>
                  </div>
                ) : (
                  <>
                    {activeTab === 'dashboard' && (
                      <Dashboard 
                        data={dashboardData} 
                        refreshData={fetchDashboardData} 
                        API_URL={API_URL} 
                        token={token} 
                        setActiveTab={setActiveTab}
                      />
                    )}
                    {activeTab === 'tasks' && <Tasks API_URL={API_URL} token={token} />}
                    {activeTab === 'leetcode' && <LeetCode API_URL={API_URL} token={token} />}
                    {activeTab === 'notes' && <Notes API_URL={API_URL} token={token} />}
                    {activeTab === 'placement_prep' && <PlacementPrep API_URL={API_URL} token={token} />}
                    {activeTab === 'grades' && <Grades API_URL={API_URL} token={token} />}
                    {activeTab === 'leaderboard' && <Leaderboard API_URL={API_URL} token={token} />}
                    {activeTab === 'attendance' && <Attendance API_URL={API_URL} token={token} />}
                    {activeTab === 'leaves' && <Leaves API_URL={API_URL} token={token} />}
                    {activeTab === 'chat' && <Chat API_URL={API_URL} token={token} batchName={dashboardData.batch.name} />}
                    {activeTab === 'profile' && (
                      <Profile 
                        studentData={dashboardData.student} 
                        token={token} 
                        API_URL={API_URL} 
                        refreshUserData={refreshUserData} 
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100vw',
    background: 'var(--bg-main)',
    color: 'var(--text-main)',
    transition: 'background 0.3s ease',
  },
  header: {
    height: 72,
    borderBottom: '1px solid var(--border-color)',
    background: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'var(--font-header)',
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 1,
    color: '#ffffff',
  },
  logoVersion: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: 600,
    background: 'rgba(59,130,246,0.1)',
    padding: '2px 6px',
    borderRadius: 4,
    marginLeft: 4,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  profileShowcase: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  showcaseNames: {
    display: 'flex',
    flexDirection: 'column',
  },
  roleTag: {
    fontSize: 9,
    fontWeight: 'bold',
    padding: '1px 5px',
    borderRadius: 3,
    textTransform: 'uppercase',
  },
  bodyLayout: {
    display: 'flex',
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  sidebar: {
    width: 260,
    borderRight: '1px solid var(--border-color)',
    background: 'rgba(15, 23, 42, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 20,
    height: 'calc(100vh - 72px)',
    position: 'sticky',
    top: 72,
    overflowY: 'auto',
    '@media (max-width: 768px)': {
      display: 'none',
    }
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    width: '100%',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-header)',
    fontWeight: 600,
    fontSize: 14,
    transition: 'all 0.2s',
    '&:hover': {
      color: '#ffffff',
      background: 'rgba(255,255,255,0.03)',
    }
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--primary-glow)',
    border: 'none',
    color: 'var(--primary)',
    width: '100%',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-header)',
    fontWeight: 700,
    fontSize: 14,
  },
  submenuHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-header)',
    fontWeight: 600,
    fontSize: 14,
  },
  submenuItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    paddingLeft: 24,
    marginTop: 4,
  },
  subItem: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    width: '100%',
    textAlign: 'left',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.2s',
  },
  subItemActive: {
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: 'var(--primary)',
    width: '100%',
    textAlign: 'left',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 'bold',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'none',
    border: 'none',
    color: '#ef4444',
    width: '100%',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-header)',
    fontWeight: 600,
    fontSize: 14,
    marginTop: 20,
  },
  contentPane: {
    flex: 1,
    padding: 32,
    overflowY: 'auto',
    height: 'calc(100vh - 72px)',
  }
};
