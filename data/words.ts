// Word data for the fishing game
export interface WordData {
    word: string;
    targetLetter: string;
    emoji: string;
}

export const WORDS: WordData[] = [
    { word: 'APPLE', targetLetter: 'A', emoji: '🍎' },
    { word: 'BALL', targetLetter: 'B', emoji: '⚽' },
    { word: 'CAT', targetLetter: 'C', emoji: '🐱' },
    { word: 'DOG', targetLetter: 'D', emoji: '🐕' },
    { word: 'EGG', targetLetter: 'E', emoji: '🥚' },
    { word: 'FISH', targetLetter: 'F', emoji: '🐟' },
    { word: 'GRAPE', targetLetter: 'G', emoji: '🍇' },
    { word: 'HAT', targetLetter: 'H', emoji: '🎩' },
    { word: 'ICE', targetLetter: 'I', emoji: '🧊' },
    { word: 'JAR', targetLetter: 'J', emoji: '🫙' },
    { word: 'KITE', targetLetter: 'K', emoji: '🪁' },
    { word: 'LION', targetLetter: 'L', emoji: '🦁' },
    { word: 'MOON', targetLetter: 'M', emoji: '🌙' },
    { word: 'NEST', targetLetter: 'N', emoji: '🪹' },
    { word: 'ORANGE', targetLetter: 'O', emoji: '🍊' },
    { word: 'PIG', targetLetter: 'P', emoji: '🐷' },
    { word: 'QUEEN', targetLetter: 'Q', emoji: '👸' },
    { word: 'RAIN', targetLetter: 'R', emoji: '🌧️' },
    { word: 'SUN', targetLetter: 'S', emoji: '☀️' },
    { word: 'TREE', targetLetter: 'T', emoji: '🌳' },
    { word: 'UMBRELLA', targetLetter: 'U', emoji: '☂️' },
    { word: 'VASE', targetLetter: 'V', emoji: '🏺' },
    { word: 'WATER', targetLetter: 'W', emoji: '💧' },
    { word: 'XYLOPHONE', targetLetter: 'X', emoji: '🎵' },
    { word: 'YARN', targetLetter: 'Y', emoji: '🧶' },
    { word: 'ZEBRA', targetLetter: 'Z', emoji: '🦓' },
];

// Get a random word, optionally excluding already played words
export function getRandomWord(exclude: string[] = []): WordData {
    const available = WORDS.filter(w => !exclude.includes(w.word));
    const pool = available.length > 0 ? available : WORDS;
    return pool[Math.floor(Math.random() * pool.length)];
}

// Generate fish letters including the target letter
export function generateFishLetters(targetLetter: string, count: number): string[] {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letters: string[] = [targetLetter]; // Always include target

    // Add random letters (avoid duplicates)
    while (letters.length < count) {
        const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        if (!letters.includes(randomLetter)) {
            letters.push(randomLetter);
        }
    }

    // Shuffle the array
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    return letters;
}
