export type Connect4Color = 'red' | 'yellow';
export type Connect4Cell = Connect4Color | null;
export type Connect4Board = Connect4Cell[][]; // 6 rows, 7 cols

export const ROWS = 6;
export const COLS = 7;

export function createConnect4Board(): Connect4Board {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
}

export function dropPiece(board: Connect4Board, col: number, color: Connect4Color): { success: boolean; newBoard: Connect4Board; row: number } {
    if (col < 0 || col >= COLS) return { success: false, newBoard: board, row: -1 };

    // Find the first empty cell from the bottom (row 5 down to 0)
    // Board[0] is top, Board[5] is bottom usually for visual mapping
    // Let's assume Board[0] is TOP.
    // So we search from ROWS-1 (5) up to 0.

    const newBoard = board.map(row => [...row]); // Deep copy rows
    let placedRow = -1;

    for (let r = ROWS - 1; r >= 0; r--) {
        if (newBoard[r][col] === null) {
            newBoard[r][col] = color;
            placedRow = r;
            break;
        }
    }

    if (placedRow === -1) {
        return { success: false, newBoard: board, row: -1 }; // Column full
    }

    return { success: true, newBoard, row: placedRow };
}

export function checkConnect4Win(board: Connect4Board, lastRow: number, lastCol: number, color: Connect4Color): boolean {
    if (lastRow === -1 || lastCol === -1) return false;

    // Directions: Horizontal, Vertical, Diagonal /, Diagonal \
    const directions = [
        [0, 1],  // Horizontal
        [1, 0],  // Vertical
        [1, 1],  // Diagonal \ (down-right)
        [1, -1]  // Diagonal / (down-left)
    ];

    for (const [dr, dc] of directions) {
        let count = 1; // Count current piece

        // Check forward
        for (let i = 1; i < 4; i++) {
            const r = lastRow + dr * i;
            const c = lastCol + dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== color) break;
            count++;
        }

        // Check backward
        for (let i = 1; i < 4; i++) {
            const r = lastRow - dr * i;
            const c = lastCol - dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== color) break;
            count++;
        }

        if (count >= 4) return true;
    }

    return false;
}

export function isBoardFull(board: Connect4Board): boolean {
    // Check if top row is full
    return board[0].every(cell => cell !== null);
}
