'use client';

import React from 'react';

export type TrainState = 'entering' | 'stopped' | 'exiting';

export default function Train({
  sequence,
  missingIndex,
  trainState,
  isShaking,
  showSteam,
}: {
  sequence: Array<string | null>;
  missingIndex: number;
  trainState: TrainState;
  isShaking: boolean;
  showSteam: boolean;
}) {
  return (
    <div className={`train-container train-${trainState}`}>
      <div className="train">
        <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" className="train-engine-svg">
          {/* Shadow */}
          <ellipse cx="250" cy="360" rx="180" ry="25" fill="#D0D0D0" opacity="0.5" />

          {/* Smoke puffs */}
          {showSteam && (
            <>
              <ellipse cx="280" cy="60" rx="30" ry="25" fill="#E0E0E0" opacity="0.6" />
              <ellipse cx="300" cy="45" rx="25" ry="20" fill="#E0E0E0" opacity="0.5" />
              <ellipse cx="320" cy="30" rx="20" ry="15" fill="#E0E0E0" opacity="0.4" />
            </>
          )}

          {/* Chimney on boiler */}
          <rect x="335" y="130" width="35" height="55" rx="5" fill="#87CEEB" stroke="#1E3A5F" strokeWidth="5" />
          <rect x="328" y="125" width="49" height="15" rx="7" fill="#FFD93D" stroke="#1E3A5F" strokeWidth="4" />

          {/* Red hat/cap on cabin */}
          <ellipse cx="210" cy="95" rx="95" ry="30" fill="#E85A5A" stroke="#1E3A5F" strokeWidth="5" />
          <rect x="180" y="75" width="60" height="25" rx="12" fill="#FFB74D" stroke="#1E3A5F" strokeWidth="4" />

          {/* Main cabin body (blue with face) */}
          <rect x="120" y="110" width="180" height="180" rx="8" fill="#87CEEB" stroke="#1E3A5F" strokeWidth="5" />

          {/* Eyes */}
          <circle cx="170" cy="180" r="28" fill="#FFFFFF" stroke="#1E3A5F" strokeWidth="4" />
          <circle cx="170" cy="180" r="18" fill="#1E3A5F" />
          <circle cx="175" cy="175" r="7" fill="#FFFFFF" />

          <circle cx="250" cy="180" r="28" fill="#FFFFFF" stroke="#1E3A5F" strokeWidth="4" />
          <circle cx="250" cy="180" r="18" fill="#1E3A5F" />
          <circle cx="255" cy="175" r="7" fill="#FFFFFF" />

          {/* Cheeks */}
          <circle cx="140" cy="215" r="18" fill="#FFB74D" />
          <circle cx="280" cy="215" r="18" fill="#FFB74D" />

          {/* Smile */}
          <path
            d="M 170 230 Q 210 250 250 230"
            fill="none"
            stroke="#4A7BA7"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Boiler section (striped) */}
          <rect x="300" y="185" width="140" height="105" rx="15" fill="#E85A5A" stroke="#1E3A5F" strokeWidth="5" />

          {/* Yellow stripes on boiler */}
          <path d="M 315 185 Q 320 240 315 290" fill="#FFD93D" stroke="none" />
          <rect x="310" y="190" width="25" height="95" fill="#FFD93D" />

          <path d="M 355 185 Q 360 240 355 290" fill="#FFD93D" stroke="none" />
          <rect x="350" y="190" width="25" height="95" fill="#FFD93D" />

          <path d="M 395 185 Q 400 240 395 290" fill="#FFD93D" stroke="none" />
          <rect x="390" y="190" width="25" height="95" fill="#FFD93D" />

          {/* Yellow round end cap */}
          <path d="M 440 185 Q 465 237 440 290 L 440 185 Z" fill="#FFD93D" stroke="#1E3A5F" strokeWidth="5" />

          {/* Red platform base */}
          <path
            d="M 100 290 L 460 290 Q 470 310 465 330 L 85 330 Q 80 310 100 290 Z"
            fill="#E85A5A"
            stroke="#1E3A5F"
            strokeWidth="5"
          />

          {/* Yellow stripe on platform */}
          <path d="M 105 310 L 460 310 L 463 320 L 87 320 Z" fill="#FFB74D" />

          {/* Wheels */}
          <circle cx="150" cy="350" r="35" fill="#87CEEB" stroke="#1E3A5F" strokeWidth="5" className="rotating-wheel" />
          <circle cx="150" cy="350" r="22" fill="#FFFFFF" stroke="#1E3A5F" strokeWidth="4" />
          <circle cx="150" cy="350" r="10" fill="#87CEEB" />

          <circle cx="240" cy="350" r="35" fill="#87CEEB" stroke="#1E3A5F" strokeWidth="5" className="rotating-wheel" />
          <circle cx="240" cy="350" r="22" fill="#FFFFFF" stroke="#1E3A5F" strokeWidth="4" />
          <circle cx="240" cy="350" r="10" fill="#87CEEB" />

          <circle cx="340" cy="350" r="35" fill="#87CEEB" stroke="#1E3A5F" strokeWidth="5" className="rotating-wheel" />
          <circle cx="340" cy="350" r="22" fill="#FFFFFF" stroke="#1E3A5F" strokeWidth="4" />
          <circle cx="340" cy="350" r="10" fill="#87CEEB" />

          <circle cx="420" cy="350" r="35" fill="#87CEEB" stroke="#1E3A5F" strokeWidth="5" className="rotating-wheel" />
          <circle cx="420" cy="350" r="22" fill="#FFFFFF" stroke="#1E3A5F" strokeWidth="4" />
          <circle cx="420" cy="350" r="10" fill="#87CEEB" />
        </svg>

        {/* compartments */}
        <div className={`compartment compartment-red ${isShaking && missingIndex === 0 ? 'shake' : ''}`}>
          <div className="compartment-top-cap" />
          <div className="compartment-letter-card">
            <span className="compartment-letter">{sequence[0] === null ? '?' : sequence[0]}</span>
          </div>
          <div className="compartment-wheel wheel-left" />
          <div className="compartment-wheel wheel-right" />
          <div className="compartment-connector" />
        </div>

        <div className={`compartment compartment-yellow ${isShaking && missingIndex === 1 ? 'shake' : ''}`}>
          <div className="compartment-top-cap" />
          <div className="compartment-letter-card">
            <span className="compartment-letter">{sequence[1] === null ? '?' : sequence[1]}</span>
          </div>
          <div className="compartment-wheel wheel-left" />
          <div className="compartment-wheel wheel-right" />
          <div className="compartment-connector" />
        </div>

        <div className={`compartment compartment-green ${isShaking && missingIndex === 2 ? 'shake' : ''}`}>
          <div className="compartment-top-cap" />
          <div className="compartment-letter-card">
            <span className="compartment-letter">{sequence[2] === null ? '?' : sequence[2]}</span>
          </div>
          <div className="compartment-wheel wheel-left" />
          <div className="compartment-wheel wheel-right" />
        </div>
      </div>
    </div>
  );
}

