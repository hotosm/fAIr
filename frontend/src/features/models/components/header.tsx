import { ButtonWithIcon } from "@/components/ui/button";
import { AddIcon } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { APP_CONTENT, APPLICATION_ROUTES } from "@/utils";

const PageHeader = () => {
  return (
    <div className="flex flex-col gap-y-8 my-12">
      <div>
        <h1 className="font-semibold text-title-1 text-primary md:text-large-title">
          {APP_CONTENT.models.modelsList.pageTitle}
        </h1>
      </div>
      <div className="flex flex-col md:flex-row gap-y-6 justify-between">
        <p className="max-w-[80%] md:max-w-[50%] text-gray text-body-2base md:text-body-2">
          {APP_CONTENT.models.modelsList.description}
        </p>
        <div className="self-start">
          <Link
            href={APPLICATION_ROUTES.CREATE_NEW_MODEL}
            nativeAnchor={false}
            title={APP_CONTENT.models.modelsList.ctaButton}
          >
            <ButtonWithIcon
              variant="primary"
              prefixIcon={AddIcon}
              label={APP_CONTENT.models.modelsList.ctaButton}
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
