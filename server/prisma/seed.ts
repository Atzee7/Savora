import { PrismaClient, Role, StoreStatus, TierName } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_PASSWORD = 'password123'

/** Waktu disimpan sebagai kolom TIME; gunakan UTC agar jam tersimpan apa adanya. */
const time = (hour: number, minute: number) => new Date(Date.UTC(1970, 0, 1, hour, minute))

const tiers = {
  hemat: { name: TierName.HEMAT, price: 15_000, minOriginalValue: 45_000 },
  reguler: { name: TierName.REGULER, price: 25_000, minOriginalValue: 75_000 },
  besar: { name: TierName.BESAR, price: 35_000, minOriginalValue: 105_000 },
}

type StoreSeed = {
  id: string
  merchantId: string
  storeName: string
  address: string
  latitude: number
  longitude: number
  status: StoreStatus
  pickupStart: Date
  pickupEnd: Date
  stock: [number, number, number]
}

const merchantIds = Array.from({ length: 8 }, (_, index) => `11111111-1111-4111-8111-0000000001${(index + 1).toString().padStart(2, '0')}`)

const stores: StoreSeed[] = [
  {
    id: '22222222-2222-4222-8222-000000000101',
    merchantId: merchantIds[0],
    storeName: 'Roti Asri Lowokwaru',
    address: 'Jl. Soekarno-Hatta No. 45, Lowokwaru, Malang',
    latitude: -7.9417,
    longitude: 112.6145,
    status: StoreStatus.ACTIVE,
    pickupStart: time(20, 30),
    pickupEnd: time(21, 30),
    stock: [5, 3, 2],
  },
  {
    id: '22222222-2222-4222-8222-000000000102',
    merchantId: merchantIds[1],
    storeName: 'Kopi Senja Tlogomas',
    address: 'Jl. Tlogomas Raya No. 12, Lowokwaru, Malang',
    latitude: -7.9312,
    longitude: 112.5989,
    status: StoreStatus.ACTIVE,
    pickupStart: time(19, 30),
    pickupEnd: time(21, 0),
    stock: [4, 2, 1],
  },
  {
    id: '22222222-2222-4222-8222-000000000103',
    merchantId: merchantIds[2],
    storeName: 'Bakehouse Ijen',
    address: 'Jl. Ijen No. 88, Klojen, Malang',
    latitude: -7.9785,
    longitude: 112.63,
    status: StoreStatus.ACTIVE,
    pickupStart: time(20, 0),
    pickupEnd: time(21, 30),
    stock: [6, 4, 2],
  },
  {
    id: '22222222-2222-4222-8222-000000000104',
    merchantId: merchantIds[3],
    storeName: 'Nusantara Kitchen',
    address: 'Jl. Semarang No. 21, Klojen, Malang',
    latitude: -7.972,
    longitude: 112.634,
    status: StoreStatus.ACTIVE,
    pickupStart: time(19, 0),
    pickupEnd: time(20, 30),
    stock: [3, 2, 1],
  },
  {
    id: '22222222-2222-4222-8222-000000000105',
    merchantId: merchantIds[4],
    storeName: 'Blimbing Bakery',
    address: 'Jl. LA Sucipto No. 100, Blimbing, Malang',
    latitude: -7.941,
    longitude: 112.649,
    status: StoreStatus.ACTIVE,
    pickupStart: time(20, 30),
    pickupEnd: time(22, 0),
    stock: [5, 3, 0],
  },
  {
    id: '22222222-2222-4222-8222-000000000106',
    merchantId: merchantIds[5],
    storeName: 'Sukun Snack Co',
    address: 'Jl. S. Supriadi No. 67, Sukun, Malang',
    latitude: -8.0034,
    longitude: 112.616,
    status: StoreStatus.ACTIVE,
    pickupStart: time(20, 0),
    pickupEnd: time(21, 0),
    stock: [4, 2, 1],
  },
  {
    id: '22222222-2222-4222-8222-000000000107',
    merchantId: merchantIds[6],
    storeName: 'Kafe Tlogomas',
    address: 'Jl. Tlogomas No. 55, Lowokwaru, Malang',
    latitude: -7.9298,
    longitude: 112.6012,
    status: StoreStatus.ACTIVE,
    pickupStart: time(21, 0),
    pickupEnd: time(22, 0),
    stock: [0, 0, 0],
  },
  {
    id: '22222222-2222-4222-8222-000000000108',
    merchantId: merchantIds[7],
    storeName: 'Tiga Rasa Resto',
    address: 'Jl. Danau Toba No. 5, Sawojajar, Malang',
    latitude: -7.977,
    longitude: 112.66,
    status: StoreStatus.PENDING,
    pickupStart: time(20, 0),
    pickupEnd: time(21, 30),
    stock: [5, 3, 2],
  },
]

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  await prisma.user.upsert({
    where: { email: 'admin@savora.id' },
    update: { passwordHash, role: Role.ADMIN },
    create: {
      id: '11111111-1111-4111-8111-000000000001',
      name: 'Admin Savora',
      email: 'admin@savora.id',
      passwordHash,
      role: Role.ADMIN,
      phone: '081200000001',
    },
  })

  await prisma.user.upsert({
    where: { email: 'customer@savora.id' },
    update: { passwordHash, role: Role.CUSTOMER },
    create: {
      id: '11111111-1111-4111-8111-000000000002',
      name: 'Dimas Mahasiswa',
      email: 'customer@savora.id',
      passwordHash,
      role: Role.CUSTOMER,
      phone: '081200000002',
    },
  })

  for (let index = 0; index < stores.length; index += 1) {
    const store = stores[index]
    const email = index === 0 ? 'merchant@savora.id' : `merchant${index + 1}@savora.id`

    await prisma.user.upsert({
      where: { id: store.merchantId },
      update: { passwordHash, role: Role.MERCHANT },
      create: {
        id: store.merchantId,
        name: `${store.storeName} (Kasir)`,
        email,
        passwordHash,
        role: Role.MERCHANT,
        phone: `0812000001${(index + 1).toString().padStart(2, '0')}`,
      },
    })

    await prisma.store.upsert({
      where: { id: store.id },
      update: {
        storeName: store.storeName,
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        status: store.status,
      },
      create: {
        id: store.id,
        userId: store.merchantId,
        storeName: store.storeName,
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        status: store.status,
      },
    })

    await prisma.storeSchedule.deleteMany({ where: { storeId: store.id } })
    await prisma.storeSchedule.create({
      data: {
        storeId: store.id,
        pickupStart: store.pickupStart,
        pickupEnd: store.pickupEnd,
      },
    })

    const tierSeeds = [tiers.hemat, tiers.reguler, tiers.besar]
    for (let tierIndex = 0; tierIndex < tierSeeds.length; tierIndex += 1) {
      const tier = tierSeeds[tierIndex]
      await prisma.tier.upsert({
        where: { storeId_name: { storeId: store.id, name: tier.name } },
        update: {
          price: tier.price,
          minOriginalValue: tier.minOriginalValue,
          stock: store.stock[tierIndex],
        },
        create: {
          storeId: store.id,
          name: tier.name,
          price: tier.price,
          minOriginalValue: tier.minOriginalValue,
          stock: store.stock[tierIndex],
        },
      })
    }
  }

  console.log('Seed selesai.')
  console.log(`Akun demo (password: ${DEMO_PASSWORD}):`)
  console.log('  customer@savora.id')
  console.log('  merchant@savora.id')
  console.log('  admin@savora.id')
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
