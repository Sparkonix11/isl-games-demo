'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const SEQ_LEN = 60;
const SMOOTHING_FACTOR = 0.7;
const CONFIDENCE_THRESHOLD = 0.6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const HOLD_DURATION_FRAMES = 8;

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
    targetLetter?: string; // Add target letter to reset state when it changes
}

interface UseISLRecognitionReturn {
    prediction: Prediction | null;
    holdProgress: number;
    isLoaded: boolean;
    webcamRef: React.RefObject<Webcam | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    initMediaPipe: () => void;
}

export function useISLRecognition({
    onLetterConfirmed,
    enabled = true,
    targetLetter,
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
    const lastWordRef = useRef<string | null>(null);

    // Keep enabled ref in sync
    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    // Reset lastConfirmedLetter when target letter changes (new word)
    useEffect(() => {
        if (targetLetter && lastWordRef.current !== targetLetter) {
            lastConfirmedLetter.current = null;
            lastWordRef.current = targetLetter;
            holdCounter.current = 0;
            setHoldProgress(0);
        }
    }, [targetLetter]);

    const onResults = useCallback(async (results: any) => {
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
            setPrediction(null);
            smoothedProbs.current = null;
            holdCounter.current = 0;
            setHoldProgress(0);
            return;
        }

        if (landmarkBuffer.current.length === SEQ_LEN && !isPredicting.current) {
            isPredicting.current = true;

            try {
                const res = await fetch('/api/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ landmarks: landmarkBuffer.current }),
                });

                const data = await res.json();

                if (data.probabilities) {
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
                    const topIdx = currentProbs.reduce((maxIdx, currentVal, idx, arr) =>
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
                }
            } catch (e) {
                console.error("Inference Error:", e);
            } finally {
                isPredicting.current = false;
            }
        }
    }, [onLetterConfirmed]);

    const initMediaPipe = useCallback(() => {
        if (typeof window !== 'undefined' && window.Hands && window.Camera && !isLoaded) {
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

            if (webcamRef.current?.video) {
                const camera = new window.Camera(webcamRef.current.video, {
                    onFrame: async () => {
                        if (webcamRef.current?.video) {
                            await hands.send({ image: webcamRef.current.video });
                        }
                    },
                    width: 640,
                    height: 480
                });
                camera.start();
                setIsLoaded(true);
            }
        }
    }, [isLoaded, onResults]);

    return {
        prediction,
        holdProgress,
        isLoaded,
        webcamRef,
        canvasRef,
        initMediaPipe,
    };
}
