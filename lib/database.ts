import { ObjectId } from 'mongodb'
import { getCollection, COLLECTIONS } from './mongodb'
import { User, Space, Booking, Payment, Review, PromoCode } from './models'

// Generic database operations
export class DatabaseService {
  // Users
  static async createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
    const collection = await getCollection(COLLECTIONS.USERS)
    const now = new Date()
    const user = {
      ...userData,
      createdAt: now,
      updatedAt: now,
      isActive: true
    }
    const result = await collection.insertOne(user)
    return { ...user, _id: result.insertedId }
  }

  static async getUserById(id: string) {
    const collection = await getCollection(COLLECTIONS.USERS)
    return collection.findOne({ _id: new ObjectId(id) })
  }

  static async getUserByEmail(email: string) {
    const collection = await getCollection(COLLECTIONS.USERS)
    return collection.findOne({ email })
  }

  static async updateUser(id: string, updateData: Partial<User>) {
    const collection = await getCollection(COLLECTIONS.USERS)
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { ...updateData, updatedAt: new Date() },
        $currentDate: { updatedAt: true }
      }
    )
    return result.modifiedCount > 0
  }

  // Spaces
  static async createSpace(spaceData: Omit<Space, '_id' | 'createdAt' | 'updatedAt'>) {
    const collection = await getCollection(COLLECTIONS.SPACES)
    const now = new Date()
    const space = {
      ...spaceData,
      createdAt: now,
      updatedAt: now,
      rating: 0,
      reviewCount: 0,
      status: 'pending' as const
    }
    const result = await collection.insertOne(space)
    return { ...space, _id: result.insertedId }
  }

  static async getSpaceById(id: string) {
    const collection = await getCollection(COLLECTIONS.SPACES)
    return collection.findOne({ _id: new ObjectId(id) })
  }

  static async getSpaces(filters: any = {}, options: any = {}) {
    const collection = await getCollection(COLLECTIONS.SPACES)
    const query: any = { status: 'active' }

    if (filters.category) {
      query.category = { $in: filters.category }
    }
    if (filters.location) {
      query['location.city'] = { $regex: filters.location, $options: 'i' }
    }
    if (filters.capacity) {
      query.capacity = { $gte: filters.capacity.min || 0, $lte: filters.capacity.max || 1000 }
    }
    if (filters.priceRange) {
      query.$or = [
        { 'pricing.hourly': { $gte: filters.priceRange.min, $lte: filters.priceRange.max } },
        { 'pricing.daily': { $gte: filters.priceRange.min, $lte: filters.priceRange.max } }
      ]
    }

    return collection.find(query, options).toArray()
  }

  static async updateSpace(id: string, updateData: Partial<Space>) {
    const collection = await getCollection(COLLECTIONS.SPACES)
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { ...updateData, updatedAt: new Date() }
      }
    )
    return result.modifiedCount > 0
  }

  static async deleteSpace(id: string) {
    const collection = await getCollection(COLLECTIONS.SPACES)
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'inactive', updatedAt: new Date() } }
    )
    return result.modifiedCount > 0
  }

  // Bookings
  static async createBooking(bookingData: Omit<Booking, '_id' | 'createdAt' | 'updatedAt'>) {
    const collection = await getCollection(COLLECTIONS.BOOKINGS)
    const now = new Date()
    const booking = {
      ...bookingData,
      createdAt: now,
      updatedAt: now
    }
    const result = await collection.insertOne(booking)
    return { ...booking, _id: result.insertedId }
  }

  static async getBookingById(id: string) {
    const collection = await getCollection(COLLECTIONS.BOOKINGS)
    return collection.findOne({ _id: new ObjectId(id) })
  }

  static async getBookingsByUser(userId: string, filters: any = {}) {
    const collection = await getCollection(COLLECTIONS.BOOKINGS)
    const query: any = { userId }

    if (filters.status) {
      query.status = { $in: filters.status }
    }
    if (filters.dateRange) {
      query.bookingDate = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      }
    }

    return collection.find(query).sort({ createdAt: -1 }).toArray()
  }

  static async getBookingsBySpace(spaceId: string, filters: any = {}) {
    const collection = await getCollection(COLLECTIONS.BOOKINGS)
    const query: any = { spaceId }

    if (filters.status) {
      query.status = { $in: filters.status }
    }

    return collection.find(query).sort({ createdAt: -1 }).toArray()
  }

  static async updateBooking(id: string, updateData: Partial<Booking>) {
    const collection = await getCollection(COLLECTIONS.BOOKINGS)
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { ...updateData, updatedAt: new Date() }
      }
    )
    return result.modifiedCount > 0
  }

  // Payments
  static async createPayment(paymentData: Omit<Payment, '_id' | 'createdAt' | 'updatedAt'>) {
    const collection = await getCollection(COLLECTIONS.PAYMENTS)
    const now = new Date()
    const payment = {
      ...paymentData,
      createdAt: now,
      updatedAt: now
    }
    const result = await collection.insertOne(payment)
    return { ...payment, _id: result.insertedId }
  }

  static async getPaymentByOrderId(orderId: string) {
    const collection = await getCollection(COLLECTIONS.PAYMENTS)
    return collection.findOne({ razorpayOrderId: orderId })
  }

  static async updatePayment(id: string, updateData: Partial<Payment>) {
    const collection = await getCollection(COLLECTIONS.PAYMENTS)
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { ...updateData, updatedAt: new Date() }
      }
    )
    return result.modifiedCount > 0
  }

  // Reviews
  static async createReview(reviewData: Omit<Review, '_id' | 'createdAt' | 'updatedAt'>) {
    const collection = await getCollection(COLLECTIONS.REVIEWS)
    const now = new Date()
    const review = {
      ...reviewData,
      createdAt: now,
      updatedAt: now,
      helpful: 0
    }
    const result = await collection.insertOne(review)

    // Update space rating
    await DatabaseService.updateSpaceRating(reviewData.spaceId)

    return { ...review, _id: result.insertedId }
  }

  static async getReviewsBySpace(spaceId: string, limit: number = 10) {
    const collection = await getCollection(COLLECTIONS.REVIEWS)
    return collection.find({ spaceId }).sort({ createdAt: -1 }).limit(limit).toArray()
  }

  private static async updateSpaceRating(spaceId: string) {
    const collection = await getCollection(COLLECTIONS.REVIEWS)
    const reviews = await collection.find({ spaceId }).toArray()

    if (reviews.length > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      const spaceCollection = await getCollection(COLLECTIONS.SPACES)

      await spaceCollection.updateOne(
        { _id: new ObjectId(spaceId) },
        {
          $set: {
            rating: Math.round(averageRating * 10) / 10,
            reviewCount: reviews.length
          }
        }
      )
    }
  }

  // Promo Codes
  static async createPromoCode(promoData: Omit<PromoCode, '_id' | 'createdAt' | 'updatedAt' | 'usedCount'>) {
    const collection = await getCollection(COLLECTIONS.PROMO_CODES)
    const now = new Date()
    const promo = {
      ...promoData,
      createdAt: now,
      updatedAt: now,
      usedCount: 0,
      isActive: true
    }
    const result = await collection.insertOne(promo)
    return { ...promo, _id: result.insertedId }
  }

  static async getPromoCode(code: string) {
    const collection = await getCollection(COLLECTIONS.PROMO_CODES)
    return collection.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
      $or: [
        { usageLimit: { $exists: false } },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    })
  }

  static async usePromoCode(code: string) {
    const collection = await getCollection(COLLECTIONS.PROMO_CODES)
    const result = await collection.updateOne(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 }, $set: { updatedAt: new Date() } }
    )
    return result.modifiedCount > 0
  }
}
