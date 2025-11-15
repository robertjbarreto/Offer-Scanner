
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Offer, OfferType, JobOffer, ServiceOffer, ProductOffer, SalaryType, PriceType } from '../types';
import Scanner from './Scanner';
import { geocodeLocation, getLocationSuggestions } from '../services/geminiService';
import { CameraIcon, BriefcaseIcon, WrenchScrewdriverIcon, TagIcon, XMarkIcon, SparklesIcon, MapPinIcon, XCircleIcon, PlusIcon, MinusIcon } from './Icons';

interface OfferFormProps {
  onAddOffer: (offerData: Omit<Offer, 'id' | 'scannedAt'>) => void;
  onCancel: () => void;
}

const initialFormData = {
    type: OfferType.JOB,
    jobTitle: '', company: '', responsibilities: [''], skills: [''], salary: '', salaryType: SalaryType.PER_MONTH,
    serviceName: '', provider: '', phone: '', email: '', priceType: PriceType.PER_PROJECT,
    productName: '', brand: '', price: '', condition: '',
    summary: '',
    location: '',
    additionalDetails: '',
    expiresAt: '',
};

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// Extracted Components to prevent focus loss on re-render

interface TypeButtonProps {
    type: OfferType;
    label: string;
    icon: React.ReactNode;
    currentType: OfferType;
    onClick: (type: OfferType) => void;
}
const TypeButton: React.FC<TypeButtonProps> = ({ type, label, icon, currentType, onClick }) => (
    <button
      type="button"
      onClick={() => onClick(type)}
      className={`flex-1 flex items-center justify-center p-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
        currentType === type
          ? 'bg-blue-600 text-white border-blue-700 shadow-md'
          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
);

interface InputFieldProps {
    name: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: 'text' | 'email' | 'tel' | 'date';
}
const InputField: React.FC<InputFieldProps> = ({ name, label, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
    </div>
);

interface SelectFieldProps {
    name: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
}
const SelectField: React.FC<SelectFieldProps> = ({ name, label, value, onChange, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
            {children}
        </select>
    </div>
);

interface TextAreaFieldProps {
    name: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
}
const TextAreaField: React.FC<TextAreaFieldProps> = ({ name, label, value, onChange, placeholder, rows = 3 }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
    </div>
);

interface ArrayFieldProps {
    name: 'skills' | 'responsibilities';
    label: string;
    values: string[];
    placeholder: string;
    onChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
    onAdd: () => void;
}
const ArrayField: React.FC<ArrayFieldProps> = ({ name, label, values, placeholder, onChange, onRemove, onAdd }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {values.map((value, index) => (
            <div key={index} className="flex items-center mb-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(index, e.target.value)}
                    placeholder={`${placeholder} #${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <button type="button" onClick={() => onRemove(index)} className="ml-2 text-gray-400 hover:text-red-500">
                    <XMarkIcon className="h-5 w-5"/>
                </button>
            </div>
        ))}
        <button type="button" onClick={onAdd} className="text-sm font-semibold text-blue-600 hover:text-blue-800">+ Add another</button>
    </div>
);

