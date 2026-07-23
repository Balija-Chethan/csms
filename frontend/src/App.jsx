import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  LayoutDashboard, BookOpen, BarChart3, Users, 
  Settings, LogOut, ChevronDown, ChevronRight, ClipboardList, Clock, ShieldAlert, Award, Menu
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <button 
              className="mobile-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px 8px 4px 0',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Menu size={24} />
            </button>
            <img src="/logo.jpg" alt="CSMS Logo" style={{ height: 40, width: 'auto', borderRadius: 6, objectFit: 'contain' }} />
            <div style={styles.logo}>CSMS</div>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div className="live-online-pill" style={{ marginRight: 16 }}>
            <span className="live-dot"></span>
            <span style={{ fontSize: 12, fontWeight: '700', color: '#10b981' }}>
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
        {/* Sidebar Panel overlay on mobile */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        {/* Sidebar Panel */}
        <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`} style={styles.sidebar}>
          <div style={styles.sidebarBrand}>
            <img src="/logo.jpg" alt="CSMS Logo" style={styles.sidebarLogo} />
            <span style={styles.sidebarBrandText}>CSMS</span>
          </div>
          <nav style={styles.nav}>
            {isAdmin ? (
              // ADMIN SIDEBAR NAVIGATION
              <>
                <button 
                  className={activeTab === 'admin_dashboard' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('admin_dashboard'); setSidebarOpen(false); }}
                >
                  <LayoutDashboard size={18} />
                  Admin Workspace
                </button>

                <button 
                  className={activeTab === 'admin_pending_requests' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('admin_pending_requests'); setSidebarOpen(false); }}
                >
                  <Clock size={18} />
                  Pending Requests
                </button>

                <button 
                  className={activeTab === 'admin_allocation' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('admin_allocation'); setSidebarOpen(false); }}
                >
                  <Users size={18} />
                  Batch Allocation
                </button>

                <button 
                  className={activeTab === 'admin_users' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('admin_users'); setSidebarOpen(false); }}
                >
                  <Users size={18} />
                  User Directory
                </button>

                <button 
                  className={activeTab === 'admin_tasks' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('admin_tasks'); setSidebarOpen(false); }}
                >
                  <ClipboardList size={18} />
                  Tasks & LeetCode
                </button>

                <button 
                  className={activeTab === 'admin_grades' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('admin_grades'); setSidebarOpen(false); }}
                >
                  <Award size={18} />
                  Grade Submissions
                </button>

                <button 
                  className={activeTab === 'admin_mock_results' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('admin_mock_results'); setSidebarOpen(false); }}
                >
                  <Award size={18} />
                  Placement Scores
                </button>

                <button 
                  className={activeTab === 'admin_notes' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('admin_notes'); setSidebarOpen(false); }}
                >
                  <BookOpen size={18} />
                  Notes Manager
                </button>

                <button 
                  className={activeTab === 'admin_placement_prep' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('admin_placement_prep'); setSidebarOpen(false); }}
                >
                  <BookOpen size={18} />
                  Prep Manager
                </button>

                <button 
                  className={activeTab === 'admin_leaves' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('admin_leaves'); setSidebarOpen(false); }}
                >
                  <ShieldAlert size={18} />
                  Audit Leaves
                </button>

                <button 
                  className={activeTab === 'admin_attendance' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('admin_attendance'); setSidebarOpen(false); }}
                >
                  <Clock size={18} />
                  Attendance Audit
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
                        className={activeTab === 'admin_change_password' ? "nav-btn-active" : "nav-btn"}
                        style={{ paddingLeft: 24 }}
                        onClick={() => { setActiveTab('admin_change_password'); setSidebarOpen(false); }}
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
                  className={activeTab === 'dashboard' ? "nav-btn-active" : "nav-btn"}
                  onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
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
                            className={activeTab === 'tasks' ? "nav-btn-active" : "nav-btn"}
                            style={{ paddingLeft: 24 }}
                            onClick={() => { setActiveTab('tasks'); setSidebarOpen(false); }}
                          >
                            My Tasks
                          </button>
                          <button 
                            className={activeTab === 'leetcode' ? "nav-btn-active" : "nav-btn"}
                            style={{ paddingLeft: 24 }}
                            onClick={() => { setActiveTab('leetcode'); setSidebarOpen(false); }}
                          >
                            LeetCode Challenges
                          </button>
                          <button 
                            className={activeTab === 'notes' ? "nav-btn-active" : "nav-btn"}
                            style={{ paddingLeft: 24 }}
                            onClick={() => { setActiveTab('notes'); setSidebarOpen(false); }}
                          >
                            Study Notes
                          </button>
                          <button 
                            className={activeTab === 'placement_prep' ? "nav-btn-active" : "nav-btn"}
                            style={{ paddingLeft: 24 }}
                            onClick={() => { setActiveTab('placement_prep'); setSidebarOpen(false); }}
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
                            className={activeTab === 'grades' ? "nav-btn-active" : "nav-btn"}
                            style={{ paddingLeft: 24 }}
                            onClick={() => { setActiveTab('grades'); setSidebarOpen(false); }}
                          >
                            My Grades & Mocks
                          </button>
                          <button 
                            className={activeTab === 'leaderboard' ? "nav-btn-active" : "nav-btn"}
                            style={{ paddingLeft: 24 }}
                            onClick={() => { setActiveTab('leaderboard'); setSidebarOpen(false); }}
                          >
                            Leaderboard
                          </button>
                          <button 
                            className={activeTab === 'attendance' ? "nav-btn-active" : "nav-btn"}
                            style={{ paddingLeft: 24 }}
                            onClick={() => { setActiveTab('attendance'); setSidebarOpen(false); }}
                          >
                            Attendance Tracker
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Chat */}
                    <button 
                      className={activeTab === 'chat' ? "nav-btn-active" : "nav-btn"}
                      onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }}
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
                          className={activeTab === 'leaves' ? "nav-btn-active" : "nav-btn"}
                          style={{ paddingLeft: 24 }}
                          onClick={() => { setActiveTab('leaves'); setSidebarOpen(false); }}
                        >
                          Leave Application
                        </button>
                      )}
                      <button 
                        className={activeTab === 'profile' ? "nav-btn-active" : "nav-btn"}
                        style={{ paddingLeft: 24 }}
                        onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
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
    display: 'flex',
    flexDirection: 'column',
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
    paddingLeft: 0,
    marginTop: 4,
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
    transition: 'all 0.2s',
  },
  contentPane: {
    flex: 1,
    padding: '32px 24px',
    overflowY: 'auto',
    height: 'calc(100vh - 72px)',
    position: 'relative',
    zIndex: 2,
  }
};
