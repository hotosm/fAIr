import { Button } from "@/components/ui/button";
import { SHARED_CONTENT } from "@/constants";

export const PageUnderConstruction = () => {
  return (
    <section className="mt-20 flex min-h-[80vh] flex-col items-center justify-around">
      <div>
        <p className="text-center text-body-1 font-semibold text-dark lg:text-title-1">
          {SHARED_CONTENT.construction.message}
        </p>
      </div>

      <Button
        onClick={() => window.location.assign(window.location.origin)}
        className="max-w-80"
      >
        {SHARED_CONTENT.construction.button}
      </Button>
    </section>
  );
};
