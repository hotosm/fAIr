export const ModelInfoSkeleton = () => {
  return (
    <div className="my-12 flex flex-col gap-y-20">
      <section className="flex flex-col gap-y-8 animate-pulse">
        <div className="flex flex-col gap-y-4">
          <div className="inline-flex flex-col gap-y-2">
            <div className="h-4 md:w-32 bg-light-gray animated-pulse " />
            <div className="flex items-center justify-between">
              <div className="h-8 w-64 bg-light-gray animated-pulse " />
              <div className="h-10 md:w-36 bg-light-gray animated-pulse " />
            </div>
          </div>
        </div>

        <div className="md:self-end flex items-center gap-x-2">
          <div className="h-4 w-40 bg-light-gray animated-pulse " />
        </div>

        <div className="h-[1px] bg-light-gray animated-pulse w-full" />

        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="flex flex-col gap-y-10">
            <div className="h-4 w-32 bg-light-gray animated-pulse " />
            <div className="h-4 w-48 bg-light-gray animated-pulse " />
            <div className="h-4 w-48 bg-light-gray animated-pulse " />
          </div>
          <div className="flex flex-col gap-y-4 justify-between">
            <div className="h-4 w-48 bg-light-gray animated-pulse " />
            <div className="h-10 w-44 bg-light-gray animated-pulse " />
          </div>
          <div className="flex flex-col md:items-end gap-y-4 justify-between">
            <div className="h-4 w-32 bg-light-gray animated-pulse " />
            <div className="h-10 w-36 bg-light-gray animated-pulse " />
          </div>
        </div>
      </section>
    </div>
  );
};
