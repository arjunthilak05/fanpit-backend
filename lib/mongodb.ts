import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

// Helper function to get database instance
export async function getDatabase(dbName: string = 'fanpit') {
  const client = await clientPromise
  return client.db(dbName)
}

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  SPACES: 'spaces',
  BOOKINGS: 'bookings',
  PAYMENTS: 'payments',
  REVIEWS: 'reviews',
  PROMO_CODES: 'promo_codes'
} as const

// Helper function to get collection
export async function getCollection(collectionName: string, dbName: string = 'fanpit') {
  const db = await getDatabase(dbName)
  return db.collection(collectionName)
}
