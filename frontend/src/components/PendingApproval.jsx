import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

export default function PendingApproval({ enrollment, onRefresh }) {
  const batchName = enrollment?.batch_name || enrollment?.batch?.name || "Selected Batch";

  return (
    <div style={{
      maxWidth: 700,
      margin: '60px auto',
      padding: 40,
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      border: '1px solid #334155',
      borderRadius: 20,
      color: '#f8fafc',
      textAlign: 'center',
      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 24,
        background: 'rgba(234, 179, 8, 0.15)',
        color: '#eab308',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto',
        border: '1px solid rgba(234, 179, 8, 0.3)'
      }}>
        <Clock size={36} />
      </div>

      <span style={{
        background: 'rgba(234, 179, 8, 0.15)',
        color: '#fde047',
        padding: '6px 16px',
        borderRadius: 20,
        fontSize: '0.82rem',
        fontWeight: 600,
        border: '1px solid rgba(234, 179, 8, 0.3)',
        letterSpacing: '0.5px'
      }}>
        ENROLLMENT PENDING APPROVAL
      </span>

      <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '20px 0 12px 0' }}>
        Request Submitted for {batchName}
      </h2>

      <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 28, maxWidth: 520, margin: '0 auto 28px auto' }}>
        Your request has been sent to the administrator for approval. Please wait until it is approved to access batch tasks, chat, and study materials.
      </p>

      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px dashed #475569',
        borderRadius: 14,
        padding: '16px 20px',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'left'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Requested Batch</div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: '#f8fafc' }}>{batchName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Status</div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fde047', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', display: 'inline-block' }}></span>
            Awaiting Admin Action
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
        <button
          onClick={onRefresh}
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
          <RefreshCw size={18} />
          Check Approval Status
        </button>
      </div>
    </div>
  );
}
