export const DatasetListSkeleton = () => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(299px,1fr))] gap-8">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="w-full h-48 bg-light-gray rounded-lg animate-pulse"
        ></div>
      ))}
    </div>
  );
};
