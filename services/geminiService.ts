import { GoogleGenAI, Type } from "@google/genai";
import { Offer, OfferType, JobOffer, ServiceOffer, ProductOffer, SalaryType, PriceType } from '../types';

// Simple cache with Time-To-Live (TTL) that uses both in-memory and localStorage
const cache = new Map<string, { value: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const LOCAL_STORAGE_CACHE_PREFIX = 'gemini_api_cache_';

// Create a single, shared instance of the AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function getFromCache<T>(key: string): T | null {
    // 1. Try in-memory cache first for speed
    const entry = cache.get(key);
    if (entry && entry.expiry > Date.now()) {
        return entry.value as T;
    }
    if (entry) { // Expired entry
        cache.delete(key);
    }

    // 2. Try localStorage for persistence
    try {
        const localData = localStorage.getItem(`${LOCAL_STORAGE_CACHE_PREFIX}${key}`);
        if (localData) {
            const localEntry = JSON.parse(localData);
            if (localEntry.expiry > Date.now()) {
                // Populate in-memory cache for faster access next time
                cache.set(key, { value: localEntry.value, expiry: localEntry.expiry });
                return localEntry.value as T;
            } else {
                // Clean up expired entry from localStorage
                localStorage.removeItem(`${LOCAL_STORAGE_CACHE_PREFIX}${key}`);
            }
        }
    } catch (error) {
        console.error("Error reading from localStorage cache", error);
    }

    return null;
}

function setInCache<T>(key: string, value: T): void {
    const expiry = Date.now() + CACHE_TTL;
    
    // Set in-memory cache
    cache.set(key, { value, expiry });
    
    // Set in localStorage
    try {
        const localEntry = { value, expiry };
        localStorage.setItem(`${LOCAL_STORAGE_CACHE_PREFIX}${key}`, JSON.stringify(localEntry));
    } catch (error) {
        // This can happen if localStorage is full or disabled
        console.error("Error writing to localStorage cache", error);
    }
}


const offerSchema = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      description: "The type of offer. Must be one of: 'job', 'service', or 'product'.",
      enum: ['job', 'service', 'product']
    },
    // Job fields
    jobTitle: { type: Type.STRING, description: "The title of the job position." },
    company: { type: Type.STRING, description: "The name of the company offering the job." },
    responsibilities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key responsibilities for the job." },
    skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required skills for the job." },
    salary: { type: Type.STRING, description: "The salary for the job, if mentioned." },
    salaryType: { type: Type.STRING, description: "The type of salary. Must be one of: 'Per Hour', 'Per Month', or 'Per Project'.", enum: ['Per Hour', 'Per Month', 'Per Project']},
    // Service fields
    serviceName: { type: Type.STRING, description: "The name of the service being offered." },
    provider: { type: Type.STRING, description: "The person or company providing the service." },
    priceType: { type: Type.STRING, description: "The type of price for the service. Must be one of: 'Per Hour', 'Per Project', or 'Fixed Price'.", enum: ['Per Hour', 'Per Project', 'Fixed Price']},
    phone: { type: Type.STRING, description: "The primary contact phone number for the service or job." },
    email: { type: Type.STRING, description: "The primary contact email address for the service or job." },
    // Product fields
    productName: { type: Type.STRING, description: "The name of the product for sale." },
    brand: { type: Type.STRING, description: "The brand of the product." },
    condition: { type: Type.STRING, description: "The condition of the product (e.g., 'new', 'used')." },
    // Common fields
    price: { type: Type.STRING, description: "The price for a product or service." },
    summary: { type: Type.STRING, description: "A brief summary of the offer." },
    location: { type: Type.STRING, description: "The physical address, city, or general location of the offer." },
    additionalDetails: { type: Type.STRING, description: "Any extra details, requirements, benefits, or specifics about the offer." },
    expiresAt: { type: Type.STRING, description: "The date when the offer is no longer valid, in YYYY-MM-DD format." },
  },
  required: ["type", "summary"]
};

const geocodeSchema = {
    type: Type.OBJECT,
    properties: {
        lat: { type: Type.NUMBER, description: "Latitude coordinate" },
        lng: { type: Type.NUMBER, description: "Longitude coordinate" },
    },
    required: ["lat", "lng"],
};

