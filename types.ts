export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameMode = 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME' | 'COLESTROL' | 'INSANE';

export type FoodType = 'regular' | 'golden';

export interface Food {
  position: Position;
  type: FoodType;
}