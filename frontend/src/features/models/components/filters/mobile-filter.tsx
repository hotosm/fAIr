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
        "flex md:hidden  border border-gray-border p-2 items-center justify-center text-dark cursor-pointer"
      }
      onClick={openMobileFilterModal}
    >
      {<FilterIcon className="icon-lg" />}
    </div>
  );
};

export default MobileFilter;
