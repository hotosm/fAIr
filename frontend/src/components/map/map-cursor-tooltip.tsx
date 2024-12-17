export const MapCursorToolTip = ({
  color = "bg-black",
  tooltipVisible = true,
  tooltipPosition,
  children,
}: {
  color?: string;
  tooltipPosition: Record<string, number>;
  tooltipVisible?: boolean;
  children: React.ReactNode;
}) => {
  if (!tooltipVisible) return null;

  return (
    <div
      className={`absolute w-50 text-white px-2 pointer-events-none text-nowrap rounded-lg shadow-2xl flex flex-col ${color}`}
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
      }}
    >
      {children}
    </div>
  );
};
