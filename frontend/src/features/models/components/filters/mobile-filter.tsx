import { FilterIcon } from "@/components/ui/icons";

const MobileFilter = ({
  openMobileFilterModal,
}: {
  openMobileFilterModal: () => void;
  isMobile?: boolean;
}) => {
  return (
    <div
      role="button"
      className={
        "flex cursor-pointer  items-center justify-center border border-gray-border p-2 text-dark md:hidden"
      }
      onClick={openMobileFilterModal}
    >
      {<FilterIcon className="icon-lg" />}
    </div>
  );
};

export default MobileFilter;
