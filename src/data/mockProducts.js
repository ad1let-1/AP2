/**
 * Mock product data for development/demo.
 * Used as fallback when the product microservice is unavailable.
 */

const CLOTHING = [
  {
    id: 'c001',
    name: 'Oversized Wool Overcoat',
    price: 489.00,
    originalPrice: 620.00,
    category: 'clothing',
    description: 'A structured, long-line wool overcoat cut from premium Italian fabric. Relaxed silhouette with notched lapels and hidden button placket.',
    images: [
      'https://images.unsplash.com/photo-1539533018257-7f01f8498dc1?w=600&q=80',
      'https://images.unsplash.com/photo-1608234808654-2a8875faa7fd?w=600&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 12,
    sku: 'NOV-C001',
    tags: ['new', 'outerwear'],
  },
  {
    id: 'c002',
    name: 'Leather Tote Bag',
    price: 299.00,
    category: 'clothing',
    description: 'Full-grain vegetable-tanned leather tote with antique brass hardware. Ages beautifully with use.',
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
    ],
    sizes: null,
    stock: 8,
    sku: 'NOV-C002',
    tags: ['accessories'],
  },
  {
    id: 'c003',
    name: 'Charcoal Slim Blazer',
    price: 199.00,
    originalPrice: 260.00,
    category: 'clothing',
    description: 'A precision-cut slim-fit blazer in charcoal wool-blend. A modern essential for any wardrobe.',
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80',
      'https://images.unsplash.com/photo-1584182284516-a50e4ccd6c17?w=600&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stock: 20,
    sku: 'NOV-C003',
    tags: ['essentials'],
  },
  {
    id: 'c004',
    name: 'Ribbed Cashmere Turtleneck',
    price: 245.00,
    category: 'clothing',
    description: '100% pure cashmere turtleneck with a fine-rib texture. Impossibly soft, timelessly elegant.',
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 15,
    sku: 'NOV-C004',
    tags: ['new', 'knitwear'],
  },
  {
    id: 'c005',
    name: 'High-Waist Tailored Trousers',
    price: 175.00,
    category: 'clothing',
    description: 'Sharp high-waist trousers with a wide-leg silhouette in a drapey viscose blend.',
    images: [
      'https://images.unsplash.com/photo-1594938374182-a57826a57ac1?w=600&q=80',
      'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=600&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 9,
    sku: 'NOV-C005',
    tags: ['essentials'],
  },
  {
    id: 'c006',
    name: 'Minimalist Leather Sneakers',
    price: 225.00,
    category: 'clothing',
    description: 'Clean-profile leather sneakers with vulcanized sole. Made in Portugal.',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80',
    ],
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    stock: 30,
    sku: 'NOV-C006',
    tags: ['footwear'],
  },
]

const GADGETS = [
  {
    id: 'g001',
    name: 'High-End Wireless Earbuds',
    price: 299.00,
    originalPrice: 349.00,
    category: 'gadgets',
    description: 'Active noise cancellation, 30hr battery, spatial audio. The pinnacle of wireless listening.',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
      'https://images.unsplash.com/photo-1606400082777-ef05f3c5cde2?w=600&q=80',
    ],
    sizes: null,
    stock: 45,
    sku: 'NOV-G001',
    tags: ['new', 'audio'],
  },
  {
    id: 'g002',
    name: 'Aluminum Desk Lamp',
    price: 180.00,
    category: 'gadgets',
    description: 'Articulated arm desk lamp in aircraft-grade aluminum. Dimmable, color-temperature adjustable.',
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600&q=80',
    ],
    sizes: null,
    stock: 22,
    sku: 'NOV-G002',
    tags: ['workspace'],
  },
  {
    id: 'g003',
    name: 'Mechanical Keyboard',
    price: 189.00,
    category: 'gadgets',
    description: 'Tenkeyless mechanical keyboard with custom linear switches and CNC-machined aluminum chassis.',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&q=80',
    ],
    sizes: null,
    stock: 18,
    sku: 'NOV-G003',
    tags: ['workspace'],
  },
  {
    id: 'g004',
    name: 'Portable Espresso Maker',
    price: 149.00,
    category: 'gadgets',
    description: 'Hand-powered espresso maker that pulls a true 9-bar extraction. No electricity needed.',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80',
    ],
    sizes: null,
    stock: 60,
    sku: 'NOV-G004',
    tags: ['lifestyle'],
  },
]

const TECH = [
  {
    id: 't001',
    name: 'Ultra-Thin Laptop Stand',
    price: 89.00,
    category: 'tech',
    description: 'Foldable laptop stand crafted from a single sheet of aircraft aluminum. 0mm packed height.',
    images: [
      'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80',
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80',
    ],
    sizes: null,
    stock: 80,
    sku: 'NOV-T001',
    tags: ['workspace'],
  },
  {
    id: 't002',
    name: 'Wireless Charging Pad',
    price: 65.00,
    category: 'tech',
    description: 'Premium leather-topped wireless charging pad. 15W fast charging for Qi-compatible devices.',
    images: [
      'https://images.unsplash.com/photo-1600490036275-b882c8e5a7c3?w=600&q=80',
      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80',
    ],
    sizes: null,
    stock: 55,
    sku: 'NOV-T002',
    tags: ['new', 'accessories'],
  },
  {
    id: 't003',
    name: 'Smart Home Hub',
    price: 229.00,
    category: 'tech',
    description: 'Matter-compatible smart home hub. Controls 200+ devices, built-in privacy shutter.',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
    ],
    sizes: null,
    stock: 28,
    sku: 'NOV-T003',
    tags: ['smart home'],
  },
  {
    id: 't004',
    name: 'Carbon Fiber Phone Case',
    price: 79.00,
    category: 'tech',
    description: 'Aerospace-grade real carbon fiber case. 0.4mm thin, military-grade drop protection.',
    images: [
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80',
    ],
    sizes: null,
    stock: 100,
    sku: 'NOV-T004',
    tags: ['accessories'],
  },
]

export const MOCK_PRODUCTS = [...CLOTHING, ...GADGETS, ...TECH]

export const MOCK_FEATURED = [
  CLOTHING[0], GADGETS[0], CLOTHING[2], GADGETS[1],
  CLOTHING[3], TECH[0], CLOTHING[1], GADGETS[2],
]

/**
 * Simulate paginated product results from mock data.
 * @param {{ category?: string, sort?: string, min?: number, max?: number, page?: number, limit?: number, q?: string }} params
 * @returns {{ products: object[], total: number, page: number, totalPages: number }}
 */
export function queryMockProducts(params = {}) {
  const { category, sort = 'newest', min = 0, max = 10000, page = 1, limit = 12, q } = params

  let results = [...MOCK_PRODUCTS]

  if (category && category !== 'all') {
    results = results.filter((p) => p.category === category)
  }
  if (q) {
    const lower = q.toLowerCase()
    results = results.filter(
      (p) => p.name.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower)
    )
  }
  results = results.filter((p) => p.price >= min && p.price <= max)

  if (sort === 'price_asc') results.sort((a, b) => a.price - b.price)
  else if (sort === 'price_desc') results.sort((a, b) => b.price - a.price)

  const total = results.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const products = results.slice(start, start + limit)

  return { products, total, page, totalPages }
}
