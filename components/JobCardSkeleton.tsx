import React from 'react';
import Skeleton from './Skeleton';

const JobCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 p-5 space-y-4">
            {/* Title/Subtitle Skeleton */}
            <div className="flex justify-between items-start">
                <div className="space-y-2 w-3/4 pr-4">
                    <Skeleton className="h-5 w-full rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                </div>
                <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>

            {/* Applicant Indicator Skeleton */}
            <div className="flex items-center">
                <div className="flex -space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full border-2 border-white bg-gray-300" />
                    <Skeleton className="h-8 w-8 rounded-full border-2 border-white bg-gray-300" />
                </div>
                <Skeleton className="ml-2 h-4 w-2/5 rounded" />
            </div>

            {/* Summary Skeleton */}
            <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-10/12 rounded" />
            </div>

            {/* Tags/Price Skeleton */}
            <div className="flex justify-between items-end pt-2">
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-7 w-20 rounded" />
            </div>
            
            {/* Show More Button Skeleton */}
            <div className="border-t border-gray-200 bg-gray-50 -m-5 mt-4 py-3 text-center relative top-4">
                 <Skeleton className="h-5 w-1/3 mx-auto rounded" />
            </div>
        </div>
    );
};

export default JobCardSkeleton;