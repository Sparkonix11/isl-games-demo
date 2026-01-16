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
    showLoading?: boolean; // Control whether to show loading indicator
    webcamKey?: string | number; // Unique key for webcam element to force remount
}

export default function WebcamOverlay({
    webcamRef,
    canvasRef,
    isLoaded,
    prediction,
    holdProgress,
    targetLetter,
    onScriptsLoad,
    showLoading = true, // Default to true for backward compatibility
    webcamKey, // Unique key for webcam element
}: WebcamOverlayProps) {
    const isCorrect = prediction?.label === targetLetter;
    const [scriptsLoaded, setScriptsLoaded] = useState(0);
    const prevWebcamKeyRef = React.useRef<string | number | undefined>(webcamKey);
    
    // Check if scripts are already loaded (when switching games)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Hands && window.Camera && window.drawConnectors) {
            // Scripts are already loaded from previous game
            setScriptsLoaded(3);
        }
    }, []);

    // Handle webcam key changes
    useEffect(() => {
        if (webcamKey && webcamKey !== prevWebcamKeyRef.current && prevWebcamKeyRef.current !== undefined) {
            // Webcam key changed (switching games)
            prevWebcamKeyRef.current = webcamKey;
            // Check if scripts are loaded, then trigger re-initialization
            if (typeof window !== 'undefined' && window.Hands && window.Camera && window.drawConnectors) {
                // Scripts already loaded, trigger initialization after webcam is ready
                const timer = setTimeout(() => {
                    onScriptsLoad();
                }, 300);
                return () => clearTimeout(timer);
            } else {
                // Scripts not loaded yet, wait for them
                setScriptsLoaded(0);
            }
        } else if (!prevWebcamKeyRef.current && webcamKey) {
            prevWebcamKeyRef.current = webcamKey;
        }
    }, [webcamKey, onScriptsLoad]);

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
                    key={webcamKey ? `webcam-${webcamKey}` : 'webcam-default'}
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
                {!isLoaded && showLoading && (
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
                {isCorrect && holdProgress > 0 && (
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
