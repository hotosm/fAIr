import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import styles from "./fair-process.module.css";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { BotIcon, FeedbackIcon, PredictionsIcon } from "@/components/ui/icons";
import { IconProps } from "@/types";
import { DesktopFlowIcon } from "@/components/ui/icons";
import { APP_CONTENT } from "@/utils/content";

/**
 * The delay in seconds before switching to the next step. This can be adjust accordingly.
 * The lower it is, the longer time it takes before the beam animates from the origin node to the destination node.
 */
const AUTOSCROLL_DELAY: number = 2500;

type TSteps = {
  title: string;
  paragraph: string;
  icon: React.FC<IconProps>;
};

const steps: TSteps[] = [
  {
    title: APP_CONTENT.homepage.fairProcess.stepOne.title,
    paragraph: APP_CONTENT.homepage.fairProcess.stepOne.description,
    icon: BotIcon,
  },
  {
    title: APP_CONTENT.homepage.fairProcess.stepTwo.title,
    paragraph: APP_CONTENT.homepage.fairProcess.stepTwo.description,
    icon: PredictionsIcon,
  },
  {
    title: APP_CONTENT.homepage.fairProcess.stepThree.title,
    paragraph: APP_CONTENT.homepage.fairProcess.stepThree.description,
    icon: FeedbackIcon,
  },
  {
    title: APP_CONTENT.homepage.fairProcess.stepFour.title,
    paragraph: APP_CONTENT.homepage.fairProcess.stepFour.description,
    icon: DesktopFlowIcon,
  },
];

const TheFAIRProcess = ({
  disableStyle = false,
}: {
  disableStyle?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<React.RefObject<HTMLDivElement>>>(
    steps.map(() => React.createRef<HTMLDivElement>()),
  );

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showBeam, setShowBeam] = useState<boolean>(false);
  const handleClick = (index: number) => {
    setActiveIndex(index);
  };

  const stepsLength = useMemo(() => steps.length, [steps]);

  const checkDirection = useCallback(() => {
    if (activeIndex >= 0 && activeIndex < stepsLength - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      setActiveIndex(0);
    }
  }, [activeIndex, stepsLength]);

  useEffect(() => {
    setShowBeam(false);
    const interval = setInterval(() => {
      setShowBeam(true);
      checkDirection();
    }, AUTOSCROLL_DELAY);
    return () => clearInterval(interval);
  }, [checkDirection]);

  const renderAnimatedBeam = useMemo(() => {
    // When it gets to the last item, don't show this beam
    if (activeIndex + 1 === steps.length && !showBeam) return;
    // when it gets to the first item delay a bit before showing the beam
    return (
      <AnimatedBeam
        delay={3}
        duration={2.5}
        containerRef={containerRef}
        fromRef={itemRefs.current[activeIndex]}
        toRef={itemRefs.current[(activeIndex + 1) % steps.length]}
      />
    );
  }, [steps.length, activeIndex]);

  return (
    <section
      className={disableStyle ? "relative" : styles.fairProcess}
      ref={containerRef}
    >
      <h2 className="text-title-2 lg:text-4xl font-semibold mb-[73px]">
        {APP_CONTENT.homepage.fairProcess.title}
      </h2>
      <ol className="flex flex-col md:flex-row justify-between items-start  w-full">
        {steps.map((step, id) => (
          <li
            key={`fair-process-${id}`}
            className="cursor-pointer flex flex-row md:flex-col"
            onClick={() => handleClick(id)}
          >
            <div className="flex flex-col md:flex-row items-center">
              <div
                className={`${activeIndex === id ? "bg-primary" : ""} p-1 z-10 shadow-xl flex items-center justify-center transition-all w-11 h-11 md:w-16 md:h-16 rounded-full`}
                ref={itemRefs.current[id]}
              >
                <step.icon
                  className={`w-7 h-7 md:w-8 md:h-8 p-1 transition-all ${activeIndex !== id ? "text-gray-disabled" : "text-white scale-125"}`}
                />
              </div>
              {/* Disable for the last timeline on web. */}
              {id !== steps.length - 1 && (
                <div
                  className="hidden md:inline-flex w-full h-[2px] bg-[#E4E4E4]"
                  style={{ width: `calc(100% - 4rem)` }}
                ></div>
              )}
              {/* Disable for the last timeline on mobile. */}
              {id !== steps.length - 1 && (
                <div
                  className="md:hidden inline-flex w-[2px] bg-[#E4E4E4]"
                  style={{ height: `calc(100% - 2.5rem)` }}
                ></div>
              )}
            </div>

            <div className="inline-flex flex-col gap-y-4 pe-8 md:mt-[34px] ml-6 md:ml-0">
              <h3
                className={`text-body-1 md:text-2xl md:mt-4 font-bold transition-all  ${activeIndex !== id ? "text-gray-disabled" : "text-dark"}`}
              >
                {step.title}
              </h3>
              <p
                className={`text-body-2base md:text-body-2 mb-[68px] md:mb-0 md:mt-2 ${activeIndex !== id ? "text-gray" : "text-gray-600 "}`}
              >
                {step.paragraph}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {renderAnimatedBeam}
    </section>
  );
};

export default TheFAIRProcess;
