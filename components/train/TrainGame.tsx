'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
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
  const [level, setLevel] = useState<GameLevel>(1); // 1 = sequential, 2 = random
  const [gameState, setGameState] = useState<TrainRound>(() => createNewRound(3, level));
  const [revealedSequence, setRevealedSequence] = useState<Array<string | null>>(() =>
    buildInitialRevealedSequence(gameState)
  );

  const [trainState, setTrainState] = useState<TrainState>('entering');
  const [isShaking, setIsShaking] = useState(false);
  const [showSteam, setShowSteam] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastConfirmed, setLastConfirmed] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [roundId, setRoundId] = useState(1);

  const exitTimerRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const prevHoldRef = useRef<number>(0);
  const lastAutoSubmitRef = useRef<string | null>(null);

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
    setStatus('idle');
    setRoundId((r) => r + 1);
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
    setStatus('idle');
    setRoundId((r) => r + 1);

    setTrainState('entering');
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = window.setTimeout(() => setTrainState('stopped'), 2000);
  }, [level]);

  const handleCorrect = useCallback(
    (key: string) => {
      setIsProcessing(true);
      setStatus('correct');
      // reveal missing letter
      setRevealedSequence((prev) => {
        const next = [...prev];
        next[gameState.missingIndex] = key;
        return next;
      });

      setShowSteam(true);
      setGameState((prev) => ({ ...prev, isComplete: true }));

      // confetti burst (no CSS confetti needed)
      try {
        confetti({
          particleCount: 120,
          spread: 75,
          origin: { y: 0.55 },
          ticks: 220,
        });
      } catch {
        // ignore if canvas not available
      }

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
      if (isProcessing) return;
      if (showHint) return;
      if (trainState !== 'stopped') return;
      if (gameState.isComplete) return;

      const normalized = letter.trim().toUpperCase().slice(0, 1);
      setLastConfirmed(normalized);

      if (validateInput(normalized, gameState.answer)) {
        handleCorrect(normalized);
      } else {
        setIsProcessing(true);
        setStatus('wrong');
        setIsShaking(true);
        window.setTimeout(() => setIsShaking(false), 500);
        window.setTimeout(() => setIsProcessing(false), 650);
      }
    },
    [gameState.answer, gameState.isComplete, handleCorrect, isProcessing, showHint, trainState]
  );

  const { prediction, holdProgress, isLoaded, webcamRef, canvasRef, initMediaPipe } = useISLRecognition({
    onLetterConfirmed: (letter) => {
      handleLetterInput(letter);
    },
    enabled: trainState === 'stopped' && !gameState.isComplete && !isProcessing && !showHint,
  });

  // Fallback submit: if hold reaches ~100% but hook doesn't fire onLetterConfirmed
  useEffect(() => {
    const prev = prevHoldRef.current;
    prevHoldRef.current = holdProgress;

    const canSubmit =
      trainState === 'stopped' && !gameState.isComplete && !isProcessing && !showHint && !!prediction?.label;

    if (!canSubmit) return;

    // Only fire once per hold "crossing" to avoid spamming submissions
    if (holdProgress >= 98 && prev < 98) {
      const label = prediction!.label;
      if (lastAutoSubmitRef.current !== label) {
        lastAutoSubmitRef.current = label;
        handleLetterInput(label);
      }
    }

    // Reset latch when user releases / confidence drops
    if (holdProgress < 20) {
      lastAutoSubmitRef.current = null;
    }
  }, [gameState.isComplete, handleLetterInput, holdProgress, isProcessing, prediction, showHint, trainState]);

  return (
    <div className="train-game">
      <div className="app">
        <div className="sun" />
        <div className="ground-pattern" />

        <div className="tracks-container" aria-hidden="true">
          <div className="tracks">
            <div className="rail rail-top" />
            <div className="rail rail-bottom" />
            <div>
              {sleepers.map((_, i) => (
                <div key={i} className="sleeper" style={{ left: `${(i * 100) / sleepers.length}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="game-container">
          <h1 className="title">Train to Totpur: The Alphabet Express</h1>
          <p className="instructions">Sign the missing letter using ISL in your webcam!</p>

          <div className="mb-4 flex items-center gap-2 text-sm text-slate-800/90">
            <span className="font-semibold">Mode:</span>
            <button
              type="button"
              className={`px-3 py-1 rounded-full border ${
                level === 1 ? 'bg-white/80 border-slate-800/20' : 'bg-white/40 border-slate-800/10'
              }`}
              onClick={() => setLevel(1)}
            >
              Sequential
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-full border ${
                level === 2 ? 'bg-white/80 border-slate-800/20' : 'bg-white/40 border-slate-800/10'
              }`}
              onClick={() => setLevel(2)}
            >
              Random
            </button>
          </div>

          <Train
            key={roundId}
            sequence={revealedSequence}
            missingIndex={gameState.missingIndex}
            trainState={trainState}
            isShaking={isShaking}
            showSteam={showSteam}
          />

          <div className="hint">Find the missing letter in the sequence</div>

          {/* Status / debug so you can see confirmation vs prediction */}
          <div className="mt-2 text-xs text-slate-800/75">
            <div>
              Target: <span className="font-semibold">{gameState.answer}</span> · Prediction:{' '}
              <span className="font-semibold">{prediction?.label ?? '—'}</span>{' '}
              <span className="text-slate-800/60">{prediction ? `${Math.round(prediction.score * 100)}%` : ''}</span> · Hold:{' '}
              <span className="font-semibold">{holdProgress.toFixed(1)}%</span>
            </div>
            <div>
              Last confirmed: <span className="font-semibold">{lastConfirmed ?? '—'}</span>
            </div>
          </div>

          <div className="mt-1 text-[11px] text-slate-800/60">
            Round #{roundId} · Train: <span className="font-semibold">{trainState}</span> ·{" "}
            <span className="font-semibold">{status === 'idle' ? 'Waiting' : status.toUpperCase()}</span>
          </div>

          {status !== 'idle' && (
            <div
              className={`mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-bold border ${
                status === 'correct'
                  ? 'bg-green-500/15 text-green-900 border-green-900/20'
                  : 'bg-red-500/15 text-red-900 border-red-900/20'
              }`}
            >
              {status === 'correct' ? 'Correct! Train departing…' : 'Try again'}
            </div>
          )}
        </div>

        <button className="hint-button" onClick={() => setShowHint((s) => !s)} aria-label="Hint">
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

        {showHint && (
          <div className="hint-popup" role="dialog" aria-modal="true">
            <div className="hint-popup-content">
              <button className="hint-close" onClick={() => setShowHint(false)} aria-label="Close hint">
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
        />
      </div>
    </div>
  );
}

