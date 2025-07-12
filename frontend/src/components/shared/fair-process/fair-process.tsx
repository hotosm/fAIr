import styles from "./fair-process.module.css";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { BotIcon, FeedbackIcon, PredictionsIcon } from "@/components/ui/icons";
import { DesktopFlowIcon } from "@/components/ui/icons";
import { IconProps } from "@/types";
import { SHARED_CONTENT } from "@/constants";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

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
    title: SHARED_CONTENT.homepage.fairProcess.stepOne.title,
    paragraph: SHARED_CONTENT.homepage.fairProcess.stepOne.description,
    icon: BotIcon,
  },
  {
    title: SHARED_CONTENT.homepage.fairProcess.stepTwo.title,
    paragraph: SHARED_CONTENT.homepage.fairProcess.stepTwo.description,
    icon: PredictionsIcon,
  },
  {
    title: SHARED_CONTENT.homepage.fairProcess.stepThree.title,
    paragraph: SHARED_CONTENT.homepage.fairProcess.stepThree.description,
    icon: FeedbackIcon,
  },
  {
    title: SHARED_CONTENT.homepage.fairProcess.stepFour.title,
    paragraph: SHARED_CONTENT.homepage.fairProcess.stepFour.description,
    icon: DesktopFlowIcon,
  },
];

export const TheFAIRProcess = ({
  disableStyle = false,
}: {
  disableStyle?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<React.RefObject<HTMLDivElement | null>>>(
    steps.map(() => React.createRef<HTMLDivElement>())
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
      <h2 className="mb-[73px] text-title-2 font-semibold lg:text-4xl">
        {SHARED_CONTENT.homepage.fairProcess.title}
      </h2>
      <ol className="flex w-full flex-col items-start justify-between  md:flex-row">
        {steps.map((step, id) => (
          <li
            key={`fair-process-${id}`}
            className="flex cursor-pointer flex-row md:flex-col"
            onClick={() => handleClick(id)}
          >
            <div className="flex flex-col items-center md:flex-row">
              <div
                className={`${activeIndex === id ? "bg-primary" : ""} z-10 flex size-11 items-center justify-center rounded-full p-1 shadow-xl transition-all md:size-16`}
                ref={itemRefs.current[id]}
              >
                <step.icon
                  className={`size-7 p-1 transition-all md:size-8 ${activeIndex !== id ? "text-grey-disabled" : "scale-125 text-white"}`}
                />
              </div>
              {/* Disable for the last timeline on web. */}
              {id !== steps.length - 1 && (
                <div
                  className="hidden h-[2px] w-full bg-[#E4E4E4] md:inline-flex"
                  style={{ width: `calc(100% - 4rem)` }}
                ></div>
              )}
              {/* Disable for the last timeline on mobile. */}
              {id !== steps.length - 1 && (
                <div
                  className="inline-flex w-[2px] bg-[#E4E4E4] md:hidden"
                  style={{ height: `calc(100% - 2.5rem)` }}
                ></div>
              )}
            </div>

            <div className="ml-6 inline-flex flex-col gap-y-4 pe-8 md:ml-0 md:mt-[34px]">
              <h3
                className={`text-body-1 font-bold transition-all md:mt-4 md:text-2xl  ${activeIndex !== id ? "text-grey-disabled" : "text-dark"}`}
              >
                {step.title}
              </h3>
              <p
                className={`mb-[68px] text-body-2base md:mb-0 md:mt-2 md:text-body-2 ${activeIndex !== id ? "text-grey" : "text-grey-600 "}`}
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
