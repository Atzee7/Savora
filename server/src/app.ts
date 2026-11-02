import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import authRouter from './modules/auth/router.js'
import healthRouter from './modules/health/router.js'
import ordersRouter from './modules/orders/router.js'
import storesRouter from './modules/stores/router.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/', (_req, res) => {
  res.json({
    name: 'Savora API',
    version: '0.1.0',
    docs: '/api/health',
  })
})

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/stores', storesRouter)
app.use('/api/orders', ordersRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
