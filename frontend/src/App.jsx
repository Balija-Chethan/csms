import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  LayoutDashboard, BookOpen, BarChart3, Users, 
  Settings, LogOut, ChevronDown, ChevronRight, ClipboardList, Clock, ShieldAlert, Award
} from 'lucide-react';

const Login = lazy(() => import('./components/Login'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Tasks = lazy(() => import('./components/Tasks'));
const LeetCode = lazy(() => import('./components/LeetCode'));
const Notes = lazy(() => import('./components/Notes'));
const Grades = lazy(() => import('./components/Grades'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const Attendance = lazy(() => import('./components/Attendance'));
const Leaves = lazy(() => import('./components/Leaves'));
const Chat = lazy(() => import('./components/Chat'));
const Profile = lazy(() => import('./components/Profile'));
const PlacementPrep = lazy(() => import('./components/PlacementPrep'));

// Admin components
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminAllocation = lazy(() => import('./components/AdminAllocation'));
const AdminTasks = lazy(() => import('./components/AdminTasks'));
const AdminGrades = lazy(() => import('./components/AdminGrades'));
const AdminLeaves = lazy(() => import('./components/AdminLeaves'));
const AdminAttendance = lazy(() => import('./components/AdminAttendance'));
const AdminNotes = lazy(() => import('./components/AdminNotes'));
const AdminMockResults = lazy(() => import('./components/AdminMockResults'));
const AdminPlacementPrep = lazy(() => import('./components/AdminPlacementPrep'));
const AdminUsers = lazy(() => import('./components/AdminUsers'));
const AdminChangePassword = lazy(() => import('./components/AdminChangePassword'));

// Student Onboarding components
const BatchSelection = lazy(() => import('./components/BatchSelection'));
const PendingApproval = lazy(() => import('./components/PendingApproval'));
const RejectedBatch = lazy(() => import('./components/RejectedBatch'));
const AdminPendingRequests = lazy(() => import('./components/AdminPendingRequests'));

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? "http://127.0.0.1:8000/api" : "/api");

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('csms_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('csms_user')));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [onlineStudents, setOnlineStudents] = useState(1);

  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState(null);

  const fetchEnrollmentStatus = async () => {
    if (!token || !user || user.role === 'admin') return;
    try {
      const res = await fetch(`${API_URL}/student/enrollment/?_cb=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEnrollmentStatus(data.status);
        setEnrollmentData(data.enrollment);
      }
    } catch (err) {
      console.error("Error fetching enrollment status:", err);
    }
  };

  useEffect(() => {
    if (token && user && user.role !== 'admin') {
      fetchEnrollmentStatus();
    }
  }, [token, user]);

  // Periodic heartbeat for live activity tracking
  useEffect(() => {
    if (!token) return;
    const sendHeartbeat = async () => {
      try {
        const res = await fetch(`${API_URL}/student/heartbeat/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.onlineStudents) {
          setOnlineStudents(data.onlineStudents);
        }
      } catch (err) {
        // silent catch
      }
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(interval);
  }, [token]);

  // Sidebar collapsibles
  const [learningOpen, setLearningOpen] = useState(true);
  const [performanceOpen, setPerformanceOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(true);

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/student/dashboard/?_cb=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
    return (
      <Suspense fallback={
        <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#fff' }}>
          <h2>Loading Portal...</h2>
        </div>
      }>
        <Login setAuth={setAuth} API_URL={API_URL} />
      </Suspense>
    );
  }

  if (loading && !dashboardData) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#fff', flexDirection: 'column', gap: 20 }}>
        <img src="/logo.jpg" alt="CSMS Logo" style={{ height: 80, width: 'auto', borderRadius: 12, objectFit: 'contain' }} />
        <h2 style={{ fontSize: 20, fontFamily: 'var(--font-header)' }}>Loading CSMS Portal...</h2>
      </div>
    );
  }

  if (user.role !== 'admin' && enrollmentStatus === null) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#fff', flexDirection: 'column', gap: 20 }}>
        <img src="/logo.jpg" alt="CSMS Logo" style={{ height: 80, width: 'auto', borderRadius: 12, objectFit: 'contain' }} />
        <h2 style={{ fontSize: 20, fontFamily: 'var(--font-header)' }}>Loading CSMS Portal...</h2>
      </div>
    );
  }

  if (!dashboardData && user.role !== 'admin') {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.jpg" alt="CSMS Logo" style={{ height: 40, width: 'auto', borderRadius: 6, objectFit: 'contain' }} />
            <div style={styles.logo}>CSMS</div>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div className="live-online-pill">
            <span className="live-dot"></span>
            <span style={{ fontSize: 12, fontWeight: '700', color: '#34d399' }}>
              {onlineStudents} Online
            </span>
          </div>

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
          <div style={styles.sidebarBrand}>
            <img src="/logo.jpg" alt="CSMS Logo" style={styles.sidebarLogo} />
            <span style={styles.sidebarBrandText}>CSMS</span>
          </div>
          <nav style={styles.nav}>
            {isAdmin ? (
              // ADMIN SIDEBAR NAVIGATION
              <>
                <button 
                  style={activeTab === 'admin_dashboard' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_dashboard')}
                >
                  <LayoutDashboard size={18} />
                  Admin Workspace
                </button>

                <button 
                  style={activeTab === 'admin_pending_requests' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_pending_requests')}
                >
                  <Clock size={18} />
                  Pending Batch Requests
                </button>

                <button 
                  style={activeTab === 'admin_allocation' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_allocation')}
                >
                  <Users size={18} />
                  Batch Allocation
                </button>

                <button 
                  style={activeTab === 'admin_users' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_users')}
                >
                  <Users size={18} />
                  User & Student Directory
                </button>

                <button 
                  style={activeTab === 'admin_tasks' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_tasks')}
                >
                  <ClipboardList size={18} />
                  Tasks & 10-Day LeetCode
                </button>

                <button 
                  style={activeTab === 'admin_grades' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_grades')}
                >
                  <Award size={18} />
                  Grade Submissions
                </button>

                <button 
                  style={activeTab === 'admin_mock_results' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_mock_results')}
                >
                  <Award size={18} />
                  Mock Placement Scores
                </button>

                <button 
                  style={activeTab === 'admin_notes' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_notes')}
                >
                  <BookOpen size={18} />
                  Study Notes Manager
                </button>

                <button 
                  style={activeTab === 'admin_placement_prep' ? styles.navItemActive : styles.navItem}
                  onClick={() => setActiveTab('admin_placement_prep')}
                >
                  <BookOpen size={18} />
                  Placement Prep Manager
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
                  Attendance Logs Audit
                </button>

                {/* Admin Account Settings */}
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
                      <button 
                        style={activeTab === 'admin_change_password' ? styles.subItemActive : styles.subItem}
                        onClick={() => setActiveTab('admin_change_password')}
                      >
                        🔐 Change Password
                      </button>
                    </div>
                  )}
                </div>
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

                {dashboardData?.status === 'allocated' && (
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
                      {dashboardData?.status === 'allocated' && (
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
            <Suspense fallback={
              <div style={{ display: 'flex', height: '100%', minHeight: '300px', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }}></div>
                <span>Loading view...</span>
              </div>
            }>
              {isAdmin ? (
                // ADMIN CONTENT ROUTING
                <>
                  {activeTab === 'admin_dashboard' && <AdminDashboard API_URL={API_URL} token={token} />}
                  {activeTab === 'admin_pending_requests' && <AdminPendingRequests API_URL={API_URL} token={token} />}
                  {activeTab === 'admin_allocation' && <AdminAllocation API_URL={API_URL} token={token} />}
                  {activeTab === 'admin_users' && <AdminUsers API_URL={API_URL} token={token} />}
                  {activeTab === 'admin_tasks' && <AdminTasks API_URL={API_URL} token={token} />}
                  {activeTab === 'admin_grades' && <AdminGrades API_URL={API_URL} token={token} />}
                  {activeTab === 'admin_mock_results' && <AdminMockResults API_URL={API_URL} token={token} />}
                  {activeTab === 'admin_notes' && <AdminNotes API_URL={API_URL} token={token} />}
                  {activeTab === 'admin_placement_prep' && <AdminPlacementPrep API_URL={API_URL} token={token} />}
                  {activeTab === 'admin_leaves' && <AdminLeaves API_URL={API_URL} token={token} />}
                  {activeTab === 'admin_attendance' && <AdminAttendance API_URL={API_URL} token={token} />}
                  {activeTab === 'admin_change_password' && <AdminChangePassword API_URL={API_URL} token={token} handleLogout={handleLogout} />}
                </>

              ) : (
                // STUDENT CONTENT ROUTING
                <>
                  {enrollmentStatus === 'no_enrollment' ? (
                    <BatchSelection 
                      API_URL={API_URL} 
                      token={token} 
                      onEnrollmentRequested={() => {
                        fetchEnrollmentStatus();
                        fetchDashboardData();
                      }} 
                    />
                  ) : enrollmentStatus === 'pending' ? (
                    <PendingApproval 
                      enrollment={enrollmentData} 
                      onRefresh={() => {
                        fetchEnrollmentStatus();
                        fetchDashboardData();
                      }} 
                    />
                  ) : enrollmentStatus === 'rejected' ? (
                    <RejectedBatch 
                      enrollment={enrollmentData} 
                      onChooseNewBatch={() => setEnrollmentStatus('no_enrollment')} 
                    />
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
                      {activeTab === 'chat' && <Chat API_URL={API_URL} token={token} batchName={dashboardData?.batch?.name || "Batch"} />}
                      {activeTab === 'profile' && (
                        <Profile 
                          studentData={dashboardData?.student || user} 
                          token={token} 
                          API_URL={API_URL} 
                          refreshUserData={refreshUserData} 
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </Suspense>
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
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 8px 16px 8px',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: 16,
  },
  sidebarLogo: {
    height: 36,
    width: 'auto',
    borderRadius: 6,
    objectFit: 'contain',
  },
  sidebarBrandText: {
    fontFamily: 'var(--font-header)',
    fontSize: 18,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.05em',
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
