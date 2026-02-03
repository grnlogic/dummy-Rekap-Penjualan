"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Cat,
  Minimize2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import NekoAiWelcomePopup from "./NekoAiWelcomePopup";
import { nekoAiService } from "@/app/services/nekoAiService";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean;
}

interface NekoAiChatProps {
  dashboardData?: any;
}

const NekoAiChat: React.FC<NekoAiChatProps> = ({ dashboardData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "error"
  >("connected");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Test koneksi saat pertama kali buka
  useEffect(() => {
    if (isOpen && connectionStatus === "connected") {
      testConnection();
    }
  }, [isOpen]);

  const testConnection = async () => {
    setConnectionStatus("connecting");
    try {
      const isConnected = await nekoAiService.testConnection();
      setConnectionStatus(isConnected ? "connected" : "error");
    } catch (error) {
      setConnectionStatus("error");
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText("");
    setIsTyping(true);

    try {
      // Enhanced dashboard data dengan informasi lebih lengkap
      const enhancedDashboardData = {
        ...dashboardData,
        requestTimestamp: new Date().toISOString(),
        userQuery: currentInput,
        sessionInfo: {
          chatLength: messages.length,
          lastInteraction: new Date().toISOString(),
        },
      };

      const response = await nekoAiService.sendMessage(
        currentInput,
        enhancedDashboardData
      );

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setConnectionStatus("connected");
    } catch (error) {
      console.error("Error sending message:", error);

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Nyaa~ 🐱 Maaf, sepertinya ada masalah koneksi atau saat mengambil data. Coba lagi dalam beberapa saat ya!",
        isUser: false,
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorResponse]);
      setConnectionStatus("error");
    } finally {
      setIsTyping(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        text: "Halo! Saya NEKO AI 🐱\n\nSaya siap membantu Anda menganalisis data penjualan PERUSAHAAN dengan data real-time!\n\nSaya bisa:\n- Menganalisis data penjualan terkini\n- Memberikan insight berdasarkan data asli\n- Menjawab pertanyaan tentang performa sales\n- Analisis tren produk dan customer\n- Rekomendasi berdasarkan data real\n\nSemua jawaban saya berdasarkan data terbaru dari sistem! Silakan tanya apa saja, nyaa~! 🎯",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const clearChat = () => {
    setMessages([]);
    nekoAiService.clearHistory();
    const welcomeMessage: Message = {
      id: "welcome-" + Date.now(),
      text: "Chat sudah dibersihkan! Nyaa~ 🐱 Ada yang bisa saya bantu lagi?",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  if (!isOpen) {
    return (
      <>
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group animate-pulse hover:animate-none"
          title="Chat dengan NEKO AI"
        >
          <Cat className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </button>

        {showWelcome && (
          <NekoAiWelcomePopup
            onStartChat={() => {
              setShowWelcome(false);
              handleOpen();
            }}
            onClose={() => setShowWelcome(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl border border-gray-200 z-40 transition-all duration-300 ${
          isMinimized ? "h-14" : "h-96"
        } w-80`}
      >
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Cat className="h-5 w-5" />
            <span className="font-medium">NEKO AI</span>
            {connectionStatus === "connecting" && <LoadingSpinner size="sm" />}
            {connectionStatus === "error" && (
              <AlertCircle className="h-4 w-4 text-yellow-300" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isMinimized && (
              <button
                onClick={clearChat}
                className="p-1 hover:bg-white/20 rounded"
                title="Bersihkan chat"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.isUser
                        ? "bg-purple-500 text-white"
                        : message.isError
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg text-sm flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>NEKO sedang menganalisis data real-time...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200">
              {connectionStatus === "error" && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center justify-between">
                  <span>Koneksi bermasalah</span>
                  <button
                    onClick={testConnection}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
              )}

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Tanya tentang data penjualan..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  disabled={isTyping || connectionStatus === "connecting"}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={
                    !inputText.trim() ||
                    isTyping ||
                    connectionStatus === "connecting"
                  }
                  className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default NekoAiChat;
