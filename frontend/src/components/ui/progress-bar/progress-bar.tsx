import { SlProgressBar } from "@shoelace-style/shoelace/dist/react";

export const ProgressBar = ({ value }: { value: number }) => {
  return (
    <div className="flex items-center justify-between w-full">
      <SlProgressBar
        className="w-[90%]"
        value={value}
        label="File upload progress"
        style={{ "--height": "6px" }}
      />
      <p className="text-xs text-gray font-semibold">{value}%</p>
    </div>
  );
};
