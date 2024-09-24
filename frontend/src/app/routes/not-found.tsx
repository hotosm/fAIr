import { Button } from "@/components/ui/button";
import { APPLICATION_ROUTES } from "@/utils/constants";
import { APP_CONTENT } from "@/utils/content";
import { useLocation, useNavigate } from "react-router-dom"


export const PageNotFound = () => {
    const location = useLocation();
    const modelNotFound = location.state?.from.includes(APPLICATION_ROUTES.MODELS);
    const trainingDatasetNotFound = location.state?.from.includes(APPLICATION_ROUTES.TRAINING_DATASETS);
    const navigate = useNavigate();

    return (
        <section className="min-h-[80vh] flex flex-col mt-20 items-center justify-around lg:justify-center">
            <div>
                <p className="text-[20px] lg:text-[38px] font-semibold text-dark text-center">
                    {APP_CONTENT.pageNotFound.messages.constant} {modelNotFound ? APP_CONTENT.pageNotFound.messages.modelNotFound : trainingDatasetNotFound ? APP_CONTENT.pageNotFound.messages.trainingDatasetNotFound : APP_CONTENT.pageNotFound.messages.pageNotFound}
                </p>
            </div>
            <h1 className="w-[200px] text-[200px] lg:w-[450px] lg:text-[450px] flex items-center justify-center font-semibold text-light-gray relative">
                404
                <span className="absolute flex items-center w-full justify-center h-full">
                    {/* Icon */}
                    <svg viewBox="0 0 408 193" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M40.1829 174.379L58.5117 48.149L121.653 12.8012L120.508 120.275L40.1829 174.379Z" fill="#D33132" />
                        <path d="M284.424 135.982L359.272 192.915L359.971 77.8621L311.582 37.7324L284.424 135.982Z" fill="#D63F40" />
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M172.899 8.42335L185.592 19.9675L178.544 39.252L189.796 43.6536L183.449 66.8856L198.822 78.1181L188.954 97.903L206.911 104.023L203.309 117.891L120.514 120.295L121.659 12.82L172.899 8.42335Z" fill="#D63F40" />
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M212.815 126.458L212.764 126.374L224.193 116.472L212.87 101.251L232.215 90.5464L225.918 72.5779L244.318 57.0381L237.543 47.0331L254.282 35.1424L251.511 23.3072L311.585 37.7313L284.438 135.973L212.815 126.458Z" fill="#D33132" />
                    </svg>
                </span>
            </h1>
            <Button variant="primary" onClick={() => {
                navigate(modelNotFound ? APPLICATION_ROUTES.MODELS : trainingDatasetNotFound ? APPLICATION_ROUTES.TRAINING_DATASETS : APPLICATION_ROUTES.HOMEPAGE)
            }}
                className="max-w-[300px]"
            >
                {modelNotFound ? APP_CONTENT.pageNotFound.actionButtons.modelNotFound : trainingDatasetNotFound ? APP_CONTENT.pageNotFound.actionButtons.trainingDatasetNotFound : APP_CONTENT.pageNotFound.actionButtons.pageNotFound}
            </Button>
        </section>
    )
}