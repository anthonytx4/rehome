import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Send, Paperclip, MoreVertical, Search, ArrowLeft, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import styles from './MessagesPage.module.css';

const MessagesPage = () => {
  const { user } = useAuth();
  const { listingId: routeListingId } = useParams();
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get('sellerId');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load inbox
  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await api.get('/messages/inbox');
        setConversations(res.data);
        
        // If we came from a listing, find or prep that conversation
        if (routeListingId) {
          const existing = sellerId
            ? res.data.find(c => c.listingId === routeListingId && c.otherUser.id === sellerId)
            : res.data.find(c => c.listingId === routeListingId);
          if (existing) {
            setActiveConv(existing);
          } else {
            // Prep a "virtual" conversation for a new thread
            try {
              const listingRes = await api.get(`/listings/${routeListingId}`);
              const resolvedSellerId = sellerId || listingRes.data?.seller?.id || listingRes.data?.userId;
              if (!resolvedSellerId) {
                toast.error('Seller information is unavailable for this listing');
                return;
              }
              setActiveConv({
                listingId: routeListingId,
                listing: listingRes.data,
                otherUser: {
                  id: resolvedSellerId,
                  name: listingRes.data?.seller?.name || listingRes.data?.user?.name || 'Seller',
                },
                isNew: true
              });
            } catch {
              toast.error('Listing not found');
            }
          }
        }
      } catch {
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, [routeListingId, sellerId]);

  // Load active thread
  useEffect(() => {
    if (!activeConv) return;
    
    const fetchThread = async () => {
      try {
        const res = await api.get(`/messages/${activeConv.listingId}?userId=${activeConv.otherUser.id}`);
        setMessages(res.data);
      } catch {
        if (!activeConv.isNew) toast.error('Failed to load conversation');
      }
    };

    fetchThread();
    const interval = setInterval(fetchThread, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [activeConv]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) return toast.error('File too large (max 20MB)');
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = () => setMediaPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !mediaFile) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('receiverId', activeConv.otherUser.id);
      formData.append('listingId', activeConv.listingId);
      if (newMessage.trim()) formData.append('content', newMessage);
      if (mediaFile) formData.append('media', mediaFile);

      const res = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessages([...messages, res.data]);
      setNewMessage('');
      setMediaFile(null);
      setMediaPreview(null);
      
      // If it was a new thread, refresh inbox to make it "real"
      if (activeConv.isNew) {
        const inboxRes = await api.get('/messages/inbox');
        setConversations(inboxRes.data);
        const realConv = inboxRes.data.find(c => c.listingId === activeConv.listingId && c.otherUser.id === activeConv.otherUser.id);
        if (realConv) setActiveConv(realConv);
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className={styles.loadingState}>
      <Loader2 className={styles.spinner} />
      <p>Loading your conversations...</p>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={`container ${styles.chatContainer}`}>
        
        {/* Sidebar: Inbox */}
        <div className={`${styles.sidebar} ${activeConv ? styles.sidebarHidden : ''}`}>
          <div className={styles.sidebarHeader}>
            <h2>Messages</h2>
            <div className={styles.searchWrap}>
              <Search size={18} />
              <input type="text" placeholder="Search chats..." />
            </div>
          </div>
          <div className={styles.convList}>
            {conversations.length === 0 ? (
              <div className={styles.emptyInbox}>
                <p>No messages yet</p>
              </div>
            ) : conversations.map(conv => (
              <div 
                key={`${conv.listingId}-${conv.otherUser.id}`} 
                className={`${styles.convItem} ${activeConv?.listingId === conv.listingId && activeConv?.otherUser.id === conv.otherUser.id ? styles.convItemActive : ''}`}
                onClick={() => setActiveConv(conv)}
              >
                <div className={styles.convInfo}>
                  <div className={styles.convHeader}>
                    <strong>{conv.otherUser.name}</strong>
                    <span>{new Date(conv.lastMessage.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className={styles.convListing}>{conv.listing.petName} • {conv.listing.breed}</p>
                  <p className={styles.lastMsg}>
                    {conv.lastMessage.senderId === user.id ? 'You: ' : ''}
                    {conv.lastMessage.content || 'Sent media'}
                  </p>
                </div>
                {conv.unreadCount > 0 && <span className={styles.unreadBadge}>{conv.unreadCount}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Main: Chat Thread */}
        <div className={`${styles.chatWindow} ${!activeConv ? styles.windowHidden : ''}`}>
          {activeConv ? (
            <>
              <div className={styles.chatHeader}>
                <button className={styles.backBtn} onClick={() => setActiveConv(null)}>
                  <ArrowLeft size={20} />
                </button>
                <div className={styles.headerInfo}>
                  <h3>{activeConv.otherUser.name}</h3>
                  <p>{activeConv.listing.petName} — {activeConv.listing.breed}</p>
                </div>
                <MoreVertical size={20} className={styles.headerMore} />
              </div>

              <div className={styles.messageList}>
                {messages.length === 0 ? (
                  <div className={styles.chatStart}>
                    <div className={styles.listingPreview}>
                      <img src={activeConv.listing.image || activeConv.listing.images?.[0]} alt={activeConv.listing.petName || 'Listing preview'} />
                      <div>
                        <h4>Inquiry about {activeConv.listing.petName}</h4>
                        <p>${activeConv.listing.price}</p>
                      </div>
                    </div>
                    <p className={styles.startNote}>Say hello! Keep payments on Rehome to stay protected.</p>
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} className={`${styles.messageWrap} ${msg.senderId === user.id ? styles.messageSent : styles.messageReceived}`}>
                    <div className={styles.bubble}>
                      {msg.mediaUrl && (
                        <div className={styles.mediaContent}>
                          {msg.mediaType === 'image' ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL || ''}${msg.mediaUrl}`}
                              alt="Sent media"
                              onClick={() => window.open(`${import.meta.env.VITE_API_URL || ''}${msg.mediaUrl}`, '_blank', 'noopener')}
                            />
                          ) : (
                            <div className={styles.videoContainer}>
                              <video controls>
                                <source src={`${import.meta.env.VITE_API_URL || ''}${msg.mediaUrl}`} type="video/mp4" />
                                Your browser does not support video.
                              </video>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.content && <p>{msg.content}</p>}
                      <span className={styles.time}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {mediaPreview && (
                <div className={styles.previewPanel}>
                  <div className={styles.previewContainer}>
                    {mediaFile.type.startsWith('video/') ? (
                      <video src={mediaPreview} controls />
                    ) : (
                      <img src={mediaPreview} alt="Preview" />
                    )}
                    <button className={styles.removePreview} onClick={() => { setMediaFile(null); setMediaPreview(null); }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              <form className={styles.inputArea} onSubmit={handleSendMessage}>
                <button type="button" className={styles.attachBtn} onClick={() => fileInputRef.current.click()}>
                  <Paperclip size={20} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                />
                <button type="submit" className={styles.sendBtn} disabled={sending || (!newMessage.trim() && !mediaFile)}>
                  {sending ? <Loader2 className={styles.spinnerSmall} /> : <Send size={20} />}
                </button>
              </form>
            </>
          ) : (
            <div className={styles.noConvSelected}>
              <div className={styles.noConvContent}>
                <Send size={48} className={styles.noConvIcon} />
                <h3>Your Messages</h3>
                <p>Select a conversation from the sidebar to start chatting with buyers or sellers.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MessagesPage;
