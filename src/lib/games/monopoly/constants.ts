export type PropertyGroup = 'brown' | 'light-blue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'dark-blue' | 'station' | 'utility';

export type SpaceType = 'property' | 'chance' | 'chest' | 'tax' | 'go' | 'jail' | 'parking' | 'go-to-jail';

export interface BoardSpace {
    id: number; // 0-39
    name: string;
    type: SpaceType;
    price?: number;
    rent?: number[]; // Base, 1h, 2h, 3h, 4h, hotel
    group?: PropertyGroup;
    houseCost?: number;
}

export const MONOPOLY_BOARD: BoardSpace[] = [
    { id: 0, name: "GO", type: 'go' },
    { id: 1, name: "Old Kent Road", type: 'property', group: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50 },
    { id: 2, name: "Community Chest", type: 'chest' },
    { id: 3, name: "Whitechapel Road", type: 'property', group: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50 },
    { id: 4, name: "Income Tax", type: 'tax', price: 200 },
    { id: 5, name: "Kings Cross Station", type: 'property', group: 'station', price: 200, rent: [25, 50, 100, 200] },
    { id: 6, name: "The Angel Islington", type: 'property', group: 'light-blue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
    { id: 7, name: "Chance", type: 'chance' },
    { id: 8, name: "Euston Road", type: 'property', group: 'light-blue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
    { id: 9, name: "Pentonville Road", type: 'property', group: 'light-blue', price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50 },
    { id: 10, name: "Jail", type: 'jail' },
    { id: 11, name: "Pall Mall", type: 'property', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
    { id: 12, name: "Electric Company", type: 'property', group: 'utility', price: 150 },
    { id: 13, name: "Whitehall", type: 'property', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
    { id: 14, name: "Northumberland Avenue", type: 'property', group: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100 },
    { id: 15, name: "Marylebone Station", type: 'property', group: 'station', price: 200, rent: [25, 50, 100, 200] },
    { id: 16, name: "Bow Street", type: 'property', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
    { id: 17, name: "Community Chest", type: 'chest' },
    { id: 18, name: "Marlborough Street", type: 'property', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
    { id: 19, name: "Vine Street", type: 'property', group: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100 },
    { id: 20, name: "Free Parking", type: 'parking' },
    { id: 21, name: "Strand", type: 'property', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
    { id: 22, name: "Chance", type: 'chance' },
    { id: 23, name: "Fleet Street", type: 'property', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
    { id: 24, name: "Trafalgar Square", type: 'property', group: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150 },
    { id: 25, name: "Fenchurch St. Station", type: 'property', group: 'station', price: 200, rent: [25, 50, 100, 200] },
    { id: 26, name: "Leicester Square", type: 'property', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
    { id: 27, name: "Coventry Street", type: 'property', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
    { id: 28, name: "Water Works", type: 'property', group: 'utility', price: 150 },
    { id: 29, name: "Piccadilly", type: 'property', group: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150 },
    { id: 30, name: "Go To Jail", type: 'go-to-jail' },
    { id: 31, name: "Regent Street", type: 'property', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200 },
    { id: 32, name: "Oxford Street", type: 'property', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200 },
    { id: 33, name: "Community Chest", type: 'chest' },
    { id: 34, name: "Bond Street", type: 'property', group: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200 },
    { id: 35, name: "Liverpool St. Station", type: 'property', group: 'station', price: 200, rent: [25, 50, 100, 200] },
    { id: 36, name: "Chance", type: 'chance' },
    { id: 37, name: "Park Lane", type: 'property', group: 'dark-blue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200 },
    { id: 38, name: "Super Tax", type: 'tax', price: 100 },
    { id: 39, name: "Mayfair", type: 'property', group: 'dark-blue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200 }
];
