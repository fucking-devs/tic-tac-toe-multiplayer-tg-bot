import { InlineKeyboard } from 'grammy';

export function createGameKeyboard(board: (string | null)[]) {
    const keyboard = new InlineKeyboard(); // Создаем экземпляр InlineKeyboard

    for (let i = 0; i < 9; i++) {
        // Добавляем кнопку для каждой клетки
        keyboard.text(board[i] ?? (i + 1).toString(), i.toString());

        // Добавляем новую строку каждые три кнопки
        if ((i + 1) % 3 === 0 && i < 8) {
            keyboard.row();
        }
    }

    return keyboard; // Возвращаем экземпляр клавиатуры
}