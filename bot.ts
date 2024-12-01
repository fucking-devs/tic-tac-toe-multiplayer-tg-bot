import { Bot, Context, GrammyError, HttpError } from 'grammy';
import { createGameKeyboard } from './keyboard';
import { startGame, makeMove, resetGame } from './gameLogic';
import { sendInvitation, acceptInvitation, declineInvitation } from './inviteLogic';

const bot = new Bot('7420628298:AAH_hibqqR4jtJcyAOwVemJSuBzuHERTKO0'); // Замените на ваш токен

// Обработчик ошибок
bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;

    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
});

// Команда /start
bot.command('start', async (ctx) => {
    await ctx.reply('Добро пожаловать в игру Крестики-Нолики!\n\n' +
        'Используйте следующие команды:\n' +
        '/invite <username> - Пригласить другого игрока.\n' +
        '/accept - Принять приглашение на игру.\n' +
        '/decline - Отклонить приглашение на игру.\n' +
        '/reset - Сбросить текущую игру.\n' +
        '/play_with_you - Играть против компьютера.\n' +
        'Нажмите кнопку ниже, чтобы начать игру.', {
            reply_markup: { inline_keyboard: [[{ text: 'Играть', callback_data: 'play_game' }]] }
        });
});

// Обработчик команды /reset
bot.command('reset', async (ctx) => {
    await resetGame(ctx); // Не ожидаем результат
    await ctx.reply("Игра сброшена! Используйте /start для начала новой игры."); // Сообщение о сбросе
});

// Обработчик команды /invite
bot.command('invite', async (ctx) => {
    const username = ctx.message?.text?.split(" ")[1]; // Получаем имя пользователя из команды
    if (username) {
        const result = await sendInvitation(ctx, username);
        await ctx.reply(result ?? "Произошла ошибка при отправке приглашения."); // Обработка результата
    } else {
        await ctx.reply("Пожалуйста, укажите имя пользователя для приглашения.");
    }
});

// Обработчик команды /accept
bot.command('accept', async (ctx) => {
    const result = await acceptInvitation(ctx);
    await ctx.reply(result ?? "Ошибка: нет активного приглашения."); // Обработка результата
});

// Обработчик команды /decline
bot.command('decline', async (ctx) => {
    const result = await declineInvitation(ctx);
    await ctx.reply(result ?? "Ошибка: нет активного приглашения для отклонения."); // Обработка результата
});

// Обработчик команды /play_with_computer
bot.command('play_with_computer', async (ctx) => {
    await startGame(ctx); // Запускаем игру против компьютера
    await ctx.reply("Игра с компьютером началась! Выберите клетку."); // Сообщение о начале игры
});

// Обработка нажатий кнопок
bot.on('callback_query:data', async (ctx) => {
    if (ctx.callbackQuery.data === 'play_game') {
        await startGame(ctx); // Запускаем режим игрок против игрока
        await ctx.reply("Игра началась! Выберите клетку."); // Сообщение о начале игры
    } else {
        const cellIndex = parseInt(ctx.callbackQuery.data);
        if (!isNaN(cellIndex)) { // Проверка на корректность индекса клетки
            const result = await makeMove(ctx, cellIndex);
            if (result) {
                await ctx.reply(result); // Отправляем новое сообщение с результатом
            }
        } else {
            await ctx.reply("Некорректный ввод. Пожалуйста, выберите клетку.");
        }
    }
});

bot.start();