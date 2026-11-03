import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './config/env.js'
import { runLazyExpireOrders } from './jobs/expireOrders.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import adminRouter from './modules/admin/router.js'
import authRouter from './modules/auth/router.js'
import healthRouter from './modules/health/router.js'
import merchantRouter from './modules/merchant/router.js'
import ordersRouter from './modules/orders/router.js'
import storesRouter from './modules/stores/router.js'
import { asyncHandler } from './utils/asyncHandler.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

/**
 * Di platform serverless tidak ada proses yang hidup terus, sehingga cron
 * tidak berjalan. Pemeriksaan order kedaluwarsa dijalankan malas di sini,
 * maksimal sekali per menit per instance.
 */
if (process.env.VERCEL) {
  app.use(
    asyncHandler(async (_req, _res, next) => {
      await runLazyExpireOrders()
      next()
    }),
  )
}

app.get('/', (_req, res) => {
  res.json({
    name: 'Savora API',
    version: '0.1.0',
    docs: '/api/health',
  })
})

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/merchant', merchantRouter)
app.use('/api/stores', storesRouter)
app.use('/api/orders', ordersRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
