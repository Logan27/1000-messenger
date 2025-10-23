import React, { useState } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api.service';

interface MessageProps {
  message: {
    id: string;
    senderId: string;
    content: string;
    contentType: string;
    metadata?: any;
    createdAt: string;
    isEdited: boolean;
    reactions?: Array<{ id: string; emoji: string; userId: string }>;
  };
  senderName: string;
  senderAvatar?: string;
}

export const Message: React.FC<MessageProps> = ({ 
  message, 
  senderName, 
  senderAvatar 
}) => {
  const { user } = useAuthStore();
  const [showReactions, setShowReactions] = useState(false);
  const isOwnMessage = message.senderId === user?.id;

  const handleAddReaction = async (emoji: string) => {
    try {
      await apiService.addReaction(message.id, emoji);
      setShowReactions(false);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const renderContent = () => {
    if (message.contentType === 'image' && message.metadata?.images) {
      return (
        <div className="space-y-2">
          {message.content && (
            <div dangerouslySetInnerHTML={{ __html: message.content }} />
          )}
          <div className="grid grid-cols-2 gap-2">
            {message.metadata.images.map((img: any, idx: number) => (
              <img
                key={idx}
                src={img.url}
                alt="Uploaded"
                className="rounded cursor-pointer hover:opacity-90"
                onClick={() => window.open(img.originalUrl, '_blank')}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: message.content }}
        className="break-words"
      />
    );
  };

  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);

  return (
    <div className={`flex gap-2 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {senderAvatar ? (
          <img
            src={senderAvatar}
            alt={senderName}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-medium">
              {senderName.charAt(0).toUpperCase()}
            </span>
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
          {message.isEdited && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>

        <div
          className={`relative group max-w-md px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200'
          }`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {renderContent()}

          {/* Reaction picker */}
          {showReactions && (
            <div className="absolute -top-8 left-0 bg-white border rounded-lg shadow-lg p-2 flex gap-1">
              {['👍', '❤️', '😂', '😮', '😢', '🎉'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(emoji)}
                  className="hover:bg-gray-100 rounded p-1 text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reactions display */}
        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
          <div className="flex gap-1 mt-1">
            {Object.entries(groupedReactions).map(([emoji, reactions]) => (
              <div
                key={emoji}
                className="bg-gray-100 rounded-full px-2 py-1 text-xs flex items-center gap-1"
                title={reactions.map(r => r.userId).join(', ')}
              >
                <span>{emoji}</span>
                <span>{reactions.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
