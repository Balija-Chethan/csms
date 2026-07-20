import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Hash } from 'lucide-react';

export default function Chat({ API_URL, token, batchName }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  
  const chatBottomRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/student/chat/`, {
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
      <div className="glass-card" style={styles.sidebar}>
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
    gap: 20,
    height: 'calc(100vh - 120px)',
    width: '100%',
  },
  sidebar: {
    width: 260,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 20,
    '@media (max-width: 768px)': {
      display: 'none',
    }
  },
  sidebarHeader: {
    fontSize: 16,
    color: '#ffffff',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 12,
  },
  groupItemActive: {
    background: 'rgba(59,130,246,0.1)',
    border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: 8,
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
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.01)',
  },
  messageStream: {
    flex: 1,
    padding: 20,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  messageItem: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  messageContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: 'rgba(0,0,0,0.15)',
    padding: '10px 14px',
    borderRadius: '0 12px 12px 12px',
    border: '1px solid rgba(255,255,255,0.04)',
    maxWidth: '80%',
  },
  senderHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  senderTitle: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    background: 'rgba(234,179,8,0.1)',
    padding: '1px 4px',
    borderRadius: 3,
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
  },
  textBody: {
    fontSize: 13,
    color: '#e5e7eb',
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap',
  },
  inputArea: {
    display: 'flex',
    padding: 16,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(0,0,0,0.1)',
  },
  sendBtn: {
    borderRadius: '0 24px 24px 0',
    padding: '0 20px',
  }
};
