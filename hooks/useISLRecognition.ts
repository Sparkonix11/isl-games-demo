'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const SEQ_LEN = 60;
const SMOOTHING_FACTOR = 0.7;
const CONFIDENCE_THRESHOLD = 0.6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const HOLD_DURATION_FRAMES = 8;
// Keep prediction calls bounded; serverless inference can be slow (cold starts on Vercel).
const MIN_PREDICT_INTERVAL_MS = 175;
const MAX_INIT_ATTEMPTS = 20;
const INIT_RETRY_INTERVAL_MS = 100;

declare global {
    interface Window {
        Hands: any;
        Camera: any;
        drawConnectors: any;
        drawLandmarks: any;
        HAND_CONNECTIONS: any;
    }
}

interface Prediction {
    label: string;
    score: number;
}

interface UseISLRecognitionOptions {
    onLetterConfirmed?: (letter: string) => void;
    enabled?: boolean;
}

interface UseISLRecognitionReturn {
    prediction: Prediction | null;
    holdProgress: number;
    isLoaded: boolean;
    webcamRef: React.RefObject<Webcam | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    initMediaPipe: () => void;
    onWebcamReady: () => void; // Callback to trigger initialization when webcam stream is ready
}

export function useISLRecognition({
    onLetterConfirmed,
    enabled = true,
}: UseISLRecognitionOptions = {}): UseISLRecognitionReturn {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [prediction, setPrediction] = useState<Prediction | null>(null);
    const [holdProgress, setHoldProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    const landmarkBuffer = useRef<number[][][]>([]);
    const isPredicting = useRef(false);
    const smoothedProbs = useRef<number[] | null>(null);
    const holdCounter = useRef(0);
    const lastConfirmedLetter = useRef<string | null>(null);
    const enabledRef = useRef(enabled);
    const predictionSession = useRef(0);
    const lastPredictAt = useRef(0);
    const mountedRef = useRef(true);
    const isInitializing = useRef(false);
    const initRetryTimeout = useRef<number | null>(null);
    const handsInstance = useRef<any>(null);
    const cameraInstance = useRef<any>(null);
    const needsReinitAfterCleanup = useRef(false);

    // Cleanup function to stop MediaPipe instances
    const cleanupMediaPipe = useCallback(() => {
        // Stop camera
        if (cameraInstance.current) {
            try {
                cameraInstance.current.stop();
            } catch (e) {
                console.error('Error stopping camera:', e);
            }
            cameraInstance.current = null;
        }

        // Close hands instance
        if (handsInstance.current) {
            try {
                handsInstance.current.close();
            } catch (e) {
                console.error('Error closing hands:', e);
            }
            handsInstance.current = null;
        }

        // Release webcam MediaStream
        if (webcamRef.current?.video?.srcObject) {
            try {
                const stream = webcamRef.current.video.srcObject as MediaStream;
                stream.getTracks().forEach(track => {
                    track.stop();
                });
                webcamRef.current.video.srcObject = null;
            } catch (e) {
                console.error('Error releasing webcam stream:', e);
            }
        }

        // Clear retry timeout
        if (initRetryTimeout.current) {
            window.clearTimeout(initRetryTimeout.current);
            initRetryTimeout.current = null;
        }

        // Reset state
        setIsLoaded(false);
        isInitializing.current = false;
        setPrediction(null);
        setHoldProgress(0);
        landmarkBuffer.current = [];
        smoothedProbs.current = null;
        holdCounter.current = 0;
        lastConfirmedLetter.current = null;
        predictionSession.current = 0;
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            // Clean up MediaPipe instances on unmount
            cleanupMediaPipe();
        };
    }, [cleanupMediaPipe]);

    // Keep enabled ref in sync
    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    const startPrediction = useCallback((sequence: number[][][], sessionAtStart: number) => {
        isPredicting.current = true;
        lastPredictAt.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());

        fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ landmarks: sequence }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!mountedRef.current) return;
                if (sessionAtStart !== predictionSession.current) return; // hands disappeared/reset since request started

                if (!data?.probabilities) return;
                const probs = data.probabilities as number[];

                if (!smoothedProbs.current) {
                    smoothedProbs.current = probs;
                } else {
                    const alpha = SMOOTHING_FACTOR;
                    smoothedProbs.current = smoothedProbs.current.map((p, i) =>
                        alpha * p + (1.0 - alpha) * probs[i]
                    );
                }

                const currentProbs = smoothedProbs.current;
                const topIdx = currentProbs.reduce((maxIdx: number, currentVal: number, idx: number, arr: number[]) =>
                    currentVal > arr[maxIdx] ? idx : maxIdx, 0
                );

                const predictedLabel = ALPHABET[topIdx];
                const score = currentProbs[topIdx];

                setPrediction({ label: predictedLabel, score });

                // Only process game logic if enabled
                if (enabledRef.current) {
                    if (score > CONFIDENCE_THRESHOLD) {
                        holdCounter.current += 1;
                    } else {
                        holdCounter.current = Math.max(0, holdCounter.current - 0.5);
                    }

                    holdCounter.current = Math.min(holdCounter.current, HOLD_DURATION_FRAMES + 2);
                    const progress = Math.min(100, (holdCounter.current / HOLD_DURATION_FRAMES) * 100);
                    setHoldProgress(progress);

                    if (holdCounter.current >= HOLD_DURATION_FRAMES) {
                        // Prevent rapid re-triggers of the same letter
                        if (lastConfirmedLetter.current !== predictedLabel) {
                            lastConfirmedLetter.current = predictedLabel;
                            onLetterConfirmed?.(predictedLabel);

                            // Reset after confirmation
                            holdCounter.current = 0;
                            setHoldProgress(0);

                            // Allow same letter after a delay
                            setTimeout(() => {
                                lastConfirmedLetter.current = null;
                            }, 2000);
                        }
                    }
                }
            })
            .catch((e) => {
                // Ignore fetch errors; keep camera loop running smoothly.
                console.error("Inference Error:", e);
            })
            .finally(() => {
                isPredicting.current = false;
            });
    }, [onLetterConfirmed]);

    const onResults = useCallback((results: any) => {
        if (!canvasRef.current || !webcamRef.current?.video) return;
        const canvasCtx = canvasRef.current.getContext('2d')!;

        // Global MediaPipe
        const { drawConnectors, drawLandmarks, HAND_CONNECTIONS } = window;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                if (drawConnectors && HAND_CONNECTIONS) {
                    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#ef4444', lineWidth: 4 });
                }
                if (drawLandmarks) {
                    drawLandmarks(canvasCtx, landmarks, { color: '#f59e0b', lineWidth: 2, radius: 3 });
                }
            }
        }
        canvasCtx.restore();

        // Feature Extraction
        const frameFeatures = new Array(21).fill(0).map(() => new Array(6).fill(0));

        if (results.multiHandLandmarks && results.multiHandedness) {
            results.multiHandLandmarks.forEach((landmarks: any[], index: number) => {
                const classification = results.multiHandedness[index];
                const label = classification.label.toLowerCase();

                const correctedLabel = label === 'left' ? 'right' : 'left';
                const offset = correctedLabel === 'left' ? 0 : 3;

                landmarks.forEach((lm, i) => {
                    const x = 1.0 - lm.x;
                    frameFeatures[i][offset] = isNaN(x) ? 0 : Math.max(0, Math.min(1, x));
                    frameFeatures[i][offset + 1] = isNaN(lm.y) ? 0 : Math.max(0, Math.min(1, lm.y));
                    frameFeatures[i][offset + 2] = isNaN(lm.z) ? 0 : Math.max(0, Math.min(1, lm.z));
                });
            });
        }

        landmarkBuffer.current.push(frameFeatures);
        if (landmarkBuffer.current.length > SEQ_LEN) landmarkBuffer.current.shift();

        const hasHands = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
        if (!hasHands) {
            // Bump session so any in-flight prediction result is ignored.
            predictionSession.current += 1;
            if (prediction !== null) setPrediction(null);
            smoothedProbs.current = null;
            holdCounter.current = 0;
            if (holdProgress !== 0) setHoldProgress(0);
            return;
        }

        if (landmarkBuffer.current.length === SEQ_LEN && !isPredicting.current) {
            const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            if (now - lastPredictAt.current >= MIN_PREDICT_INTERVAL_MS) {
                const sessionAtStart = predictionSession.current;
                // Shallow copy is safe because frames are immutable once pushed.
                const sequence = landmarkBuffer.current.slice();
                startPrediction(sequence, sessionAtStart);
            }
        }
    }, [holdProgress, prediction, startPrediction]);

    // Helper function to create and start MediaPipe instances
    const createMediaPipeInstances = useCallback(() => {
        if (!webcamRef.current?.video) {
            throw new Error('Video element not available');
        }

        const hands = new window.Hands({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);
        handsInstance.current = hands;

        const camera = new window.Camera(webcamRef.current.video, {
            onFrame: async () => {
                if (webcamRef.current?.video && handsInstance.current) {
                    await handsInstance.current.send({ image: webcamRef.current.video });
                }
            },
            width: 640,
            height: 480
        });
        camera.start();
        cameraInstance.current = camera;
        setIsLoaded(true);
        isInitializing.current = false;
    }, [onResults]);

    const initMediaPipeInternal = useCallback(() => {
        // Prevent multiple simultaneous initialization attempts
        if (isInitializing.current) return;
        if (typeof window === 'undefined' || !window.Hands || !window.Camera) return;

        // Clear any existing retry timeout
        if (initRetryTimeout.current) {
            window.clearTimeout(initRetryTimeout.current);
            initRetryTimeout.current = null;
        }

        // Check if video is ready and stream is available
        const video = webcamRef.current?.video;
        if (video && video.readyState >= 2 && video.srcObject) {
            // Video is ready, initialize immediately
            isInitializing.current = true;
            
            try {
                createMediaPipeInstances();
            } catch (error) {
                console.error('MediaPipe initialization error:', error);
                isInitializing.current = false;
                cleanupMediaPipe();
            }
        } else {
            // Video not ready yet, retry
            let attempt = 0;
            
            const tryInit = () => {
                if (isInitializing.current) {
                    if (initRetryTimeout.current) {
                        window.clearTimeout(initRetryTimeout.current);
                        initRetryTimeout.current = null;
                    }
                    return;
                }
                
                const video = webcamRef.current?.video;
                if (video && video.readyState >= 2 && video.srcObject) {
                    // Video is ready now, initialize directly
                    isInitializing.current = true;
                    
                    try {
                        createMediaPipeInstances();
                    } catch (error) {
                        console.error('MediaPipe initialization error:', error);
                        isInitializing.current = false;
                        cleanupMediaPipe();
                    }
                } else if (attempt < MAX_INIT_ATTEMPTS) {
                    attempt++;
                    initRetryTimeout.current = window.setTimeout(tryInit, INIT_RETRY_INTERVAL_MS);
                } else {
                    // Max attempts reached, give up
                    isInitializing.current = false;
                }
            };
            
            initRetryTimeout.current = window.setTimeout(tryInit, INIT_RETRY_INTERVAL_MS);
        }
    }, [createMediaPipeInstances, cleanupMediaPipe]);

    const initMediaPipe = useCallback(() => {
        // Always clean up any existing instances before creating new ones
        // This ensures a fresh start when switching games
        if (handsInstance.current || cameraInstance.current) {
            cleanupMediaPipe();
            // Set flag to re-initialize when webcam is ready (via onWebcamReady)
            needsReinitAfterCleanup.current = true;
        } else {
            // No existing instances, initialize directly
            initMediaPipeInternal();
        }
    }, [cleanupMediaPipe, initMediaPipeInternal]);

    // Callback to trigger initialization when webcam stream is ready
    const onWebcamReady = useCallback(() => {
        // Only initialize if MediaPipe scripts are loaded
        if (typeof window === 'undefined' || !window.Hands || !window.Camera) {
            return;
        }

        // If we need to re-initialize after cleanup, do it now that webcam is ready
        if (needsReinitAfterCleanup.current && mountedRef.current && !handsInstance.current && !cameraInstance.current) {
            needsReinitAfterCleanup.current = false;
            initMediaPipeInternal();
        } else if (!handsInstance.current && !cameraInstance.current && !isInitializing.current) {
            // Webcam is ready and no instances exist, initialize
            initMediaPipeInternal();
        }
    }, [initMediaPipeInternal]);

    return {
        prediction,
        holdProgress,
        isLoaded,
        webcamRef,
        canvasRef,
        initMediaPipe,
        onWebcamReady,
    };
}
