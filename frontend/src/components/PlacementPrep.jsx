import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowRight, ExternalLink, Download, X, HelpCircle, FileText } from 'lucide-react';

export default function PlacementPrep({ API_URL, token }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);

  useEffect(() => {
    const fetchPlacementData = async () => {
      try {
        const res = await fetch(`${API_URL}/student/placement-prep/?_cb=${Date.now()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setCompanies(data);
      } catch (err) {
        console.error("Error loading placement guides:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlacementData();
  }, []);

  const handleOpenCompany = (comp) => {
    setSelectedCompany(comp);
    setActiveRoundIndex(0); // Default to first round
  };

  const handleClose = () => {
    setSelectedCompany(null);
  };

  if (loading) return <div style={{ color: '#fff' }}>Loading placement guides...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.header}>
            <Briefcase size={28} style={{ color: '#3b82f6', verticalAlign: 'middle', marginRight: 8 }} /> Company Placement Prep
          </h2>
          <p style={styles.subheader}>
            Access selection rounds structures, guidelines, and previous year mock question papers for top IT recruitment drives.
          </p>
        </div>
      </div>

      {/* Grid of Companies */}
      <div style={styles.grid}>
        {companies.map(comp => (
          <div 
            key={comp.id} 
            className="glass-card interactive" 
            style={styles.card}
            onClick={() => handleOpenCompany(comp)}
          >
            <div style={styles.cardHeader}>
              <div style={styles.logoBadge}>
                <img 
                  src={comp.logo_url} 
                  alt={comp.name} 
                  style={{ width: 44, height: 44, borderRadius: 8 }} 
                />
              </div>
              <div>
                <h3 style={styles.companyName}>{comp.name}</h3>
                <span style={styles.roundsCount}>{comp.rounds ? comp.rounds.length : 0} Selection Rounds</span>
              </div>
            </div>
            <p style={styles.companyDesc}>{comp.description}</p>
            <div style={styles.cardFooter}>
              <span>Explore Guides</span>
              <ArrowRight size={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal Overlay */}
      {selectedCompany && (
        <div style={styles.modalOverlay} onClick={handleClose}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <img 
                  src={selectedCompany.logo_url} 
                  alt={selectedCompany.name} 
                  style={{ width: 56, height: 56, borderRadius: 12 }} 
                />
                <div>
                  <h2 style={styles.modalTitle}>{selectedCompany.name} Placement Syllabus</h2>
                  <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 2 }}>{selectedCompany.name} Recruitment Drive Preparation</p>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Content layout */}
            <div style={styles.modalBody}>
              {/* Left sidebar: Timeline stepper */}
              <div style={styles.timelineCol}>
                <h4 style={styles.colHeader}>Selection Pipeline</h4>
                <div style={styles.timelineList}>
                  {selectedCompany.rounds.map((rnd, idx) => (
                    <button 
                      key={rnd.id}
                      style={idx === activeRoundIndex ? styles.timelineItemActive : styles.timelineItem}
                      onClick={() => setActiveRoundIndex(idx)}
                    >
                      <div style={{ 
                        ...styles.timelineDot,
                        backgroundColor: idx === activeRoundIndex ? '#3b82f6' : 'rgba(255,255,255,0.1)'
                      }}>
                        {rnd.round_num}
                      </div>
                      <div style={styles.timelineInfo}>
                        <span style={styles.timelineTitle}>{rnd.title}</span>
                        <span style={styles.timelineSubtitle}>Round {rnd.round_num}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right content: Round Details & Sample Questions */}
              <div style={styles.detailsCol}>
                {selectedCompany.rounds[activeRoundIndex] ? (
                  <>
                    <div style={styles.roundBanner}>
                      <h3 style={styles.roundTitle}>
                        Round {selectedCompany.rounds[activeRoundIndex].round_num}: {selectedCompany.rounds[activeRoundIndex].title}
                      </h3>
                      <p style={styles.roundDescText}>
                        {selectedCompany.rounds[activeRoundIndex].description}
                      </p>
                    </div>

                    {/* Resources & Question papers list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <h4 style={styles.sectionHeader}>
                        <FileText size={18} style={{ color: '#3b82f6' }} /> Question Papers & Study Material
                      </h4>
                      {selectedCompany.rounds[activeRoundIndex].resources && selectedCompany.rounds[activeRoundIndex].resources.map(res => (
                        <div key={res.id} style={styles.resourceCard}>
                          <div style={styles.resInfo}>
                            <h4 style={styles.resTitle}>{res.title}</h4>
                            {res.file_url && (
                              <a 
                                href={res.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={styles.downloadBtn}
                              >
                                <Download size={14} /> Download PDF previous papers
                              </a>
                            )}
                          </div>
                          
                          {/* Sample questions rendering */}
                          {res.sample_questions && (
                            <div style={styles.questionsContainer}>
                              <div style={styles.questionsHeader}>
                                <HelpCircle size={16} style={{ color: '#10b981' }} /> Previous Year Sample Questions
                              </div>
                              <div style={styles.questionsText}>
                                {res.sample_questions.split('\n').map((line, lIdx) => (
                                  <div key={lIdx} style={{ marginBottom: 6, whiteSpace: 'pre-wrap' }}>{line}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#9ca3af', textAlign: 'center', padding: 48 }}>
                    No rounds guidelines uploaded for this stage.
                  </div>
                )}
              </div>
            </div>
          </div>
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
    width: '100%',
  },
  headerRow: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 20,
  },
  header: {
    color: '#ffffff',
    fontSize: 26,
    marginBottom: 6,
  },
  subheader: {
    color: '#9ca3af',
    fontSize: 14,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  logoBadge: {
    background: 'rgba(255,255,255,0.02)',
    padding: 6,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  companyName: {
    fontSize: 18,
    color: '#ffffff',
  },
  roundsCount: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: 'bold',
    marginTop: 2,
    display: 'block',
  },
  companyDesc: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 1.5,
    flex: 1,
    marginBottom: 16,
  },
  cardFooter: {
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 960,
    height: '80vh',
    background: '#0d1321',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  modalTitle: {
    fontSize: 20,
    color: '#ffffff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: 4,
  },
  modalBody: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  timelineCol: {
    width: 240,
    borderRight: '1px solid rgba(255,255,255,0.06)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflowY: 'auto',
  },
  colHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'none',
    border: 'none',
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  timelineItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(59,130,246,0.1)',
    border: 'none',
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  timelineTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  timelineSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  detailsCol: {
    flex: 1,
    padding: 24,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  roundBanner: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 20,
  },
  roundTitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 10,
  },
  roundDescText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 1.6,
  },
  sectionHeader: {
    fontSize: 16,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  resourceCard: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  resInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  resTitle: {
    fontSize: 15,
    color: '#ffffff',
  },
  downloadBtn: {
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 6,
    color: '#10b981',
    padding: '6px 12px',
    fontSize: 12,
    textDecoration: 'none',
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
  },
  questionsContainer: {
    background: '#090b11',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: 16,
  },
  questionsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: 8,
  },
  questionsText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#e5e7eb',
    lineHeight: 1.6,
  }
};
