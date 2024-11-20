import { Button } from "@/components/ui/button";
import { APP_CONTENT } from "@/utils";
import { NavBar } from "@/components/ui/navbar";

const MainErrorFallback = () => {
  return (
    <>
      <NavBar />
      <section className="min-h-[80vh] flex flex-col mt-20 items-center justify-around">
        <div>
          <p className="text-body-1 lg:text-title-1 font-semibold text-dark text-center">
            {APP_CONTENT.errorBoundary.title}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => window.location.reload()}
          className="max-w-80"
        >
          {APP_CONTENT.errorBoundary.button}
        </Button>
      </section>
    </>
  );
};

export default MainErrorFallback;
