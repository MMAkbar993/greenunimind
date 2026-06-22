import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  User, 
  Bot,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connected');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mockMessages = [
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      sender: 'agent',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      isRead: true
    },
    {
      id: '2',
      content: 'Hi, I\'m having trouble uploading videos to my course.',
      sender: 'user',
      timestamp: new Date(Date.now() - 240000), // 4 minutes ago
      isRead: true
    },
    {
      id: '3',
      content: 'I\'d be happy to help you with that! What file format are you trying to upload?',
      sender: 'agent',
      timestamp: new Date(Date.now() - 180000), // 3 minutes ago
      isRead: true
    },
    {
      id: '4',
      content: 'It\'s an MP4 file, about 500MB in size.',
      sender: 'user',
      timestamp: new Date(Date.now() - 120000), // 2 minutes ago
      isRead: true
    }
  ];

  const [messages, setMessages] = useState(mockMessages);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user' as const,
      timestamp: new Date(),
      isRead: false
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    // Simulate agent typing
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const agentResponse = {
        id: (Date.now() + 1).toString(),
        content: 'Thank you for your message. Let me check that for you...',
        sender: 'agent' as const,
        timestamp: new Date(),
        isRead: true
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connecting':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      case 'connected':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'disconnected':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Agent online';
      case 'disconnected':
        return 'Disconnected';
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-brand-primary hover:bg-brand-primary-dark shadow-lg hover:shadow-xl transition-all duration-300"
          aria-label="Open live chat"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
        
        {/* Notification badge */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
          1
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-300",
      isMinimized ? "w-80" : "w-96"
    )}>
      <Card className="shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <CardHeader className="p-4 bg-brand-primary text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Live Support</CardTitle>
                <div className="flex items-center gap-1 text-xs opacity-90">
                  {getConnectionStatusIcon()}
                  <span>{getConnectionStatusText()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white hover:bg-opacity-20 h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Chat Content */}
        {!isMinimized && (
          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    msg.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.sender === 'agent' && (
                    <div className="w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                      msg.sender === 'user'
                        ? "bg-brand-primary text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    <p>{msg.content}</p>
                    <div className={cn(
                      "text-xs mt-1 opacity-70",
                      msg.sender === 'user' ? "text-right" : "text-left"
                    )}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                  
                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={connectionStatus === 'disconnected'}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || connectionStatus === 'disconnected'}
                  className="bg-brand-primary hover:bg-brand-primary-dark"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {connectionStatus === 'disconnected' && (
                <p className="text-xs text-red-600 mt-2">
                  Connection lost. Trying to reconnect...
                </p>
              )}
            </div>
          </CardContent>
        )}

        {/* Minimized state */}
        {isMinimized && (
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Chat minimized</span>
              <Badge variant="secondary" className="bg-brand-primary text-white">
                {messages.filter(m => m.sender === 'agent' && !m.isRead).length} new
              </Badge>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default LiveChatWidget;
