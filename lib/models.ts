// Database Models and Types for Fanpit Platform

export interface User {
  _id?: string
  email: string
  name: string
  role: 'consumer' | 'brand_owner' | 'staff'
  avatar?: string
  phone?: string
  organization?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  preferences?: {
    notifications: boolean
    marketing: boolean
    language: string
  }
}

export interface Space {
  _id?: string
  ownerId: string
  name: string
  description: string
  location: {
    address: string
    city: string
    state: string
    pincode: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  capacity: number
  category: 'Conference' | 'Workshop' | 'Meetup' | 'Social' | 'Business' | 'Entertainment'
  amenities: string[]
  pricing: {
    hourly?: number
    daily?: number
    weekly?: number
    monthly?: number
    currency: string
  }
  images: string[]
  availability: {
    schedule: {
      monday: { open: string, close: string, isOpen: boolean }[]
      tuesday: { open: string, close: string, isOpen: boolean }[]
      wednesday: { open: string, close: string, isOpen: boolean }[]
      thursday: { open: string, close: string, isOpen: boolean }[]
      friday: { open: string, close: string, isOpen: boolean }[]
      saturday: { open: string, close: string, isOpen: boolean }[]
      sunday: { open: string, close: string, isOpen: boolean }[]
    }
    blockedDates: Date[]
  }
  rating: number
  reviewCount: number
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  createdAt: Date
  updatedAt: Date
  contactInfo: {
    phone: string
    email: string
    website?: string
  }
  policies: {
    cancellation: string
    payment: string
    rules: string[]
  }
}

export interface Booking {
  _id?: string
  bookingCode: string
  spaceId: string
  userId: string
  customerDetails: {
    name: string
    email: string
    phone: string
    organization?: string
  }
  eventDetails: {
    purpose: string
    specialRequests?: string
    attendeeCount: number
  }
  bookingDate: Date
  timeSlot: {
    start: string
    end: string
  }
  duration: number // in hours
  pricing: {
    baseAmount: number
    discountAmount: number
    taxAmount: number
    totalAmount: number
    currency: string
    appliedPromoCode?: string
  }
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  payment: {
    razorpayOrderId?: string
    razorpayPaymentId?: string
    status: 'pending' | 'paid' | 'failed' | 'refunded'
    paidAt?: Date
  }
  createdAt: Date
  updatedAt: Date
  cancelledAt?: Date
  cancellationReason?: string
  checkInTime?: Date
  checkOutTime?: Date
  staffNotes?: string
}

export interface Payment {
  _id?: string
  razorpayOrderId: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  bookingId: string
  userId: string
  amount: number
  currency: string
  status: 'created' | 'paid' | 'failed' | 'refunded'
  paymentMethod?: string
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

export interface Review {
  _id?: string
  bookingId: string
  spaceId: string
  userId: string
  rating: number
  title: string
  comment: string
  images?: string[]
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
  helpful: number
  response?: {
    by: string
    message: string
    respondedAt: Date
  }
}

export interface PromoCode {
  _id?: string
  code: string
  description: string
  type: 'percentage' | 'fixed'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  validFrom: Date
  validUntil: Date
  usageLimit?: number
  usedCount: number
  applicableCategories?: string[]
  applicableSpaces?: string[]
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Search and Filter Types
export interface SpaceSearchFilters {
  query?: string
  category?: string[]
  location?: string
  priceRange?: {
    min: number
    max: number
  }
  capacity?: {
    min: number
    max: number
  }
  amenities?: string[]
  rating?: number
  availability?: {
    date: Date
    timeSlot?: {
      start: string
      end: string
    }
  }
}

export interface BookingFilters {
  userId?: string
  spaceId?: string
  status?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  paymentStatus?: string[]
}
