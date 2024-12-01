import { generateKey, randomUUID } from 'crypto'
import { db } from './db'
import { config } from 'dotenv'
config()

import { Bot, Context, GrammyError, HttpError } from 'grammy'

const generateKeyboard = (board: number[][], gameId: string) => {
  return board.map((row, r) =>
    row.map((cell, c) => ({
      text: cell === 0 ? ' ' : cell === 1 ? 'x' : 'o',
      callback_data: `put_elem:${gameId}:${r}:${c}`
    }))
  )
}

const checkGame = (board: number[][]) => {
  const checkLine = (line: number[]) => line[0] !== 0 && line.every((cell) => cell === line[0])

  for (const row of board) {
    if (checkLine(row)) return row[0]
  }

  for (let c = 0; c < 3; c++) {
    const line = [board[0][c], board[1][c], board[2][c]]
    if (checkLine(line)) return line[0]
  }

  if (checkLine([board[0][0], board[1][1], board[2][2]])) return board[0][0]
  if (checkLine([board[0][2], board[1][1], board[2][0]])) return board[0][2]

  if (board.every((row) => row.every((cell) => cell !== 0))) return 0

  return -1
}

const initBot = (token: string) => {
  const bot = new Bot(token)

  bot.catch((err) => {
    console.error({
      message: err.message
    })
  })

  bot.command('start', async (ctx) => {
    if (!ctx.from) return await ctx.reply('Только обычные пользователи могут играть')

    await ctx.reply(
      `Добро пожаловать, ${ctx.from.first_name || 'друг'}, с помощью этого бота ты можешь сыграть в крестики нолики с другом`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Играть с другом', callback_data: 'play_with_friend' }],
            [{ text: 'Играть с компьютером', callback_data: 'play_with_comp' }]
          ]
        }
      }
    )
  })

  bot.callbackQuery('play_with_friend', async (ctx) => {
    const userId = ctx.from.id
    const name = ctx.from.first_name
    const gameId = randomUUID()

    const sendedMessage = await ctx.reply('Ожидаем соперника', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Присоединиться', callback_data: `join_game:${gameId}` }]]
      }
    })

    db.games[gameId] = {
      users: [
        {
          userId,
          name,
          symbol: 'x'
        }
      ],
      board: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ],
      messageId: sendedMessage.message_id,
      chatId: sendedMessage.chat.id,
      awaitUserId: userId
    }
  })

  bot.callbackQuery(/^join_game/, async (ctx) => {
    const gameId = ctx.callbackQuery.data.split(':')[1]
    const userId = ctx.from.id
    const name = ctx.from.first_name

    const game = db.games[gameId]

    if (!game) return await ctx.reply('Игра не найдена!')

    if (game.users.length > 1) return await ctx.answerCallbackQuery('Вы не можете присоединиться! В игре максимум человек')

    if (game.users.some((user) => user.userId === userId)) return await ctx.answerCallbackQuery('Вы уже присоединены к игре')

    db.games[gameId].users.push({
      name,
      userId,
      symbol: 'o'
    })

    await bot.api.editMessageText(game.chatId, game.messageId, `Ожидаем игрока ${game.users.find((u) => u.userId !== userId)!.name}`)
    await bot.api.editMessageReplyMarkup(game.chatId, game.messageId, {
      reply_markup: {
        inline_keyboard: generateKeyboard(game.board, gameId)
      }
    })
  })

  bot.callbackQuery(/^put_elem/, async (ctx) => {
    const [_, gameId, r, c] = ctx.callbackQuery.data.split(':')

    const game = db.games[gameId]

    if (!game) return await ctx.answerCallbackQuery('Игра не найдена!')

    const user = game.users.find((user) => user.userId === ctx.from.id)

    if (!user) return await ctx.answerCallbackQuery('Вы не являетесь участником игры')

    if (game.awaitUserId !== user.userId) return await ctx.answerCallbackQuery('Сейчас не ваш ход!')

    if (db.games[gameId].board[Number(r)][Number(c)] !== 0) return await ctx.answerCallbackQuery('Эта клетка уже занята!')

    db.games[gameId].board[Number(r)][Number(c)] = user.symbol === 'x' ? 1 : 2

    const status = checkGame(db.games[gameId].board)

    if (status !== -1) {
      if (status === 0) {
        await ctx.editMessageText('Игра окончена вничью!')
      } else if (status === 1) {
        await ctx.editMessageText(`Игрок ${game.users.find((u) => u.symbol === 'x')!.name} выиграл!`)
      } else if (status === 2) {
        await ctx.editMessageText(`Игрок ${game.users.find((u) => u.symbol === 'o')!.name} выиграл!`)
      }

      return await ctx.editMessageReplyMarkup({
        reply_markup: {
          inline_keyboard: []
        }
      })
    }

    db.games[gameId].awaitUserId = game.users.find((u) => u.userId !== user.userId)!.userId

    await bot.api.editMessageText(game.chatId, game.messageId, `Ожидаем игрока ${game.users.find((u) => u.userId !== ctx.from.id)!.name}`)
    await bot.api.editMessageReplyMarkup(game.chatId, game.messageId, {
      reply_markup: {
        inline_keyboard: generateKeyboard(game.board, gameId)
      }
    })
  })

  return bot
}
export default initBot
