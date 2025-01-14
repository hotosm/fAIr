import { Button } from "@/components/ui/button";
import { SHARED_CONTENT } from "@/constants";

export const PageUnderConstruction = () => {
  return (
    <section className="min-h-[80vh] flex flex-col mt-20 items-center justify-around">
      <div>
        <p className="text-body-1 lg:text-title-1 font-semibold text-dark text-center">
          {SHARED_CONTENT.construction.message}
        </p>
      </div>

      <Button
        variant="primary"
        onClick={() => window.location.assign(window.location.origin)}
        className="max-w-80"
      >
        {SHARED_CONTENT.construction.button}
      </Button>
    </section>
  );
};
