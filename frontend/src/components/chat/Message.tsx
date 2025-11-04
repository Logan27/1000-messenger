import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api.service';
import { EmojiPicker } from './EmojiPicker';
import { useMessageRead } from '../../hooks/useMessageRead';

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
    // Will be handled by parent component (ChatWindow) via custom event
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
    // Inline Edit Mode
    if (isEditing) {
      return (
        <div className="space-y-2 w-full">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
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
            <div className="grid grid-cols-2 gap-2">
              {images.map((img, idx: number) => (
                <img
                  key={idx}
                  src={img.url}
                  alt="Uploaded"
                  className="rounded cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openLightbox(idx)}
                />
              ))}
            </div>
          </div>

          {/* Lightbox */}
          {lightboxOpen && (
            <div
              className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
              onClick={closeLightbox}
            >
              <button
                onClick={e => {
                  e.stopPropagation();
                  closeLightbox();
                }}
                className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
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
                    className="absolute left-4 text-white text-3xl hover:text-gray-300"
                  >
                    ‹
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      nextImage(images);
                    }}
                    className="absolute right-4 text-white text-3xl hover:text-gray-300"
                  >
                    ›
                  </button>
                </>
              )}

              <img
                src={images[lightboxIndex].originalUrl}
                alt="Full size"
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={e => e.stopPropagation()}
              />

              <div className="absolute bottom-4 text-white">
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
    <div ref={messageRef} className={`flex gap-2 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {senderAvatar ? (
          <img src={senderAvatar} alt={senderName} className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-medium">{senderName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Message bubble */}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium">{senderName}</span>
          <span className="text-xs text-gray-500">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {message.isEdited && <span className="text-xs text-gray-400">(edited)</span>}
          {message.isPending && <span className="text-xs text-gray-400">⏳ Sending...</span>}
          {message.isFailed && <span className="text-xs text-red-500">❌ Failed</span>}
        </div>

        {/* Delivery status for own messages */}
        {isOwnMessage && !message.isPending && !message.isFailed && (
          <div className="flex items-center gap-1 mb-1">
            {message.deliveryStatus === 'read' && (
              <span className="text-xs text-blue-500" title="Read">
                ✓✓
                {message.readCount && message.readCount.total > 0 && (
                  <span className="ml-1">
                    Read by {message.readCount.read} of {message.readCount.total}
                  </span>
                )}
              </span>
            )}
            {message.deliveryStatus === 'delivered' && (
              <span className="text-xs text-gray-400" title="Delivered">
                ✓✓
              </span>
            )}
            {message.deliveryStatus === 'sent' && (
              <span className="text-xs text-gray-400" title="Sent">
                ✓
              </span>
            )}
          </div>
        )}

        <div
          className={`relative group max-w-md px-4 py-2 rounded-lg ${
            message.isFailed
              ? 'bg-red-100 border border-red-300'
              : message.isPending
                ? 'bg-gray-100 opacity-60'
                : isOwnMessage
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200'
          }`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {/* Reply Preview */}
          {message.replyTo && (
            <div className={`mb-2 pb-2 border-l-4 pl-2 text-xs ${isOwnMessage ? 'border-blue-300' : 'border-gray-300'}`}>
              <div className={`font-medium ${isOwnMessage ? 'text-blue-100' : 'text-gray-600'}`}>
                {message.replyTo.sender?.username || 'Unknown User'}
              </div>
              <div className={`truncate ${isOwnMessage ? 'text-blue-100 opacity-80' : 'text-gray-500'}`}>
                {message.replyTo.content}
              </div>
            </div>
          )}

          {renderContent()}

          {/* Action Menu Button */}
          {!message.isPending && !message.isFailed && !isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActionMenu(!showActionMenu);
              }}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
            >
              <span className="text-gray-600">⋮</span>
            </button>
          )}

          {/* Action Menu Dropdown */}
          {showActionMenu && (
            <div className="absolute top-8 right-0 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              <button
                onClick={handleReply}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
              >
                Reply
              </button>
              {isOwnMessage && (
                <>
                  <button
                    onClick={handleEdit}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {/* Quick reactions + emoji picker button */}
          {showReactions && !isEditing && (
            <div className="absolute -top-8 left-0 bg-white border rounded-lg shadow-lg p-2 flex gap-1 z-10">
              {['👍', '❤️', '😂', '😮', '😢', '🎉'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="hover:bg-gray-100 rounded p-1 text-lg"
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
                className="hover:bg-gray-100 rounded px-2 text-sm text-gray-600"
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

        {/* Reactions display */}
        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
          <div className="flex gap-1 mt-1">
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
                  className={`rounded-full px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                    userReaction
                      ? 'bg-blue-200 hover:bg-blue-300 border border-blue-400'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={`${reactions.length} reaction${reactions.length > 1 ? 's' : ''}`}
                >
                  <span>{emoji}</span>
                  <span>{reactions.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
