'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import WaterBackground from '@/components/WaterBackground';
import Fish from '@/components/Fish';
import GameUI from '@/components/GameUI';
import StartScreen from '@/components/StartScreen';
import SuccessOverlay from '@/components/SuccessOverlay';
import WrongAnswerOverlay from '@/components/WrongAnswerOverlay';
import Bubbles from '@/components/Bubbles';
import Sparkles from '@/components/Sparkles';
import WebcamOverlay from '@/components/WebcamOverlay';
import { useISLRecognition } from '@/hooks/useISLRecognition';
import { WORDS, generateFishLetters, getRandomWord, type WordData } from '@/data/words';

interface FishPosition {
  yPosition: number;
  swimDirection: number;
  delay: number;
}

function generateFishPositions(count: number): FishPosition[] {
  return Array.from({ length: count }, (_, i) => ({
    yPosition: 25 + i * 7 + Math.random() * 4,
    swimDirection: i % 2 === 0 ? 1 : -1,
    delay: Math.random() * 5,
  }));
}

export default function FishingGame() {
  // Game state
  const [currentWord, setCurrentWord] = useState<WordData>(() => getRandomWord());
  const [fishLetters, setFishLetters] = useState<string[]>(() => generateFishLetters(currentWord.targetLetter, 7));
  const [score, setScore] = useState(0);
  const [playedWords, setPlayedWords] = useState<string[]>([]);

  // Animation states
  const [jumpingLetter, setJumpingLetter] = useState<string | null>(null);
  const [wigglingLetter, setWigglingLetter] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWrongAnswer, setShowWrongAnswer] = useState(false);
  const [sparklePosition, setSparklePosition] = useState({ x: 0, y: 0 });
  const [showSparkles, setShowSparkles] = useState(false);
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });
  const [showBubbles, setShowBubbles] = useState(false);

  // Fish positions
  const [fishPositions, setFishPositions] = useState<FishPosition[]>(() => generateFishPositions(7));

  // Game state
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);

  // Audio context for sound effects
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play wrong answer sound
  const playWrongSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }, []);

  // Load next word
  const loadNextWord = useCallback(() => {
    const newPlayedWords = [...playedWords, currentWord.word];
    setPlayedWords(newPlayedWords);

    const nextWord = getRandomWord(newPlayedWords.length >= WORDS.length ? [] : newPlayedWords);
    setCurrentWord(nextWord);

    const newLetters = generateFishLetters(nextWord.targetLetter, 7);
    setFishLetters(newLetters);

    setFishPositions(generateFishPositions(7));
  }, [playedWords, currentWord.word]);

  // Handle letter input (from ISL recognition)
  const handleLetterInput = useCallback(
    (letter: string) => {
      if (showStartScreen) return;

      const normalized = letter.trim().toUpperCase().slice(0, 1);
      const isCorrectLetter = normalized === currentWord.targetLetter;

      // Allow processing correct answer even during processing (for new word)
      if (isProcessing && !isCorrectLetter) return;

      // For correct letters, always accept them (even if fish not visible)
      // For wrong letters, only process if the fish is on screen
      if (!isCorrectLetter) {
        const matchingFishIndex = fishLetters.findIndex((l) => l === normalized);
        if (matchingFishIndex === -1) {
          // Wrong letter and fish not on screen - ignore
          return;
        }
      }

      // Find matching fish index (for correct letter, find the target fish)
      const matchingFishIndex = isCorrectLetter
        ? fishLetters.findIndex((l) => l === currentWord.targetLetter)
        : fishLetters.findIndex((l) => l === normalized);

      // If correct letter but fish not found, use default position
      const fishIndex = matchingFishIndex !== -1 ? matchingFishIndex : 0;

      const screenCenterX = window.innerWidth / 2;
      const fishY = fishPositions[fishIndex]?.yPosition || 50;
      const effectY = (fishY / 100) * window.innerHeight;

      if (isCorrectLetter) {
        // Correct answer!
        setIsProcessing(true);
        setJumpingLetter(normalized);

        const fishX = screenCenterX + (fishPositions[fishIndex]?.swimDirection || 1) * 100;
        setSparklePosition({ x: fishX, y: effectY });
        setShowSparkles(true);

        setTimeout(() => {
          setShowSuccess(true);
          setScore((prev) => prev + 10);
        }, 400);

        setTimeout(() => {
          loadNextWord();
          setShowSparkles(false);
          setShowSuccess(false);
          setJumpingLetter(null);
          setIsProcessing(false);
        }, 2000);
      } else {
        // Wrong answer
        setIsProcessing(true);
        playWrongSound();
        setShowWrongAnswer(true);
        setWigglingLetter(normalized);
        setBubblePosition({ x: screenCenterX, y: effectY });
        setShowBubbles(true);

        setTimeout(() => {
          setShowWrongAnswer(false);
          setWigglingLetter(null);
          setShowBubbles(false);
          setIsProcessing(false);
        }, 800);
      }
    },
    [currentWord.targetLetter, fishLetters, fishPositions, isProcessing, showStartScreen, loadNextWord, playWrongSound]
  );

  // ISL Recognition hook
  const { prediction, holdProgress, isLoaded, webcamRef, canvasRef, initMediaPipe } = useISLRecognition({
    onLetterConfirmed: handleLetterInput,
    enabled: !showStartScreen && !isProcessing,
  });

  // Ensure target letter fish is always present
  useEffect(() => {
    const targetLetterCount = fishLetters.filter((l) => l === currentWord.targetLetter).length;

    if (targetLetterCount === 0) {
      const newLetters = [...fishLetters, currentWord.targetLetter];
      setFishLetters(newLetters);

      const newPosition: FishPosition = {
        yPosition: 25 + Math.random() * 50,
        swimDirection: Math.random() < 0.5 ? 1 : -1,
        delay: 0,
      };
      setFishPositions((prev) => [...prev, newPosition]);
    }
  }, [fishLetters, currentWord.targetLetter]);

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-sky-400">
      <WaterBackground fullHeight={showStartScreen} />

      {!showStartScreen && (
        <GameUI word={currentWord.word} emoji={currentWord.emoji} targetLetter={currentWord.targetLetter} score={score} />
      )}

      {!showStartScreen && (
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence mode="popLayout">
            {fishLetters.map((letter, index) => (
              <Fish
                key={`${letter}-${index}-${currentWord.word}`}
                letter={letter}
                isTarget={letter === currentWord.targetLetter}
                isJumping={letter === jumpingLetter}
                isWiggling={letter === wigglingLetter}
                index={index}
                swimDirection={fishPositions[index]?.swimDirection || 1}
                yPosition={fishPositions[index]?.yPosition || 50}
                onAnimationComplete={() => {
                  if (letter === jumpingLetter) {
                    setJumpingLetter(null);
                  }
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Sparkles show={showSparkles} x={sparklePosition.x} y={sparklePosition.y} />
      <Bubbles show={showBubbles} x={bubblePosition.x} y={bubblePosition.y} />

      <SuccessOverlay show={showSuccess} letter={currentWord.targetLetter} word={currentWord.word} />
      <WrongAnswerOverlay show={showWrongAnswer} />

      <StartScreen show={showStartScreen} onStart={() => setShowStartScreen(false)} />

      {!showStartScreen && (
        <WebcamOverlay
          webcamRef={webcamRef}
          canvasRef={canvasRef}
          isLoaded={isLoaded}
          prediction={prediction}
          holdProgress={holdProgress}
          targetLetter={currentWord.targetLetter}
          onScriptsLoad={initMediaPipe}
          showLoading={false}
        />
      )}
    </div>
  );
}

