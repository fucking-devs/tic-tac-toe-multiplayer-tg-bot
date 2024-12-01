import { Context } from 'grammy';

interface Invitation {
    from: string; // Имя пользователя, отправившего приглашение
    to: string;   // Имя пользователя, которому отправлено приглашение
    chatId: number; // Идентификатор чата, где происходит игра
}

// Хранение активных приглашений
const invitations: Record<number, Invitation> = {}; // Ключ - chatId, значение - объект приглашения

// Функция для отправки приглашения
export async function sendInvitation(ctx: Context, username: string) {
    const chatId = ctx.chat?.id; // Получаем идентификатор чата
    const from = ctx.from?.username; // Получаем имя пользователя, отправившего приглашение

    if (!chatId || !from) {
        return "Ошибка: не удалось получить информацию о чате или пользователе.";
    }

    // Проверяем, есть ли уже активное приглашение
    if (invitations[chatId]) {
        return `У вас уже есть активное приглашение для игры.`;
    }

    // Сохраняем приглашение
    invitations[chatId] = { from, to: username, chatId };

    // Отправляем сообщение с предложением принять приглашение
    await ctx.api.sendMessage(username, `Пользователь @${from} пригласил вас играть в крестики-нолики! Напишите /accept для принятия или /decline для отказа.`);
    
    return `Приглашение отправлено пользователю @${username}.`;
}

// Функция для обработки принятия приглашения
export async function acceptInvitation(ctx: Context) {
    const chatId = ctx.chat?.id;

    if (!chatId || !invitations[chatId]) {
        return "Ошибка: нет активного приглашения.";
    }

    const invitation = invitations[chatId];

    await ctx.reply(`Вы приняли приглашение от @${invitation.from}. Начинаем игру!`);
    
    // Здесь можно вызвать функцию startGame() с необходимыми параметрами
    
    delete invitations[chatId]; // Удаляем приглашение после его принятия.
}

// Функция для обработки отказа от приглашения.
export async function declineInvitation(ctx: Context) {
   const chatId = ctx.chat?.id;

   if (!chatId || !invitations[chatId]) {
       return "Ошибка: нет активного приглашения.";
   }

   const invitation = invitations[chatId];

   await ctx.reply(`Вы отклонили приглашение от @${invitation.from}.`);
   
   delete invitations[chatId]; // Удаляем приглашение после отказа.
}