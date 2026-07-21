import React from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function RejectedBatch({ enrollment, onChooseNewBatch }) {
  const batchName = enrollment?.batch_name || enrollment?.batch?.name || "the requested batch";

  return (
    <div style={{
      maxWidth: 650,
      margin: '60px auto',
      padding: 40,
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      border: '1px solid #7f1d1d',
      borderRadius: 20,
      color: '#f8fafc',
      textAlign: 'center',
      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 24,
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      }}>
        <XCircle size={38} />
      </div>

      <span style={{
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#fca5a5',
        padding: '6px 16px',
        borderRadius: 20,
        fontSize: '0.82rem',
        fontWeight: 600,
        border: '1px solid rgba(239, 68, 68, 0.3)',
        letterSpacing: '0.5px'
      }}>
        REQUEST REJECTED
      </span>

      <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '20px 0 12px 0' }}>
        Batch Request Rejected
      </h2>

      <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 24 }}>
        Your request to join <strong>{batchName}</strong> has been rejected. Please contact the administrator for assistance or choose a different training batch.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 24 }}>
        <button
          onClick={onChooseNewBatch}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}
        >
          <ArrowLeft size={18} />
          Choose Another Batch
        </button>
      </div>
    </div>
  );
}
