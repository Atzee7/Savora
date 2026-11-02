const imageRules: Array<{ pattern: RegExp; src: string }> = [
  { pattern: /roti|bakehouse|bakery|bread/i, src: '/images/store-bakery.webp' },
  { pattern: /kopi|kafe|coffee|cafe/i, src: '/images/store-coffee.webp' },
  { pattern: /kitchen|resto|restaurant|rasa|dapur/i, src: '/images/store-resto.webp' },
  { pattern: /snack|camilan|cemilan/i, src: '/images/store-snack.webp' },
]

const defaultImage = '/images/store-default.webp'
const serviceAreas = ['Lowokwaru', 'Klojen', 'Blimbing', 'Sukun', 'Sawojajar']

export function storeImage(storeName: string): string {
  return imageRules.find((rule) => rule.pattern.test(storeName))?.src ?? defaultImage
}

export function storeArea(address: string): string {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  const known = parts.find((part) =>
    serviceAreas.some((area) => part.toLowerCase().includes(area.toLowerCase())),
  )

  return known ?? parts[parts.length - 2] ?? 'Malang'
}
