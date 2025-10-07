import React from 'react';

export const Skeleton = ({ className = '', width, height }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Skeleton height="200px" className="w-full" />
      <div className="p-4">
        <Skeleton height="24px" className="w-2/3 mb-2" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

export default Skeleton;