'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GameUIProps {
    word: string;
    emoji: string;
    targetLetter: string;
    score: number;
}

export default function GameUI({ word, emoji, targetLetter, score }: GameUIProps) {
    return (
        <div className="absolute top-0 left-0 right-0 z-50 p-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                {/* Word display */}
                <motion.div
                    className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                >
                    <div className="flex items-center gap-4">
                        {/* Emoji */}
                        <span className="text-5xl">{emoji}</span>

                        {/* Word with highlighted letter */}
                        <div className="flex items-center gap-1">
                            {word.split('').map((char, idx) => (
                                <motion.span
                                    key={idx}
                                    className={`text-3xl font-bold ${char === targetLetter
                                            ? 'text-yellow-500 underline decoration-4 decoration-yellow-400'
                                            : 'text-gray-700'
                                        }`}
                                    animate={char === targetLetter ? {
                                        scale: [1, 1.1, 1],
                                    } : {}}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                    }}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>
                    </div>

                    {/* Instruction */}
                    <p className="text-sm text-gray-500 mt-2 text-center">
                        Sign the letter <span className="font-bold text-yellow-600">{targetLetter}</span> to catch the fish!
                    </p>
                </motion.div>

                {/* Score */}
                <motion.div
                    className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl px-6 py-4 shadow-xl text-white"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
                >
                    <div className="text-sm uppercase tracking-wider opacity-80">Score</div>
                    <motion.div
                        className="text-4xl font-bold"
                        key={score}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        {score}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
