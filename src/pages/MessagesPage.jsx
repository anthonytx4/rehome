import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCheck, ExternalLink, Loader2, MessageSquare, MoreVertical, Paperclip, Search, Send, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { resolveMediaUrl } from '../utils/media';
import styles from './MessagesPage.module.css';

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showThreadMenu, setShowThreadMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.otherUser?.name,
        conversation.listing?.petName,
        conversation.listing?.breed,
        conversation.lastMessage?.content,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [conversations, searchQuery]);

  const activeListingId = activeConv?.listingId;
  const activeOtherUserId = activeConv?.otherUser?.id;
  const activeIsNew = activeConv?.isNew;

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await api.get('/messages/inbox');
        setConversations(res.data);

        if (routeListingId) {
          const matches = sellerId
            ? res.data.filter((conversation) => conversation.listingId === routeListingId && conversation.otherUser.id === sellerId)
            : res.data.filter((conversation) => conversation.listingId === routeListingId);

          if (matches.length === 1) {
            setActiveConv(matches[0]);
          } else if (matches.length > 1) {
            toast.error('Multiple conversations exist for this listing. Choose one from the inbox.');
          } else {
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
                isNew: true,
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

  useEffect(() => {
    setShowThreadMenu(false);
  }, [activeListingId, activeOtherUserId]);

  useEffect(() => {
    if (!activeListingId || !activeOtherUserId) return;

    const fetchThread = async () => {
      try {
        const res = await api.get(`/messages/${activeListingId}?userId=${activeOtherUserId}`);
        setMessages(res.data);

        const inboxRes = await api.get('/messages/inbox');
        setConversations(inboxRes.data);

        const refreshedConv = inboxRes.data.find(
          (conversation) => conversation.listingId === activeListingId && conversation.otherUser.id === activeOtherUserId
        );
        if (refreshedConv) {
          setActiveConv(refreshedConv);
        }
      } catch {
        if (!activeIsNew) toast.error('Failed to load conversation');
      }
    };

    fetchThread();
    const interval = setInterval(fetchThread, 5000);
    return () => clearInterval(interval);
  }, [activeListingId, activeOtherUserId, activeIsNew]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large (max 20MB)');
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !mediaFile) return;
    if (!activeOtherUserId || !activeListingId) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('receiverId', activeOtherUserId);
      formData.append('listingId', activeListingId);
      if (newMessage.trim()) formData.append('content', newMessage);
      if (mediaFile) formData.append('media', mediaFile);

      const res = await api.post('/messages', formData);

      setMessages((current) => [...current, res.data]);
      setNewMessage('');
      setMediaFile(null);
      setMediaPreview(null);

      const inboxRes = await api.get('/messages/inbox');
      setConversations(inboxRes.data);

      const refreshedConv = inboxRes.data.find(
        (conversation) => conversation.listingId === activeListingId && conversation.otherUser.id === activeOtherUserId
      );
      if (refreshedConv) {
        setActiveConv(refreshedConv);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }

      if (err.response?.status === 403 && err.response?.data?.error === 'queue_active') {
        const hoursLeft = err.response?.data?.hoursLeft;
        toast.error(hoursLeft ? `This listing is still in the queue. Try again in about ${hoursLeft}h.` : 'This listing is still in the queue.');
        return;
      }

      if (err.response?.status === 400) {
        toast.error(err.response?.data?.error || 'Check the message and try again.');
        return;
      }

      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleOpenListing = () => {
    if (!activeListingId) return;
    navigate(`/listing/${activeListingId}`);
  };

  const handleMarkRead = async () => {
    if (!activeListingId || !activeOtherUserId) return;

    try {
      await api.post('/messages/read', {
        listingId: activeListingId,
        userId: activeOtherUserId,
      });

      const inboxRes = await api.get('/messages/inbox');
      setConversations(inboxRes.data);
      setShowThreadMenu(false);
      toast.success('Conversation marked as read');
    } catch {
      toast.error('Unable to mark conversation as read');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spinner} />
        <p>Loading your conversations...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={`container ${styles.chatContainer}`}>
        <div className={`${styles.sidebar} ${activeConv ? styles.sidebarHidden : ''}`}>
          <div className={styles.sidebarHeader}>
            <h2>Messages</h2>
            <div className={styles.searchWrap}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className={styles.searchClear} onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className={styles.convList}>
            {filteredConversations.length === 0 ? (
              <div className={styles.emptyInbox}>
                <MessageSquare size={42} />
                <h3>{searchQuery ? 'No matching conversations' : 'No messages yet'}</h3>
                <p>
                  {searchQuery
                    ? 'Try a different seller name, listing name, or breed.'
                    : 'Browse listings and start a conversation when you are ready.'}
                </p>
                <div className={styles.emptyActions}>
                  <Link to="/" className="btn btn-primary">Browse Marketplace</Link>
                  {searchQuery && (
                    <button type="button" className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                      Clear search
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredConversations.map((conv) => (
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
              ))
            )}
          </div>
        </div>

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
                <div className={styles.headerActions}>
                  <button type="button" className={styles.headerActionBtn} onClick={handleOpenListing} title="Open listing">
                    <ExternalLink size={18} />
                  </button>
                  <div className={styles.threadMenuWrap}>
                    <button
                      type="button"
                      className={styles.headerActionBtn}
                      onClick={() => setShowThreadMenu((value) => !value)}
                      aria-label="Conversation actions"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showThreadMenu && (
                      <div className={styles.threadMenu}>
                        <button type="button" className={styles.threadMenuItem} onClick={handleMarkRead}>
                          <CheckCheck size={16} /> Mark as read
                        </button>
                        <button type="button" className={styles.threadMenuItem} onClick={handleOpenListing}>
                          <ExternalLink size={16} /> Open listing
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.messageList}>
                {messages.length === 0 ? (
                  <div className={styles.chatStart}>
                    <div className={styles.listingPreview}>
                      <img src={resolveMediaUrl(activeConv.listing.image || activeConv.listing.images?.[0])} alt={activeConv.listing.petName || 'Listing preview'} />
                      <div>
                        <h4>Inquiry about {activeConv.listing.petName}</h4>
                        <p>${activeConv.listing.price}</p>
                      </div>
                    </div>
                    <p className={styles.startNote}>Say hello and keep the conversation on Rehome so the thread stays organized.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`${styles.messageWrap} ${msg.senderId === user.id ? styles.messageSent : styles.messageReceived}`}>
                      <div className={styles.bubble}>
                        {msg.mediaUrl && (
                          <div className={styles.mediaContent}>
                            {(msg.mediaType || '').startsWith('image') || msg.mediaType === 'image' ? (
                              <img
                                src={resolveMediaUrl(msg.mediaUrl)}
                                alt="Sent media"
                                onClick={() => window.open(resolveMediaUrl(msg.mediaUrl), '_blank', 'noopener')}
                              />
                            ) : (
                              <div className={styles.videoContainer}>
                                <video controls>
                                  <source src={resolveMediaUrl(msg.mediaUrl)} type={msg.mediaType || undefined} />
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
                  ))
                )}
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
                <p>Select a conversation from the sidebar, or browse listings to start a new thread.</p>
                <div className={styles.emptyActions}>
                  <Link to="/" className="btn btn-primary">Browse Marketplace</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
