import { Context } from 'grammy';
import { createGameKeyboard } from './keyboard'; // Импортируем функцию для создания клавиатуры

interface GameState {
    board: (string | null)[];
    currentPlayer: string;
}

const games: Record<number, GameState> = {}; // Хранение состояния игр по chatId

export async function startGame(ctx: Context) {
    const chatId = ctx.chat?.id; // Проверка на undefined
    
    if (!chatId) return; // Если chatId не определен, выходим из функции

    // Инициализация состояния игры
    games[chatId] = {
        board: Array(9).fill(null),
        currentPlayer: 'X'
    };

    await ctx.reply("Игра начинается! Выберите клетку:", {
        reply_markup: createGameKeyboard(games[chatId].board)
    });
}

export async function resetGame(ctx: Context) {
    const chatId = ctx.chat?.id; // Проверка на undefined
    
    if (!chatId) return "Ошибка: не удалось сбросить игру."; // Если chatId не определен

    delete games[chatId]; // Удаляем текущее состояние игры
    return "Игра сброшена! Используйте /start для начала новой игры.";
}

export async function makeMove(ctx: Context, cellIndex: number) {
    const chatId = ctx.chat?.id; // Проверка на undefined
    
    if (!chatId || !games[chatId]) return;

    const game = games[chatId];

    if (game.board[cellIndex] !== null) {
        return 'Эта клетка уже занята! Попробуйте другую.';
    }

   game.board[cellIndex] = game.currentPlayer;

   const winner = checkWinner(game.board);
   
   if (winner) {
       delete games[chatId]; // Удаляем игру после завершения
       return `Игрок ${winner} выиграл! Игра окончена. Напишите /reset для новой игры.`;
   }

   // Проверка на ничью
   if (isDraw(game.board)) {
       delete games[chatId]; 
       return `Ничья! Игра окончена. Напишите /reset для новой игры.`;
   }

   game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X'; // Смена текущего игрока

   await ctx.reply("Ход игрока " + game.currentPlayer + ". Выберите клетку:", {
       reply_markup: createGameKeyboard(game.board)
   });
}

// Функция для проверки победителя
function checkWinner(board: (string | null)[]) {
   const winConditions = [
       [0, 1, 2],
       [3, 4, 5],
       [6, 7, 8],
       [0, 3, 6],
       [1, 4, 7],
       [2, 5, 8],
       [0, 4, 8],
       [2, 4, 6]
   ];

   for (const condition of winConditions) {
       const [a, b, c] = condition;
       if (board[a] && board[a] === board[b] && board[a] === board[c]) {
           return board[a]; // Возвращаем символ победителя ('X' или 'O')
       }
   }
   
   return null; // Нет победителя
}

// Функция для проверки ничьей
function isDraw(board: (string | null)[]) {
   return board.every(cell => cell !== null); // Если все клетки заняты и нет победителя
}