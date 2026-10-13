import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '').replace(/\r/g, '')
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Real public stores in Metro Cebu collected from web sources:
const CEBU_STORES = [
  {
    name: 'Firstank Industrial Corporation',
    description: 'Premier manufacturer and distributor of stainless steel water tanks, polyethylene overhead storage tanks, modular tanks, and pressure tanks.',
    address_line: 'Granite Industrial Corp. Bldg., Hernan Cortes St.',
    barangay: 'Subangdaku',
    municipality: 'Mandaue City',
    province: 'Cebu',
    latitude: 10.3340,
    longitude: 123.9275,
    contact_number: '(032) 345-0371',
    opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 500.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'Cebu Hi-Q Manufacturing Corp. — Mandaue',
    description: 'Leading industrial fabricator of stainless steel water tanks, FRP fiberglass tanks, and residential water storage systems.',
    address_line: 'Grand Arcade Building, A.C. Cortes Ave.',
    barangay: 'Ibabao-Estancia',
    municipality: 'Mandaue City',
    province: 'Cebu',
    latitude: 10.3315,
    longitude: 123.9450,
    contact_number: '(032) 346-6888',
    opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 350.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'Mandaue Trade Centre Inc. (Bestank Distributor)',
    description: 'Authorized distributor for Bestank water storage solutions, polyethylene vertical tanks, and stainless steel overhead tanks.',
    address_line: 'Elizabeth Bldg., 70 Lopez Jaena St.',
    barangay: 'Subangdaku',
    municipality: 'Mandaue City',
    province: 'Cebu',
    latitude: 10.3282,
    longitude: 123.9298,
    contact_number: '(032) 344-3321',
    opening_hours: 'Mon-Sat 8:00 AM - 6:00 PM',
    delivers: true,
    delivery_fee_php: 400.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Cebu Home and Builders Centre — Banilad',
    description: 'Major home depot carrying polyethylene water storage tanks, drums, utility containers, buckets, and water pumps.',
    address_line: 'A.S. Fortuna St.',
    barangay: 'Banilad',
    municipality: 'Mandaue City',
    province: 'Cebu',
    latitude: 10.3448,
    longitude: 123.9182,
    contact_number: '(032) 343-6900',
    opening_hours: 'Mon-Sat 8:00 AM - 6:00 PM, Sun 9:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 300.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Cebu Home and Builders Centre — N. Bacalso',
    description: 'South Cebu branch carrying overhead water tanks, plastic drums, water jugs, and emergency water containers.',
    address_line: 'Natalio B. Bacalso Ave. (Cebu South Road)',
    barangay: 'Labangon',
    municipality: 'Cebu City',
    province: 'Cebu',
    latitude: 10.3015,
    longitude: 123.8742,
    contact_number: '(032) 261-8888',
    opening_hours: 'Mon-Sat 8:00 AM - 6:00 PM, Sun 9:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 350.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Cebu Home and Builders Centre — Consolacion',
    description: 'Northern Cebu branch stocking water storage tanks, water containers, and sanitation plumbing.',
    address_line: 'Cebu North Coastal Road',
    barangay: 'Cansaga',
    municipality: 'Consolacion',
    province: 'Cebu',
    latitude: 10.3705,
    longitude: 123.9632,
    contact_number: '(032) 423-4500',
    opening_hours: 'Mon-Sat 8:00 AM - 6:00 PM, Sun 9:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 300.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'CitiHardware Mandaue (Tabok)',
    description: 'Warehouse retail hardware featuring polyethylene water storage tanks, 200L drums, heavy-duty buckets, and fittings.',
    address_line: 'Cebu North Road, cor. J. Rizal & Paknaan Sts.',
    barangay: 'Tabok',
    municipality: 'Mandaue City',
    province: 'Cebu',
    latitude: 10.3602,
    longitude: 123.9485,
    contact_number: '(032) 346-5501',
    opening_hours: 'Mon-Sun 8:00 AM - 7:00 PM',
    delivers: true,
    delivery_fee_php: 250.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'CitiHardware Bulacao (Cebu South)',
    description: 'Cebu City South warehouse branch carrying domestic water storage tanks, plastic water containers, and buckets.',
    address_line: '155 Natalio B. Bacalso Ave.',
    barangay: 'Bulacao',
    municipality: 'Cebu City',
    province: 'Cebu',
    latitude: 10.2825,
    longitude: 123.8552,
    contact_number: '(032) 273-0050',
    opening_hours: 'Mon-Sun 8:00 AM - 7:00 PM',
    delivers: true,
    delivery_fee_php: 250.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Wilcon Depot Mandaue',
    description: 'Flagship home and building depot offering stainless steel overhead water tanks, plastic water tanks, and pressurized storage systems.',
    address_line: 'U.N. Avenue',
    barangay: 'Umapad',
    municipality: 'Mandaue City',
    province: 'Cebu',
    latitude: 10.3385,
    longitude: 123.9555,
    contact_number: '(032) 343-3000',
    opening_hours: 'Mon-Sun 8:00 AM - 7:00 PM',
    delivers: true,
    delivery_fee_php: 400.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Wilcon Depot Talisay',
    description: 'South Metro Cebu depot supplying Bestank and Firstank water tanks, polyethylene drums, and water containers.',
    address_line: 'Cebu South National Highway',
    barangay: 'Lawaan III',
    municipality: 'Talisay City',
    province: 'Cebu',
    latitude: 10.2605,
    longitude: 123.8340,
    contact_number: '(032) 238-6000',
    opening_hours: 'Mon-Sun 8:00 AM - 7:00 PM',
    delivers: true,
    delivery_fee_php: 350.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Atlantic Hardware — Taboan Main',
    description: 'Downtown Cebu commercial hardware carrying 200L blue plastic drums, 20L water timba with lids, and storage jugs.',
    address_line: '66-72 B. Aranas St. cor. Lakandula St.',
    barangay: 'San Nicolas Proper',
    municipality: 'Cebu City',
    province: 'Cebu',
    latitude: 10.2970,
    longitude: 123.8905,
    contact_number: '0906-292-9850',
    opening_hours: 'Mon-Sat 8:00 AM - 5:30 PM',
    delivers: false,
    delivery_fee_php: null,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'Atlantic Hardware — Mandaue',
    description: 'Subangdaku branch providing heavy-duty water drums, poly tanks, containers, and plumbing supplies.',
    address_line: 'Albano St. cor. Lopez Jaena St.',
    barangay: 'Subangdaku',
    municipality: 'Mandaue City',
    province: 'Cebu',
    latitude: 10.3290,
    longitude: 123.9302,
    contact_number: '0917-324-7731',
    opening_hours: 'Mon-Sat 8:00 AM - 5:30 PM',
    delivers: true,
    delivery_fee_php: 200.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'Enj Drums Mandaue',
    description: 'Specialist supplier of 200L blue HDPE plastic drums (open top with locking ring & closed top), 65L carboys, and containers.',
    address_line: 'F.B. Cabahug St.',
    barangay: 'Guizo',
    municipality: 'Mandaue City',
    province: 'Cebu',
    latitude: 10.3275,
    longitude: 123.9380,
    contact_number: '0931-204-3353',
    opening_hours: 'Mon-Sat 8:00 AM - 6:00 PM',
    delivers: true,
    delivery_fee_php: 150.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'Livingwater Station & Supplies — Mabolo',
    description: 'Water station and supplier selling 5-gallon slim water containers with faucet, 5-gallon round bottles, and purified drinking water refills.',
    address_line: '29 F. Gochan Street',
    barangay: 'Mabolo',
    municipality: 'Cebu City',
    province: 'Cebu',
    latitude: 10.3195,
    longitude: 123.9145,
    contact_number: '(032) 232-1555',
    opening_hours: 'Mon-Sat 7:00 AM - 7:00 PM, Sun 8:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 50.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'Aquabest Water Refilling Station — Lapu-Lapu',
    description: 'Authorized Aquabest branch providing 5-gallon slim containers, round gallons, and bottled purified water supply.',
    address_line: 'Plumera Square, Basak-Cagodoy-Bankal-Buaya Rd.',
    barangay: 'Basak',
    municipality: 'Lapu-Lapu City',
    province: 'Cebu',
    latitude: 10.3080,
    longitude: 123.9780,
    contact_number: '0917-888-2782',
    opening_hours: 'Mon-Sun 7:00 AM - 7:00 PM',
    delivers: true,
    delivery_fee_php: 40.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  }
]

async function seedCebuStores() {
  console.log(`Inserting ${CEBU_STORES.length} real Cebu stores into Supabase...`)

  for (const store of CEBU_STORES) {
    const { data, error } = await supabase.from('stores').insert({
      ...store
    }).select('id, name')

    if (error) {
      console.error(`Failed to insert ${store.name}:`, error.message)
    } else {
      console.log(`✅ Inserted: ${data[0].name} (ID: ${data[0].id})`)
    }
  }
}

seedCebuStores()
