import app from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'
import { startExpireOrdersJob } from './jobs/expireOrders.js'

const server = app.listen(env.PORT, () => {
  console.log(`[server] Savora API berjalan di http://localhost:${env.PORT}`)
  console.log(`[server] Environment: ${env.NODE_ENV}`)
})

startExpireOrdersJob()

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[server] Menerima ${signal}, menutup server...`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
