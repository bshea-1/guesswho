import { MONOPOLY_BOARD, BoardSpace, PropertyGroup } from './constants';
import { Player } from '@/lib/types';

export interface MonopolyPlayerData {
    money: number;
    position: number;
    properties: number[];
    inJail: boolean;
    jailTurns: number;
    color: string; // Token color
    // Future: houses/hotels mapping { propertyId: count }
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

export function getPropertiesInGroup(group: PropertyGroup): BoardSpace[] {
    return MONOPOLY_BOARD.filter(s => s.group === group);
}

export function checkColorSetOwnership(gameState: any, playerId: string, group: PropertyGroup): boolean {
    const groupProperties = getPropertiesInGroup(group);
    const playerProps = gameState.players[playerId].data.properties;
    return groupProperties.every(p => playerProps.includes(p.id));
}

export function calculateRent(property: BoardSpace, diceRoll: number, ownerId: string, gameState: any): number {
    if (!property.rent) return 0;

    // Utilities
    if (property.group === 'utility') {
        // Check if owner owns both
        const hasBoth = checkColorSetOwnership(gameState, ownerId, 'utility');
        return diceRoll * (hasBoth ? 10 : 4);
    }

    // Stations
    if (property.group === 'station') {
        const stationGroup = getPropertiesInGroup('station');
        const ownerProps = gameState.players[ownerId].data.properties;
        const stationsOwned = stationGroup.filter(s => ownerProps.includes(s.id)).length;
        // 25, 50, 100, 200
        return 25 * Math.pow(2, stationsOwned - 1);
    }

    // Standard Properties
    // Check for Monopoly (all colors owned) implies double rent on unimproved lots
    // housing logic would go here: if (houses > 0) return property.rent[houses];

    const hasMonopoly = property.group ? checkColorSetOwnership(gameState, ownerId, property.group) : false;
    // Assuming no houses for now, logic:
    return property.rent[0] * (hasMonopoly ? 2 : 1);
}

export function getSpace(position: number): BoardSpace {
    return MONOPOLY_BOARD[position % MONOPOLY_BOARD.length];
}

// Helper to check if player can afford amount
export function canAfford(playerData: MonopolyPlayerData, amount: number): boolean {
    return playerData.money >= amount;
}
