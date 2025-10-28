import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from './GameBoard.tsx';
import ScoreBoard from './ScoreBoard.tsx';
import GameOverModal from './GameOverModal.tsx';
import { useGameLogic } from './useGameLogic.ts';
import { useSounds } from './useSounds.ts';
import {
  FOOD_IMG_URL,
  SNAKE_HEAD_B64,
  SNAKE_BODY_B64,
  GOLDEN_FOOD_IMG_URL,
  COLESTROL_UNLOCK_REQUIREMENTS,
} from './constants.ts';
import type { GameMode } from './types.ts';
import MobileControls from './MobileControls.tsx';

const FullscreenEnterIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 4l-5-5" />
  </svg>
);

const FullscreenExitIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l-6 6m0 0l6-6m-6 6h6V14m4-4l6-6m0 0l-6 6m6-6v6h-6" />
  </svg>
);

const PauseIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>
);

const PlayIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25v13.5l10.5-6.75L5.25 5.25z" /></svg>
);

const LockIcon = ({ className = 'h-4 w-4 inline-block ml-1' } : { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
);


const gameModes: { id: GameMode; name: string }[] = [
  { id: 'EASY', name: 'Easy' },
  { id: 'MEDIUM', name: 'Medium' },
  { id: 'HARD', name: 'Hard' },
  { id: 'EXTREME', name: 'Extreme' },
];

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('EASY');
  const { playClickSound } = useSounds();
  const {
    snake,
    food,
    score,
    highScore,
    isGameOver,
    startGame,
    changeDirection,
    isRunning,
    isPaused,
    togglePause,
    obstacles,
    goBackToMenu,
    direction,
    countdown,
    isGameWon,
    isColestrolUnlocked,
    isInsaneUnlocked,
    allHighScores,
    gameMode: activeGameMode,
  } = useGameLogic(gameMode);
  
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleSetGameMode = (mode: GameMode) => {
    playClickSound();
    setGameMode(mode);
  };

  const handleStartGame = () => {
    playClickSound();
    startGame();
  }

  useEffect(() => {
    const imagesToPreload = [FOOD_IMG_URL, SNAKE_HEAD_B64, SNAKE_BODY_B64, GOLDEN_FOOD_IMG_URL];
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  const showMenu = !isRunning && !isGameOver && countdown === 0 && !isGameWon;
  const showControls = !showMenu && !isGameOver && !isGameWon;
  const controlsDisabled = !isRunning || isPaused || countdown > 0;

  const renderUnlockTooltip = () => {
    const requirements = Object.entries(COLESTROL_UNLOCK_REQUIREMENTS);
    
    return (
      <div className="tooltip-text">
        <p className="font-bold mb-1">Unlock Challenge:</p>
        <ul className="list-disc list-inside">
          {requirements.map(([mode, score]) => (
            <li key={mode} className={`${(allHighScores[mode] || 0) >= score! ? 'text-green-400' : 'text-red-400'}`}>
              {mode}: {allHighScores[mode] || 0} / {score}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center">
        <header className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-game tracking-wider">
            <span className="text-red-500 kfc-text-glow">Konda's</span> <span className="text-green-400 snake-text-glow">KFC Crawl</span>
          </h1>
        </header>
        
        <main className="relative w-full flex flex-col items-center">
          <ScoreBoard score={score} highScore={highScore} />

          <div className="relative">
             {showMenu && (
              <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex flex-col justify-center items-center z-10 rounded-lg p-4 menu-fade-in">
                <h2 className="text-3xl font-bold mb-6 text-glow menu-item menu-item-1">Select Mode</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                  {gameModes.map((mode, index) => (
                    <button
                      key={mode.id}
                      onClick={() => handleSetGameMode(mode.id)}
                      className={`font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm md:text-base border-2 menu-item menu-item-${index + 2} ${
                        gameMode === mode.id
                          ? 'bg-green-500 border-green-300 text-white scale-105 shadow-lg'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500 text-gray-200'
                      }`}
                    >
                      {mode.name}
                    </button>
                  ))}

                  {/* Colestrol Mode Button */}
                  <div className="tooltip-container menu-item menu-item-6">
                    <button
                      onClick={() => handleSetGameMode('COLESTROL')}
                      disabled={!isColestrolUnlocked}
                      className={`w-full font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm md:text-base border-2 ${
                          gameMode === 'COLESTROL' ? 'bg-yellow-500 border-yellow-300 text-white scale-105 shadow-lg'
                          : 'bg-gray-700 border-gray-600 hover:bg-yellow-600 hover:border-yellow-500 text-gray-200'
                      } disabled:bg-gray-800 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed`}
                    >
                      Colestrol {!isColestrolUnlocked && <LockIcon />}
                    </button>
                    {!isColestrolUnlocked && renderUnlockTooltip()}
                  </div>
                  
                  {/* Insane Mode Button */}
                  {isInsaneUnlocked && (
                     <button
                      onClick={() => handleSetGameMode('INSANE')}
                      className={`font-bold py-2 px-4 rounded-lg transition-all duration-200 text-sm md:text-base border-2 menu-item menu-item-6 ${
                        gameMode === 'INSANE'
                          ? 'bg-red-700 border-red-500 text-white scale-105 shadow-lg'
                          : 'bg-gray-700 border-gray-600 hover:bg-red-700 hover:border-red-600 text-gray-200'
                      }`}
                    >
                      Insane
                    </button>
                  )}
                </div>
                <button
                  onClick={handleStartGame}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-200 hover:scale-105 text-lg shadow-lg menu-item menu-item-6"
                >
                  Start Game
                </button>
                 <p className="mt-6 text-xs md:text-sm text-gray-400 menu-item menu-item-6">Use Arrow/WASD keys or swipe to move. 'P' or 'Esc' to pause.</p>
              </div>
            )}
            {isGameOver && <GameOverModal score={score} highScore={highScore} onRestart={startGame} onChangeMode={goBackToMenu} isGameWon={isGameWon} gameMode={activeGameMode} />}
            <GameBoard snake={snake} food={food} obstacles={obstacles} onDirectionChange={changeDirection} direction={direction} isPaused={isPaused} isGameOver={isGameOver} countdown={countdown} gameMode={activeGameMode}/>
          </div>

          <div className="flex items-center justify-center space-x-4 mt-4 w-full">
              <button
                onClick={togglePause}
                disabled={!isRunning || countdown > 0}
                className="p-2 rounded-full bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                aria-label={isPaused ? 'Resume game' : 'Pause game'}
                title={isPaused ? 'Resume game' : 'Pause game'}
              >
                  {isPaused ? <PlayIcon /> : <PauseIcon />}
              </button>
          </div>
          {showControls && <MobileControls onDirectionChange={changeDirection} disabled={controlsDisabled} />}
        </main>
        
        <footer className="mt-6 text-xs text-gray-500 flex items-center space-x-4">
          <p>Enhanced by a Gemini API expert</p>
          <button 
            onClick={toggleFullscreen} 
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default App;