import bcrypt from 'bcryptjs'

import { prisma } from '../src/config/prisma.js'

const DEMO_EMAIL_DOMAIN = '@savora.id'
const MIN_LENGTH = 12

async function main(): Promise<void> {
  const password = process.env.DEMO_PASSWORD ?? ''

  if (password.length < MIN_LENGTH) {
    console.error(`DEMO_PASSWORD wajib diisi (minimal ${MIN_LENGTH} karakter).`)
    process.exitCode = 1
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const result = await prisma.user.updateMany({
    where: { email: { endsWith: DEMO_EMAIL_DOMAIN } },
    data: { passwordHash },
  })

  console.log(`${result.count} akun demo diperbarui.`)
}

main()
  .catch((error) => {
    console.error('Gagal memperbarui password demo:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
