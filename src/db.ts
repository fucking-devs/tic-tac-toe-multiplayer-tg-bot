export interface Game {
  users: {
    userId: number
    name: string
    symbol: 'x' | 'o'
  }[]
  board: number[][],
  messageId: number,
  chatId: number
  awaitUserId: number
}

export const db: {
  games: {
    [key: string]: Game
  }
} = {
  games: {}
}
