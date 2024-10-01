import { Button } from "@/components/ui/button";
import { APP_CONTENT } from "@/utils";

const PageUnderConstruction = () => {
  return (
    <section className="min-h-[80vh] flex flex-col mt-20 items-center justify-around">
      <div>
        <p className="text-body-1 lg:text-title-1 font-semibold text-dark text-center">
          {APP_CONTENT.construction.message}
        </p>
      </div>

      <Button
        variant="primary"
        onClick={() => window.location.assign(window.location.origin)}
        className="max-w-[300px]"
      >
        {APP_CONTENT.construction.button}
      </Button>
    </section>
  );
};

export default PageUnderConstruction;
