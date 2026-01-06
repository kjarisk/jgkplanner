/**
 * Seed script for initial training packages
 * Run with: node server/scripts/seed-packages.js
 */

import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '../database.json')
const adapter = new JSONFile(dbPath)
const db = new Low(adapter, {})

// Trainer IDs
const TRAINERS = {
  andreas: '268c81b2-40d7-4da5-9a0b-e16e546730a9',
  tolo: '555251b3-2592-40c3-9d33-50715e3f86d6',
  janEgil: 'd16fb858-4ae1-48f7-883f-6aaf155958b1',
  kjartan: 'f9be6c95-c85e-4505-9424-bdca46423fa4'
}

// Training Type IDs
const TYPES = {
  junior1113: 'dad5e0cd-960a-4d6d-9c07-1c6ce304f713',
  junior1419: 'c52f62f6-ed42-4f3d-9745-3d2cf2c4e52c',
  mandagstrening: '7d945060-c284-4c30-86ad-3fe288cd7a5c',
  fredagstrening: '915464c6-33ab-43db-b101-7c11cc9eda4c',
  juniorVinter: 'c86debd0-904c-4141-b1e6-26f802a9eb9e',
  fredagsBanespill: 'fd8dfab7-85da-4657-81d5-dbbe782edfd3'
}

const timestamp = new Date().toISOString()

const packages = [
  // Junior Packages
  {
    id: uuidv4(),
    name: 'Junior Vintertrening',
    description: 'Innendørs trening i simulatorhuset gjennom vinteren. Perfekt for å holde formen oppe når det er kaldt ute.',
    price: 600,
    category: 'junior',
    trainer_ids: [TRAINERS.andreas, TRAINERS.janEgil],
    training_type_ids: [TYPES.juniorVinter],
    perks: [
      'Innendørs trening i simulatorhuset',
      'Profesjonell veiledning',
      'Tilgang til alle vinterøkter'
    ],
    requirements: [
      'Krever simulator medlemskap'
    ],
    period: 'Januar - Mars',
    is_featured: false,
    sort_order: 1,
    is_deleted: false,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: uuidv4(),
    name: 'Junior Sommer',
    description: 'Sommertrening med onsdagstrening og fredags banespill (turnering). Perfekt for å utvikle spillet ditt i sommersesongen.',
    price: 400,
    category: 'junior',
    trainer_ids: [TRAINERS.andreas],
    training_type_ids: [TYPES.junior1113, TYPES.junior1419, TYPES.fredagsBanespill],
    perks: [
      'Onsdagstrening hver uke',
      'Fredags banespill (turnering)',
      'Utendørs trening på banen'
    ],
    requirements: [],
    period: 'Sommer',
    is_featured: false,
    sort_order: 2,
    is_deleted: false,
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: uuidv4(),
    name: 'Junior Helårspakke',
    description: 'Den komplette pakken for seriøse juniorspillere. Inkluderer sommer, høst og vinter - alt du trenger for å bli bedre hele året.',
    price: 2000,
    category: 'junior',
    trainer_ids: [TRAINERS.andreas, TRAINERS.janEgil],
    training_type_ids: [TYPES.junior1113, TYPES.junior1419, TYPES.juniorVinter, TYPES.fredagsBanespill],
    perks: [
      'Sommerpakken inkludert',
      'Tilgang til alle tema-treninger',
      '20% rabatt på ballmaskinen',
      'Høst- og vintertrening inkludert',
      'Alt innhold fra sommerpakken'
    ],
    requirements: [],
    period: 'Sommer / Høst / Vinter',
    is_featured: true,
    sort_order: 3,
    is_deleted: false,
    created_at: timestamp,
    updated_at: timestamp
  },
  
  // Voksen Packages
  {
    id: uuidv4(),
    name: 'Fredagstrening',
    description: 'Temabasert trening med fokus på kortspill. Perfekt for å forbedre putting, chipping, pitching og bunkerslag.',
    price: 1000,
    category: 'voksen',
    trainer_ids: [TRAINERS.janEgil],
    training_type_ids: [TYPES.fredagstrening],
    perks: [
      'Ca. 10 treningsøkter før sommeren',
      'Tema: Putting',
      'Tema: Chipping',
      'Tema: Pitching',
      'Tema: Bunkerslag',
      'Tema: Kortspill strategi',
      'Drop-in på alle økter'
    ],
    requirements: [],
    period: 'Før sommeren',
    is_featured: true,
    sort_order: 1,
    is_deleted: false,
    created_at: timestamp,
    updated_at: timestamp
  },
  
  // Alle (Everyone) Packages
  {
    id: uuidv4(),
    name: 'Nybegynner-pakke',
    description: 'Perfekt startpakke for de som er nye i golf. Få profesjonell veiledning og spill dine første runder med en trener.',
    price: 1000,
    category: 'alle',
    trainer_ids: [TRAINERS.kjartan, TRAINERS.tolo],
    training_type_ids: [],
    perks: [
      '2 runder på banen med trener',
      '6 treningsøkter',
      'Grunnleggende teknikk',
      'Regler og etikette',
      'Personlig oppfølging'
    ],
    requirements: [],
    period: 'Mai - Juli',
    is_featured: false,
    sort_order: 1,
    is_deleted: false,
    created_at: timestamp,
    updated_at: timestamp
  },
  
  // Gratis Packages
  {
    id: uuidv4(),
    name: 'Mandagstrening',
    description: 'Gratis trening for alle! Juniorene starter kl. 17:00 og voksne fra 18:00-19:00.',
    price: 0,
    category: 'gratis',
    trainer_ids: [TRAINERS.kjartan],
    training_type_ids: [TYPES.mandagstrening],
    perks: [
      'Gratis for alle',
      'Juniors: 17:00',
      'Voksne: 18:00 - 19:00',
      'Sosial trening',
      'Alle nivåer velkommen'
    ],
    requirements: [],
    period: 'Hele året',
    is_featured: false,
    sort_order: 1,
    is_deleted: false,
    created_at: timestamp,
    updated_at: timestamp
  }
]

async function seed() {
  console.log('Reading database...')
  await db.read()
  
  // Ensure packages array exists
  if (!db.data.packages) {
    db.data.packages = []
  }
  
  // Check if packages already exist
  if (db.data.packages.length > 0) {
    console.log(`Database already has ${db.data.packages.length} packages.`)
    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const answer = await new Promise(resolve => {
      rl.question('Do you want to replace them? (y/n): ', resolve)
    })
    rl.close()
    
    if (answer.toLowerCase() !== 'y') {
      console.log('Aborted.')
      process.exit(0)
    }
    
    // Clear existing packages
    db.data.packages = []
  }
  
  // Add packages
  console.log(`Adding ${packages.length} packages...`)
  db.data.packages = packages
  
  await db.write()
  console.log('Done! Packages seeded successfully.')
}

seed().catch(console.error)
