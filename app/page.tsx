'use client';

import React, { useState } from 'react';
import FishingGame from '@/components/FishingGame';
import TrainGame from '@/components/train/TrainGame';

export default function Home() {
    const [game, setGame] = useState<'menu' | 'fishing' | 'train'>('menu');

    if (game === 'menu') {
        return (
            <div className="w-screen h-screen overflow-hidden flex items-center justify-center bg-gradient-to-b from-sky-400 via-blue-500 to-blue-900">
                <div className="max-w-3xl w-full px-6">
                    <div className="text-center mb-10">
                        <div className="text-6xl mb-3">🎮</div>
                        <h1 className="text-5xl font-bold text-white drop-shadow">Choose a game</h1>
                        <p className="text-white/80 mt-2">Pick what you want to play: Fishing (ISL) or Train (Keyboard).</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            type="button"
                            onClick={() => setGame('fishing')}
                            className="group text-left rounded-3xl p-6 bg-white/15 backdrop-blur border border-white/25 hover:bg-white/20 transition"
                        >
                            <div className="text-4xl mb-3">🐠</div>
                            <div className="text-2xl font-bold text-white">Alphabet Fishing</div>
                            <div className="text-white/80 mt-1">Play using your webcam + ISL gestures.</div>
                            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20">Webcam</span>
                                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20">ISL</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setGame('train')}
                            className="group text-left rounded-3xl p-6 bg-white/15 backdrop-blur border border-white/25 hover:bg-white/20 transition"
                        >
                            <div className="text-4xl mb-3">🚂</div>
                            <div className="text-2xl font-bold text-white">Alphabet Train</div>
                            <div className="text-white/80 mt-1">Sign the missing letter using ISL in your webcam.</div>
                            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20">Webcam</span>
                                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20">ISL</span>
                            </div>
                        </button>
                    </div>

                    <div className="text-center text-white/60 text-sm mt-10">
                        Tip: You can always come back here using the Back button.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {game === 'fishing' ? <FishingGame /> : <TrainGame />}
            <button
                type="button"
                onClick={() => setGame('menu')}
                className="fixed top-4 left-4 z-[400] px-4 py-2 rounded-full bg-black/40 text-white border border-white/20 backdrop-blur hover:bg-black/50 transition"
            >
                ← Back
            </button>
        </>
    );
}
