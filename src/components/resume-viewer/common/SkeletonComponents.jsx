// Skeleton components for loading states

export const TextSkeleton = ({ className = "", width = "w-full" }) => (
  <div className={`animate-pulse ${className}`}>
    <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${width}`}></div>
  </div>
);

export const ParagraphSkeleton = ({ lines = 3 }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
          i === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </div>
);

export const BadgeSkeleton = ({ count = 5 }) => (
  <div className="flex flex-wrap gap-2 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div 
        key={i} 
        className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"
      />
    ))}
  </div>
);

export const CardSkeleton = ({ showBullets = false }) => (
  <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-3 animate-pulse">
    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1"></div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
    {showBullets && (
      <div className="space-y-1 mt-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
      </div>
    )}
  </div>
);

export const ProfileLinkSkeleton = () => (
  <div className="flex items-center gap-2 animate-pulse">
    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
  </div>
);

// Section-specific skeleton components
export const PersonalInfoSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {/* Name */}
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Name:</span>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
    </div>
    
    {/* Email */}
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56"></div>
    </div>
    
    {/* Phone */}
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
    </div>
    
    {/* Professional Links */}
    <div className="pt-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Professional Links</p>
      <div className="space-y-2 ml-4">
        <ProfileLinkSkeleton />
        <ProfileLinkSkeleton />
        <ProfileLinkSkeleton />
      </div>
    </div>
  </div>
);

export const SkillsSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {['Technical Skills', 'Soft Skills', 'Tools & Software'].map((label, i) => (
      <div key={i}>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</p>
        <BadgeSkeleton count={i === 0 ? 8 : i === 1 ? 6 : 5} />
      </div>
    ))}
  </div>
);

export const ExperienceSkeleton = () => (
  <div className="space-y-3">
    {[1, 2].map((i) => (
      <CardSkeleton key={i} showBullets={true} />
    ))}
  </div>
);

export const EducationSkeleton = () => (
  <div className="space-y-3">
    {[1, 2].map((i) => (
      <CardSkeleton key={i} showBullets={false} />
    ))}
  </div>
);