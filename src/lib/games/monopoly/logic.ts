import { MONOPOLY_BOARD, BoardSpace } from './constants';
import { Player } from '@/lib/types';

export interface MonopolyPlayerData {
    money: number;
    position: number;
    properties: number[];
    inJail: boolean;
    jailTurns: number;
    color: string; // Token color
}

export const INITIAL_MONOPOLY_MONEY = 1500;

export function createInitialMonopolyData(color: string): MonopolyPlayerData {
    return {
        money: INITIAL_MONOPOLY_MONEY,
        position: 0, // GO
        properties: [],
        inJail: false,
        jailTurns: 0,
        color
    };
}

export function rollDice(): [number, number] {
    return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
}

export function calculateRent(property: BoardSpace, diceRoll: number): number {
    // Simplified rent calculation (ignores houses/ownership set bonus for now)
    // TODO: Implement full rent logic (color sets, houses)
    if (property.group === 'utility') {
        return diceRoll * 4; // Basic utility rule
    }
    if (property.group === 'station') {
        return 25; // Base station rent (needs count logic)
    }
    if (property.rent && property.rent.length > 0) {
        return property.rent[0]; // Base rent
    }
    return 0;
}

export function getSpace(position: number): BoardSpace {
    return MONOPOLY_BOARD[position % MONOPOLY_BOARD.length];
}

// Helper to check if player can afford amount
export function canAfford(playerData: MonopolyPlayerData, amount: number): boolean {
    return playerData.money >= amount;
}
