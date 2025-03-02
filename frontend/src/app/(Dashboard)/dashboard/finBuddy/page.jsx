'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, ThumbsUp, ThumbsDown, MoreVertical, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserButton } from "@clerk/nextjs";
import ReactMarkdown from 'react-markdown';

const ChatMessage = ({ message, isUser }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
          FS
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div className="flex flex-col">
          <div className={`p-3 rounded-lg ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className={`mb-2 last:mb-0 ${isUser ? 'text-white' : 'text-gray-900'}`}>{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-gray-200 text-gray-800 px-1 rounded">{children}</code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{message.timestamp}</span>
            {message.status && (
              <span className="text-xs text-gray-500">✓</span>
            )}
          </div>
        </div>
      </div>
      {isUser && (
        <div className="ml-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add commands help message
  const showHelp = () => {
    setMessages(prev => [...prev, {
      type: 'text',
      content: `Available commands:
- Upload a PDF or image file to analyze it
- Type 'summarize' to get a summary of the current document
- Ask any questions about the uploaded document or financial topics
- Type 'help' to see this message again`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: true,
    }]);
  };

  useEffect(() => {
    // Show welcome message and help on component mount
    setMessages([{
      type: 'text',
      content: `👋 Welcome to FinSaathi AI! I can help you analyze financial documents and answer your questions.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: true,
    }]);
    showHelp();
  }, []);
  
  const handleSend = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage = {
        type: 'text',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: true,
      };

      // Handle special commands
      if (inputValue.toLowerCase() === 'help') {
        setMessages(prev => [...prev, userMessage]);
        showHelp();
        setInputValue('');
        return;
      }
      
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);

      try {
        const response = await fetch('http://localhost:5000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ message: inputValue }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 'success') {
          setMessages(prev => [...prev, data.response]);
        } else {
          throw new Error(data.message || 'Server error');
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = {
          type: 'text',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: true,
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const addLoadingMessage = () => {
    setMessages(prev => [...prev, {
      type: 'text',
      content: '⏳ Processing your document...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: true,
    }]);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setMessages(prev => [...prev, {
        type: 'text',
        content: '❌ File size too large. Please upload files smaller than 10MB.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: true,
      }]);
      return;
    }

    setIsLoading(true);
    addLoadingMessage();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        // Remove loading message
        setMessages(prev => prev.filter(msg => msg.content !== '⏳ Processing your document...'));
        
        setMessages(prev => [...prev, {
          type: 'text',
          content: `📄 Document uploaded successfully: ${file.name}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: true,
        }, data.response]);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev.filter(msg => msg.content !== '⏳ Processing your document...'), {
        type: 'text',
        content: `❌ Error uploading document: ${error.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: true,
      }]);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">FinSaathi AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            isUser={index % 2 === 0}
          />
        ))}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-t">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
        />
        <button 
          className={`p-2 hover:bg-gray-100 rounded-full relative ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 text-xs text-white bg-blue-500 rounded-full px-1">
            PDF
          </span>
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <Copy className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <ThumbsUp className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <ThumbsDown className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask FinSaathi about your finances or upload a document..."
            className="flex-1 bg-transparent outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            className={`p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;