"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  TrendingUp,
  BarChart3,
  PieChart,
  Cat,
} from "lucide-react";

interface NekoAiWelcomePopupProps {
  onStartChat: () => void;
  onClose: () => void;
}

const NekoAiWelcomePopup: React.FC<NekoAiWelcomePopupProps> = ({
  onStartChat,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    // Auto slide carousel
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const slides = [
    {
      icon: <TrendingUp className="h-12 w-12 text-purple-500" />,
      title: "Analisis Data Instan",
      description:
        "Tanya tentang penjualan, tren, performa, atau minta analisis mendalam dari data PERUSAHAAN!",
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-blue-500" />,
      title: "Rekomendasi & Strategi",
      description:
        "Dapatkan saran bisnis, strategi penjualan, dan insight untuk meningkatkan performa!",
    },
    {
      icon: <PieChart className="h-12 w-12 text-green-500" />,
      title: "Chat Bebas & Fleksibel",
      description:
        "Berbicara dengan bahasa sehari-hari, tanya apa saja tentang bisnis dan data Anda!",
    },
  ];

  const handleStartChat = () => {
    setIsVisible(false);
    setTimeout(() => {
      onStartChat();
      onClose();
    }, 300);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header dengan animasi */}
        <div className="relative bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-t-3xl p-6 text-white overflow-hidden">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
              <Cat className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Kenalan dengan NEKO AI! 🐱
            </h2>
            <p className="text-purple-100 text-sm">
              Asisten AI cerdas untuk analisis data PERUSAHAAN
            </p>
          </div>
        </div>

        {/* Content dengan carousel */}
        <div className="p-6">
          <div className="relative h-40 mb-6 overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-transform duration-500 ${
                  index === currentSlide
                    ? "translate-x-0"
                    : index < currentSlide
                    ? "-translate-x-full"
                    : "translate-x-full"
                }`}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-3">{slide.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {slide.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Slide indicators */}
          <div className="flex justify-center space-x-2 mb-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? "bg-purple-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Feature highlights */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                NEKO AI Bisa Membantu:
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></span>
                Analisis penjualan & revenue mendalam
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 bg-pink-400 rounded-full mr-2"></span>
                Tren produk & customer behavior
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                Rekomendasi strategi bisnis
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                Interpretasi dashboard & laporan
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2"></span>
                Pertanyaan umum tentang data
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
                Chat santai dengan AI cerdas
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleStartChat}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              🚀 Mulai Chat dengan NEKO AI
            </button>

            <button
              onClick={handleClose}
              className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm transition-colors"
            >
              Mungkin nanti saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NekoAiWelcomePopup;
