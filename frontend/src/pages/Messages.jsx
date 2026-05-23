import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import Navigation from '../components/Navigation';
import { Smile, Paperclip, Image, Mic, X, Download } from 'lucide-react';
import { AppleEmoji, renderContentWithEmojis, insertHTMLAtCursor, convertHTMLToTextWithEmojis } from '../utils/emoji';

// Common emojis for picker (matching comrade implementation)
// Common emojis for picker (matching comrade implementation)
const COMMON_EMOJIS = ['😀', '😂', '🥰', '😍', '🤔', '😢', '😡', '🔥', '❤️', '👍', '👎', '🎉', '💯', '✨', '🙏', '👀', '💬', '🙂', '😎', '🤝'];

const EmojiPicker = ({ onSelect }) => (
  <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
    {COMMON_EMOJIS.map(e => (
      <button key={e} onClick={() => onSelect(e)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px', borderRadius: '6px', transition: 'background 0.15s' }}
        onMouseOver={ev => ev.currentTarget.style.background = 'var(--border-color)'}
        onMouseOut={ev => ev.currentTarget.style.background = 'none'}
      >{e}</button>
    ))}
  </div>
);

const MediaPreview = ({ media, isMe }) => {
  if (!media) return null;
  const url = media.startsWith('http') ? media : `http://localhost:8000${media}`;
  const ext = url.split('.').pop().toLowerCase().split('?')[0];
  const imgExts = ['jpg','jpeg','png','gif','webp','svg','bmp'];
  const audioExts = ['mp3','wav','ogg','m4a','webm'];

  if (imgExts.includes(ext)) {
    return <img src={url} alt="shared" style={{ maxWidth: '260px', maxHeight: '200px', borderRadius: '8px', marginTop: '6px', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} />;
  }
  if (audioExts.includes(ext)) {
    return <audio controls src={url} style={{ marginTop: '6px', maxWidth: '240px' }} />;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '8px 12px', backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : 'var(--border-color)', borderRadius: '8px', color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '13px' }}>
      <Download size={14} /> {decodeURIComponent(url.split('/').pop().split('?')[0])}
    </a>
  );
};

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const ws = useRef(null);
  const typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    fetchConversations();
    connectWebSocket();
    return () => { if (ws.current) ws.current.close(); };
  }, []);

  useEffect(() => {
    if (activeConversation) fetchMessages(activeConversation.id);
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectWebSocket = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/dm/?ticket=${token}`);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        if (activeConversation && data.message.conversation === activeConversation.id) {
          setMessages(prev => [...prev, data.message]);
        }
        fetchConversations();
      } else if (data.type === 'typing') {
        if (activeConversation && data.conversation_id === activeConversation.id) {
          if (data.is_typing) {
            setTypingUsers(prev => new Set(prev).add(data.sender_id));
            setTimeout(() => {
              setTypingUsers(prev => { const next = new Set(prev); next.delete(data.sender_id); return next; });
            }, 3000);
          }
        }
      }
    };
  };

  const fetchConversations = async () => {
    try { const res = await apiClient('/dm/conversations/'); setConversations(res.results || res); } catch (err) { console.error(err); }
  };

    const fetchMessages = async (id) => {
      try { 
        const res = await apiClient(`/dm/conversations/${id}/messages/`); 
        // Messages should be in chronological order (oldest first)
        // Remove the .reverse() call that was putting newest at the top
        setMessages(res.results || res); 
      } catch (err) { console.error(err); }
    };

  const searchUsers = async () => {
    if (!searchEmail) return;
    try { const res = await apiClient(`/users/?search=${searchEmail}`); setSearchResults(res.results || res); } catch (err) { console.error(err); }
  };

  const startConversation = async (otherUserId) => {
    try {
      const res = await apiClient('/dm/conversations/', { method: 'POST', body: { user_id: otherUserId } });
      fetchConversations(); setActiveConversation(res); setSearchEmail(''); setSearchResults([]);
    } catch (err) { console.error(err); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !activeConversation) return;

    try {
      const formData = new FormData();
      formData.append('conversation', activeConversation.id);
      formData.append('content', inputText);
      if (selectedFile) formData.append('media', selectedFile);

      await apiClient('/dm/messages/', { method: 'POST', body: formData });
      setInputText(''); setSelectedFile(null); setShowEmoji(false);
      fetchMessages(activeConversation.id);
    } catch (err) { console.error(err); }
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    if (ws.current && ws.current.readyState === WebSocket.OPEN && activeConversation) {
      const receiver = activeConversation.participants.find(p => p.id !== user.id);
      ws.current.send(JSON.stringify({ action: 'typing', conversation_id: activeConversation.id, receiver_id: receiver?.id, is_typing: true }));
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ action: 'typing', conversation_id: activeConversation.id, receiver_id: receiver?.id, is_typing: false }));
        }
      }, 2000);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(file);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { console.error('Microphone access denied', err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

   const insertEmoji = (emoji) => {
     // Insert emoji at cursor position in the textarea
     const input = document.querySelector('input[placeholder="Type a message..."]');
     if (input) {
       const start = input.selectionStart;
       const end = input.selectionEnd;
       const text = input.value;
       input.value = text.substring(0, start) + emoji + text.substring(end);
       input.selectionStart = input.selectionEnd = start + emoji.length;
       input.focus();
     } else {
       setInputText(prev => prev + emoji);
     }
     setShowEmoji(false);
   };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <Navigation />

      <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', height: 'calc(100vh - 160px)', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '300px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Direct Messages</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Search email to chat..." value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUsers()}
                className="input-field"
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px' }}
              />
            </div>
            {searchResults.length > 0 && (
              <div style={{ marginTop: '10px', background: 'var(--bg-primary)', borderRadius: '6px', padding: '5px', border: '1px solid var(--border-color)' }}>
                {searchResults.map(u => (
                  <div key={u.id} onClick={() => startConversation(u.id)} style={{ padding: '8px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: 'white', fontWeight: 'bold', fontSize: '13px' }}>
                      {u.avatar ? <img src={u.avatar} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : u.email[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: '14px' }}>{u.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.map(conv => {
              const otherUser = conv.participants.find(p => p.id !== user?.id) || conv.participants[0];
              const isActive = activeConversation?.id === conv.id;
              return (
                <div key={conv.id} onClick={() => setActiveConversation(conv)}
                  style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', backgroundColor: isActive ? 'var(--bg-primary)' : 'transparent', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', color: 'white' }}>
                    {otherUser.avatar ? <img src={otherUser.avatar} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : otherUser.email[0].toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{otherUser.email}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {conv.last_message ? (conv.last_message.media ? '📎 Attachment' : conv.last_message.content) : 'No messages yet'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeConversation ? (
            <>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                  {activeConversation.participants.find(p => p.id !== user.id)?.email[0].toUpperCase()}
                </div>
                <h3 style={{ margin: 0, fontWeight: '500', color: 'var(--text-primary)' }}>
                  {activeConversation.participants.find(p => p.id !== user.id)?.email}
                </h3>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                 {messages.map((msg, index) => {
                   const isMe = msg.sender?.id === user.id;
                   return (
                     <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                       <div style={{ maxWidth: '70%', padding: '12px 16px', borderRadius: '16px', backgroundColor: isMe ? 'var(--accent-primary)' : 'var(--bg-primary)', color: isMe ? '#fff' : 'var(--text-primary)', borderBottomRightRadius: isMe ? '4px' : '16px', borderBottomLeftRadius: !isMe ? '4px' : '16px', border: isMe ? 'none' : '1px solid var(--border-color)' }}>
                         {msg.content && <div style={{ lineHeight: '1.5', wordBreak: 'break-word' }}>{msg.content}</div>}
                         <MediaPreview media={msg.media} isMe={isMe} />
                         <div style={{ fontSize: '11px', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', marginTop: '5px', textAlign: 'right' }}>
                           {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                       </div>
                     </div>
                   );
                 })}
                {typingUsers.size > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                      Typing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* File Preview */}
              {selectedFile && (
                <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '6px 12px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                    📎 {selectedFile.name}
                    <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', position: 'relative' }}>
                {showEmoji && <EmojiPicker onSelect={insertEmoji} />}
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button type="button" onClick={() => setShowEmoji(!showEmoji)} style={{ background: 'none', border: 'none', color: showEmoji ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                    <Smile size={22} />
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                    <Paperclip size={22} />
                  </button>
                  <button type="button" onClick={() => { fileInputRef.current.accept = 'image/*'; fileInputRef.current?.click(); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                    <Image size={22} />
                  </button>
                  <button type="button" onClick={isRecording ? stopRecording : startRecording} style={{ background: 'none', border: 'none', color: isRecording ? 'var(--danger)' : 'var(--text-secondary)', cursor: 'pointer', padding: '4px', animation: isRecording ? 'pulse 1s infinite' : 'none' }}>
                    <Mic size={22} />
                  </button>
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
                  <input
                    type="text" placeholder="Type a message..." value={inputText} onChange={handleTyping}
                    className="input-field"
                    style={{ flex: 1, padding: '12px 20px', borderRadius: '24px', fontSize: '15px' }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '24px' }}>
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
};

export default Messages;
