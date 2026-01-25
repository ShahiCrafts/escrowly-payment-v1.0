import { useRef, useEffect, useState, useMemo } from 'react';
import { cn, formatDateTime } from '../../../utils/cn';
import { ImageAvatar, Card, Button } from '../../common';
import TransactionStatus from './TransactionStatus';
import PoCSubmission from './PoCSubmission';
import ChecklistCard from './ChecklistCard';

const TransactionChat = ({
    messages,
    user,
    onSendMessage,
    newMessage,
    setNewMessage,
    sendingMessage,
    attachments,
    onRemoveAttachment,
    onFileSelect,
    fileInputRef,
    sellerNeedsOnboarding,
    transaction,
    // PoC props
    isSeller,
    isBuyer,
    onSubmitPoC,
    onApprovePoC,
    onRequestChanges,
    pocLoading
}) => {
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const scrollContainerRef = useRef(null);

    const isMe = (senderId) => senderId === user?.id;

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [newMessage]);

    const scrollToBottom = (behavior = 'smooth') => {
        chatEndRef.current?.scrollIntoView({ behavior });
        setIsScrolledUp(false);
    };

    // Smart scroll handling
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setIsScrolledUp(!isNearBottom);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll on new messages if near bottom
    useEffect(() => {
        if (!isScrolledUp) {
            scrollToBottom();
        }
    }, [messages.length]);

    // Group messages by Date and Sender
    const groupedMessages = useMemo(() => {
        const groups = [];
        let currentGroup = null;

        messages.forEach((msg, index) => {
            if (msg.isSystemMessage) return;

            const msgDate = new Date(msg.createdAt).toLocaleDateString();
            const senderId = msg.sender?._id;

            if (!currentGroup ||
                currentGroup.date !== msgDate ||
                currentGroup.senderId !== senderId) {

                if (currentGroup) groups.push(currentGroup);

                currentGroup = {
                    id: `group - ${index} `,
                    date: msgDate,
                    senderId,
                    sender: msg.sender,
                    messages: [msg]
                };
            } else {
                currentGroup.messages.push(msg);
            }
        });

        if (currentGroup) groups.push(currentGroup);
        return groups;
    }, [messages]);

    const getDateLabel = (dateString) => {
        const date = new Date(dateString);
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

        if (dateString === today) return 'Today';
        if (dateString === yesterday) return 'Yesterday';
        return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    };

    // insert date separators
    const renderedGroups = [];
    let lastDate = null;

    groupedMessages.forEach(group => {
        if (group.date !== lastDate) {
            renderedGroups.push({ type: 'date', content: getDateLabel(group.date), id: `date - ${group.date} ` });
            lastDate = group.date;
        }
        renderedGroups.push({ type: 'message_group', ...group });
    });


    return (
        <Card className="flex flex-col min-h-[700px] rounded-xl border border-slate-200 bg-white overflow-hidden mb-4 shadow-none">
            {/* Header */}
            <div className="border-b border-slate-100 bg-white px-6 py-4 flex-shrink-0 z-10 sticky top-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900 leading-tight">Transaction Chat</h2>
                            <p className="text-xs text-slate-500 font-medium">Secure conversation</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto relative flex flex-col bg-slate-50">


                <div ref={scrollContainerRef} className="flex-1 px-6 pb-6 pt-4 space-y-6 scroll-smooth">
                    {groupedMessages.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <p className="text-sm font-medium text-slate-900">No messages yet</p>
                            <p className="text-xs text-slate-500 mt-1">Start the conversation</p>
                        </div>
                    ) : (
                        renderedGroups.map((item) => {
                            if (item.type === 'date') {
                                return (
                                    <div key={item.id} className="flex justify-center py-2">
                                        <span className="bg-slate-200/60 text-slate-500 text-[10px] font-medium px-3 py-1 rounded-full border border-slate-100 uppercase tracking-wider backdrop-blur-sm">
                                            {item.content}
                                        </span>
                                    </div>
                                );
                            }

                            const isMeUser = isMe(item.senderId);

                            return (
                                <div key={item.id} className={cn("flex gap-3 w-full", isMeUser && "flex-row-reverse")}>
                                    <div className="flex-shrink-0 self-start mt-0.5">
                                        <ImageAvatar
                                            imageUrl={item.sender?.profile?.avatar?.url}
                                            firstName={item.sender?.profile?.firstName || item.sender?.email}
                                            lastName={item.sender?.profile?.lastName}
                                            size="sm"
                                            className="rounded-full text-slate-500 border border-slate-100"
                                        />
                                    </div>
                                    <div className={cn("flex flex-col gap-1 max-w-[80%]", isMeUser ? "items-end" : "items-start")}>
                                        <div className={cn("flex items-center gap-2 px-1", isMeUser && "flex-row-reverse")}>
                                            <span className="text-xs text-slate-500 font-medium">
                                                {item.sender?.profile?.firstName || (isMeUser ? 'You' : 'Counterparty')}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {formatDateTime(item.messages[item.messages.length - 1].createdAt)}
                                            </span>
                                        </div>

                                        <div className={cn("space-y-3 w-full flex flex-col", isMeUser ? "items-end" : "items-start")}>
                                            {item.messages.map((msg, idx) => {
                                                if (msg.isPoc) {
                                                    return (
                                                        <PoCSubmission
                                                            key={msg._id || idx}
                                                            poc={{
                                                                title: msg.pocTitle || 'Proof of Completion',
                                                                description: msg.content,
                                                                attachments: msg.attachments || [],
                                                                timestamp: formatDateTime(msg.createdAt)
                                                            }}
                                                            isBuyer={isBuyer}
                                                            isMe={isMeUser}
                                                            onApprove={() => onApprovePoC && onApprovePoC(msg._id)}
                                                            onRequestChanges={() => onRequestChanges && onRequestChanges(msg._id)}
                                                            isLoading={pocLoading}
                                                        />
                                                    );
                                                }

                                                if (msg.content?.includes('**Acceptance Checklist**')) {
                                                    return (
                                                        <ChecklistCard
                                                            key={msg._id || idx}
                                                            content={msg.content}
                                                            isMe={isMeUser}
                                                        />
                                                    );
                                                }

                                                return (
                                                    <div key={msg._id || idx} className={cn("flex flex-col gap-1 w-full relative", isMeUser ? "items-end" : "items-start")}>
                                                        {msg.content && (
                                                            <div className={cn(
                                                                "rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed break-words w-fit max-w-full border shadow-sm",
                                                                isMeUser
                                                                    ? "bg-slate-800 text-white rounded-tr-sm border-slate-700"
                                                                    : "bg-white text-slate-800 border-slate-200 rounded-tl-sm"
                                                            )}>
                                                                {msg.content}
                                                            </div>
                                                        )}

                                                        {/* Inline Attachments for this specific message */}
                                                        {msg.attachments?.length > 0 && (
                                                            <div className={cn("flex flex-col gap-2 mt-1 w-full max-w-[280px]", isMeUser ? "items-end ml-auto" : "items-start")}>
                                                                {msg.attachments.map((f, i) => {
                                                                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename);
                                                                    const fileUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}${f.url} `;
                                                                    return (
                                                                        <a key={`${msg._id}-att-${i}`} href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all group w-full">
                                                                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                                                {isImage ? (
                                                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                                ) : (
                                                                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-medium text-slate-800 truncate">{f.filename}</p>
                                                                                <p className="text-[11px] text-slate-500 font-medium">Click to download</p>
                                                                            </div>
                                                                            <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                                        </a>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Composer Area */}
            <div className="border-t border-slate-100 bg-white p-4 z-20">


                {attachments.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                        {attachments.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg min-w-[200px]">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-6 h-6 bg-white rounded border border-slate-100 flex items-center justify-center text-blue-500 shrink-0">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    </div>
                                    <span className="text-xs text-slate-700 truncate">{f.name}</span>
                                </div>
                                <button type="button" onClick={() => onRemoveAttachment(i)} className="text-slate-400 hover:text-red-500 ml-2">✕</button>
                            </div>
                        ))}
                    </div>
                )}


                <div className="flex items-end gap-2 px-1 transition-all duration-200">
                    <input type="file" multiple accept=".docx,.png,.jpg,.jpeg" ref={fileInputRef} className="hidden" onChange={onFileSelect} />
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-[44px] w-[44px] p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all flex-shrink-0"
                        title="Attach files (.docx, .png, .jpg)"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </Button>
                    <form onSubmit={onSendMessage} className="flex-1 flex gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 items-center min-h-[44px] focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500/50 transition-all">
                        <textarea ref={textareaRef} value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage(e); } }} rows={1} placeholder="Type a message..." className="w-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none p-0 text-[14px] text-slate-700 placeholder:text-slate-400 resize-none leading-normal shadow-none ring-0 overflow-hidden py-[10px]" style={{ minHeight: '20px' }} />
                    </form>
                    <Button onClick={onSendMessage} disabled={(!newMessage.trim() && attachments.length === 0) || sendingMessage} className="h-[44px] px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all flex items-center justify-center min-w-[100px] flex-shrink-0 gap-2">
                        {sendingMessage ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span className="font-semibold text-[15px]">Send</span><svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></>}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default TransactionChat;
