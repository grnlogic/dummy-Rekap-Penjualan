"use client";

import { useState, useEffect } from 'react';

export const useNekoAiWelcome = () => {
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // ✅ Default true untuk SSR
  const [isClient, setIsClient] = useState(false); // ✅ Track client-side hydration

  useEffect(() => {
    // ✅ Set client flag setelah hydration
    setIsClient(true);
    
    // ✅ Hanya jalankan localStorage logic di client
    if (typeof window !== 'undefined') {
      // Cek apakah user sudah pernah melihat popup
      const hasSeenBefore = localStorage.getItem('neko-ai-welcome-seen');
      const lastSeenDate = localStorage.getItem('neko-ai-welcome-date');
      const today = new Date().toDateString();

      if (!hasSeenBefore || lastSeenDate !== today) {
        setHasSeenWelcome(false); // ✅ Update state setelah client-side
        // Tampilkan popup setelah 2 detik untuk user experience yang lebih baik
        const timer = setTimeout(() => {
          setShowWelcomePopup(true);
        }, 2001);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
    setHasSeenWelcome(true);
    
    // ✅ Hanya simpan di localStorage di client-side
    if (typeof window !== 'undefined') {
      // Simpan ke localStorage bahwa user sudah melihat popup hari ini
      localStorage.setItem('neko-ai-welcome-seen', 'true');
      localStorage.setItem('neko-ai-welcome-date', new Date().toDateString());
    }
  };

  const handleStartChat = () => {
    handleCloseWelcome();
    return true; // Indicate that chat should be opened
  };

  // Method untuk reset (berguna untuk testing atau admin)
  const resetWelcomeStatus = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('neko-ai-welcome-seen');
      localStorage.removeItem('neko-ai-welcome-date');
    }
    setHasSeenWelcome(false);
    setShowWelcomePopup(true);
  };

  return {
    showWelcomePopup,
    hasSeenWelcome,
    handleCloseWelcome,
    handleStartChat,
    resetWelcomeStatus
  };
};