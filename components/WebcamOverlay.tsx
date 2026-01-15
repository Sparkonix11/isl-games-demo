'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import Webcam from 'react-webcam';

interface WebcamOverlayProps {
    webcamRef: React.RefObject<Webcam | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    isLoaded: boolean;
    prediction: { label: string; score: number } | null;
    holdProgress: number;
    targetLetter?: string;
    onScriptsLoad: () => void;
}

export default function WebcamOverlay({
    webcamRef,
    canvasRef,
    isLoaded,
    prediction,
    holdProgress,
    targetLetter,
    onScriptsLoad,
}: WebcamOverlayProps) {
    const isCorrect = prediction?.label === targetLetter;
    const [scriptsLoaded, setScriptsLoaded] = useState(0);

    // Track when scripts are loaded
    const handleScriptLoad = () => {
        setScriptsLoaded((prev) => prev + 1);
    };

    // When all scripts are loaded AND video is ready, initialize MediaPipe
    useEffect(() => {
        if (scriptsLoaded >= 3 && !isLoaded) {
            // All 3 scripts loaded, try to initialize (hook will handle retry if video not ready)
            onScriptsLoad();
        }
    }, [scriptsLoaded, isLoaded, onScriptsLoad]);

    return (
        <>
            {/* MediaPipe Scripts */}
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
            />

            {/* Webcam Overlay */}
            <div className="webcam-overlay">
                <Webcam
                    ref={webcamRef}
                    mirrored
                    audio={false}
                    videoConstraints={{
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 30, max: 30 },
                    }}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)'
                    }}
                />

                {/* Loading indicator */}
                {!isLoaded && (
                    <div className="webcam-loading">
                        <p className="animate-pulse">LOADING...</p>
                    </div>
                )}

                {/* Detection Badge */}
                {prediction && (
                    <div className={`detection-badge ${isCorrect ? 'correct' : ''}`}>
                        <span className="letter">{prediction.label}</span>
                        <span className="text-xs text-gray-300">
                            {(prediction.score * 100).toFixed(0)}%
                        </span>
                    </div>
                )}

                {/* Hold Progress Bar - Only show for correct letter */}
                {isCorrect && targetLetter && holdProgress > 0 && (
                    <div className="hold-progress">
                        <div
                            className="hold-progress-bar"
                            style={{ width: `${holdProgress}%` }}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
