import React, { useState, useRef, KeyboardEvent } from 'react';
import { PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface ReplyMessage {
  id: string;
  senderId?: string;
  sender?: {
    username: string;
  };
  content: string;
}

interface MessageInputProps {
  onSend: (content: string, files?: File[], replyToId?: string) => void;
  onTyping: () => void;
  replyTo?: ReplyMessage;
  onCancelReply?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, onTyping, replyTo, onCancelReply }) => {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!content.trim() && selectedFiles.length === 0) return;

    let formattedContent = content;

    // Apply formatting
    if (isBold) {
      formattedContent = `<strong>${formattedContent}</strong>`;
    }
    if (isItalic) {
      formattedContent = `<em>${formattedContent}</em>`;
    }

    onSend(formattedContent, selectedFiles, replyTo?.id);
    setContent('');
    setSelectedFiles([]);
    setIsBold(false);
    setIsItalic(false);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setSelectedFiles(imageFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-secondary-100 bg-white p-4 shadow-soft">
      {/* Reply Preview - Telegram style */}
      {replyTo && (
        <div className="mb-3 p-3 bg-primary-50 border-l-4 border-primary-500 rounded-lg flex justify-between items-start transition-all duration-200">
          <div className="flex-1">
            <div className="text-xs font-semibold text-primary-700 mb-1">
              Replying to {replyTo.sender?.username || 'Unknown User'}
            </div>
            <div className="text-sm text-secondary-700 truncate">
              {replyTo.content}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="ml-3 text-secondary-400 hover:text-error-600 transition-colors duration-200 w-6 h-6 flex items-center justify-center rounded-full hover:bg-error-50"
            aria-label="Cancel reply"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Selected files preview - Telegram style */}
      {selectedFiles.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-20 w-20 object-cover rounded-xl shadow-soft"
              />
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-error-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium shadow-medium hover:bg-error-600 transition-all duration-200 opacity-90 group-hover:opacity-100"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Formatting buttons - Telegram style */}
        <div className="flex gap-1">
          <button
            onClick={() => setIsBold(!isBold)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
              isBold
                ? 'bg-primary-500 text-white shadow-soft'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
            title="Bold"
            aria-label="Toggle bold"
          >
            <strong className="text-sm">B</strong>
          </button>
          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
              isItalic
                ? 'bg-primary-500 text-white shadow-soft'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
            title="Italic"
            aria-label="Toggle italic"
          >
            <em className="text-sm">I</em>
          </button>
        </div>

        {/* Text input - Telegram style */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 resize-none rounded-xl border border-secondary-200 bg-white px-4 py-3 text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200"
          rows={1}
          style={{ maxHeight: '120px' }}
        />

        {/* Image upload - Telegram style */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-secondary-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
          title="Attach image"
          aria-label="Attach image"
        >
          <PhotoIcon className="w-6 h-6" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Send button - Telegram style */}
        <button
          onClick={handleSend}
          disabled={!content.trim() && selectedFiles.length === 0}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-500 text-white hover:bg-primary-600 disabled:bg-secondary-300 disabled:cursor-not-allowed shadow-soft hover:shadow-medium transition-all duration-200 disabled:shadow-none"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
