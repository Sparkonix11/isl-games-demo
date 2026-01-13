'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Pre-computed bubble configurations to avoid hydration mismatch
const START_BUBBLES = [
    { width: 35, height: 45, left: 5, xDrift: -30, duration: 10, delay: 0 },
    { width: 50, height: 38, left: 15, xDrift: 40, duration: 14, delay: 1 },
    { width: 28, height: 52, left: 25, xDrift: -20, duration: 12, delay: 2 },
    { width: 45, height: 32, left: 35, xDrift: 35, duration: 9, delay: 0.5 },
    { width: 55, height: 48, left: 45, xDrift: -45, duration: 16, delay: 3 },
    { width: 30, height: 42, left: 55, xDrift: 25, duration: 11, delay: 1.5 },
    { width: 42, height: 55, left: 65, xDrift: -35, duration: 13, delay: 2.5 },
    { width: 48, height: 35, left: 75, xDrift: 50, duration: 10, delay: 4 },
    { width: 32, height: 28, left: 85, xDrift: -15, duration: 15, delay: 0.8 },
    { width: 58, height: 50, left: 10, xDrift: 20, duration: 12, delay: 3.5 },
    { width: 25, height: 38, left: 20, xDrift: -40, duration: 14, delay: 1.2 },
    { width: 40, height: 45, left: 30, xDrift: 30, duration: 11, delay: 4.5 },
    { width: 52, height: 30, left: 50, xDrift: -25, duration: 9, delay: 2.2 },
    { width: 38, height: 52, left: 60, xDrift: 45, duration: 13, delay: 0.3 },
    { width: 45, height: 40, left: 70, xDrift: -50, duration: 10, delay: 3.8 },
    { width: 30, height: 35, left: 80, xDrift: 15, duration: 16, delay: 1.8 },
    { width: 55, height: 48, left: 90, xDrift: -30, duration: 12, delay: 4.2 },
    { width: 42, height: 55, left: 40, xDrift: 35, duration: 14, delay: 2.8 },
    { width: 35, height: 32, left: 95, xDrift: -20, duration: 11, delay: 0.6 },
    { width: 48, height: 42, left: 8, xDrift: 40, duration: 15, delay: 3.2 },
];

interface StartScreenProps {
    show: boolean;
    onStart: () => void;
}

export default function StartScreen({ show, onStart }: StartScreenProps) {
    if (!show) return null;

    return (
        <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-b from-sky-400 via-blue-500 to-blue-800"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Animated bubbles background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {START_BUBBLES.map((bubble, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-white/10"
                        style={{
                            width: bubble.width,
                            height: bubble.height,
                            left: `${bubble.left}%`,
                            bottom: -50,
                        }}
                        initial={{
                            y: 0,
                            x: 0,
                        }}
                        animate={{
                            y: '-110vh',
                            x: bubble.xDrift,
                        }}
                        transition={{
                            duration: bubble.duration,
                            repeat: Infinity,
                            delay: bubble.delay,
                            ease: "linear",
                        }}
                    />
                ))}
            </div>

            <motion.div
                className="text-center z-10 relative px-8"
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
            >
                {/* Fish decoration */}
                <motion.div
                    className="text-8xl mb-4"
                    animate={{
                        y: [0, -20, 0],
                        rotate: [0, 5, 0, -5, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    🐠
                </motion.div>

                {/* Game title */}
                <motion.h1
                    className="text-6xl md:text-7xl font-bold text-white mb-4"
                    style={{
                        textShadow: '4px 4px 0 rgba(0,0,0,0.2), 8px 8px 0 rgba(0,0,0,0.1)'
                    }}
                >
                    Alphabet Fishing
                </motion.h1>

                <motion.p
                    className="text-2xl text-white/90 mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    ISL Edition ✋
                </motion.p>

                <motion.p
                    className="text-lg text-white/70 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Catch fish by signing letters in Indian Sign Language!
                </motion.p>

                {/* Instructions */}
                <motion.div
                    className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="space-y-3 text-left">
                        <div className="flex items-center gap-3 text-white">
                            <span className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-sm font-bold text-yellow-900">1</span>
                            <span>Look at the word and find the highlighted letter</span>
                        </div>
                        <div className="flex items-center gap-3 text-white">
                            <span className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-sm font-bold text-yellow-900">2</span>
                            <span>Sign that letter using ISL in your webcam</span>
                        </div>
                        <div className="flex items-center gap-3 text-white">
                            <span className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-sm font-bold text-yellow-900">3</span>
                            <span>Hold the sign steady to catch the fish!</span>
                        </div>
                    </div>
                </motion.div>

                {/* Start button */}
                <motion.button
                    className="px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-2xl font-bold rounded-full shadow-xl hover:shadow-2xl transition-shadow"
                    onClick={onStart}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    Start Playing! 🎣
                </motion.button>

                {/* Note about webcam */}
                <motion.p
                    className="mt-6 text-sm text-white/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    📷 Webcam access required for gesture recognition
                </motion.p>
            </motion.div>
        </motion.div>
    );
}
