'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WrongAnswerOverlayProps {
    show: boolean;
}

export default function WrongAnswerOverlay({ show }: WrongAnswerOverlayProps) {
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
                        className="w-32 h-32 rounded-full bg-red-500/90 flex items-center justify-center shadow-2xl"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                        {/* X icon */}
                        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </motion.div>

                    {/* Shake effect rings */}
                    <motion.div
                        className="absolute w-40 h-40 rounded-full border-4 border-red-500/50"
                        initial={{ scale: 0.8, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    />
                    <motion.div
                        className="absolute w-40 h-40 rounded-full border-4 border-red-500/30"
                        initial={{ scale: 0.8, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
