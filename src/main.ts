import initBot from './bot'
import { db } from './db'

const { BOT_TOKEN } = process.env

if (!BOT_TOKEN) throw new Error('BOT_TOKEN is not defined')

const bot = initBot(BOT_TOKEN)

bot.start({
  onStart: () => {
    console.log('Bot started')
  }
})

