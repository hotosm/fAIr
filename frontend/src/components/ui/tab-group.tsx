import { useEffect, useRef } from "react";

export const TabGroup = ({
  tabs,
  activeTab,
  setActiveTab,
  className,
}: {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  className?: string;
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLButtonElement &&
        tabRefs.current.includes(event.target)
      ) {
        const currentIndex = tabs.indexOf(activeTab);
        if (event.key === "ArrowRight") {
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % tabs.length;
          setActiveTab(tabs[nextIndex]);
          tabRefs.current[nextIndex]?.focus();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          setActiveTab(tabs[prevIndex]);
          tabRefs.current[prevIndex]?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTab, setActiveTab, tabs]);

  return (
    <div
      className={`flex gap-x-4 border border-gray-border  bg-gray-100 overflow-x-auto font-medium  w-fit rounded-[4px] p-0.5 ${className}`}
      role="tablist"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab}
          ref={(el) => {
            tabRefs.current[index] = el;
          }}
          className={`md:px-4 px-2 py-1  text-nowrap text-body-3 md:text-base transition-colors duration-150 rounded-[4px] ${
            activeTab === tab ? "bg-white shadow-sm text-black" : "text-grey"
          }`}
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={`tabpanel-${tab}`}
          id={`tab-${tab}`}
          tabIndex={activeTab === tab ? 0 : -1}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