const reverseGeocodeSchema = {
    type: Type.OBJECT,
    properties: {
        locationName: { type: Type.STRING, description: "The city and state/country name for the given coordinates, formatted like 'City, State'." },
    },
    required: ["locationName"],
};

const locationSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of up to 5 location suggestion strings."
        },
    },
    required: ["suggestions"],
};


export async function reverseGeocode(coords: { lat: number; lng: number }): Promise<string | null> {
    // Using toFixed(2) for ~1km precision to avoid cache misses from minor GPS fluctuations.
    const cacheKey = `reverse-geocode:${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
    const cached = getFromCache<string>(cacheKey);
    if (cached) {
        return cached;
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `What is the city and state for the coordinates: latitude ${coords.lat}, longitude ${coords.lng}? Respond with only the location name.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: reverseGeocodeSchema,
            },
        });
        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);
        const locationName = parsed.locationName || null;
        if (locationName) {
            setInCache(cacheKey, locationName);
        }
        return locationName;
    } catch (error) {
        console.error("Error reverse geocoding with Gemini:", error);
        return null;
    }
}

export async function getLocationSuggestions(query: string): Promise<string[]> {
    if (query.trim().length < 3) {
        return [];
    }
    const cacheKey = `suggestions:${query.toLowerCase()}`;
    const cached = getFromCache<string[]>(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Provide up to 5 location autocomplete suggestions for the partial address: "${query}". Respond with only a JSON object containing a "suggestions" array. Each suggestion should be a full address or place name.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: locationSuggestionsSchema,
            },
        });
        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);
        const suggestions = parsed.suggestions || [];
        setInCache(cacheKey, suggestions);
        return suggestions;
    } catch (error) {
        console.error("Error getting location suggestions from Gemini:", error);
        return [];
    }
}


export async function geocodeLocation(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!address.trim()) return null;
    const cacheKey = `geocode:${address.toLowerCase()}`;
    const cached = getFromCache<{ lat: number; lng: number }>(cacheKey);
    if (cached) {
        return cached;
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Return the latitude and longitude for the following location: ${address}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: geocodeSchema,
            },
        });
        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
            setInCache(cacheKey, parsed);
            return parsed;
        }
        return null;
    } catch (error) {
        console.error("Error geocoding location with Gemini:", error);
        return null;
    }
}


export async function analyzeOfferImage(imageDataBase64: string): Promise<Partial<Offer & { location?: string }>> {
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageDataBase64,
      },
    };

    const textPart = {
      text: "Analyze the image. First, classify it as a 'job', 'service', or 'product' offer and set the 'type' field. Then, extract all relevant details into the corresponding fields of the JSON schema. If a field is not present, omit it. Be sure to extract key contact details like a 'phone' number or 'email' address if available for any offer type, as well as the 'location', 'salaryType' for jobs, and 'priceType' for services if specified. Also, extract any other important information like requirements, benefits, or specific instructions into the 'additionalDetails' field. Finally, look for any expiration or 'valid until' date and extract it into the 'expiresAt' field in YYYY-MM-DD format.",
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: offerSchema,
      },
    });
    
    const jsonString = response.text.trim();
    const parsedData = JSON.parse(jsonString);

    // Return a partial object that can be used to populate the form
    // The form will handle validation and completion.
    const result: Partial<Offer & { location?: string }> = {
        type: parsedData.type,
        jobTitle: parsedData.jobTitle,
        company: parsedData.company,
        summary: parsedData.summary,
        responsibilities: parsedData.responsibilities,
        skills: parsedData.skills,
        salary: parsedData.salary,
        salaryType: parsedData.salaryType,
        serviceName: parsedData.serviceName,
        provider: parsedData.provider,
        price: parsedData.price,
        priceType: parsedData.priceType,
        phone: parsedData.phone,
        email: parsedData.email,
        productName: parsedData.productName,
        brand: parsedData.brand,
        condition: parsedData.condition,
        location: parsedData.location,
        additionalDetails: parsedData.additionalDetails,
        expiresAt: parsedData.expiresAt,
    };
    
    return result;

  } catch (error) {
    console.error("Error analyzing offer with Gemini:", error);
    if (error instanceof Error) {
        throw new Error("Failed to process the image. Please try again with a clearer picture.");
    }
    throw new Error("An unknown error occurred while processing the image.");
  }
}