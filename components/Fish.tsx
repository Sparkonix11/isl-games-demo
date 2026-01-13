'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

// Fish color palettes for variety
const FISH_COLORS = [
    { body: '#FF6B6B', accent: '#FF8E8E', fin: '#E55555' },
    { body: '#4ECDC4', accent: '#7EDDD6', fin: '#3DBDB5' },
    { body: '#FFD93D', accent: '#FFE566', fin: '#E6C235' },
    { body: '#6BCB77', accent: '#8FD99A', fin: '#5AB866' },
    { body: '#9B59B6', accent: '#B47CC7', fin: '#8A4AA5' },
    { body: '#3498DB', accent: '#5DADE2', fin: '#2E86C1' },
    { body: '#E67E22', accent: '#F39C12', fin: '#D35400' },
];

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
    const colors = FISH_COLORS[index % FISH_COLORS.length];
    const fishSize = 80;
    const swimDuration = 12 + (index * 2);

    return (
        <AnimatePresence>
            <motion.div
                className="absolute pointer-events-none"
                style={{
                    top: `${yPosition}%`,
                    left: swimDirection > 0 ? '-120px' : 'calc(100% + 40px)',
                }}
                initial={{
                    x: 0,
                    opacity: 1,
                }}
                animate={
                    isJumping
                        ? {
                            y: [-20, -150, -300],
                            x: swimDirection > 0 ? ['0vw', '50vw', '100vw'] : ['0vw', '-50vw', '-100vw'],
                            rotate: [0, -20, -40],
                            scale: [1, 1.2, 0.8],
                            opacity: [1, 1, 0],
                        }
                        : {
                            x: swimDirection > 0 ? '100vw' : '-100vw',
                        }
                }
                transition={
                    isJumping
                        ? {
                            duration: 1,
                            ease: "easeOut",
                        }
                        : {
                            duration: swimDuration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: index * 1.5,
                        }
                }
                onAnimationComplete={isJumping ? onAnimationComplete : undefined}
            >
                {/* Fish container with swim animation */}
                <motion.div
                    className={`relative ${isWiggling ? 'animate-fish-wiggle' : ''}`}
                    animate={!isJumping ? {
                        y: [0, -8, 0, 8, 0],
                        rotate: [0, 2, 0, -2, 0],
                    } : {}}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        transform: swimDirection < 0 ? 'scaleX(-1)' : 'scaleX(1)',
                    }}
                >
                    {/* Fish SVG */}
                    <svg
                        width={fishSize}
                        height={fishSize * 0.6}
                        viewBox="0 0 100 60"
                    >
                        {/* Tail fin */}
                        <motion.path
                            d="M5,30 Q15,10 25,30 Q15,50 5,30"
                            fill={colors.fin}
                            animate={{
                                d: [
                                    "M5,30 Q15,10 25,30 Q15,50 5,30",
                                    "M5,30 Q20,15 25,30 Q20,45 5,30",
                                    "M5,30 Q15,10 25,30 Q15,50 5,30",
                                ]
                            }}
                            transition={{
                                duration: 0.4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />

                        {/* Body */}
                        <ellipse
                            cx="55"
                            cy="30"
                            rx="35"
                            ry="25"
                            fill={colors.body}
                        />

                        {/* Body shimmer */}
                        <ellipse
                            cx="50"
                            cy="25"
                            rx="25"
                            ry="12"
                            fill={colors.accent}
                            opacity={0.6}
                        />

                        {/* Top fin */}
                        <path
                            d="M45,5 Q55,10 60,8 Q55,20 45,20"
                            fill={colors.fin}
                        />

                        {/* Eye */}
                        <circle cx="75" cy="25" r="8" fill="white" />
                        <circle cx="77" cy="24" r="4" fill="#333" />
                        <circle cx="78" cy="22" r="1.5" fill="white" />

                        {/* Mouth */}
                        <path
                            d="M88,32 Q92,35 88,38"
                            stroke="#333"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Letter bubble */}
                    <motion.div
                        className={`absolute -top-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${isTarget
                                ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-300'
                                : 'bg-white text-gray-700'
                            }`}
                        style={{
                            transform: swimDirection < 0 ? 'translateX(-50%) scaleX(-1)' : 'translateX(-50%)',
                        }}
                        animate={{
                            y: [0, -4, 0],
                            scale: isTarget ? [1, 1.1, 1] : 1,
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <span style={{ transform: swimDirection < 0 ? 'scaleX(-1)' : 'scaleX(1)' }}>
                            {letter}
                        </span>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
