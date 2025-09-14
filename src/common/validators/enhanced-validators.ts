import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Business hours validator
@ValidatorConstraint()
export class IsBusinessHoursConstraint implements ValidatorConstraintInterface {
  validate(time: string, args: ValidationArguments) {
    if (!time || typeof time !== 'string') return false;
    
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    
    // Default business hours: 6 AM to 10 PM
    const [startHour, endHour] = args.constraints || [6, 22];
    const startMinutes = startHour * 60;
    const endMinutes = endHour * 60;
    
    return timeInMinutes >= startMinutes && timeInMinutes <= endMinutes;
  }

  defaultMessage(args: ValidationArguments) {
    const [startHour, endHour] = args.constraints || [6, 22];
    return `Time must be between ${startHour}:00 and ${endHour}:00`;
  }
}

export function IsBusinessHours(
  startHour: number = 6,
  endHour: number = 22,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [startHour, endHour],
      validator: IsBusinessHoursConstraint,
    });
  };
}

// Future date validator
@ValidatorConstraint()
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(date: any, args: ValidationArguments) {
    if (!date) return true;
    
    const inputDate = new Date(date);
    const now = new Date();
    const [minHoursAhead] = args.constraints || [1];
    
    const minFutureDate = new Date(now.getTime() + minHoursAhead * 60 * 60 * 1000);
    
    return inputDate >= minFutureDate;
  }

  defaultMessage(args: ValidationArguments) {
    const [minHoursAhead] = args.constraints || [1];
    return `Date must be at least ${minHoursAhead} hour(s) in the future`;
  }
}

export function IsFutureDate(
  minHoursAhead: number = 1,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minHoursAhead],
      validator: IsFutureDateConstraint,
    });
  };
}

// Booking duration validator
@ValidatorConstraint()
export class IsValidBookingDurationConstraint implements ValidatorConstraintInterface {
  validate(duration: number, args: ValidationArguments) {
    if (typeof duration !== 'number') return false;
    
    const [minHours, maxHours] = args.constraints || [0.5, 24];
    
    return duration >= minHours && duration <= maxHours;
  }

  defaultMessage(args: ValidationArguments) {
    const [minHours, maxHours] = args.constraints || [0.5, 24];
    return `Booking duration must be between ${minHours} and ${maxHours} hours`;
  }
}

export function IsValidBookingDuration(
  minHours: number = 0.5,
  maxHours: number = 24,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minHours, maxHours],
      validator: IsValidBookingDurationConstraint,
    });
  };
}

// Capacity validator
@ValidatorConstraint()
export class IsValidCapacityConstraint implements ValidatorConstraintInterface {
  validate(capacity: number, args: ValidationArguments) {
    if (typeof capacity !== 'number') return false;
    
    const [minCapacity, maxCapacity] = args.constraints || [1, 1000];
    
    return capacity >= minCapacity && capacity <= maxCapacity;
  }

  defaultMessage(args: ValidationArguments) {
    const [minCapacity, maxCapacity] = args.constraints || [1, 1000];
    return `Capacity must be between ${minCapacity} and ${maxCapacity} people`;
  }
}

export function IsValidCapacity(
  minCapacity: number = 1,
  maxCapacity: number = 1000,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minCapacity, maxCapacity],
      validator: IsValidCapacityConstraint,
    });
  };
}

// Price validator
@ValidatorConstraint()
export class IsValidPriceConstraint implements ValidatorConstraintInterface {
  validate(price: number, args: ValidationArguments) {
    if (typeof price !== 'number') return false;
    
    const [minPrice, maxPrice] = args.constraints || [100, 1000000]; // 1 rupee to 10,000 rupees in paise
    
    return price >= minPrice && price <= maxPrice;
  }

  defaultMessage(args: ValidationArguments) {
    const [minPrice, maxPrice] = args.constraints || [100, 1000000];
    return `Price must be between ₹${minPrice / 100} and ₹${maxPrice / 100}`;
  }
}

