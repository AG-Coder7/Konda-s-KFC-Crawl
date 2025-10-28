import { useState, useEffect, useCallback, useRef } from 'react';
import type { Position, Direction, GameMode, Food } from './types.ts';
import {
  TILE_COUNT,
  INITIAL_SNAKE_POSITION,
  GAME_MODE_CONFIGS,
  HIGH_SCORE_KEY_PREFIX,
  COLESTROL_UNLOCK_REQUIREMENTS,
  COLESTROL_UNLOCKED_KEY,
  INSANE_UNLOCKED_KEY,
  COLESTROL_MAZE,
} from './constants.ts';
import { useInterval } from './useInterval.ts';
import { useSounds } from './useSounds.ts';

const FIXED_COLESTROL_SNAKE_LENGTH = 5;
const SPEED_INCREMENT = 1; // ms to decrease delay by on each food eaten

const MIN_SPEEDS: Record<GameMode, number> = {
  EASY: 60,
  MEDIUM: 50,
  HARD: 40,
  EXTREME: 35,
  INSANE: 30,
  COLESTROL: GAME_MODE_CONFIGS['COLESTROL'].speed, // No speed up
};


const generateRandomObstacles = (segmentCount: number): Position[] => {
  const occupied = new Set<string>();
  INITIAL_SNAKE_POSITION.forEach((p) => occupied.add(`${p.x},${p.y}`));

  const obstacles: Position[] = [];
  let segmentsPlaced = 0;

  let attempts = 0;
  while (segmentsPlaced < segmentCount && attempts < 200) {
    attempts++;
    const length = 2 + Math.floor(Math.random() * 3); // 2 to 4 segments long
    const isHorizontal = Math.random() > 0.5;
    const startPos: Position = {
      x: 1 + Math.floor(Math.random() * (TILE_COUNT - (isHorizontal ? length : 1) - 2)),
      y: 1 + Math.floor(Math.random() * (TILE_COUNT - (!isHorizontal ? length : 1) - 2)),
    };

    const wallSegment: Position[] = [];
    let canPlace = true;
    for (let j = 0; j < length; j++) {
      const currentPos: Position = isHorizontal
        ? { x: startPos.x + j, y: startPos.y }
        : { x: startPos.x, y: startPos.y + j };

      const isOccupied = occupied.has(`${currentPos.x},${currentPos.y}`);
      const isNearCenter = Math.abs(currentPos.x - TILE_COUNT / 2) < 4 && Math.abs(currentPos.y - TILE_COUNT / 2) < 4;

      if (isOccupied || isNearCenter) {
        canPlace = false;
        break;
      }
      wallSegment.push(currentPos);
    }

    if (canPlace) {
      wallSegment.forEach(pos => {
        obstacles.push(pos);
        occupied.add(`${pos.x},${pos.y}`);
      });
      segmentsPlaced += length;
    }
  }
  return obstacles;
};


const getRandomPosition = (
  snake: Position[],
  obstacles: Position[]
): Position => {
  let newPosition: Position;
  do {
    newPosition = {
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT),
    };
  } while (
    snake.some(
      (segment) => segment.x === newPosition.x && segment.y === newPosition.y
    ) ||
    obstacles.some(
      (obstacle) => obstacle.x === newPosition.x && obstacle.y === newPosition.y
    )
  );
  return newPosition;
};

