import React, { useState, useRef, KeyboardEvent } from 'react';
import { 
  PaperAirplaneIcon, 
  PhotoIcon,
} from '@heroicons/react/24/outline';

interface MessageInputProps {
  onSend: (content: string, files?: File[]) => void;
  onTyping: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, onTyping }) => {
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

    onSend(formattedContent, selectedFiles);
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
    <div className="border-t bg-white p-4">
      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-20 w-20 object-cover rounded"
              />
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Formatting buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => setIsBold(!isBold)}
            className={`p-2 rounded hover:bg-gray-100 ${isBold ? 'bg-gray-200' : ''}`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`p-2 rounded hover:bg-gray-100 ${isItalic ? 'bg-gray-200' : ''}`}
            title="Italic"
          >
            <em>I</em>
          </button>
        </div>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 resize-none border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
          style={{ maxHeight: '120px' }}
        />

        {/* Image upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-gray-100"
          title="Attach image"
        >
          <PhotoIcon className="w-6 h-6 text-gray-600" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim() && selectedFiles.length === 0}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
