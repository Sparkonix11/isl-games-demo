'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Train, { TrainState } from '@/components/train/Train';
import { createNewRound, validateInput, type GameLevel, type TrainRound } from '@/components/train/gameLogic';
import { useISLRecognition } from '@/hooks/useISLRecognition';
import WebcamOverlay from '@/components/WebcamOverlay';

function buildInitialRevealedSequence(round: TrainRound): Array<string | null> {
  const seq: Array<string | null> = [...round.fullSequence];
  seq[round.missingIndex] = null;
  return seq;
}

export default function TrainGame() {
  // Unique key for webcam (changes on each mount)
  const [webcamInstanceKey] = useState(() => `train-${Date.now()}-${Math.random()}`);
  
  const [level, setLevel] = useState<GameLevel>(1); // 1 = sequential, 2 = random
  const [gameState, setGameState] = useState<TrainRound>(() => createNewRound(3, level));
  const [revealedSequence, setRevealedSequence] = useState<Array<string | null>>(() =>
    buildInitialRevealedSequence(gameState)
  );
  const [score, setScore] = useState(0);

  const [trainState, setTrainState] = useState<TrainState>('entering');
  const [isShaking, setIsShaking] = useState(false);
  const [showSteam, setShowSteam] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const exitTimerRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);

  // sleepers (track planks)
  const sleepers = useMemo(() => Array.from({ length: 15 }), []);

  // initial train entry on mount
  useEffect(() => {
    setTrainState('entering');
    stopTimerRef.current = window.setTimeout(() => setTrainState('stopped'), 2000);
    return () => {
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    };
  }, []);

  // when level changes, start a fresh round
  useEffect(() => {
    const next = createNewRound(3, level);
    setGameState(next);
    setRevealedSequence(buildInitialRevealedSequence(next));
    setShowHint(false);
    setShowSteam(false);
    setIsShaking(false);
    setIsProcessing(false);
    setShowConfetti(false);
    setTrainState('entering');

    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = window.setTimeout(() => setTrainState('stopped'), 2000);

    return () => {
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    };
  }, [level]);

  const startNextRound = useCallback(() => {
    const next = createNewRound(3, level);
    setGameState(next);
    setRevealedSequence(buildInitialRevealedSequence(next));
    setShowHint(false);
    setShowSteam(false);
    setIsProcessing(false);
    setShowConfetti(false);

    setTrainState('entering');
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = window.setTimeout(() => {
      setTrainState('stopped');
      // Reset processing state after train stops to allow new input
      setTimeout(() => setIsProcessing(false), 100);
    }, 2000);
  }, [level]);

  const handleCorrect = useCallback(
    (key: string) => {
      setIsProcessing(true);
      // reveal missing letter
      setRevealedSequence((prev) => {
        const next = [...prev];
        next[gameState.missingIndex] = key;
        return next;
      });

      setShowSteam(true);
      setShowConfetti(true);
      setGameState((prev) => ({ ...prev, isComplete: true }));
      setScore((prev) => prev + 10);

      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 4000);

      // exit train, then next round
      setTrainState('exiting');
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = window.setTimeout(() => {
        startNextRound();
      }, 3000);
    },
    [gameState.missingIndex, startNextRound]
  );

  const handleLetterInput = useCallback(
    (letter: string) => {
      if (showHint) return;
      if (trainState !== 'stopped') return;
      if (gameState.isComplete) return;

      const normalized = letter.trim().toUpperCase().slice(0, 1);
      const isCorrectLetter = validateInput(normalized, gameState.answer);

      // Allow processing correct answer even during processing (for new word)
      if (isProcessing && !isCorrectLetter) return;

      if (isCorrectLetter) {
        handleCorrect(normalized);
      } else {
        // Wrong answer - shake (only if train is stopped)
        if (trainState === 'stopped') {
          setIsProcessing(true);
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            setIsProcessing(false);
          }, 650);
        }
      }
    },
    [gameState.answer, gameState.isComplete, handleCorrect, isProcessing, showHint, trainState]
  );

  const { prediction, holdProgress, isLoaded, webcamRef, canvasRef, initMediaPipe, onWebcamReady } = useISLRecognition({
    onLetterConfirmed: (letter) => {
      handleLetterInput(letter);
    },
    enabled: trainState === 'stopped' && !gameState.isComplete && !isProcessing && !showHint,
  });

  // Watch for correct letter detection when it turns green (high confidence + high hold progress)
  useEffect(() => {
    if (!prediction || trainState !== 'stopped' || gameState.isComplete || showHint) return;

    // Check if the predicted letter matches the target and has high confidence
    const isCorrect = prediction.label === gameState.answer;
    const hasHighConfidence = prediction.score > 0.6;
    
    // If correct letter detected with high confidence and hold progress is high, trigger success
    // This catches the "green" state in the camera
    // Allow correct answers even during processing (for new rounds)
    if (isCorrect && hasHighConfidence && holdProgress >= 80) {
      handleLetterInput(prediction.label);
    }
  }, [prediction, holdProgress, gameState.answer, gameState.isComplete, trainState, showHint, handleLetterInput]);

  const handleHintClick = () => {
    setShowHint(!showHint);
  };

  const handleCloseHint = () => {
    setShowHint(false);
  };

  return (
    <div className="train-game">
      <div className="app">
        {showConfetti && (
          <div className="confetti-container">
            {Array.from({ length: 60 }).map((_, i) => (
              <div key={i} className={`confetti confetti-${i}`}></div>
            ))}
          </div>
        )}
        <div className="sun"></div>
        <div className="ground-pattern"></div>
        <div className="tracks-container" aria-hidden="true">
          <div className="tracks">
            <div className="rail rail-top"></div>
            <div className="rail rail-bottom"></div>
            <div>
              {sleepers.map((_, i) => (
                <div key={i} className="sleeper" style={{ left: `${(i * 100) / sleepers.length}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Score Box - Centered Horizontally */}
        <motion.div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl px-6 py-4 shadow-xl"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <div className="text-sm uppercase tracking-wider text-gray-600 mb-1" style={{ fontFamily: 'Fredoka, sans-serif' }}>Score</div>
          <motion.div
            className="text-4xl font-bold text-gray-800"
            key={score}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            {score}
          </motion.div>
        </motion.div>

        {/* Hint Button - Top Right Corner */}
        <button className="hint-button" onClick={handleHintClick} style={{ cursor: 'pointer' }}>
          <svg className="hint-button-svg" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet">
            <circle cx="60" cy="60" r="55" fill="#fff" stroke="#8B4513" strokeWidth="5" />
            <text
              x="60"
              y="70"
              fontFamily="Fredoka"
              fontSize="24"
              fill="#8B4513"
              textAnchor="middle"
              fontWeight="bold"
            >
              HINT
            </text>
          </svg>
        </button>

        <div className="game-container">
          <h1 className="title">Train to Totpur: The Alphabet Express</h1>
          <p className="instructions">Sign the missing letter using ISL in your webcam!</p>

          {/* Mode Selector - Below Instructions */}
          <div className="flex items-center justify-center gap-3 mt-4 mb-2">
            <span className="text-lg font-semibold text-gray-700" style={{ fontFamily: 'Fredoka, sans-serif' }}>Mode:</span>
            <div className="flex gap-2 bg-gray-200/60 backdrop-blur rounded-xl p-1">
              <button
                onClick={() => setLevel(1)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  level === 1
                    ? 'bg-sky-400 text-white shadow-md'
                    : 'bg-transparent text-gray-600 hover:bg-gray-300/50'
                }`}
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                Sequential
              </button>
              <button
                onClick={() => setLevel(2)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  level === 2
                    ? 'bg-sky-400 text-white shadow-md'
                    : 'bg-transparent text-gray-600 hover:bg-gray-300/50'
                }`}
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                Random
              </button>
            </div>
          </div>

          <Train
            sequence={revealedSequence}
            missingIndex={gameState.missingIndex}
            trainState={trainState}
            isShaking={isShaking}
            showSteam={showSteam}
          />

          <div className="hint">Find the missing letter in the sequence</div>
        </div>

        {showHint && (
          <div className="hint-popup">
            <div className="hint-popup-content">
              <button className="hint-close" onClick={handleCloseHint}>
                ×
              </button>
              <h3>
                The missing letter is: <strong>{gameState.answer}</strong>
              </h3>
              <p>Look at the sequence: {gameState.fullSequence.join(' - ')}</p>
            </div>
          </div>
        )}

        <WebcamOverlay
          webcamRef={webcamRef}
          canvasRef={canvasRef}
          isLoaded={isLoaded}
          prediction={prediction}
          holdProgress={holdProgress}
          targetLetter={gameState.answer}
          onScriptsLoad={initMediaPipe}
          onWebcamReady={onWebcamReady}
          showLoading={false}
          webcamKey={webcamInstanceKey}
        />
      </div>
    </div>
  );
}

