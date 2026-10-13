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

// Real public stores across Northern, Central, and Southern Cebu Province:
const CEBU_PROVINCE_STORES = [
  // --- Bogo City ---
  {
    name: 'CitiHardware Bogo',
    description: 'Home improvement warehouse depot offering Bestank polyethylene and stainless steel water tanks, drums, and plumbing.',
    address_line: 'National Highway',
    barangay: 'Dakit',
    municipality: 'Bogo City',
    province: 'Cebu',
    latitude: 10.9850,
    longitude: 124.0080,
    contact_number: '0917-815-9598',
    opening_hours: 'Mon-Sun 8:00 AM - 7:00 PM',
    delivers: true,
    delivery_fee_php: 250.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Bogo Builders Supply',
    description: 'Major building materials and hardware supplier stocking Tiger and Bestank water storage tanks, water containers, and pipes.',
    address_line: 'Dela Vina St. cor. R. Ancajas St.',
    barangay: 'Poblacion',
    municipality: 'Bogo City',
    province: 'Cebu',
    latitude: 11.0505,
    longitude: 124.0040,
    contact_number: '0997-160-8614',
    opening_hours: 'Mon-Sat 8:00 AM - 5:30 PM',
    delivers: true,
    delivery_fee_php: 200.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Borbon ---
  {
    name: 'Laaw Hardware Trading',
    description: 'Hardware store supplying water drums, polyethylene containers, utility buckets, and plumbing materials in northern Cebu.',
    address_line: 'Central Nautical Highway',
    barangay: 'Laaw',
    municipality: 'Borbon',
    province: 'Cebu',
    latitude: 10.8350,
    longitude: 124.0305,
    contact_number: '0928-341-8902',
    opening_hours: 'Mon-Sat 7:30 AM - 5:30 PM',
    delivers: true,
    delivery_fee_php: 150.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'Jowel Hardware & Construction Supply',
    description: 'Poblacion hardware stocking domestic water storage drums, fittings, containers, and household construction items.',
    address_line: 'Central Nautical Highway',
    barangay: 'Poblacion',
    municipality: 'Borbon',
    province: 'Cebu',
    latitude: 10.8410,
    longitude: 124.0260,
    contact_number: '0919-455-1234',
    opening_hours: 'Mon-Sat 7:30 AM - 5:00 PM',
    delivers: false,
    delivery_fee_php: null,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Catmon ---
  {
    name: 'KAPHORO Hardware & Construction Supply',
    description: 'Main highway supplier carrying water storage tanks, 200L plastic drums, and PVC plumbing connections.',
    address_line: 'Central Nautical Highway',
    barangay: 'Flores',
    municipality: 'Catmon',
    province: 'Cebu',
    latitude: 10.6870,
    longitude: 124.0150,
    contact_number: '0917-702-8844',
    opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 150.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'Four B\'s Hardware & Construction Supply',
    description: 'Catmon branch providing household water storage barrels, buckets, and water installation supplies.',
    address_line: 'Central Nautical Highway',
    barangay: 'Corazon',
    municipality: 'Catmon',
    province: 'Cebu',
    latitude: 10.6920,
    longitude: 124.0180,
    contact_number: '0922-834-9001',
    opening_hours: 'Mon-Sat 7:30 AM - 5:00 PM',
    delivers: false,
    delivery_fee_php: null,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'TWINS Purified Drinking Water Refilling Station',
    description: 'Drinking water refilling station and supplier of 5-gallon slim water containers with faucet and round bottles.',
    address_line: 'Central Nautical Highway',
    barangay: 'Flores',
    municipality: 'Catmon',
    province: 'Cebu',
    latitude: 10.6860,
    longitude: 124.0140,
    contact_number: '0933-219-4500',
    opening_hours: 'Mon-Sun 7:00 AM - 6:00 PM',
    delivers: true,
    delivery_fee_php: 20.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Carmen ---
  {
    name: 'JVS Murang Yero & Bakal Hardware',
    description: 'Specialist builders supply carrying water storage tanks, drums, and heavy piping infrastructure.',
    address_line: 'Purok Ilang-Ilang',
    barangay: 'Cogon West',
    municipality: 'Carmen',
    province: 'Cebu',
    latitude: 10.5820,
    longitude: 124.0180,
    contact_number: '0917-302-8811',
    opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 200.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'RCV Enterprise Hardware Supply',
    description: 'Construction and hardware supply providing overhead tanks, plastic containers, and plumbing fittings.',
    address_line: 'National Highway',
    barangay: 'Cogon West',
    municipality: 'Carmen',
    province: 'Cebu',
    latitude: 10.5790,
    longitude: 124.0195,
    contact_number: '0920-911-3444',
    opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 180.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Sogod ---
  {
    name: 'Arnado Hardware & Construction Supply',
    description: 'Highway hardware outlet stocking blue plastic drums, water containers, and agricultural water supplies.',
    address_line: 'Central Nautical Highway',
    barangay: 'Poblacion',
    municipality: 'Sogod',
    province: 'Cebu',
    latitude: 10.7485,
    longitude: 124.0105,
    contact_number: '0927-440-1928',
    opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    delivers: false,
    delivery_fee_php: null,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Danao City ---
  {
    name: 'Total Lumber and Construction Supply',
    description: 'Comprehensive Danao hardware depot carrying stainless steel and plastic water tanks, drums, and cistern supplies.',
    address_line: 'Mabini Street',
    barangay: 'Poblacion',
    municipality: 'Danao City',
    province: 'Cebu',
    latitude: 10.5230,
    longitude: 124.0270,
    contact_number: '(032) 200-3150',
    opening_hours: 'Mon-Sat 8:00 AM - 5:30 PM',
    delivers: true,
    delivery_fee_php: 200.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'New Jet Hardware & Electrical Supplies',
    description: 'Downtown Danao supplier providing water storage jugs, timba with covers, and plumbing installations.',
    address_line: 'Pio del Pilar St.',
    barangay: 'Suba',
    municipality: 'Danao City',
    province: 'Cebu',
    latitude: 10.5215,
    longitude: 124.0250,
    contact_number: '(032) 200-4888',
    opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    delivers: false,
    delivery_fee_php: null,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'Build It Building Materials Sales Inc.',
    description: 'Modern building center offering residential water tanks, pressure tanks, and poly storage containers.',
    address_line: 'National Highway',
    barangay: 'Guinsay',
    municipality: 'Danao City',
    province: 'Cebu',
    latitude: 10.5360,
    longitude: 124.0285,
    contact_number: '(032) 266-9000',
    opening_hours: 'Mon-Sat 8:00 AM - 6:00 PM',
    delivers: true,
    delivery_fee_php: 250.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },

  // --- Liloan ---
  {
    name: 'CitiHardware Liloan',
    description: 'Large format hardware warehouse carrying full lines of Bestank poly tanks, stainless tanks, drums, and water containers.',
    address_line: 'National Highway',
    barangay: 'Cotcot',
    municipality: 'Liloan',
    province: 'Cebu',
    latitude: 10.4210,
    longitude: 123.9985,
    contact_number: '0917-815-9500',
    opening_hours: 'Mon-Sun 8:00 AM - 7:00 PM',
    delivers: true,
    delivery_fee_php: 250.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Northway Hardware and Construction Supply',
    description: 'Liloan builders depot offering residential stainless water tanks, HDPE drums, and general plumbing.',
    address_line: 'Sitio Lourdes, Purok Chicos',
    barangay: 'Poblacion',
    municipality: 'Liloan',
    province: 'Cebu',
    latitude: 10.3980,
    longitude: 123.9920,
    contact_number: '0922-811-9233',
    opening_hours: 'Mon-Sat 8:00 AM - 5:30 PM',
    delivers: true,
    delivery_fee_php: 200.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Cordova ---
  {
    name: 'Wilcon Depot Cordova',
    description: 'Major home improvement center near CCLEX expressway stocking premium Bestank water tanks, cisterns, and storage drums.',
    address_line: 'Mactan Coastal Corridor',
    barangay: 'Gabi',
    municipality: 'Cordova',
    province: 'Cebu',
    latitude: 10.2680,
    longitude: 123.9480,
    contact_number: '(032) 349-8000',
    opening_hours: 'Mon-Sun 8:00 AM - 7:00 PM',
    delivers: true,
    delivery_fee_php: 350.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Cordova Town Hardware & Supply',
    description: 'Neighborhood hardware providing plastic water containers, buckets, and water connection parts in Cordova.',
    address_line: 'San Miguel St.',
    barangay: 'Poblacion',
    municipality: 'Cordova',
    province: 'Cebu',
    latitude: 10.2520,
    longitude: 123.9510,
    contact_number: '0932-840-1288',
    opening_hours: 'Mon-Sat 7:30 AM - 5:30 PM',
    delivers: false,
    delivery_fee_php: null,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Minglanilla ---
  {
    name: 'Belmont Hardware Depot — Minglanilla',
    description: 'Massive home depot at Belmont One stocking Firstank and Bestank water storage tanks, drums, and plumbing fixtures.',
    address_line: 'Belmont One, Cebu South Road',
    barangay: 'Calajoan',
    municipality: 'Minglanilla',
    province: 'Cebu',
    latitude: 10.2450,
    longitude: 123.7960,
    contact_number: '(032) 272-8888',
    opening_hours: 'Mon-Sun 8:00 AM - 7:00 PM',
    delivers: true,
    delivery_fee_php: 300.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Cebu Home and Builders Centre — Minglanilla',
    description: 'South showroom featuring polyethylene overhead tanks, food-grade storage containers, and plumbing supplies.',
    address_line: 'Cebu South Road',
    barangay: 'Ward II',
    municipality: 'Minglanilla',
    province: 'Cebu',
    latitude: 10.2420,
    longitude: 123.7930,
    contact_number: '(032) 268-7000',
    opening_hours: 'Mon-Sat 8:00 AM - 6:00 PM, Sun 9:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 250.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },

  // --- City of Naga ---
  {
    name: 'JH Joji Hardware & Construction',
    description: 'Naga City highway hardware supply carrying 200L plastic drums, household water storage containers, and fittings.',
    address_line: 'National Highway',
    barangay: 'South Poblacion',
    municipality: 'Naga City',
    province: 'Cebu',
    latitude: 10.2085,
    longitude: 123.7550,
    contact_number: '0917-628-9901',
    opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 200.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'St. Expedite Builders Supply',
    description: 'Building materials provider catering to residential water storage needs with plastic tanks and drums.',
    address_line: 'National Highway',
    barangay: 'Inayagan',
    municipality: 'Naga City',
    province: 'Cebu',
    latitude: 10.2210,
    longitude: 123.7680,
    contact_number: '0922-410-8271',
    opening_hours: 'Mon-Sat 7:30 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 200.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Carcar City ---
  {
    name: 'CitiHardware Carcar',
    description: 'Major South Cebu warehouse retail hub offering poly and stainless water storage tanks, containers, and pumps.',
    address_line: 'National Highway',
    barangay: 'Valladolid',
    municipality: 'Carcar City',
    province: 'Cebu',
    latitude: 10.1250,
    longitude: 123.6510,
    contact_number: '0917-815-9515',
    opening_hours: 'Mon-Sun 8:00 AM - 7:00 PM',
    delivers: true,
    delivery_fee_php: 250.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Atlantic Hardware Carcar',
    description: 'Carcar City heritage hardware stocking 200L blue plastic drums, water containers, and PVC pipelines.',
    address_line: 'P. Nellas St.',
    barangay: 'Poblacion I',
    municipality: 'Carcar City',
    province: 'Cebu',
    latitude: 10.1110,
    longitude: 123.6420,
    contact_number: '(032) 487-9050',
    opening_hours: 'Mon-Sat 8:00 AM - 5:30 PM',
    delivers: true,
    delivery_fee_php: 200.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Toledo City ---
  {
    name: 'Cebu Home and Builders Centre — Toledo',
    description: 'West coast home depot carrying comprehensive selections of Bestank overhead water tanks, drums, and accessories.',
    address_line: 'Sta. Ana',
    barangay: 'Poblacion',
    municipality: 'Toledo City',
    province: 'Cebu',
    latitude: 10.3780,
    longitude: 123.6420,
    contact_number: '(032) 322-5500',
    opening_hours: 'Mon-Sat 8:00 AM - 6:00 PM, Sun 9:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 300.00,
    listing_status: 'approved',
    verification_status: 'admin_verified'
  },
  {
    name: 'Gilbros Hardware & Construction Supplies',
    description: 'Commercial hardware in central Toledo offering water tanks, storage barrels, and plumbing supplies.',
    address_line: 'Poloyapoy St.',
    barangay: 'Poblacion',
    municipality: 'Toledo City',
    province: 'Cebu',
    latitude: 10.3750,
    longitude: 123.6390,
    contact_number: '0917-320-1122',
    opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    delivers: false,
    delivery_fee_php: null,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Balamban ---
  {
    name: 'Balamban Grace Hardware & Industrial Supply',
    description: 'Industrial and home builders supplier stocking stainless water tanks, HDPE drums, and water utilities.',
    address_line: 'Aliwanay',
    barangay: 'Poblacion',
    municipality: 'Balamban',
    province: 'Cebu',
    latitude: 10.5020,
    longitude: 123.7150,
    contact_number: '(032) 333-2210',
    opening_hours: 'Mon-Sat 8:00 AM - 5:30 PM',
    delivers: true,
    delivery_fee_php: 200.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'Concesa Builders Hardware',
    description: 'Highway hardware supplying residential water drums, water buckets, and plumbing fixtures.',
    address_line: 'Antonio Y. De Pio National Highway',
    barangay: 'Aliwanay',
    municipality: 'Balamban',
    province: 'Cebu',
    latitude: 10.4980,
    longitude: 123.7120,
    contact_number: '0922-890-4411',
    opening_hours: 'Mon-Sat 7:30 AM - 5:00 PM',
    delivers: false,
    delivery_fee_php: null,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Daanbantayan ---
  {
    name: 'HSS Hardware and General Merchandise',
    description: 'Northern tip Cebu hardware providing blue plastic drums, water containers, and PVC fittings.',
    address_line: 'Osmeña St.',
    barangay: 'Poblacion',
    municipality: 'Daanbantayan',
    province: 'Cebu',
    latitude: 11.2650,
    longitude: 124.0160,
    contact_number: '0918-920-7714',
    opening_hours: 'Mon-Sat 7:30 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 150.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },
  {
    name: 'Mackinesta Hardware & Construction Supplies',
    description: 'Hardware store supplying emergency water storage drums, buckets, and general construction materials.',
    address_line: 'National Highway',
    barangay: 'Agujo',
    municipality: 'Daanbantayan',
    province: 'Cebu',
    latitude: 11.2580,
    longitude: 124.0120,
    contact_number: '0929-338-9005',
    opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    delivers: false,
    delivery_fee_php: null,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- San Fernando ---
  {
    name: 'San Fernando Hardware & Construction Supply',
    description: 'Central South Cebu hardware supplying plastic water drums, water containers, and sanitation pipes.',
    address_line: 'National Highway',
    barangay: 'South Poblacion',
    municipality: 'San Fernando',
    province: 'Cebu',
    latitude: 10.1620,
    longitude: 123.7120,
    contact_number: '0917-710-3329',
    opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    delivers: true,
    delivery_fee_php: 180.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  },

  // --- Compostela ---
  {
    name: 'Compostela Builders & Hardware Supply',
    description: 'East coast hardware carrying overhead polyethylene water tanks, drums, and plumbing connectors.',
    address_line: 'Central Nautical Highway',
    barangay: 'Poblacion',
    municipality: 'Compostela',
    province: 'Cebu',
    latitude: 10.4570,
    longitude: 124.0120,
    contact_number: '0922-841-2090',
    opening_hours: 'Mon-Sat 7:30 AM - 5:30 PM',
    delivers: true,
    delivery_fee_php: 180.00,
    listing_status: 'approved',
    verification_status: 'store_confirmed'
  }
]

async function seedCebuProvinceStores() {
  console.log(`Inserting ${CEBU_PROVINCE_STORES.length} stores across Cebu Province into Supabase...`)

  let successCount = 0
  for (const store of CEBU_PROVINCE_STORES) {
    const { data, error } = await supabase.from('stores').insert({
      ...store
    }).select('id, name, municipality')

    if (error) {
      console.error(`Failed to insert ${store.name} (${store.municipality}):`, error.message)
    } else {
      successCount++
      console.log(`✅ [${store.municipality}] Inserted: ${data[0].name}`)
    }
  }

  console.log(`\nSuccessfully inserted ${successCount} / ${CEBU_PROVINCE_STORES.length} stores across Cebu Province!`)
}

seedCebuProvinceStores()
