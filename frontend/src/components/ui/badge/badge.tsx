import { TBadgeVariants } from "@/types";
import { cn } from "@/utils";

type BadgeProps = {
  variant: TBadgeVariants;
  children: React.ReactNode;
  rounded?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  rounded = false,
  onClick,
  className,
}) => {
  const variants = {
    green: "text-[#198155] bg-[#ECFCE5]",
    blue: "text-[0065D0] bg-[#E2F7FF]",
    red: "text-[#D3180C] bg-[#FFE5E5]",
    yellow: "text-[#C69102] bg-[#FFF8E6]",
    default: "bg-[#F0EFEF] text-dark",
  };
  return (
    <button
      className={cn(
        `h-8 w-fit ${variants[variant]} ${rounded ? "rounded-full p-2" : "rounded-2xl py-1 px-3 "} ${className}`,
      )}
      onClick={onClick}
    >
      <span className="font-medium capitalize text-body-3 flex items-center justify-center">
        {children}
      </span>
    </button>
  );
};

export default Badge;
