let currentSequentialIndex = 0;

export type GameLevel = 1 | 2;

export interface TrainRound {
  fullSequence: string[];
  missingIndex: number;
  answer: string;
  isComplete: boolean;
  level: GameLevel;
}

export function generateSequence(length = 3): string[] {
  const startIndex = Math.floor(Math.random() * (26 - length + 1));
  const sequence: string[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(String.fromCharCode(65 + startIndex + i));
  }
  return sequence;
}

export function generateSequentialSequence(length = 3): string[] {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const sequence: string[] = [];

  for (let i = 0; i < length; i++) {
    const letterIndex = (currentSequentialIndex + i) % alphabet.length;
    sequence.push(alphabet[letterIndex]!);
  }

  currentSequentialIndex = (currentSequentialIndex + length) % alphabet.length;
  return sequence;
}

export function createNewRound(sequenceLength = 3, level: GameLevel = 1): TrainRound {
  const fullSequence = level === 1 ? generateSequentialSequence(sequenceLength) : generateSequence(sequenceLength);
  const missingIndex = Math.floor(Math.random() * fullSequence.length);
  const answer = fullSequence[missingIndex]!;

  return {
    fullSequence,
    missingIndex,
    answer,
    isComplete: false,
    level,
  };
}

export function resetSequentialIndex() {
  currentSequentialIndex = 0;
}

export function validateInput(key: string, answer: string): boolean {
  return key.toUpperCase() === answer.toUpperCase();
}

export function isValidLetter(key: string): boolean {
  const upperKey = key.toUpperCase();
  return upperKey.length === 1 && upperKey >= 'A' && upperKey <= 'Z';
}

