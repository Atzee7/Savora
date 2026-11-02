import { Router } from 'express'

/**
 * Modul pesanan (FR-ORDER).
 * Akan diisi pada tahap berikutnya:
 *  - POST /              membuat order + reservasi stok
 *  - POST /:id/pay       mock payment + generate PIN
 *  - GET  /mine          riwayat pesanan customer
 *  - GET  /:id           detail tiket
 *  - POST /:id/cancel    batalkan order PENDING
 */
const router = Router()

router.all('*', (_req, res) => {
  res.status(501).json({ message: 'Modul pesanan belum diimplementasikan.' })
})

export default router
