export const UpdateCardSkeleton = () => {
  return (
    <div className="update-card relative overflow-hidden animate-pulse">
      {/* Thumbnail area */}
      <div className="absolute inset-0 h-full w-full bg-light-gray animated-pulse" />

      {/* Play icon placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-light-gray animated-pulse" />
      </div>

      {/* Bottom gradient content area */}
      <div className="absolute flex-col bottom-0 left-0 right-0 h-[120px] md:h-[165px] bg-gradient-to-b from-[rgba(44,48,56,0)] to-[#2C3038] backdrop-blur-[2px] p-3 md:p-4 flex justify-end gap-y-3">
        {/* Title lines */}
        <div className="h-5 w-3/4 bg-light-gray animated-pulse rounded-sm" />
        <div className="h-5 w-1/2 bg-light-gray animated-pulse rounded-sm" />

        {/* Date */}
        <div className="h-4 w-24 bg-light-gray animated-pulse rounded-sm" />
      </div>
    </div>
  );
};
