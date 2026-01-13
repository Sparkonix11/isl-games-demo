'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SparklesProps {
    show: boolean;
    x: number;
    y: number;
}

export default function Sparkles({ show, x, y }: SparklesProps) {
    if (!show) return null;

    const sparkleColors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#FF69B4'];

    return (
        <div
            className="fixed pointer-events-none z-[100]"
            style={{ left: x, top: y }}
        >
            <AnimatePresence>
                {Array.from({ length: 16 }).map((_, i) => {
                    const angle = (i / 16) * Math.PI * 2;
                    const distance = 60 + Math.random() * 60;

                    return (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{
                                width: 12,
                                height: 12,
                                backgroundColor: sparkleColors[i % sparkleColors.length],
                                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                            }}
                            initial={{
                                x: 0,
                                y: 0,
                                opacity: 1,
                                scale: 0,
                                rotate: 0,
                            }}
                            animate={{
                                x: Math.cos(angle) * distance,
                                y: Math.sin(angle) * distance,
                                opacity: [1, 1, 0],
                                scale: [0, 1.5, 0],
                                rotate: 360,
                            }}
                            transition={{
                                duration: 0.8,
                                delay: i * 0.03,
                                ease: "easeOut",
                            }}
                        />
                    );
                })}

                {/* Central burst */}
                <motion.div
                    className="absolute w-16 h-16 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, transparent 70%)',
                        transform: 'translate(-50%, -50%)',
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                />
            </AnimatePresence>
        </div>
    );
}
