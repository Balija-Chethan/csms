import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, BookOpen } from 'lucide-react';

export default function AdminAllocation({ API_URL, token }) {
  const [data, setData] = useState({ pending: [], unassigned: [], batches: [] });
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState({});
  const [selectedBatch, setSelectedBatch] = useState({});

  // Batch creation states
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchDesc, setNewBatchDesc] = useState('');
  const [creatingBatch, setCreatingBatch] = useState(false);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    setCreatingBatch(true);
    try {
      const res = await fetch(`${API_URL}/admin/create-batch/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newBatchName.trim(),
          description: newBatchDesc.trim()
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create batch');

      alert(resData.status || 'Batch created successfully!');
      setNewBatchName('');
      setNewBatchDesc('');
      fetchAllocationData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingBatch(false);
    }
  };

  const fetchAllocationData = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/pending-students/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      setData(resData);
      
      // Pre-select first batch for each student
      if (resData.batches.length > 0) {
        const initialSelected = {};
        resData.unassigned.forEach(s => {
          initialSelected[s.id] = resData.batches[0].id;
        });
        resData.pending.forEach(s => {
          initialSelected[s.student] = s.batch;
        });
        setSelectedBatch(initialSelected);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocationData();
  }, []);

  const handleAllocate = async (studentId, batchId, action = 'approved') => {
    if (!batchId) return alert('Please select a batch first');
    
    setAllocating(prev => ({ ...prev, [studentId]: true }));
    try {
      const res = await fetch(`${API_URL}/admin/allocate-batch/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId, batchId, action })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      
      alert(resData.status);
      fetchAllocationData();
    } catch (err) {
      alert(err.message);
    } finally {
      setAllocating(prev => ({ ...prev, [studentId]: false }));
    }
  };

  if (loading) return <div style={{ color: '#fff' }}>Loading pending allocation list...</div>;

  const allStudents = [...data.pending, ...data.unassigned];

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>
        <Users size={28} style={{ color: '#3b82f6' }} /> Student Batch Allocation
      </h2>
      <p style={styles.subheader}>
        Allocate registered student accounts to their course batches. Students cannot view training panels until allocated.
      </p>

      {/* Create New Batch Card */}
      <div className="glass-card" style={styles.createCard}>
        <h3 style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 10, fontSize: 18 }}>
          <BookOpen size={20} style={{ color: '#10b981' }} /> Create a New Training Batch
        </h3>
        <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 4, marginBottom: 16 }}>
          Define a new training batch (e.g., PYTHON-FSD) to enable student allocation and coursework assignments.
        </p>
        <form onSubmit={handleCreateBatch} style={styles.formInline}>
          <div style={styles.formGroup}>
            <input 
              type="text" 
              placeholder="Batch Name (e.g. PYTHON-FSD)" 
              className="custom-input"
              value={newBatchName}
              onChange={e => setNewBatchName(e.target.value)}
              required
              style={{ flex: 1 }}
            />
          </div>
          <div style={styles.formGroup}>
            <input 
              type="text" 
              placeholder="Description (optional)" 
              className="custom-input"
              value={newBatchDesc}
              onChange={e => setNewBatchDesc(e.target.value)}
              style={{ flex: 2 }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={creatingBatch}>
            {creatingBatch ? 'Creating...' : 'Create Batch'}
          </button>
        </form>
      </div>

      {allStudents.length === 0 ? (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
          <h3>No students awaiting allocation</h3>
          <p style={{ color: '#9ca3af', marginTop: 8 }}>All registered students have active approved batches.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Roll No</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Current Status</th>
                <th style={styles.th}>Allocate to Batch</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {allStudents.map(student => {
                const sId = student.student || student.id;
                return (
                  <tr key={sId} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>{student.student_roll || 'N/A'}</td>
                    <td style={styles.td}>{student.student_name}</td>
                    <td style={styles.td}>{student.student_email}</td>
                    <td style={styles.td}>
                      {student.status === 'pending' ? (
                        <span className="badge badge-warning">Pending Request</span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <select 
                        className="custom-input" 
                        value={selectedBatch[sId] || ''}
                        onChange={e => setSelectedBatch(prev => ({ ...prev, [sId]: e.target.value }))}
                        style={{ width: 180, height: 38, padding: '4px 12px' }}
                      >
                        {data.batches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '8px 12px', fontSize: 13, background: '#10b981' }}
                          onClick={() => handleAllocate(sId, selectedBatch[sId], 'approved')}
                          disabled={allocating[sId]}
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        {student.status === 'pending' && (
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '8px 12px', fontSize: 13, borderColor: '#ef4444', color: '#ef4444' }}
                            onClick={() => handleAllocate(sId, selectedBatch[sId], 'rejected')}
                            disabled={allocating[sId]}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        )}
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: '#ffffff',
  },
  subheader: {
    fontSize: 14,
    color: '#9ca3af',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 20,
    marginTop: -8,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  theadRow: {
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
  },
  th: {
    padding: '16px 20px',
    color: '#9ca3af',
    fontWeight: 'bold',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  td: {
    padding: '16px 20px',
    fontSize: 14,
    color: '#e5e7eb',
    verticalAlign: 'middle',
  },
  createCard: {
    padding: 24,
    marginBottom: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  formInline: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  formGroup: {
    flex: 1,
    minWidth: 200,
    display: 'flex',
  }
};
