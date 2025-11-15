export enum OfferType {
  JOB = 'job',
  SERVICE = 'service',
  PRODUCT = 'product',
}

export enum SalaryType {
  PER_HOUR = 'Per Hour',
  PER_MONTH = 'Per Month',
  PER_PROJECT = 'Per Project',
}

export enum PriceType {
  PER_HOUR = 'Per Hour',
  PER_PROJECT = 'Per Project',
  FIXED = 'Fixed Price',
}

interface Location {
  address: string;
  lat: number;
  lng: number;
}

interface BaseOffer {
  id: string;
  scannedAt: string;
  summary: string;
  location?: Location;
  additionalDetails?: string;
  expiresAt?: string;
  applicantCount: number;
}

export interface JobOffer extends BaseOffer {
  type: OfferType.JOB;
  jobTitle: string;
  company: string;
  responsibilities: string[];
  skills: string[];
  salary?: string;
  salaryType?: SalaryType;
  phone?: string;
  email?: string;
}

export interface ServiceOffer extends BaseOffer {
  type: OfferType.SERVICE;
  serviceName: string;
  provider?: string;
  price?: string;
  priceType?: PriceType;
  phone?: string;
  email?: string;
}

export interface ProductOffer extends BaseOffer {
  type: OfferType.PRODUCT;
  productName: string;
  brand?: string;
  price: string;
  condition?: string;
  phone?: string;
  email?: string;
}

export type Offer = JobOffer | ServiceOffer | ProductOffer;

export interface User {
  email: string;
}

export enum AppView {
  FEED = 'feed',
  NEW_OFFER = 'new_offer',
  PROFILE = 'profile',
}