'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface WaterBackgroundProps {
    fullHeight?: boolean;
}

// Pre-computed bubble configurations to avoid hydration mismatch
const BUBBLE_CONFIG = [
    { width: 6, height: 8, left: 15, duration: 10, delay: 2 },
    { width: 10, height: 6, left: 35, duration: 12, delay: 0 },
    { width: 8, height: 10, left: 55, duration: 9, delay: 4 },
    { width: 5, height: 7, left: 75, duration: 14, delay: 1 },
    { width: 11, height: 9, left: 25, duration: 11, delay: 6 },
    { width: 7, height: 11, left: 45, duration: 8, delay: 3 },
    { width: 9, height: 5, left: 65, duration: 13, delay: 5 },
    { width: 6, height: 8, left: 85, duration: 10, delay: 7 },
    { width: 10, height: 7, left: 10, duration: 15, delay: 8 },
    { width: 8, height: 9, left: 50, duration: 9, delay: 9 },
    { width: 5, height: 6, left: 70, duration: 12, delay: 1 },
    { width: 11, height: 10, left: 30, duration: 11, delay: 4 },
    { width: 7, height: 8, left: 90, duration: 14, delay: 2 },
    { width: 9, height: 6, left: 20, duration: 10, delay: 6 },
    { width: 6, height: 11, left: 60, duration: 13, delay: 3 },
];

export default function WaterBackground({ fullHeight = false }: WaterBackgroundProps) {
    return (
        <div className={`absolute inset-0 overflow-hidden ${fullHeight ? 'h-full' : ''}`}>
            {/* Sky gradient at top */}
            <div
                className="absolute top-0 left-0 right-0 h-[25%]"
                style={{
                    background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #E0F4FF 100%)'
                }}
            />

            {/* Sun */}
            <motion.div
                className="absolute top-8 right-12 w-20 h-20 rounded-full"
                style={{
                    background: 'radial-gradient(circle, #FFD700 0%, #FFA500 100%)',
                    boxShadow: '0 0 60px 20px rgba(255, 215, 0, 0.4)'
                }}
                animate={{
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Water area */}
            <div
                className="absolute left-0 right-0 bottom-0"
                style={{
                    top: '20%',
                    background: 'linear-gradient(180deg, #4FC3F7 0%, #0288D1 30%, #01579B 70%, #003366 100%)'
                }}
            >
                {/* Wave layers */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Top wave 1 */}
                    <svg
                        className="absolute -top-8 left-0 w-[200%] h-20 animate-wave"
                        viewBox="0 0 1440 54"
                        preserveAspectRatio="none"
                    >
                        <path
                            fill="rgba(255, 255, 255, 0.3)"
                            d="M0,32 C320,64 480,0 720,32 C960,64 1120,0 1440,32 L1440,0 L0,0 Z"
                        />
                    </svg>

                    {/* Top wave 2 */}
                    <svg
                        className="absolute -top-4 left-0 w-[200%] h-16 animate-wave-reverse"
                        style={{ animationDelay: '-2s' }}
                        viewBox="0 0 1440 54"
                        preserveAspectRatio="none"
                    >
                        <path
                            fill="rgba(255, 255, 255, 0.2)"
                            d="M0,22 C360,44 540,0 720,22 C900,44 1080,0 1440,22 L1440,0 L0,0 Z"
                        />
                    </svg>
                </div>

                {/* Underwater caustics effect */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `
              radial-gradient(ellipse 100px 100px at 20% 30%, rgba(255,255,255,0.5) 0%, transparent 50%),
              radial-gradient(ellipse 80px 80px at 60% 50%, rgba(255,255,255,0.4) 0%, transparent 50%),
              radial-gradient(ellipse 120px 120px at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)
            `,
                    }}
                />

                {/* Ambient bubbles - using pre-computed values */}
                {BUBBLE_CONFIG.map((bubble, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-white/20"
                        style={{
                            width: bubble.width,
                            height: bubble.height,
                            left: `${bubble.left}%`,
                            bottom: 0,
                        }}
                        initial={{
                            y: 0,
                            opacity: 0.3,
                        }}
                        animate={{
                            y: '-100vh',
                            opacity: 0,
                        }}
                        transition={{
                            duration: bubble.duration,
                            repeat: Infinity,
                            delay: bubble.delay,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

