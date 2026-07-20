import React, { useState, useEffect } from 'react';
import { ClipboardList, PlusCircle, Calendar, Send, Code } from 'lucide-react';

export default function AdminTasks({ API_URL, token }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskType, setTaskType] = useState('regular'); // 'regular' or 'leetcode'

  // Input states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/pending-students/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setBatches(data.batches || []);
        if (data.batches && data.batches.length > 0) {
          setSelectedBatchId(data.batches[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (taskType === 'regular') {
      if (!title || !description || !dueDate || !selectedBatchId) {
        return alert('Missing required task fields');
      }
      setSubmitting(true);
      try {
        const res = await fetch(`${API_URL}/admin/create-task/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ batchId: selectedBatchId, title, description, dueDate })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        alert('Task created and assigned successfully!');
        setTitle('');
        setDescription('');
        setDueDate('');
      } catch (err) {
        alert(err.message);
      } finally {
        setSubmitting(false);
      }
    } else {
      // LeetCode Challenge
      if (!title || !leetcodeUrl || !dueDate) {
        return alert('Missing required LeetCode challenge fields');
      }
      setSubmitting(true);
      try {
        const res = await fetch(`${API_URL}/admin/create-leetcode-challenge/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title, url: leetcodeUrl, deadline: dueDate })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        alert('LeetCode Daily Challenge created and assigned globally!');
        setTitle('');
        setLeetcodeUrl('');
        setDueDate('');
      } catch (err) {
        alert(err.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) return <div style={{ color: '#fff' }}>Loading batches...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>
        <ClipboardList size={28} style={{ color: '#3b82f6', verticalAlign: 'middle', marginRight: 8 }} /> Task Administration
      </h2>
      
      <div style={styles.layout}>
        <div className="glass-card" style={styles.formCard}>
          <h3 style={styles.sectionHeader}>
            {taskType === 'regular' ? (
              <PlusCircle size={18} style={{ color: '#3b82f6' }} />
            ) : (
              <Code size={18} style={{ color: '#eab308' }} />
            )}
            <span>{taskType === 'regular' ? 'Assign New Task' : 'Assign Daily LeetCode Challenge'}</span>
          </h3>

          {/* Task Type Switcher Toggle */}
          <div style={styles.toggleContainer}>
            <button 
              type="button"
              style={taskType === 'regular' ? styles.toggleBtnActive : styles.toggleBtn}
              onClick={() => {
                setTaskType('regular');
                setTitle('');
                setDueDate('');
              }}
            >
              Regular Worksheet
            </button>
            <button 
              type="button"
              style={taskType === 'leetcode' ? styles.toggleBtnActive : styles.toggleBtn}
              onClick={() => {
                setTaskType('leetcode');
                setTitle('');
                setDueDate('');
              }}
            >
              LeetCode Challenge
            </button>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {taskType === 'regular' ? (
              <>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Select Target Batch</label>
                  <select 
                    className="custom-input" 
                    value={selectedBatchId} 
                    onChange={e => setSelectedBatchId(e.target.value)}
                    required
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Task Title</label>
                  <input 
                    type="text" 
                    className="custom-input" 
                    placeholder="e.g. W7S4T3 (Worksheet 7, Task 3)"
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Task Instructions (Markdown supported)</label>
                  <textarea 
                    className="custom-input" 
                    placeholder="Describe task description, GitHub requirements, etc..."
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    style={{ minHeight: 140, resize: 'vertical' }}
                    required 
                  />
                </div>
              </>
            ) : (
              <>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Challenge Title</label>
                  <input 
                    type="text" 
                    className="custom-input" 
                    placeholder="e.g. Two Sum"
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div style={styles.inputWrapper}>
                  <label style={styles.label}>LeetCode Problem Link</label>
                  <input 
                    type="url" 
                    className="custom-input" 
                    placeholder="https://leetcode.com/problems/two-sum/"
                    value={leetcodeUrl} 
                    onChange={e => setLeetcodeUrl(e.target.value)} 
                    required 
                  />
                </div>
              </>
            )}

            <div style={styles.inputWrapper}>
              <label style={styles.label}>Due Date / Deadline</label>
              <input 
                type="date" 
                className="custom-input" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting} style={{ justifyContent: 'center', marginTop: 12 }}>
              <Send size={16} /> 
              {submitting ? 'Assigning...' : (taskType === 'regular' ? 'Assign Task to Batch' : 'Assign Challenge Globally')}
            </button>
          </form>
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
  header: {
    color: '#ffffff',
    fontSize: 26,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 20,
    marginBottom: 10,
  },
  layout: {
    display: 'flex',
    justifyContent: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 580,
  },
  sectionHeader: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  toggleContainer: {
    display: 'flex',
    gap: 10,
    marginBottom: 24,
    background: 'rgba(255,255,255,0.02)',
    padding: 6,
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  toggleBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    padding: '10px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 13,
    transition: 'all 0.2s',
  },
  toggleBtnActive: {
    flex: 1,
    background: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    color: '#3b82f6',
    padding: '10px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 13,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: '#d1d5db',
    fontWeight: 'bold',
  }
};
