import { roundNumber } from "@/utils";

const AccuracyDisplay = ({ accuracy }: { accuracy: number }) => {
  const colors = [
    "bg-[#F33A0C]",
    "bg-[#FF7802]",
    "bg-[#FFCF16]",
    "bg-[#86CE02]",
    "bg-[#00BF11]",
  ];

  const thresholds = [50, 60, 70, 80, 100];

  const activeIndex = thresholds.findIndex((threshold) => accuracy < threshold);
  const activeColor =
    colors[activeIndex === -1 ? colors.length - 1 : activeIndex];

  const arrowPosition = (accuracy / 100) * 100;

  return (
    <div className="flex items-center gap-x-4">
      <span className="text-title-3 font-semibold text-dark">
        {roundNumber(accuracy)}
      </span>
      <div className="relative h-4 w-20">
        <div className="flex h-full">
          {thresholds.map((_, index) => (
            <div
              key={index}
              className={`h-full flex-1 ${index === activeIndex ? activeColor : colors[index]}`}
            />
          ))}
        </div>
        <div
          className="absolute bottom-[-3px] left-0 -translate-x-1/2 rounded-sm border-x-8 border-b-8 border-transparent border-b-dark"
          style={{ left: `${arrowPosition}%` }}
        />
      </div>
    </div>
  );
};

export default AccuracyDisplay;
