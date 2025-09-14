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

// Business validation rules
@Injectable()
@ValidatorConstraint({ async: true })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
    @InjectModel('Space') private readonly spaceModel: Model<any>,
    @InjectModel('PromoCode') private readonly promoCodeModel: Model<any>
  ) {}

  async validate(value: any, args: ValidationArguments) {
    const [modelName, field] = args.constraints;
    
    if (!value) return true;

    const model = this.getModel(modelName);
    if (!model) return false;

    const query = { [field]: value };
    
    // If updating, exclude current document
    if (args.object && (args.object as any).id) {
      query['_id'] = { $ne: (args.object as any).id };
    }

    const count = await model.countDocuments(query);
    return count === 0;
  }

  defaultMessage(args: ValidationArguments) {
    const [, field] = args.constraints;
    return `${field} must be unique`;
  }

  private getModel(modelName: string): Model<any> | null {
    switch (modelName.toLowerCase()) {
      case 'user':
        return this.userModel;
      case 'space':
        return this.spaceModel;
      case 'promocode':
        return this.promoCodeModel;
      default:
        return null;
    }
  }
}

export function IsUnique(
  modelName: string,
  field: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [modelName, field],
      validator: IsUniqueConstraint,
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
    
    // Allow up to 1 hour in the past for clock differences
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    
    return inputDate > oneHourAgo;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Date must be in the future';
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsFutureDateConstraint,
    });
  };
}

// Business hours validator
@ValidatorConstraint()
export class IsValidBusinessHoursConstraint implements ValidatorConstraintInterface {
  validate(hours: any, args: ValidationArguments) {
    if (!hours || typeof hours !== 'object') return false;

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of daysOfWeek) {
      if (!hours[day]) continue;
      
      const dayHours = hours[day];
      
      if (dayHours.closed) continue;
      
      if (!dayHours.open || !dayHours.close) {
        return false;
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(dayHours.open) || !timeRegex.test(dayHours.close)) {
        return false;
      }

      // Validate that open time is before close time
      const [openHour, openMin] = dayHours.open.split(':').map(Number);
      const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
      
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      
      if (openMinutes >= closeMinutes) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid business hours format or open time must be before close time';
  }
}

export function IsValidBusinessHours(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidBusinessHoursConstraint,
    });
  };
}

// Time range validator
@ValidatorConstraint()
export class IsValidTimeRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value) return true;

    const object = args.object as any;
    const [startField, endField] = args.constraints || ['startTime', 'endTime'];
    
    const startTime = object[startField];
    const endTime = object[endField];
    
    if (!startTime || !endTime) return true;

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return false;
    }

    // Convert to minutes for comparison
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return startMinutes < endMinutes;
  }

  defaultMessage(args: ValidationArguments) {
    return 'End time must be after start time';
  }
}

export function IsValidTimeRange(
  startField?: string,
  endField?: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [startField || 'startTime', endField || 'endTime'],
      validator: IsValidTimeRangeConstraint,
    });
  };
}

// Coordinate validator
@ValidatorConstraint()
export class IsValidCoordinatesConstraint implements ValidatorConstraintInterface {
  validate(coords: any, args: ValidationArguments) {
    if (!coords || typeof coords !== 'object') return false;
    
    const { lat, lng } = coords;
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return false;
    }
    
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180';
  }
}

export function IsValidCoordinates(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidCoordinatesConstraint,
    });
  };
}

// Price range validator
@ValidatorConstraint()
export class IsValidPriceRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value || typeof value !== 'object') return true;
    
    const { min, max } = value;
    
    if (min !== undefined && max !== undefined) {
      if (typeof min !== 'number' || typeof max !== 'number') {
        return false;
      }
      
      if (min < 0 || max < 0) {
        return false;
      }
      
      if (min > max) {
        return false;
      }
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid price range. Min price must be less than max price and both must be non-negative';
  }
}

export function IsValidPriceRange(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidPriceRangeConstraint,
    });
  };
}

// Capacity range validator
@ValidatorConstraint()
export class IsValidCapacityRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    const spaceCapacity = object.capacity;
    
    if (!spaceCapacity || !value) return true;
    
    return value <= spaceCapacity;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Guest count cannot exceed space capacity';
  }
}

export function IsValidCapacityRange(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidCapacityRangeConstraint,
    });
  };
}