interface LocationInputProps {
    locationInputRef: React.RefObject<HTMLDivElement>;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus: () => void;
    onClear: () => void;
    showSuggestions: boolean;
    isFetchingSuggestions: boolean;
    suggestions: string[];
    onSuggestionSelect: (suggestion: string) => void;
}
const LocationInput: React.FC<LocationInputProps> = ({
    locationInputRef, value, onChange, onFocus, onClear, showSuggestions,
    isFetchingSuggestions, suggestions, onSuggestionSelect
}) => (
    <div ref={locationInputRef} className="relative">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                id="location"
                name="location"
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                placeholder="e.g., City, State or Full Address"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
            />
            {value && (
                <button type="button" onClick={onClear} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
            )}
        </div>
        {showSuggestions && (isFetchingSuggestions || suggestions.length > 0) && (
            <div className="absolute z-20 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                <ul className="max-h-60 overflow-auto py-1">
                    {isFetchingSuggestions && (
                        <li className="px-3 py-2 text-sm text-gray-500">Searching...</li>
                    )}
                    {!isFetchingSuggestions && suggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onSuggestionSelect(suggestion);
                            }}
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);


const OfferForm: React.FC<OfferFormProps> = ({ onAddOffer, onCancel }) => {
  const [formData, setFormData] = useState<any>(initialFormData);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdditionalDetailsOpen, setIsAdditionalDetailsOpen] = useState(false);
  const locationInputRef = useRef<HTMLDivElement>(null);

  const debouncedLocationQuery = useDebounce(formData.location, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
        if (debouncedLocationQuery.trim().length < 3) {
            setLocationSuggestions([]);
            return;
        }
        setIsFetchingSuggestions(true);
        const newSuggestions = await getLocationSuggestions(debouncedLocationQuery);
        setLocationSuggestions(newSuggestions);
        setIsFetchingSuggestions(false);
    };

    if (showSuggestions) {
        fetchSuggestions();
    }
  }, [debouncedLocationQuery, showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleLocationSelect = useCallback((location: string) => {
    setFormData((prev: any) => ({ ...prev, location }));
    setShowSuggestions(false);
  }, []);

  const handleArrayChange = useCallback((name: 'skills' | 'responsibilities', index: number, value: string) => {
    setFormData((prev: any) => {
        const list = [...prev[name]];
        list[index] = value;
        return { ...prev, [name]: list };
    });
  }, []);

  const addArrayItem = useCallback((name: 'skills' | 'responsibilities') => {
      setFormData((prev: any) => ({ ...prev, [name]: [...prev[name], '']}));
  }, []);

  const removeArrayItem = useCallback((name: 'skills' | 'responsibilities', index: number) => {
      setFormData((prev: any) => {
          if (prev[name].length <= 1) return prev;
          const list = [...prev[name]];
          list.splice(index, 1);
          return { ...prev, [name]: list };
      });
  }, []);

  const handleTypeChange = useCallback((type: OfferType) => {
    setFormData(() => ({ ...initialFormData, type }));
  }, []);

  const handleScanComplete = (scannedData: Partial<Offer & { location?: string }>) => {
    setFormData((prev: any) => {
        const data: any = scannedData;
        const newType = data.type || prev.type;
        return {
            ...initialFormData,
            type: newType,
            jobTitle: data.jobTitle || '',
            company: data.company || '',
            responsibilities: data.responsibilities?.length ? data.responsibilities : [''],
            skills: data.skills?.length ? data.skills : [''],
            salary: data.salary || '',
            salaryType: data.salaryType || SalaryType.PER_MONTH,
            serviceName: data.serviceName || '',
            provider: data.provider || '',
            phone: data.phone || '',
            email: data.email || '',
            productName: data.productName || '',
            brand: data.brand || '',
            price: data.price || '',
            priceType: data.priceType || PriceType.PER_PROJECT,
            condition: data.condition || '',
            summary: data.summary || '',
            location: data.location || '',
            additionalDetails: data.additionalDetails || '',
            expiresAt: data.expiresAt || '',
        };
    });
    setIsScannerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let locationObject;
    if (formData.location) {
        const coords = await geocodeLocation(formData.location);
        if (coords) {
            locationObject = { address: formData.location, ...coords };
        }
    }

    let offerData: Omit<Offer, 'id' | 'scannedAt'>;
    const commonData = {
        summary: formData.summary,
        phone: formData.phone,
        email: formData.email,
        location: locationObject,
        additionalDetails: formData.additionalDetails,
        expiresAt: formData.expiresAt || undefined,
    };

    switch (formData.type) {
      case OfferType.JOB:
        offerData = {
          ...commonData,
          type: OfferType.JOB,
          jobTitle: formData.jobTitle,
          company: formData.company,
          responsibilities: formData.responsibilities.filter(Boolean),
          skills: formData.skills.filter(Boolean),
          salary: formData.salary,
          salaryType: formData.salaryType,
        } as Omit<JobOffer, 'id' | 'scannedAt'>;
        break;
      case OfferType.SERVICE:
        offerData = {
          ...commonData,
          type: OfferType.SERVICE,
          serviceName: formData.serviceName,
          provider: formData.provider,
          price: formData.price,
          priceType: formData.priceType,
        } as Omit<ServiceOffer, 'id' | 'scannedAt'>;
        break;
      case OfferType.PRODUCT:
        offerData = {
          ...commonData,
          type: OfferType.PRODUCT,
          productName: formData.productName,
          brand: formData.brand,
          price: formData.price,
          condition: formData.condition,
        } as Omit<ProductOffer, 'id' | 'scannedAt'>;
        break;
      default:
        setIsSubmitting(false);
        return;
    }
    onAddOffer(offerData);
    setIsSubmitting(false);
  };

  return (
    <>
      {isScannerOpen && <Scanner onScanComplete={handleScanComplete} onClose={() => setIsScannerOpen(false)} />}

      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">New Offer</h1>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
                <XMarkIcon />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Offer Type</label>
            <div className="flex space-x-2">
              <TypeButton type={OfferType.JOB} label="Job" icon={<BriefcaseIcon className="h-5 w-5"/>} currentType={formData.type} onClick={handleTypeChange} />
              <TypeButton type={OfferType.SERVICE} label="Service" icon={<WrenchScrewdriverIcon className="h-5 w-5"/>} currentType={formData.type} onClick={handleTypeChange} />
              <TypeButton type={OfferType.PRODUCT} label="Product" icon={<TagIcon className="h-5 w-5"/>} currentType={formData.type} onClick={handleTypeChange} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-full flex items-center justify-center bg-white text-blue-600 font-bold py-3 px-4 rounded-lg shadow-sm hover:bg-blue-50 border-2 border-blue-500 transition-colors"
          >
            <CameraIcon className="h-6 w-6" />
            <span className="ml-2">Scan to Autofill</span>
          </button>

          {/* Dynamic Form Fields */}
          {formData.type === OfferType.JOB && (
            <div className="space-y-4 p-4 bg-white rounded-lg border">
              <InputField name="jobTitle" label="Job Title" value={formData.jobTitle} onChange={handleInputChange} placeholder="e.g., Software Engineer"/>
              <InputField name="company" label="Company" value={formData.company} onChange={handleInputChange} placeholder="e.g., Acme Corp"/>
              <LocationInput
                locationInputRef={locationInputRef}
                value={formData.location}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                onClear={() => handleInputChange({ target: { name: 'location', value: '' } } as any)}
                showSuggestions={showSuggestions}
                isFetchingSuggestions={isFetchingSuggestions}
                suggestions={locationSuggestions}
                onSuggestionSelect={handleLocationSelect}
              />
              <InputField name="expiresAt" label="Expires At (Optional)" value={formData.expiresAt} onChange={handleInputChange} type="date"/>
              <div className="grid grid-cols-2 gap-4">
                <InputField name="salary" label="Salary (Optional)" value={formData.salary} onChange={handleInputChange} placeholder="e.g., 50"/>
                 <SelectField name="salaryType" label="Salary Type" value={formData.salaryType} onChange={handleInputChange}>
                    <option value={SalaryType.PER_HOUR}>Per Hour</option>
                    <option value={SalaryType.PER_MONTH}>Per Month</option>
                    <option value={SalaryType.PER_PROJECT}>Per Project</option>
                </SelectField>
              </div>
              <InputField name="phone" label="Contact Phone (Optional)" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="e.g., 555-123-4567"/>
              <InputField name="email" label="Contact Email (Optional)" value={formData.email} onChange={handleInputChange} type="email" placeholder="e.g., hr@example.com"/>
              <TextAreaField name="summary" label="Summary" value={formData.summary} onChange={handleInputChange} placeholder="Brief description of the role"/>
              <ArrayField name="responsibilities" label="Responsibilities" values={formData.responsibilities} placeholder="Responsibility" onChange={(index, value) => handleArrayChange('responsibilities', index, value)} onRemove={(index) => removeArrayItem('responsibilities', index)} onAdd={() => addArrayItem('responsibilities')} />
              <ArrayField name="skills" label="Skills" values={formData.skills} placeholder="Skill" onChange={(index, value) => handleArrayChange('skills', index, value)} onRemove={(index) => removeArrayItem('skills', index)} onAdd={() => addArrayItem('skills')} />
            </div>
          )}

          {formData.type === OfferType.SERVICE && (
            <div className="space-y-4 p-4 bg-white rounded-lg border">
              <InputField name="serviceName" label="Service Name" value={formData.serviceName} onChange={handleInputChange} placeholder="e.g., Web Design"/>
              <InputField name="provider" label="Provider (Optional)" value={formData.provider} onChange={handleInputChange} placeholder="e.g., Jane Doe"/>
               <LocationInput
                locationInputRef={locationInputRef}
                value={formData.location}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                onClear={() => handleInputChange({ target: { name: 'location', value: '' } } as any)}
                showSuggestions={showSuggestions}
                isFetchingSuggestions={isFetchingSuggestions}
                suggestions={locationSuggestions}
                onSuggestionSelect={handleLocationSelect}
              />
              <InputField name="expiresAt" label="Expires At (Optional)" value={formData.expiresAt} onChange={handleInputChange} type="date"/>
              <div className="grid grid-cols-2 gap-4">
                <InputField name="price" label="Price (Optional)" value={formData.price} onChange={handleInputChange} placeholder="e.g., 50"/>
                <SelectField name="priceType" label="Price Type" value={formData.priceType} onChange={handleInputChange}>
                    <option value={PriceType.PER_HOUR}>Per Hour</option>
                    <option value={PriceType.PER_PROJECT}>Per Project</option>
                    <option value={PriceType.FIXED}>Fixed Price</option>
                </SelectField>
              </div>
              <InputField name="phone" label="Contact Phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="e.g., 555-123-4567"/>
              <InputField name="email" label="Contact Email" value={formData.email} onChange={handleInputChange} type="email" placeholder="e.g., contact@example.com"/>
              <TextAreaField name="summary" label="Summary" value={formData.summary} onChange={handleInputChange} placeholder="Description of the service"/>
            </div>
          )}

          {formData.type === OfferType.PRODUCT && (
            <div className="space-y-4 p-4 bg-white rounded-lg border">
              <InputField name="productName" label="Product Name" value={formData.productName} onChange={handleInputChange} placeholder="e.g., Wireless Headphones"/>
              <InputField name="brand" label="Brand (Optional)" value={formData.brand} onChange={handleInputChange} placeholder="e.g., Sony"/>
               <LocationInput
                locationInputRef={locationInputRef}
                value={formData.location}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                onClear={() => handleInputChange({ target: { name: 'location', value: '' } } as any)}
                showSuggestions={showSuggestions}
                isFetchingSuggestions={isFetchingSuggestions}
                suggestions={locationSuggestions}
                onSuggestionSelect={handleLocationSelect}
              />
              <InputField name="expiresAt" label="Expires At (Optional)" value={formData.expiresAt} onChange={handleInputChange} type="date"/>
              <InputField name="price" label="Price" value={formData.price} onChange={handleInputChange} placeholder="e.g., $99.99"/>
              <InputField name="condition" label="Condition (Optional)" value={formData.condition} onChange={handleInputChange} placeholder="e.g., New, Used, Refurbished"/>
              <InputField name="phone" label="Contact Phone (Optional)" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="e.g., 555-123-4567"/>
              <InputField name="email" label="Contact Email (Optional)" value={formData.email} onChange={handleInputChange} type="email" placeholder="e.g., contact@example.com"/>
              <TextAreaField name="summary" label="Summary" value={formData.summary} onChange={handleInputChange} placeholder="Description of the product"/>
            </div>
          )}

          <div className="bg-white rounded-lg border">
            <button
                type="button"
                onClick={() => setIsAdditionalDetailsOpen(!isAdditionalDetailsOpen)}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
                <span>Additional Details (Optional)</span>
                {isAdditionalDetailsOpen ? <MinusIcon /> : <PlusIcon />}
            </button>
            {isAdditionalDetailsOpen && (
                <div className="p-4 border-t border-gray-200 animate-fade-in">
                    <TextAreaField
                        name="additionalDetails"
                        label="Requirements, Benefits, Specifics, etc."
                        value={formData.additionalDetails}
                        onChange={handleInputChange}
                        placeholder="Add any other relevant details here..."
                        rows={5}
                    />
                </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-wait"
          >
             {isSubmitting ? <SparklesIcon className="h-6 w-6 animate-pulse"/> : 'Add Offer'}
          </button>
        </form>
      </div>
    </>
  );
};

export default OfferForm;