export const useGameLogic = (gameMode: GameMode = 'EASY') => {
  const { speed, obstacleCount } = GAME_MODE_CONFIGS[gameMode];
  const { playEatSound, playGoldenEatSound, playGameOverSound, playCountdownTickSound, playCountdownGoSound } = useSounds();

  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE_POSITION);
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [food, setFood] = useState<Food | null>(null);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isColestrolUnlocked, setIsColestrolUnlocked] = useState(false);
  const [isInsaneUnlocked, setIsInsaneUnlocked] = useState(false);
  const [allHighScores, setAllHighScores] = useState<Record<string, number>>({});
  const [currentSpeed, setCurrentSpeed] = useState(speed);
  
  const goldenFoodTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  
  const hapticFeedback = (type: 'light' | 'heavy') => {
      if (window.navigator.vibrate) {
          window.navigator.vibrate(type === 'light' ? 50 : [100, 50, 100]);
      }
  };

  const loadUnlockStatus = useCallback(() => {
    const colestrol = localStorage.getItem(COLESTROL_UNLOCKED_KEY) === 'true';
    const insane = localStorage.getItem(INSANE_UNLOCKED_KEY) === 'true';
    setIsColestrolUnlocked(colestrol);
    setIsInsaneUnlocked(insane);

    const scores: { [key: string]: number } = {};
    Object.keys(COLESTROL_UNLOCK_REQUIREMENTS).forEach(mode => {
      scores[mode] = parseInt(localStorage.getItem(`${HIGH_SCORE_KEY_PREFIX}${mode}`) || '0', 10);
    });
    setAllHighScores(scores);
  }, []);

  const loadHighScore = useCallback(() => {
    const savedHighScore = localStorage.getItem(`${HIGH_SCORE_KEY_PREFIX}${gameMode}`);
    setHighScore(savedHighScore ? parseInt(savedHighScore, 10) : 0);
  }, [gameMode]);
  
  useEffect(() => {
    loadHighScore();
    loadUnlockStatus();
  }, [gameMode, loadHighScore, loadUnlockStatus]);

  const checkColestrolUnlock = useCallback((currentMode: GameMode, newScore: number) => {
    if (isColestrolUnlocked) return;
    
    const currentHighScores = { ...allHighScores };
    Object.keys(COLESTROL_UNLOCK_REQUIREMENTS).forEach(mode => {
        currentHighScores[mode] = parseInt(localStorage.getItem(`${HIGH_SCORE_KEY_PREFIX}${mode}`) || '0', 10);
    });
    currentHighScores[currentMode] = Math.max(currentHighScores[currentMode] || 0, newScore);

    const unlocked = Object.entries(COLESTROL_UNLOCK_REQUIREMENTS).every(
        ([mode, requiredScore]) => (currentHighScores[mode] || 0) >= requiredScore!
    );

    if (unlocked) {
        setIsColestrolUnlocked(true);
        localStorage.setItem(COLESTROL_UNLOCKED_KEY, 'true');
    }
  }, [isColestrolUnlocked, allHighScores]);

  const resetGame = useCallback(() => {
    if (goldenFoodTimeoutRef.current) clearTimeout(goldenFoodTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    setIsGameWon(false);
    const isColestrol = gameMode === 'COLESTROL';

    const initialSnake = isColestrol
      ? Array.from({ length: FIXED_COLESTROL_SNAKE_LENGTH }, (_, i) => ({ x: 1, y: i + 1 }))
      : INITIAL_SNAKE_POSITION;
    
    const gameObstacles = isColestrol ? COLESTROL_MAZE : generateRandomObstacles(obstacleCount);
    
    const foodPosition = isColestrol
      ? { x: TILE_COUNT - 2, y: TILE_COUNT - 2 }
      : getRandomPosition(initialSnake, gameObstacles);
      
    const foodType = isColestrol ? 'golden' : 'regular';
    
    setObstacles(gameObstacles);
    setSnake(initialSnake);
    setFood({ position: foodPosition, type: foodType });
    setDirection(isColestrol ? 'DOWN' : 'RIGHT');
    setScore(0);
    setIsGameOver(false);
    setIsRunning(false);
    setIsPaused(false);
    setCountdown(0);
    setCurrentSpeed(GAME_MODE_CONFIGS[gameMode].speed);
    loadHighScore();
  }, [gameMode, obstacleCount, loadHighScore]);

  const startGame = useCallback(() => {
    resetGame();
    setCountdown(4);
    
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev > 2) {
          playCountdownTickSound();
          return prev - 1;
        } else if (prev === 2) {
          playCountdownGoSound();
          return prev - 1;
        } else if (prev === 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setIsRunning(true);
          return 0;
        }
        return 0;
      });
    }, 800);
  }, [resetGame, playCountdownTickSound, playCountdownGoSound]);

  const goBackToMenu = useCallback(() => {
    resetGame();
    loadUnlockStatus();
  }, [resetGame, loadUnlockStatus]);
  
  const togglePause = useCallback(() => {
      if (isRunning && !isGameOver && countdown === 0) {
        setIsPaused(prev => !prev);
      }
  }, [isRunning, isGameOver, countdown]);

  const moveSnake = useCallback(() => {
    if (!isRunning || isGameOver || isPaused || countdown > 0 || isGameWon) return;

    const isColestrol = gameMode === 'COLESTROL';
    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    switch (direction) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    const handleWin = () => {
        playGoldenEatSound();
        hapticFeedback('heavy');
        setIsGameWon(true);
        setIsRunning(false);
        localStorage.setItem(INSANE_UNLOCKED_KEY, 'true');
        setIsInsaneUnlocked(true);
    };
    
    const handleGameOver = () => {
        hapticFeedback('heavy');
        playGameOverSound();
        setIsGameOver(true);
        setIsRunning(false);
        if (score > highScore && !isColestrol) {
            localStorage.setItem(`${HIGH_SCORE_KEY_PREFIX}${gameMode}`, score.toString());
            setHighScore(score);
            checkColestrolUnlock(gameMode, score);
        }
    }

    if (!isColestrol) {
      if (head.x < 0) head.x = TILE_COUNT - 1;
      else if (head.x >= TILE_COUNT) head.x = 0;
      if (head.y < 0) head.y = TILE_COUNT - 1;
      else if (head.y >= TILE_COUNT) head.y = 0;
    }

    if (obstacles.some(o => o.x === head.x && o.y === head.y)) {
      handleGameOver();
      return;
    }

    for (let i = 1; i < newSnake.length; i++) {
      if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
        handleGameOver();
        return;
      }
    }

    newSnake.unshift(head);

    if (food && head.x === food.position.x && head.y === food.position.y) {
        if (isColestrol) {
            handleWin();
            return;
        }

        hapticFeedback('light');
        let points = 1;
        if (food.type === 'golden') {
            points = 5;
            playGoldenEatSound();
            if (goldenFoodTimeoutRef.current) clearTimeout(goldenFoodTimeoutRef.current);
        } else {
            playEatSound();
        }
        
        setScore((prev) => prev + points);
        setCurrentSpeed(prevSpeed => Math.max(MIN_SPEEDS[gameMode], prevSpeed - SPEED_INCREMENT));

        const shouldSpawnGolden = Math.random() < 0.15;
        const newFoodPosition = getRandomPosition(newSnake, obstacles);
        if(shouldSpawnGolden) {
            setFood({ position: newFoodPosition, type: 'golden'});
            goldenFoodTimeoutRef.current = window.setTimeout(() => {
                setFood({ position: getRandomPosition(newSnake, obstacles), type: 'regular'});
            }, 5000);
        } else {
            setFood({ position: newFoodPosition, type: 'regular'});
        }

    } else {
       if (isColestrol && newSnake.length > FIXED_COLESTROL_SNAKE_LENGTH) {
        newSnake.pop();
      } else if (!isColestrol) {
        newSnake.pop();
      }
    }

    setSnake(newSnake);
  }, [snake, direction, food, isGameOver, isRunning, isPaused, obstacles, score, highScore, gameMode, countdown, playEatSound, playGoldenEatSound, playGameOverSound, isGameWon, checkColestrolUnlock]);

  useInterval(moveSnake, isRunning && !isPaused ? currentSpeed : null);

  const changeDirection = useCallback(
    (newDirection: Direction) => {
      if (!isRunning || isPaused || countdown > 0) return;
      setDirection((prevDirection) => {
        if (
          (prevDirection === 'UP' && newDirection === 'DOWN') ||
          (prevDirection === 'DOWN' && newDirection === 'UP') ||
          (prevDirection === 'LEFT' && newDirection === 'RIGHT') ||
          (prevDirection === 'RIGHT' && newDirection === 'LEFT')
        ) {
          return prevDirection;
        }
        return newDirection;
      });
    },
    [isRunning, isPaused, countdown]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'Escape') {
          e.preventDefault();
          togglePause();
          return;
      }
      let newDirection: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp': case 'w': newDirection = 'UP'; break;
        case 'ArrowDown': case 's': newDirection = 'DOWN'; break;
        case 'ArrowLeft': case 'a': newDirection = 'LEFT'; break;
        case 'ArrowRight': case 'd': newDirection = 'RIGHT'; break;
        default: return;
      }
      if (newDirection) {
        e.preventDefault();
        changeDirection(newDirection);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, togglePause]);

  return {
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
    gameMode,
  };
};