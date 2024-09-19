import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import styles from './fair-process.module.css';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { BotIcon, FeedbackIcon, PredictionsIcon } from '@/components/ui/icons';
import { IconProps } from '@/utils/types';
import DesktopFlowIcon from '@/components/ui/icons/desktop-flow-icon';


// the delay in seconds before switching to the next step

const AUTOSCROLL_DELAY: number = 4500;


type TSteps = {
    title: string;
    paragraph: string;
    icon: React.FC<IconProps>

}
const steps: TSteps[] = [
    {
        title: 'Create Model',
        paragraph: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
        icon: BotIcon
    },
    {
        title: 'Run Prediction',
        paragraph: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
        icon: PredictionsIcon

    },
    {
        title: 'Feedback',
        paragraph: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
        icon: FeedbackIcon
    },
    {
        title: 'Use Data',
        paragraph: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
        icon: DesktopFlowIcon
    },
];

const TheFAIRProcess = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs: React.RefObject<HTMLDivElement>[] = steps.map(() => useRef(null));

    const [activeIndex, setActiveIndex] = useState(0);

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
        const interval = setInterval(() => {
            checkDirection();
        }, AUTOSCROLL_DELAY);
        return () => clearInterval(interval);
    }, [checkDirection]);

    const renderAnimatedBeam = useMemo(() => {
        // When it gets to the last item, don't show this beam
        if (activeIndex + 1 === steps.length) return

        // when it gets to the first item delay a bit before showing the beam
        return (
            <AnimatedBeam
                delay={activeIndex === 0 ? 2 : 0}
                duration={5}
                containerRef={containerRef}
                fromRef={itemRefs[activeIndex]}
                toRef={itemRefs[(activeIndex + 1) % steps.length]}
            />
        )
    }, [steps.length, activeIndex])

    return (
        <section>
            <div className={styles.fairProcess} ref={containerRef}  >
                <h2 className="text-4xl font-semibold mb-[73px] font-archivo-condensed">The fAIr process</h2>
                <div className="flex justify-between items-start gap-x-[73px] relative">
                    {steps.map((step, id) => (
                        <div key={`fair-process-${id}`} className="flex flex-col gap-y-[34px] cursor-pointer" onClick={() => handleClick(id)}>
                            <div
                                className={`transition-all p-1 w-[68px] h-[68px] rounded-full self-start shadow-xl items-center flex justify-center ${activeIndex === id ? 'bg-primary' : ''}`}
                                ref={itemRefs[id]}
                            >
                                <step.icon className={`w-8 h-8 transition-all ${activeIndex !== id ? 'text-[#A6A6A6]' : 'text-white scale-125'}`} />
                            </div>

                            <div className="inline-flex flex-col gap-y-4">
                                <h3 className={`text-2xl mt-4 font-bold transition-all  ${activeIndex !== id ? 'text-[#A6A6A6]' : 'text-dark'}`}>{step.title}</h3>
                                <p className={`mt-2 ${activeIndex !== id ? 'text-gray' : 'text-gray-600 '}`}>{step.paragraph}</p>
                            </div>
                        </div>
                    ))}
                    {/* <span className='absolute left-0 top-8 transform-gpu h-0.5 bg-[#E4E4E4] w-full'></span> */}
                </div>
                {renderAnimatedBeam}
            </div>

        </section>
    );
};

export default TheFAIRProcess;

