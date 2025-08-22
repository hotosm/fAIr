export const OfflinePredictionsListSkeleton = () => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(299px,1fr))] gap-8">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="h-48 w-full animate-pulse rounded-lg bg-light-gray"
        ></div>
      ))}
    </div>
  );
};
