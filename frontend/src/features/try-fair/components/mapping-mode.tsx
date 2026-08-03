// import { ChevronDownIcon } from '@/components/ui/icons'
import { ModeIcon } from "@/components/ui/icons/mode-icon";
import { ToolTip } from "@/components/ui/tooltip";

const MappingMode = () => {
  return (
    <ToolTip content={"Mapping Mode"}>
      <div className="bg-light-gray cursor-pointer rounded-[55px]  py-2 px-3  items-center  flex gap-8 ">
        <div className="gap-2 items-center flex ">
          <ModeIcon />
          <p className="text-dark">Basic</p>
        </div>
        {/* <ChevronDownIcon  className='text-dark size-4' /> */}
      </div>
    </ToolTip>
  );
};

export default MappingMode;