// GST number validator
@ValidatorConstraint()
export class IsValidGSTNumberConstraint implements ValidatorConstraintInterface {
  validate(gstNumber: string, args: ValidationArguments) {
    if (!gstNumber) return true;
    
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid GST number format';
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
    if (!panNumber) return true;
    
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(panNumber);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid PAN number format';
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

// Promo code format validator
@ValidatorConstraint()
export class IsValidPromoCodeConstraint implements ValidatorConstraintInterface {
  validate(code: string, args: ValidationArguments) {
    if (!code) return true;
    
    // Promo codes should be 3-20 characters, uppercase letters, numbers, and underscores only
    const promoCodeRegex = /^[A-Z0-9_]{3,20}$/;
    return promoCodeRegex.test(code);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Promo code must be 3-20 characters long and contain only uppercase letters, numbers, and underscores';
  }
}

export function IsValidPromoCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidPromoCodeConstraint,
    });
  };
}

// Booking duration validator
@ValidatorConstraint()
export class IsValidBookingDurationConstraint implements ValidatorConstraintInterface {
  validate(duration: number, args: ValidationArguments) {
    if (!duration) return true;
    
    const object = args.object as any;
    const startTime = object.startTime;
    const endTime = object.endTime;
    
    if (!startTime || !endTime) return true;
    
    // Calculate duration from time range
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const calculatedDuration = (endMinutes - startMinutes) / 60;
    
    // Allow small floating point differences
    return Math.abs(duration - calculatedDuration) < 0.01;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Duration must match the time range between start and end time';
  }
}

export function IsValidBookingDuration(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidBookingDurationConstraint,
    });
  };
}

// Available space validator (checks against existing bookings)
@Injectable()
@ValidatorConstraint({ async: true })
export class IsSpaceAvailableConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectModel('Booking') private readonly bookingModel: Model<any>
  ) {}

  async validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    const { spaceId, bookingDate, startTime, endTime } = object;
    
    if (!spaceId || !bookingDate || !startTime || !endTime) return true;
    
    // Check for conflicting bookings
    const conflictingBooking = await this.bookingModel.findOne({
      spaceId,
      bookingDate: new Date(bookingDate),
      status: { $in: ['pending', 'confirmed', 'checked-in'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ],
      // Exclude current booking if updating
      ...(object.id ? { _id: { $ne: object.id } } : {})
    });
    
    return !conflictingBooking;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Space is not available for the selected time slot';
  }
}

export function IsSpaceAvailable(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsSpaceAvailableConstraint,
    });
  };
}

// Password confirmation validator
export function MatchesProperty(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${propertyName} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}

// File type validator
@ValidatorConstraint()
export class IsValidFileTypeConstraint implements ValidatorConstraintInterface {
  validate(files: any, args: ValidationArguments) {
    if (!files) return true;
    
    const [allowedTypes] = args.constraints;
    const fileArray = Array.isArray(files) ? files : [files];
    
    return fileArray.every(file => {
      if (typeof file === 'string') {
        // URL validation - check file extension
        const extension = file.split('.').pop()?.toLowerCase();
        return allowedTypes.includes(extension);
      }
      
      if (file && file.mimetype) {
        return allowedTypes.some(type => file.mimetype.includes(type));
      }
      
      return false;
    });
  }

  defaultMessage(args: ValidationArguments) {
    const [allowedTypes] = args.constraints;
    return `Only ${allowedTypes.join(', ')} files are allowed`;
  }
}

export function IsValidFileType(allowedTypes: string[], validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [allowedTypes],
      validator: IsValidFileTypeConstraint,
    });
  };
}

// Age validator
@ValidatorConstraint()
export class IsValidAgeConstraint implements ValidatorConstraintInterface {
  validate(dateOfBirth: any, args: ValidationArguments) {
    if (!dateOfBirth) return true;
    
    const [minAge, maxAge] = args.constraints;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= minAge && age <= maxAge;
  }

  defaultMessage(args: ValidationArguments) {
    const [minAge, maxAge] = args.constraints;
    return `Age must be between ${minAge} and ${maxAge} years`;
  }
}

export function IsValidAge(minAge: number = 18, maxAge: number = 120, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minAge, maxAge],
      validator: IsValidAgeConstraint,
    });
  };
}