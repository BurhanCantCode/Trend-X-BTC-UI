'use client'

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import dynamic from 'next/dynamic';

interface Bitcoin {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
}

function FloatingBitcoins() {
  const [bitcoins, setBitcoins] = useState<Bitcoin[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateBitcoins = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Reduced from 20 to 10 for better performance
      const newBitcoins = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        size: Math.random() * 20 + 10,
        speed: Math.random() * 2 + 1, // Slightly faster animation
      }));
      setBitcoins(newBitcoins);
    };

    updateBitcoins();
    // Debounce resize events
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateBitcoins, 250);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0" ref={containerRef}>
      {bitcoins.map((bitcoin, index) => (
        <motion.div
          key={`bitcoin-${index}`}
          initial={{
            x: -20,
            y: -20,
            rotate: 0,
            scale: 0
          }}
          animate={{
            x: bitcoin.x,
            y: bitcoin.y,
            rotate: 0,
            scale: bitcoin.size,
          }}
          transition={{
            duration: bitcoin.speed,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute text-[#F7931A]/20 text-4xl"
          style={{ left: 0, top: 0 }}
        >
          ₿
        </motion.div>
      ))}
    </div>
  );
}

// Export a client-side only version of the component
export default dynamic(() => Promise.resolve(FloatingBitcoins), {
  ssr: false
}); 