import React, { useState, useEffect } from 'react';

interface ScoreBoardProps {
  score: number;
  highScore: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, highScore }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (score > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [score]);

  return (
    <div className="flex justify-between items-center w-full max-w-sm p-2 mb-2 rounded-lg bg-black bg-opacity-20">
      <div className="text-left">
        <p className="text-sm md:text-base text-gray-400 font-game">Score</p>
        <p className={`text-lg md:text-xl font-bold text-yellow-400 transition-transform ${isAnimating ? 'score-pop' : ''}`}>
          {score}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm md:text-base text-gray-400 font-game">High Score</p>
        <p className="text-lg md:text-xl font-bold text-yellow-400">{highScore}</p>
      </div>
    </div>
  );
};

export default ScoreBoard;