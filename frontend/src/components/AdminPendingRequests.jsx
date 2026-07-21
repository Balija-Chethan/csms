import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, XCircle, Clock, Search, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminPendingRequests({ API_URL, token }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/pending-requests/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch pending batch requests");
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionId(id);
    setActionMsg(null);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/approve/${id}/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve request");

      setActionMsg(`Approved successfully! Student allocated to batch.`);
      setRequests(requests.filter(r => r.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    setActionId(id);
    setActionMsg(null);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/reject/${id}/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject request");

      setActionMsg(`Batch request rejected.`);
      setRequests(requests.filter(r => r.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    const term = searchTerm.toLowerCase();
    const name = (r.student_name || '').toLowerCase();
    const email = (r.student_email || '').toLowerCase();
    const roll = (r.student_roll || '').toLowerCase();
    const batch = (r.batch_name || '').toLowerCase();
    return name.includes(term) || email.includes(term) || roll.includes(term) || batch.includes(term);
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Pending Batch Requests
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
            Review, approve, or reject new student requests for training batch allocation.
          </p>
        </div>

        <button
          onClick={fetchPendingRequests}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: '1px solid #334155',
            background: '#1e293b',
            color: '#cbd5e1',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <RefreshCw size={16} />
          Refresh List
        </button>
      </div>

      {actionMsg && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#86efac', padding: '12px 18px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} />
          <span>{actionMsg}</span>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '12px 18px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search by student name, email, roll number, or requested batch..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 46px',
            borderRadius: 12,
            border: '1px solid #334155',
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '0.95rem',
            outline: 'none'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <h3>Loading pending batch requests...</h3>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 16,
          padding: '48px 24px',
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          <Clock size={40} color="#64748b" style={{ marginBottom: 12 }} />
          <h3>No Pending Batch Requests</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem' }}>
            All student batch requests have been processed.
          </p>
        </div>
      ) : (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '16px 20px' }}>Student Name</th>
                <th style={{ padding: '16px 20px' }}>Email</th>
                <th style={{ padding: '16px 20px' }}>Roll Number</th>
                <th style={{ padding: '16px 20px' }}>Requested Batch</th>
                <th style={{ padding: '16px 20px' }}>Requested Date</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const isProcessing = actionId === req.id;
                const reqDate = req.requested_at || req.joined_at;
                const formattedDate = reqDate ? new Date(reqDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f8fafc' }}>
                      {req.student_name || 'N/A'}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#cbd5e1' }}>
                      {req.student_email || 'N/A'}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#818cf8', fontWeight: 500 }}>
                      {req.student_roll || 'N/A'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        background: 'rgba(99, 102, 241, 0.15)', 
                        color: '#818cf8', 
                        padding: '4px 12px', 
                        borderRadius: 20, 
                        fontWeight: 600, 
                        fontSize: '0.85rem' 
                      }}>
                        {req.batch_name || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '0.88rem' }}>
                      {formattedDate}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleApprove(req.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <CheckCircle2 size={16} />
                          Approve
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleReject(req.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#fca5a5',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
