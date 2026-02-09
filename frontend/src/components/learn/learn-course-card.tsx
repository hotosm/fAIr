import { LEARN_PAGE_CONTENT } from "@/constants";
import { TCourse } from "@/types";
import ContentIcon from "../ui/icons/content-icon";
import { DurationIcon } from "../ui/icons/duration-icon";
import { GlobeIcon } from "../ui/icons/globe-icon";
import { Image } from "../ui/image";

export const CourseCard = ({ course }: { course: TCourse }) => {
  return (
    <div className="col-span-2 p-3 border border-light-gray rounded-[2px] flex relative space-y-6 flex-col">
      <div className="w-full relative  h-full">
        <div className="bg-[#2C3038] opacity-[12%] absolute top-0 bottom-0 left-0 right-0" />
        <Image
          src={course.courseImage}
          alt={course.title}
          className="w-full h-full"
        />
      </div>

      {!course.available && (
        <div className=" bg-primary px-4 rounded-3xl py-2 top-0 text-white right-4 absolute">
          <span className="text-white font-semibold">
            {LEARN_PAGE_CONTENT.comingSoonText}
          </span>
        </div>
      )}
      <div>
        <h2 className="text-body-1 lg:text-title-3 font-bold text-dark">
          {course.title}
        </h2>
      </div>

      <div className="flex flex-col space-y-3">
        <div className="flex items-center gap-2">
          <ContentIcon />
          <p className="text-body-2base lg:text-body-2 text-grey">
            {course.courseLength}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GlobeIcon />
          <p className="text-body-2base lg:text-body-2 text-grey">
            {course.language}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DurationIcon />
          <p className="text-body-2base lg:text-body-2 text-grey">
            {course.duration}
          </p>
        </div>
      </div>
    </div>
  );
};
