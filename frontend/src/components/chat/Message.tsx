import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api.service';
import { EmojiPicker } from './EmojiPicker';
import { useMessageRead } from '../../hooks/useMessageRead';
import { LazyImage } from '../common/LazyImage';

interface ImageMetadata {
  url: string;
  originalUrl: string;
}

interface MessageMetadata {
  images?: ImageMetadata[];
}

interface MessageProps {
  message: {
    id: string;
    chatId?: string;
    senderId: string;
    content: string;
    contentType: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    isEdited: boolean;
    editedAt?: string;
    replyToId?: string;
    replyTo?: {
      id: string;
      senderId?: string;
      sender?: {
        id: string;
        username: string;
        avatar?: string;
      };
      content: string;
      contentType: string;
      createdAt: string;
    };
    reactions?: Array<{ id: string; emoji: string; userId: string }>;
    isPending?: boolean;
    isFailed?: boolean;
    deliveryStatus?: 'sent' | 'delivered' | 'read';
    readCount?: { total: number; read: number };
  };
  senderName: string;
  senderAvatar?: string;
}

export const Message: React.FC<MessageProps> = ({ message, senderName, senderAvatar }) => {
  const { user } = useAuthStore();
  const [showReactions, setShowReactions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const isOwnMessage = message.senderId === user?.id;

  // Use intersection observer to mark message as read when visible
  const messageRef = useMessageRead({
    messageId: message.id,
    chatId: message.chatId || '',
    isOwnMessage,
    isPending: message.isPending,
    isFailed: message.isFailed,
  });

  const handleReact = async (emoji: string) => {
    try {
      await apiService.addReaction(message.id, emoji);
      setShowReactions(false);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleRemoveReaction = async (reactionId: string) => {
    try {
      await apiService.removeReaction(message.id, reactionId);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
    setShowActionMenu(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await apiService.editMessage(message.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return;
    try {
      await apiService.deleteMessage(message.id);
      setShowActionMenu(false);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleReply = () => {
    const event = new CustomEvent('message:reply', { detail: message });
    window.dispatchEvent(event);
    setShowActionMenu(false);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = (images: Array<{ url: string; originalUrl: string }>) => {
    setLightboxIndex(prev => (prev + 1) % images.length);
  };

  const prevImage = (images: Array<{ url: string; originalUrl: string }>) => {
    setLightboxIndex(prev => (prev - 1 + images.length) % images.length);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const images = message.metadata?.images as Array<{ url: string; originalUrl: string }> | undefined;
      if (!images) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        nextImage(images);
      } else if (e.key === 'ArrowLeft') {
        prevImage(images);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, message.metadata]);

  const renderContent = () => {
    // Inline Edit Mode - Telegram style
    if (isEditing) {
      return (
        <div className="space-y-2 w-full">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
              className="btn-primary text-sm py-2 px-4"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="btn-secondary text-sm py-2 px-4"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (message.contentType === 'image' && message.metadata?.images) {
      const images = message.metadata.images as Array<{ url: string; originalUrl: string }>;
      return (
        <>
          <div className="space-y-2">
            {message.content && <div dangerouslySetInnerHTML={{ __html: message.content }} />}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {images.map((img, idx: number) => (
                <LazyImage
                  key={idx}
                  src={img.url}
                  alt="Uploaded"
                  className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity w-full h-auto"
                  onClick={() => openLightbox(idx)}
                  threshold={0.1}
                  rootMargin="200px"
                />
              ))}
            </div>
          </div>

          {/* Lightbox */}
          {lightboxOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm"
              onClick={closeLightbox}
            >
              <button
                onClick={e => {
                  e.stopPropagation();
                  closeLightbox();
                }}
                className="absolute top-4 right-4 text-white text-4xl hover:text-secondary-300 transition-colors w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10"
              >
                ×
              </button>

              {images.length > 1 && (
                <>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      prevImage(images);
                    }}
                    className="absolute left-4 text-white text-4xl hover:text-secondary-300 transition-colors w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10"
                  >
                    ‹
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      nextImage(images);
                    }}
                    className="absolute right-16 text-white text-4xl hover:text-secondary-300 transition-colors w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10"
                  >
                    ›
                  </button>
                </>
              )}

              <LazyImage
                src={images[lightboxIndex].originalUrl}
                alt="Full size"
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={e => e.stopPropagation()}
                threshold={0}
                rootMargin="0px"
              />

              <div className="absolute bottom-4 text-white bg-black/50 px-4 py-2 rounded-full">
                {lightboxIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </>
      );
    }

    return <div dangerouslySetInnerHTML={{ __html: message.content }} className="break-words" />;
  };

  const groupedReactions = message.reactions?.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    },
    {} as Record<string, typeof message.reactions>
  );

  return (
    <div ref={messageRef} className={`flex gap-3 mb-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar - Telegram style with gradient */}
      <div className="flex-shrink-0">
        {senderAvatar ? (
          <img src={senderAvatar} alt={senderName} className="w-10 h-10 rounded-full object-cover shadow-sm" />
        ) : (
          <div className="avatar-md">
            <span>{senderName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Message bubble - Telegram style */}
      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Sender name above bubble (only for received messages) */}
        {!isOwnMessage && (
          <span className="text-xs font-medium text-secondary-600 mb-1 px-1">{senderName}</span>
        )}

        <div
          className={`relative group ${
            message.isFailed
              ? 'bg-error-100 border border-error-300 rounded-[18px] px-4 py-3'
              : message.isPending
                ? 'bg-secondary-100 opacity-70 rounded-[18px] px-4 py-3'
                : isOwnMessage
                  ? 'message-bubble-sent'
                  : 'message-bubble-received'
          }`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {/* Reply Preview */}
          {message.replyTo && (
            <div className={`mb-2 pb-2 border-l-4 pl-2 text-xs ${isOwnMessage ? 'border-white/30' : 'border-primary-400'}`}>
              <div className={`font-medium ${isOwnMessage ? 'text-white/90' : 'text-primary-600'}`}>
                {message.replyTo.sender?.username || 'Unknown User'}
              </div>
              <div className={`truncate ${isOwnMessage ? 'text-white/70' : 'text-secondary-500'}`}>
                {message.replyTo.content}
              </div>
            </div>
          )}

          {renderContent()}

          {/* Time and status - Telegram style (inline at bottom right) */}
          <div className={`flex items-center gap-1.5 mt-1.5 text-2xs ${isOwnMessage ? 'text-white/70' : 'text-secondary-400'} justify-end`}>
            <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
            {message.isEdited && <span className="italic">edited</span>}
            {message.isPending && <span>⏳</span>}
            {message.isFailed && <span className="text-error-500">❌</span>}
            {/* Delivery status for own messages - Telegram checkmarks */}
            {isOwnMessage && !message.isPending && !message.isFailed && (
              <>
                {message.deliveryStatus === 'read' && (
                  <span title="Read" className="text-white font-bold">✓✓</span>
                )}
                {message.deliveryStatus === 'delivered' && (
                  <span title="Delivered" className="text-white/70">✓✓</span>
                )}
                {message.deliveryStatus === 'sent' && (
                  <span title="Sent" className="text-white/70">✓</span>
                )}
              </>
            )}
          </div>

          {/* Action Menu Button */}
          {!message.isPending && !message.isFailed && !isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActionMenu(!showActionMenu);
              }}
              className={`absolute -top-2 ${isOwnMessage ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full backdrop-blur-sm ${isOwnMessage ? 'hover:bg-white/20' : 'hover:bg-secondary-200'}`}
            >
              <span className={isOwnMessage ? 'text-white' : 'text-secondary-600'}>⋮</span>
            </button>
          )}

          {/* Action Menu Dropdown - Telegram style */}
          {showActionMenu && (
            <div className={`dropdown ${isOwnMessage ? 'right-0' : 'left-0'} top-8 min-w-[140px]`}>
              <button
                onClick={handleReply}
                className="dropdown-item"
              >
                <span>💬</span>
                <span>Reply</span>
              </button>
              {message.chatId && (
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/chat/${message.chatId}/message/${message.id}`;
                    navigator.clipboard.writeText(url);
                    setShowActionMenu(false);
                  }}
                  className="dropdown-item"
                >
                  <span>🔗</span>
                  <span>Copy link</span>
                </button>
              )}
              {isOwnMessage && (
                <>
                  <button
                    onClick={handleEdit}
                    className="dropdown-item"
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="dropdown-item text-error-600 hover:bg-error-50"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Quick reactions - Telegram style */}
          {showReactions && !isEditing && (
            <div className={`absolute -top-10 ${isOwnMessage ? 'right-0' : 'left-0'} bg-white rounded-xl shadow-medium p-1.5 flex gap-1 z-10 border border-secondary-100`}>
              {['👍', '❤️', '😂', '😮', '😢', '🎉'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="hover:bg-secondary-100 rounded-lg p-1.5 text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(true);
                  setShowReactions(false);
                }}
                className="hover:bg-secondary-100 rounded-lg px-2 text-sm text-secondary-600 transition-colors"
                title="More emojis"
              >
                ➕
              </button>
            </div>
          )}

          {/* Enhanced emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-0 left-0 z-20">
              <EmojiPicker
                onSelect={handleReact}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>

        {/* Reactions display - Telegram style */}
        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {Object.entries(groupedReactions).map(([emoji, reactions]) => {
              const userReaction = reactions.find(r => r.userId === user?.id);
              return (
                <button
                  key={emoji}
                  onClick={() => {
                    if (userReaction) {
                      handleRemoveReaction(userReaction.id);
                    } else {
                      handleReact(emoji);
                    }
                  }}
                  className={`rounded-full px-2.5 py-1 text-xs flex items-center gap-1 transition-all shadow-sm ${
                    userReaction
                      ? 'bg-primary-100 hover:bg-primary-200 border border-primary-400 text-primary-700'
                      : 'bg-white hover:bg-secondary-50 border border-secondary-200'
                  }`}
                  title={`${reactions.length} reaction${reactions.length > 1 ? 's' : ''}`}
                >
                  <span>{emoji}</span>
                  <span className="font-medium">{reactions.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
