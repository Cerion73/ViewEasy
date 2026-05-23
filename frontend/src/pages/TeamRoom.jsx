import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { apiClient } from '../api/client';
import Navigation from '../components/Navigation';
import { Smile, Paperclip, Image, Mic, X, Download } from 'lucide-react';
import { AppleEmoji, renderContentWithEmojis, insertHTMLAtCursor, convertHTMLToTextWithEmojis } from '../utils/emoji';

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

const FilePreview = ({ files, isMe }) => {
  if (!files || files.length === 0) return null;
  return files.map(f => {
    const url = f.file?.startsWith('http') ? f.file : `http://localhost:8000${f.file}`;
    const ext = f.file_name?.split('.').pop().toLowerCase() || '';
    const imgExts = ['jpg','jpeg','png','gif','webp','svg','bmp'];
    const audioExts = ['mp3','wav','ogg','m4a','webm'];

    if (imgExts.includes(ext)) {
      return <img key={f.id} src={url} alt={f.file_name} style={{ maxWidth: '260px', maxHeight: '200px', borderRadius: '8px', marginTop: '6px', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} />;
    }
    if (audioExts.includes(ext)) {
      return <audio key={f.id} controls src={url} style={{ marginTop: '6px', maxWidth: '240px' }} />;
    }
    return (
      <a key={f.id} href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '8px 12px', backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : 'var(--border-color)', borderRadius: '8px', color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '13px' }}>
        <Download size={14} /> {f.file_name}
      </a>
    );
  });
};

const TeamRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { switchToTeam } = useTeam();
  
  const [team, setTeam] = useState(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const ws = useRef(null);
  const typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    fetchTeamAndRoom();
    return () => { if (ws.current) ws.current.close(); };
  }, [id]);

  useEffect(() => {
    if (room) { connectWebSocket(room.id); fetchMessages(room.id); }
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTeamAndRoom = async () => {
    try {
      const teamRes = await apiClient(`/tasks/teams/${id}/`);
      setTeam(teamRes);
      switchToTeam({ id: teamRes.id, name: teamRes.name });
      const roomsRes = await apiClient('/team-rooms/rooms/');
      const rooms = roomsRes.results || roomsRes;
      const teamRoom = rooms.find(r => String(r.team?.id) === String(id));
      if (teamRoom) setRoom(teamRoom);
    } catch (err) { console.error(err); }
  };

   const fetchMessages = async (roomId) => {
     try {
       const res = await apiClient(`/team-rooms/rooms/${roomId}/chats/`);
       setMessages(res.results || res);
     } catch (err) { console.error(err); }
   };

  const connectWebSocket = (roomId) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/rooms/${roomId}/?ticket=${token}`);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === 'typing') {
        if (data.is_typing) {
          setTypingUsers(prev => new Set(prev).add(data.sender_id));
          setTimeout(() => {
            setTypingUsers(prev => { const next = new Set(prev); next.delete(data.sender_id); return next; });
          }, 3000);
        }
      }
    };
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && selectedFiles.length === 0) || !room) return;

    try {
      const formData = new FormData();
      formData.append('room', room.id);
      formData.append('content', inputText);
      selectedFiles.forEach(f => formData.append('uploaded_files', f));

      await apiClient('/team-rooms/chats/', { method: 'POST', body: formData });
      setInputText(''); setSelectedFiles([]); setShowEmoji(false);
      fetchMessages(room.id);
      
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ action: 'typing', is_typing: false }));
      }
    } catch (err) { console.error(err); }
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'typing', is_typing: true }));
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ action: 'typing', is_typing: false }));
        }
      }, 2000);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) setSelectedFiles(prev => [...prev, ...files]);
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
        setSelectedFiles(prev => [...prev, file]);
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
     const input = document.querySelector('input[placeholder={`Message #${team.name}...`}]');
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

  if (!team) return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <Navigation />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>Loading team...</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <Navigation />

      {/* Chat Container */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', overflow: 'hidden' }}>
        {/* Chat Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
              {team.name[0].toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: '600', color: 'var(--text-primary)', fontSize: '1rem' }}>#{team.name} General Discourse</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{team.memberships?.length || 0} members</span>
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '60px 20px' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No messages yet</p>
              <p style={{ fontSize: '0.9rem' }}>Start the conversation with your team!</p>
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender?.id === user.id;
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  {!isMe && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', marginLeft: '16px' }}>{msg.sender?.email}</span>}
                  <div style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: isMe ? 'var(--accent-primary)' : 'var(--bg-primary)', color: isMe ? '#fff' : 'var(--text-primary)', borderBottomRightRadius: isMe ? '4px' : '16px', borderBottomLeftRadius: !isMe ? '4px' : '16px', border: isMe ? 'none' : '1px solid var(--border-color)' }}>
                    {msg.content && <div style={{ lineHeight: '1.5', wordBreak: 'break-word' }}>{msg.content}</div>}
                    <FilePreview files={msg.files} isMe={isMe} />
                    <div style={{ fontSize: '11px', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', marginTop: '5px', textAlign: 'right' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {typingUsers.size > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                Someone is typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* File Preview Bar */}
        {selectedFiles.length > 0 && (
          <div style={{ padding: '8px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedFiles.map((f, i) => (
              <div key={i} style={{ padding: '6px 12px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                📎 {f.name}
                <button onClick={() => setSelectedFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', position: 'relative' }}>
          {showEmoji && <EmojiPicker onSelect={insertEmoji} />}
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" onClick={() => setShowEmoji(!showEmoji)} style={{ background: 'none', border: 'none', color: showEmoji ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
              <Smile size={22} />
            </button>
            <button type="button" onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = '*/*'; fileInputRef.current.click(); } }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
              <Paperclip size={22} />
            </button>
            <button type="button" onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); } }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
              <Image size={22} />
            </button>
            <button type="button" onClick={isRecording ? stopRecording : startRecording} style={{ background: 'none', border: 'none', color: isRecording ? 'var(--danger)' : 'var(--text-secondary)', cursor: 'pointer', padding: '4px', animation: isRecording ? 'pulse 1s infinite' : 'none' }}>
              <Mic size={22} />
            </button>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
            <input type="text" placeholder={`Message #${team.name}...`} value={inputText} onChange={handleTyping}
              className="input-field"
              style={{ flex: 1, padding: '12px 20px', borderRadius: '24px', fontSize: '15px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '24px' }}>
              Send
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
};

export default TeamRoom;
