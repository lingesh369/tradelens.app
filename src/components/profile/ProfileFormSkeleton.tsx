
import React from 'react';

const ProfileFormSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-2">
        <div className="h-6 w-44 bg-muted rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
          <div className="h-10 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
          <div className="h-10 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
        <div className="h-10 bg-muted rounded animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
        <div className="h-10 bg-muted rounded animate-pulse"></div>
      </div>
    </div>
  );
};

export default ProfileFormSkeleton;
