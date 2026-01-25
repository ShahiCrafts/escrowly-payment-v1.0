import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { PageLoader } from '../../components/common';
import { cn, formatDateTime } from '../../utils/cn';

const Messages = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [attachments, setAttachments] = useState([]);

    // Fetch all conversations (transactions)
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await api.get('/escrow');
                const txns = response.data.transactions || [];
                setConversations(txns);

                // Auto-select from URL param or first conversation
                const txId = searchParams.get('tx');
                if (txId) {
                    const found = txns.find(t => t._id === txId);
                    if (found) setSelectedConversation(found);
                } else if (txns.length > 0) {
                    setSelectedConversation(txns[0]);
                }
            } catch (error) {
                console.error('Failed to fetch conversations');
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, [searchParams]);

    // Fetch messages for selected conversation
    useEffect(() => {
        if (!selectedConversation) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setMessagesLoading(true);
            try {
                const response = await api.get(`/messages/${selectedConversation._id}`);
                setMessages(response.data.messages || []);
            } catch (error) {
                console.error('Failed to fetch messages');
            } finally {
                setMessagesLoading(false);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [selectedConversation?._id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const counterparty = (conv.buyer._id || conv.buyer) === user.id ? conv.seller : conv.buyer;
        return (
            conv.title?.toLowerCase().includes(query) ||
            counterparty?.profile?.fullName?.toLowerCase().includes(query) ||
            counterparty?.email?.toLowerCase().includes(query)
        );
    });

    const handleFileSelect = (e) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            const valid = selected.filter(f => {
                const ext = f.name.toLowerCase();
                return ext.endsWith('.docx') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg');
            });
            setAttachments(prev => [...prev, ...valid]);
            e.target.value = '';
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && attachments.length === 0) || sendingMessage || !selectedConversation) return;

        setSendingMessage(true);
        try {
            const formData = new FormData();
            formData.append('content', newMessage);
            attachments.forEach(file => formData.append('attachments', file));
            await api.post(`/messages/${selectedConversation._id}`, formData);
            setNewMessage('');
            setAttachments([]);

            // Refresh messages
            const response = await api.get(`/messages/${selectedConversation._id}`);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const isMe = (senderId) => senderId === user?.id;

    const formatSystemMessage = (content) => {
        return content.replace(/\b[0-9a-fA-F]{24}\b/g, (match) => `${match.substring(0, 6)}...`);
    };

    if (loading) return <PageLoader />;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="h-[calc(100vh-140px)] min-h-[600px] flex gap-6">
                {/* Left Panel - Conversation List */}
                <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Messages</h2>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">
                                <p className="text-sm">No conversations found</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const isBuyer = (conv.buyer._id || conv.buyer) === user.id;
                                const counterparty = isBuyer ? conv.seller : conv.buyer;
                                const isSelected = selectedConversation?._id === conv._id;

                                return (
                                    <button
                                        key={conv._id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={cn(
                                            "w-full p-4 flex items-start gap-3 text-left transition-colors border-b border-slate-50",
                                            isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
                                            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                                        )}>
                                            {counterparty?.profile?.firstName?.[0] || counterparty?.email?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className={cn(
                                                    "text-sm font-semibold truncate",
                                                    isSelected ? "text-blue-600" : "text-slate-900"
                                                )}>
                                                    {counterparty?.profile?.fullName || counterparty?.email || 'Unknown'}
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate mb-1">{conv.title}</p>
                                            <p className="text-xs text-slate-400 truncate">
                                                {isBuyer ? 'You are the buyer' : 'You are the seller'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Panel - Chat */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden">
                    {!selectedConversation ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-slate-900">Select a conversation</p>
                            <p className="text-xs text-slate-500 mt-1">Choose from your escrow transactions</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {(() => {
                                        const isBuyer = (selectedConversation.buyer._id || selectedConversation.buyer) === user.id;
                                        const counterparty = isBuyer ? selectedConversation.seller : selectedConversation.buyer;
                                        return (
                                            <>
                                                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                                                    {counterparty?.profile?.firstName?.[0] || counterparty?.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {counterparty?.profile?.fullName || counterparty?.email || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{counterparty?.email}</p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">
                                        {selectedConversation.title}
                                    </span>
                                    <button
                                        onClick={() => navigate(`/dashboard/transaction/${selectedConversation._id}`)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="View Transaction"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                                {messagesLoading && messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium text-slate-900">No messages yet</p>
                                        <p className="text-xs text-slate-500 mt-1">Start the conversation below</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isMeUser = isMe(msg.sender?._id);
                                        const isSequence = index > 0 && messages[index - 1].sender?._id === msg.sender?._id && !messages[index - 1].isSystemMessage && !msg.isSystemMessage;

                                        if (msg.isSystemMessage) {
                                            return (
                                                <div key={msg._id} className="flex justify-center my-4">
                                                    <div className="bg-white text-slate-500 text-xs px-3 py-1.5 rounded-full font-medium border border-slate-100">
                                                        {formatSystemMessage(msg.content)}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={msg._id} className={cn("flex w-full", isMeUser ? "justify-end" : "justify-start")}>
                                                <div className={cn("flex max-w-[70%] gap-3", isMeUser ? "flex-row-reverse" : "flex-row")}>
                                                    {!isSequence && (
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold mt-1",
                                                            isMeUser ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-100"
                                                        )}>
                                                            {msg.sender?.profile?.firstName?.[0] || '?'}
                                                        </div>
                                                    )}
                                                    {isSequence && <div className="w-8 shrink-0" />}

                                                    <div className={cn("flex flex-col", isMeUser ? "items-end" : "items-start")}>
                                                        <div className={cn(
                                                            "px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                                                            isMeUser
                                                                ? "bg-blue-600 text-white rounded-2xl rounded-tr-md"
                                                                : "bg-white text-slate-700 rounded-2xl rounded-tl-md border border-slate-100"
                                                        )}>
                                                            {msg.content}
                                                        </div>

                                                        {msg.attachments?.length > 0 && (
                                                            <div className={cn("mt-2 flex flex-wrap gap-2", isMeUser ? "justify-end" : "justify-start")}>
                                                                {msg.attachments.map((f, i) => (
                                                                    <a
                                                                        key={i}
                                                                        href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${f.url}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs transition-colors"
                                                                    >
                                                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                                        </svg>
                                                                        <span className="truncate max-w-[120px] font-medium">{f.filename}</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {!isSequence && (
                                                            <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                                {formatDateTime(msg.createdAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 bg-white border-t border-slate-100">
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {attachments.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                                                <span className="max-w-[150px] truncate text-slate-700 font-medium">{f.name}</span>
                                                <button type="button" onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                                    <input type="file" multiple accept=".docx,.png,.jpg,.jpeg" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                    </button>

                                    <div className="flex-1 relative">
                                        <textarea
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                            rows={1}
                                            placeholder="Type a message..."
                                            className="w-full h-11 py-2.5 px-4 bg-slate-50 border-none rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                            style={{ minHeight: '44px', maxHeight: '120px' }}
                                        />
                                        <p className="absolute -bottom-5 left-1 text-[10px] text-slate-400">
                                            Press Shift+Enter for new line
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={(!newMessage.trim() && attachments.length === 0) || sendingMessage}
                                        className="h-11 w-11 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {sendingMessage ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
