import { TCSSWithVars } from "@/types";
import { Avatar as SlAvatar } from "@hotosm/ui/components/react/index";

export const Avatar = ({
  imageUrl,
  label,
  size,
  className,
}: {
  imageUrl: string;
  label: string;
  size: string;
  className?: string;
}) => {
  return (
    <SlAvatar
      image={imageUrl}
      label={label}
      loading="lazy"
      initials={label.charAt(0)}
      className={className}
      style={{ "--size": size } as TCSSWithVars}
    />
  );
};
