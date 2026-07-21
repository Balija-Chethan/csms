import React, { useState, useEffect } from 'react';
import { BookOpen, UserCheck, Layers, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BatchSelection({ API_URL, token, onEnrollmentRequested }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/batches/`);
      if (!res.ok) throw new Error("Failed to fetch available batches");
      const data = await res.json();
      setBatches(data);
    } catch (err) {
      setError(err.message || "Error loading batches");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBatch = async (batchId) => {
    setSubmittingId(batchId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${API_URL}/batch/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ batch_id: batchId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit batch request");
      }
      setSuccessMsg("Your request has been sent to the administrator for approval.");
      if (onEnrollmentRequested) {
        setTimeout(() => {
          onEnrollmentRequested();
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', padding: '0 20px', color: '#f8fafc' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ 
          background: 'rgba(99, 102, 241, 0.15)', 
          color: '#818cf8', 
          padding: '6px 16px', 
          borderRadius: 20, 
          fontSize: '0.85rem', 
          fontWeight: 600,
          border: '1px solid rgba(99, 102, 241, 0.3)',
          letterSpacing: '0.5px'
        }}>
          STUDENT ONBOARDING
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 700, margin: '16px 0 10px 0', background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Select Your Training Batch
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: 650, margin: '0 auto' }}>
          Welcome to CSMS! Choose your specialized training batch below to request enrollment. Once approved by an administrator, you will get access to all batch tasks, notes, and dashboards.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '14px 18px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#86efac', padding: '14px 18px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <h3>Loading available batches...</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {batches.map((b) => {
            const seatsAvailable = Math.max(0, (b.max_seats || 60) - (b.enrolled_count || 0));
            const isSubmitting = submittingId === b.id;

            return (
              <div key={b.id} style={{
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                border: '1px solid #334155',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 12, 
                      background: 'rgba(99, 102, 241, 0.2)', 
                      color: '#818cf8', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <BookOpen size={22} />
                    </div>
                    <span style={{ 
                      background: 'rgba(30, 41, 59, 0.8)', 
                      border: '1px solid #475569', 
                      color: '#cbd5e1', 
                      fontSize: '0.78rem', 
                      padding: '4px 10px', 
                      borderRadius: 20 
                    }}>
                      {seatsAvailable} Seats Left
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
                    {b.name}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: 20 }}>
                    {b.description || "Comprehensive training program tailored for campus placements."}
                  </p>
                </div>

                <div>
                  <div style={{ 
                    borderTop: '1px solid #334155', 
                    paddingTop: 16, 
                    marginBottom: 20, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 8,
                    fontSize: '0.85rem',
                    color: '#cbd5e1'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserCheck size={16} color="#818cf8" />
                      <span>Trainer: <strong>{b.trainer_name || "Senior Instructor"}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Layers size={16} color="#818cf8" />
                      <span>Capacity: {b.enrolled_count || 0} / {b.max_seats || 60} Enrolled</span>
                    </div>
                  </div>

                  <button
                    disabled={isSubmitting}
                    onClick={() => handleJoinBatch(b.id)}
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'opacity 0.2s ease',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    {isSubmitting ? "Sending Request..." : "Join Batch"}
                    {!isSubmitting && <ArrowRight size={18} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
