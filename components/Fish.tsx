'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface FishProps {
    letter: string;
    isTarget: boolean;
    isJumping: boolean;
    isWiggling: boolean;
    index: number;
    swimDirection: number;
    yPosition: number;
    onAnimationComplete?: () => void;
}

export default function Fish({
    letter,
    isTarget,
    isJumping,
    isWiggling,
    index,
    swimDirection,
    yPosition,
    onAnimationComplete,
}: FishProps) {
    const [swimDuration] = useState(() => 12 + Math.random() * 8);
    const [floatOffset] = useState(() => Math.random() * Math.PI * 2);
    
    // Randomly select between 4 fish types (25% each)
    const [fishImage] = useState(() => {
        const rand = Math.random();
        if (rand < 0.25) return '/fish-nemo.svg';           // 25% orange
        if (rand < 0.5) return '/fish-nemo-blue.svg';      // 25% blue
        if (rand < 0.75) return '/fish-nemo-green.svg';     // 25% green
        return '/fish-nemo-yellow.svg';                     // 25% yellow
    });
    
    // Calculate starting position based on direction - use useMemo to recalculate when needed
    const { startX, endX } = useMemo(() => {
        if (typeof window === 'undefined') {
            return { startX: -150, endX: 1000 };
        }
        // Fish SVG faces right by default (eye left, tail right)
        // swimDirection > 0: facing right, swim left to right
        // swimDirection < 0: facing left (flipped), swim right to left
        const startX = swimDirection > 0 ? -150 : window.innerWidth + 150;
        const endX = swimDirection > 0 ? window.innerWidth + 150 : -150;
        return { startX, endX };
    }, [swimDirection]);

    return (
        <motion.div
            className="absolute cursor-pointer z-50"
            style={{ top: `${yPosition}%` }}
            initial={{ x: startX }}
            animate={
                isJumping 
                    ? { 
                        y: [0, -150, -250],
                        scale: [1, 1.4, 1.6],
                        opacity: [1, 1, 0],
                        x: undefined // Preserve current x position
                    }
                    : isWiggling 
                        ? { x: 'auto' }
                        : { x: endX }
            }
            transition={
                isJumping 
                    ? { 
                        duration: 1,
                        ease: "easeOut",
                        times: [0, 0.4, 1]
                    }
                    : { 
                        duration: swimDuration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: index * 0.5
                    }
            }
            onAnimationComplete={() => {
                if (isJumping && onAnimationComplete) {
                    onAnimationComplete();
                }
            }}
        >
            {/* Floating motion wrapper */}
            <motion.div
                animate={
                    isWiggling 
                        ? { rotate: [-10, 10, -10, 10, 0] }
                        : { y: [0, -8, 0, 8, 0] }
                }
                transition={
                    isWiggling
                        ? { duration: 0.5, ease: "easeInOut" }
                        : {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: floatOffset
                        }
                }
            >
                {/* Glow effect for jumping fish */}
                {isJumping && (
                    <motion.div
                        className="absolute inset-0 -m-4 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(255,224,102,0.8) 0%, transparent 70%)',
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 2, opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8 }}
                    />
                )}
                
                {/* Fish Image Container */}
                <div 
                    className="relative"
                    style={{ 
                        width: '150px',
                        height: '150px',
                        filter: isJumping ? 'drop-shadow(0 0 20px rgba(255,224,102,0.8))' : 'drop-shadow(2px 4px 6px rgba(0,0,0,0.2))'
                    }}
                >
                    {/* Fish Nemo SVG - randomly orange, blue, green, or yellow */}
                    <img 
                        src={fishImage} 
                        alt="fish"
                        className="w-full h-full object-contain"
                        style={{ 
                            imageRendering: 'auto',
                            transform: swimDirection < 0 ? 'scaleX(-1)' : 'none',
                        }}
                    />
                    
                    {/* Letter overlay - outside the flipped container */}
                    <div 
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        {/* Letter circle background */}
                        <div 
                            className="absolute rounded-full bg-white opacity-90"
                            style={{
                                width: '50px',
                                height: '50px',
                            }}
                        />
                        
                        {/* Letter */}
                        <span 
                            className="relative z-10 text-3xl font-bold"
                            style={{ 
                                fontFamily: 'Fredoka, sans-serif',
                                color: '#333',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                            }}
                        >
                            {letter}
                        </span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
