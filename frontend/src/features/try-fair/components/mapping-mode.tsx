// import { ChevronDownIcon } from '@/components/ui/icons'
import { ModeIcon } from "@/components/ui/icons/mode-icon";

const MappingMode = () => {
  return (
    <div className="bg-light-gray rounded-[55px] p-1.5 px-3  items-center  flex gap-8 ">
      <div className="gap-2 items-center flex ">
        <ModeIcon />
        <p className="text-dark">Basic</p>
      </div>
      {/* <ChevronDownIcon  className='text-dark size-4' /> */}
    </div>
  );
};

export default MappingMode;
