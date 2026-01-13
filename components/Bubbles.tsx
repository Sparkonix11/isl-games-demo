'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BubblesProps {
    show: boolean;
    x: number;
    y: number;
}

export default function Bubbles({ show, x, y }: BubblesProps) {
    if (!show) return null;

    return (
        <div
            className="fixed pointer-events-none z-[100]"
            style={{ left: x, top: y }}
        >
            <AnimatePresence>
                {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-white/60 border border-white/80"
                        style={{
                            width: 8 + Math.random() * 16,
                            height: 8 + Math.random() * 16,
                        }}
                        initial={{
                            x: 0,
                            y: 0,
                            opacity: 0.8,
                            scale: 1,
                        }}
                        animate={{
                            x: (Math.random() - 0.5) * 100,
                            y: -100 - Math.random() * 100,
                            opacity: 0,
                            scale: 0.3,
                        }}
                        transition={{
                            duration: 1 + Math.random() * 0.5,
                            delay: i * 0.05,
                            ease: "easeOut",
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
