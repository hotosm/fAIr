import { FullScreenIcon, YouTubePlayIcon } from "@/components/ui/icons";
import StepHeading from "../../step-heading";
import TrainingAreaMap from "./training-area-map";
import TrainingAreaItem from "./training-area-item";
import Pagination from "@/components/pagination";
import { Button } from "@/components/ui/button";

const trainingAreas = [
  {
    id: 1,
    area: 22,
    lastFetched: null,
  },
  {
    id: 2,
    area: 223,
    lastFetched: new Date(),
  },
  {
    id: 3,
    area: 2212,
    lastFetched: new Date("2024-10-04"),
  },
  {
    id: 4,
    area: 97,
    lastFetched: new Date("2024-10-04"),
  },
  {
    id: 5,
    area: 9,
    lastFetched: new Date("2024-10-04"),
  },
  {
    id: 6,
    area: 72,
    lastFetched: new Date("2023-10-04"),
  },
  {
    id: 7,
    area: 52,
    lastFetched: new Date("2023-10-04"),
  },
  {
    id: 8,
    area: 32,
    lastFetched: new Date("2023-10-04"),
  },
];

const TrainingAreaForm = () => {
  return (
    <div className="h-full">
      <div className="flex justify-between items-centerm mb-10">
        <div className="basis-1/2">
          <StepHeading
            heading="Create Training Area"
            description=" Lorem ipsum dolor sit amet, consectetur adipisicing elit. Id fugit
        ducimus harum debitis deserunt cum quod quam rerum aliquid. Quibusdam
        sequi incidunt quasi delectus laudantium accusamus modi omnis maiores.
        Incidunt!"
          />
        </div>
        <div className="flex flex-col items-end gap-y-4 ">
          <p className="flex items-center gap-x-2">
            <YouTubePlayIcon className="icon-lg" /> Tutorial
          </p>
          <p className="text-dark">Dataset ID: 222</p>
        </div>
      </div>
      <div className=" h-screen w-full grid grid-cols-5 border-8 border-off-white">
        <TrainingAreaMap />
        <div className="col-span-1 w-full h-full border-l-8 border-off-white p-4 justify-between flex flex-col">
          <div className="flex flex-col gap-y-2 w-full">
            <p className="text-body-1">Open Aerial Map</p>
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col gap-y-2">
                <p className="text-body-3">San Jose Mission 10C Flight 1</p>
                <div className="flex items-center justify-between w-full">
                  <p className="text-body-4">Max zoom: 22</p>
                  <p className="text-body-4">Min zoom: 12</p>
                </div>
              </div>
              <div className="bg-off-white p-2 rounded-md">
                <FullScreenIcon className="icon-lg" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-y-5">
            <p className="text-body-1">
              Training Area{" "}
              <span className="text-white bg-primary text-body-1 rounded-xl px-3 py-1">
                {trainingAreas.length}
              </span>
            </p>
            <div>
              <Pagination
                offset={0}
                disableNextPage={false}
                disablePrevPage={false}
                pageLimit={100}
                totalLength={30}
              />
            </div>
            <div className="flex flex-col gap-y-5 max-h-[calc(100%-30%)] overflow-scroll ">
              {trainingAreas.map((ta, id) => (
                <TrainingAreaItem {...ta} key={`training-area-${id}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-x-6 w-full">
            <Button variant="primary">
              <div className="flex items-center gap-x-4">
                <p>Draw</p>
                <div className="w-4 h-4 border-2 rounded-md border-white"></div>
              </div>
            </Button>
            <Button variant="dark">
              <div className="flex items-center gap-x-4">
                <p>upload</p>
                <div className="w-4 h-4">
                  <svg
                    width="16"
                    height="17"
                    viewBox="0 0 16 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.05273 0C3.94816 0 3.05273 0.895431 3.05273 2V7.20703C3.37502 7.11588 3.70932 7.05337 4.05273 7.02242V2C4.05273 1.44772 4.50045 1 5.05273 1H9.05273V4.5C9.05273 5.32843 9.72431 6 10.5527 6H14.0527V14C14.0527 14.5523 13.605 15 13.0527 15H9.45302C9.27013 15.3578 9.0492 15.6929 8.79557 16H13.0527C14.1573 16 15.0527 15.1046 15.0527 14V5.41421C15.0527 5.01639 14.8947 4.63486 14.6134 4.35355L10.6992 0.43934C10.4179 0.158035 10.0363 0 9.63852 0H5.05273ZM13.8456 5H10.5527C10.2766 5 10.0527 4.77614 10.0527 4.5V1.20711L13.8456 5ZM4.55273 17C7.03802 17 9.05273 14.9853 9.05273 12.5C9.05273 10.0147 7.03802 8 4.55273 8C2.06745 8 0.0527344 10.0147 0.0527344 12.5C0.0527344 14.9853 2.06745 17 4.55273 17ZM6.90626 12.1465C7.10152 12.3418 7.10152 12.6583 6.90626 12.8536C6.711 13.0489 6.39442 13.0489 6.19915 12.8536L5.05271 11.7072L5.05271 14.5001C5.05271 14.7762 4.82885 15.0001 4.55271 15.0001C4.27656 15.0001 4.05271 14.7762 4.05271 14.5001L4.05271 11.7072L2.90626 12.8536C2.711 13.0489 2.39442 13.0489 2.19915 12.8536C2.00389 12.6583 2.00389 12.3418 2.19915 12.1465L4.19915 10.1465C4.24709 10.0986 4.30234 10.0624 4.36132 10.038C4.4194 10.0139 4.48301 10.0005 4.54971 10.0001L4.55271 10.0001L4.55571 10.0001C4.62241 10.0005 4.68602 10.0139 4.7441 10.038C4.8022 10.062 4.85669 10.0975 4.90413 10.1444L4.90666 10.1469L6.90626 12.1465Z"
                      fill="white"
                    />
                  </svg>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingAreaForm;


