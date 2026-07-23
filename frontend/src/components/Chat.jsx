import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Hash } from 'lucide-react';

export default function Chat({ API_URL, token, batchName }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  
  const chatBottomRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/student/chat/?_cb=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Poll messages every 4 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/student/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setContent('');
      fetchMessages();
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Groups Sidebar */}
      <div className="glass-card chat-sidebar" style={styles.sidebar}>
        <h3 style={styles.sidebarHeader}>My Groups</h3>
        <div style={styles.groupItemActive}>
          <Hash size={18} style={{ color: '#3b82f6' }} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 14 }}>{batchName || 'PYTHON-FSD'}</div>
            <div style={{ fontSize: 11, color: '#10b981' }}>Joined Group</div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="glass-card" style={styles.chatPane}>
        <div style={styles.chatHeader}>
          <Hash size={20} style={{ color: '#3b82f6' }} />
          <div>
            <h3 style={{ fontSize: 16, color: '#ffffff' }}>{batchName || 'PYTHON-FSD'}</h3>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Group Chat for Batch</span>
          </div>
        </div>

        {/* Message stream */}
        <div style={styles.messageStream}>
          {messages.map((msg, index) => (
            <div key={index} style={styles.messageItem}>
              <div 
                className={`avatar-container`}
                style={{ 
                  width: 32, 
                  height: 32,
                  border: msg.sender_avatar === 'avatar-tom' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <img 
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender_name}`} 
                  alt="avatar" 
                  className="avatar-image" 
                />
              </div>
              <div style={styles.messageContent}>
                <div style={styles.senderHeader}>
                  <span style={{ fontWeight: 'bold', color: msg.sender_namecolor || '#ffffff', fontSize: 13 }}>
                    {msg.sender_name}
                  </span>
                  {msg.sender_title && (
                    <span style={styles.senderTitle}>{msg.sender_title}</span>
                  )}
                  <span style={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={styles.textBody}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} style={styles.inputArea}>
          <input 
            type="text" 
            className="custom-input" 
            placeholder="Type a message..."
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={sending}
            style={{ borderRadius: '24px 0 0 24px' }}
          />
          <button type="submit" className="btn-primary" disabled={sending} style={styles.sendBtn}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: 24,
    height: 'calc(100vh - 120px)',
    width: '100%',
    position: 'relative',
    zIndex: 2,
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 20,
    borderRadius: '20px',
  },
  sidebarHeader: {
    fontSize: 16,
    fontFamily: 'var(--font-header)',
    fontWeight: 700,
    color: '#ffffff',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 12,
  },
  groupItemActive: {
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: 10,
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
  },
  chatPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    overflow: 'hidden',
    borderRadius: '20px',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(3, 7, 18, 0.15)',
  },
  messageStream: {
    flex: 1,
    padding: 20,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  messageItem: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  messageContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: 'rgba(3, 7, 18, 0.35)',
    padding: '12px 16px',
    borderRadius: '0 14px 14px 14px',
    border: '1px solid rgba(255,255,255,0.04)',
    maxWidth: '80%',
  },
  senderHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  senderTitle: {
    color: '#fb923c',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    background: 'rgba(249, 115, 22, 0.08)',
    padding: '2px 6px',
    borderRadius: 4,
    border: '1px solid rgba(249, 115, 22, 0.15)',
  },
  timestamp: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  textBody: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  inputArea: {
    display: 'flex',
    padding: 16,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(3, 7, 18, 0.45)',
  },
  sendBtn: {
    borderRadius: '0 24px 24px 0',
    padding: '0 20px',
  }
};
