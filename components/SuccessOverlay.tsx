'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface SuccessOverlayProps {
    show: boolean;
    letter: string;
    word: string;
}

export default function SuccessOverlay({ show, letter, word }: SuccessOverlayProps) {
    React.useEffect(() => {
        if (show) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#00CED1', '#32CD32', '#FF69B4']
            });
        }
    }, [show]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-center"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {/* Success icon */}
                        <motion.div
                            className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: 2 }}
                        >
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>

                        {/* Message */}
                        <motion.h2
                            className="text-3xl font-bold text-gray-800 mb-2"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            Great Job! 🎉
                        </motion.h2>

                        <motion.p
                            className="text-xl text-gray-600"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            You caught <span className="font-bold text-yellow-600">{letter}</span> for <span className="font-bold">{word}</span>!
                        </motion.p>

                        {/* Sparkles */}
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-3 h-3 bg-yellow-400"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                                }}
                                initial={{
                                    x: 0,
                                    y: 0,
                                    scale: 0,
                                    opacity: 1,
                                }}
                                animate={{
                                    x: Math.cos((i / 8) * Math.PI * 2) * 100,
                                    y: Math.sin((i / 8) * Math.PI * 2) * 100,
                                    scale: [0, 1, 0],
                                    opacity: [1, 1, 0],
                                }}
                                transition={{
                                    duration: 0.8,
                                    delay: 0.1 + i * 0.05,
                                }}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
