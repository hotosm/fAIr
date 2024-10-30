import {
  FullScreenIcon,
  UploadIcon,
  YouTubePlayIcon,
} from "@/components/ui/icons";
import { StepHeading } from "@/features/model-creation/components/";
import TrainingAreaMap from "./training-area-map";
import TrainingAreaItem from "./training-area-item";
import Pagination from "@/components/pagination";
import { Button, ButtonWithIcon } from "@/components/ui/button";

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
    <div className="h-full w-full">
      <div className="flex justify-between items-center mb-10">
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
      <div className="w-full grid grid-cols-5 grid-rows-1 border-8 border-off-white h-screen max-h-screen">
        <div className="w-full h-full col-span-4">
          <TrainingAreaMap />
        </div>
        <div className="col-span-1 grid  grid-cols-1 w-full h-full border-l-8 border-off-white justify-between gap-y-6">
          <div className="flex flex-col gap-y-2 w-full border-b-8 border-off-white p-4">
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
          <div className="flex flex-col gap-y-4 h-full justify-between  p-4 ">
            <div className="flex flex-col gap-y-4">
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
            </div>

            <div>
              {trainingAreas.length === 0 ? (
                <div className="flex items-center justify-center flex-col gap-y-10 text-center">
                  <svg
                    width="47"
                    height="51"
                    viewBox="0 0 47 51"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.742188"
                      width="45.5156"
                      height="50.1807"
                      rx="4"
                      fill="#F7F9FA"
                    />
                    <rect
                      x="6.1875"
                      y="6.89551"
                      width="34.625"
                      height="15.6638"
                      rx="3"
                      fill="#E3E5E6"
                    />
                    <rect
                      x="6.1875"
                      y="27.6211"
                      width="34.625"
                      height="15.6638"
                      rx="3"
                      fill="#E3E5E6"
                    />
                  </svg>
                  <p className="text-gray">
                    No Training Area (TA) added yet. Start by drawing a TA on
                    the map or upload a TA from your device.
                  </p>
                </div>
              ) : (
                <div className="max-h-[80%] overflow-y-auto flex flex-col gap-y-4">
                  {trainingAreas.map((ta, id) => (
                    <TrainingAreaItem {...ta} key={`training-area-${id}`} />
                  ))}
                </div>
              )}
            </div>
            <div
              className={`flex ${trainingAreas.length === 0 ? "flex-col gap-y-6 " : " items-center justify-between gap-x-6 "} w-full"`}
            >
              <Button variant="primary">
                <div className="flex items-center gap-x-4">
                  <p>Draw</p>
                  <div className="w-4 h-4 border-2 rounded-md border-white"></div>
                </div>
              </Button>
              <ButtonWithIcon
                label="upload"
                variant="dark"
                suffixIcon={UploadIcon}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingAreaForm;