export function IsValidPrice(
  minPrice: number = 100,
  maxPrice: number = 1000000,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minPrice, maxPrice],
      validator: IsValidPriceConstraint,
    });
  };
}

// Phone number validator for Indian numbers
@ValidatorConstraint()
export class IsValidIndianPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: string, args: ValidationArguments) {
    if (!phone || typeof phone !== 'string') return false;
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Indian phone number patterns
    const patterns = [
      /^[6-9]\d{9}$/, // 10-digit mobile number
      /^\+91[6-9]\d{9}$/, // +91 prefix
      /^91[6-9]\d{9}$/, // 91 prefix
    ];
    
    return patterns.some(pattern => pattern.test(cleanPhone));
  }

  defaultMessage(args: ValidationArguments) {
    return 'Please provide a valid Indian phone number (10 digits starting with 6-9)';
  }
}

export function IsValidIndianPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidIndianPhoneConstraint,
    });
  };
}

// Pincode validator for Indian pincodes
@ValidatorConstraint()
export class IsValidIndianPincodeConstraint implements ValidatorConstraintInterface {
  validate(pincode: string, args: ValidationArguments) {
    if (!pincode || typeof pincode !== 'string') return false;
    
    // Indian pincode pattern: 6 digits
    const pincodePattern = /^[1-9][0-9]{5}$/;
    
    return pincodePattern.test(pincode);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Please provide a valid Indian pincode (6 digits)';
  }
}

export function IsValidIndianPincode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidIndianPincodeConstraint,
    });
  };
}

// GST number validator
@ValidatorConstraint()
export class IsValidGSTNumberConstraint implements ValidatorConstraintInterface {
  validate(gstNumber: string, args: ValidationArguments) {
    if (!gstNumber || typeof gstNumber !== 'string') return false;
    
    // GST number pattern: 2 digits + 2 characters + 4 digits + 1 character + 1 digit + 1 character + 2 digits
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    return gstPattern.test(gstNumber.toUpperCase());
  }

  defaultMessage(args: ValidationArguments) {
    return 'Please provide a valid GST number (format: 22AAAAA0000A1Z5)';
  }
}

export function IsValidGSTNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidGSTNumberConstraint,
    });
  };
}

// PAN number validator
@ValidatorConstraint()
export class IsValidPANNumberConstraint implements ValidatorConstraintInterface {
  validate(panNumber: string, args: ValidationArguments) {
    if (!panNumber || typeof panNumber !== 'string') return false;
    
    // PAN number pattern: 5 characters + 4 digits + 1 character
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    
    return panPattern.test(panNumber.toUpperCase());
  }

  defaultMessage(args: ValidationArguments) {
    return 'Please provide a valid PAN number (format: ABCDE1234F)';
  }
}

export function IsValidPANNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidPANNumberConstraint,
    });
  };
}

// Booking code validator
@ValidatorConstraint()
export class IsValidBookingCodeConstraint implements ValidatorConstraintInterface {
  validate(bookingCode: string, args: ValidationArguments) {
    if (!bookingCode || typeof bookingCode !== 'string') return false;
    
    // Booking code pattern: BK followed by 8 alphanumeric characters
    const bookingCodePattern = /^BK[A-Z0-9]{8}$/;
    
    return bookingCodePattern.test(bookingCode.toUpperCase());
  }

  defaultMessage(args: ValidationArguments) {
    return 'Please provide a valid booking code (format: BK followed by 8 alphanumeric characters)';
  }
}

export function IsValidBookingCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidBookingCodeConstraint,
    });
  };
}

// Time slot validator
@ValidatorConstraint()
export class IsValidTimeSlotConstraint implements ValidatorConstraintInterface {
  validate(timeSlot: string, args: ValidationArguments) {
    if (!timeSlot || typeof timeSlot !== 'string') return false;
    
    // Time slot pattern: HH:MM-HH:MM
    const timeSlotPattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeSlotPattern.test(timeSlot)) return false;
    
