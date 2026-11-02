import { Router } from 'express'

/**
 * Modul autentikasi (FR-AUTH).
 * Akan diisi pada tahap berikutnya:
 *  - POST /register  (customer / merchant onboarding)
 *  - POST /login
 *  - GET  /me
 */
const router = Router()

router.all('*', (_req, res) => {
  res.status(501).json({ message: 'Modul autentikasi belum diimplementasikan.' })
})

export default router