    const [startTime, endTime] = timeSlot.split('-');
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    // End time should be after start time
    return endTotalMinutes > startTotalMinutes;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Please provide a valid time slot (format: HH:MM-HH:MM, end time must be after start time)';
  }
}

export function IsValidTimeSlot(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidTimeSlotConstraint,
    });
  };
}

// Rating validator
@ValidatorConstraint()
export class IsValidRatingConstraint implements ValidatorConstraintInterface {
  validate(rating: number, args: ValidationArguments) {
    if (typeof rating !== 'number') return false;
    
    const [minRating, maxRating] = args.constraints || [1, 5];
    
    return rating >= minRating && rating <= maxRating;
  }

  defaultMessage(args: ValidationArguments) {
    const [minRating, maxRating] = args.constraints || [1, 5];
    return `Rating must be between ${minRating} and ${maxRating}`;
  }
}

export function IsValidRating(
  minRating: number = 1,
  maxRating: number = 5,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minRating, maxRating],
      validator: IsValidRatingConstraint,
    });
  };
}

// Discount percentage validator
@ValidatorConstraint()
export class IsValidDiscountPercentageConstraint implements ValidatorConstraintInterface {
  validate(percentage: number, args: ValidationArguments) {
    if (typeof percentage !== 'number') return false;
    
    const [minPercentage, maxPercentage] = args.constraints || [0, 100];
    
    return percentage >= minPercentage && percentage <= maxPercentage;
  }

  defaultMessage(args: ValidationArguments) {
    const [minPercentage, maxPercentage] = args.constraints || [0, 100];
    return `Discount percentage must be between ${minPercentage}% and ${maxPercentage}%`;
  }
}

export function IsValidDiscountPercentage(
  minPercentage: number = 0,
  maxPercentage: number = 100,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minPercentage, maxPercentage],
      validator: IsValidDiscountPercentageConstraint,
    });
  };
}

// URL validator for images
@ValidatorConstraint()
export class IsValidImageUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const urlObj = new URL(url);
      
      // Check if it's a valid HTTP/HTTPS URL
      if (!['http:', 'https:'].includes(urlObj.protocol)) return false;
      
      // Check if it's an image URL (basic check)
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => 
        urlObj.pathname.toLowerCase().includes(ext)
      );
      
      return hasImageExtension;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Please provide a valid image URL (must be HTTP/HTTPS and contain image file extension)';
  }
}

export function IsValidImageUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidImageUrlConstraint,
    });
  };
}

// Password strength validator
@ValidatorConstraint()
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (!password || typeof password !== 'string') return false;
    
    const [minLength] = args.constraints || [8];
    
    // Check minimum length
    if (password.length < minLength) return false;
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) return false;
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) return false;
    
    // Check for at least one digit
    if (!/\d/.test(password)) return false;
    
    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const [minLength] = args.constraints || [8];
    return `Password must be at least ${minLength} characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character`;
  }
}

export function IsStrongPassword(
  minLength: number = 8,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minLength],
      validator: IsStrongPasswordConstraint,
    });
  };
}

// Array of unique values validator
@ValidatorConstraint()
export class IsUniqueArrayConstraint implements ValidatorConstraintInterface {
  validate(array: any[], args: ValidationArguments) {
    if (!Array.isArray(array)) return false;
    
    const uniqueArray = [...new Set(array)];
    return uniqueArray.length === array.length;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Array must contain unique values';
  }
}

export function IsUniqueArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsUniqueArrayConstraint,
    });
  };
}

// Conditional validation decorator
export function ValidateIf(condition: (object: any) => boolean, validationOptions?: ValidationOptions) {
  return function (target: any, propertyName: string) {
    const originalValidate = target.constructor.prototype[propertyName];
    
    target.constructor.prototype[propertyName] = function(value: any) {
      if (condition(this)) {
        return originalValidate.call(this, value);
      }
      return true;
    };
  };
}
