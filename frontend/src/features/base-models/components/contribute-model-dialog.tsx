import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ChevronDownIcon } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";
import { SHARED_CONTENT } from "@/constants/ui-contents/shared-content";
import { useState } from "react";

type ContributeModelDialogProps = {
  isOpened: boolean;
  closeDialog: () => void;
};

type StepProps = {
  stepNumber: number;
  title: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
};

const statusBadgeClasses = {
  pending: "bg-status-pending-color text-grey",
  changes: "bg-status-changes-color text-grey",
  approved: "bg-green-secondary text-grey",
};
const Step: React.FC<StepProps> = ({
  stepNumber,
  title,
  children,
  isExpanded,
  onToggle,
}) => {
  return (
    <div className="border-b border-gray-border last:border-b-0 pb-6 mb-6 last:mb-0 last:pb-0">
      <button
        className="flex items-center w-full text-left gap-x-3 cursor-pointer"
        onClick={onToggle}
      >
        <span className="inline-flex items-center rounded-md justify-center bg-primary text-white text-body-3 font-semibold  px-2 py-1 min-w-max">
          Step {stepNumber}
        </span>
        <h3 className="font-semibold text-body-1 text-dark flex-1">{title}</h3>

        <ChevronDownIcon
          className={`w-5 h-5 text-dark transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>
      {isExpanded && <div className="mt-4 pl-0">{children}</div>}
    </div>
  );
};

const StatusBadge = ({
  className,
  label,
}: {
  className: string;
  label: string;
}) => {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-2 md:px-3 py-1 rounded-[88px] text-xs md:text-body-3 ${className}`}
    >
      {label}
    </span>
  );
};

const ContributeModelDialog: React.FC<ContributeModelDialogProps> = ({
  isOpened,
  closeDialog,
}) => {
  const contributeModelDialogContent =
    SHARED_CONTENT.baseModelsPage.contributeModelDialog;
  const [expandedStep, setExpandedStep] = useState<number>(1);

  const handleToggle = (step: number) => {
    setExpandedStep((prev) => (prev === step ? -1 : step));
  };

  return (
    <Dialog
      label={contributeModelDialogContent.label}
      isOpened={isOpened}
      closeDialog={closeDialog}
    >
      <div className="flex flex-col gap-y-2">
        <p className="text-grey text-body-2base mb-6">
          {contributeModelDialogContent.intro}
        </p>

        {contributeModelDialogContent.steps.map((step, index) => (
          <Step
            key={step.title}
            stepNumber={index + 1}
            title={step.title}
            isExpanded={expandedStep === index + 1}
            onToggle={() => handleToggle(index + 1)}
          >
            <div className="flex flex-col gap-y-4">
              {step.description && (
                <p className="text-grey text-body-2base">{step.description}</p>
              )}

              {step.sections && (
                <div className="flex flex-col gap-y-6">
                  {step.sections.map((section) => (
                    <div key={section.title}>
                      <h4 className="font-semibold text-body-2 text-dark mb-2">
                        {section.title}
                      </h4>

                      {section.description && (
                        <p className="text-grey text-body-3 mb-2">
                          {section.description}
                        </p>
                      )}

                      {section.items && section.items.length > 0 && (
                        <>
                          {section.listType === "ordered" ? (
                            <ol className="list-decimal list-inside text-grey text-body-3 space-y-1 ml-2">
                              {section.items.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ol>
                          ) : (
                            <ul className="list-disc list-inside text-grey text-body-3 space-y-1 ml-2">
                              {section.items.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}

                      {section.note && (
                        <p className="text-grey text-body-3 italic mt-2">
                          {section.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {step.statuses && (
                <div className="flex flex-col gap-y-2 md:gap-y-3">
                  {step.statuses.map((status) => (
                    <div
                      className="flex items-center gap-x-1 md:gap-x-4"
                      key={status.label}
                    >
                      <StatusBadge
                        className={statusBadgeClasses[status.variant]}
                        label={status.label}
                      />
                      <span className="text-grey text-body-4 md:text-body-3">
                        {status.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Step>
        ))}

        {/* Go to GitHub Button */}
        <div className="flex justify-end mt-4">
          <Link
            title={contributeModelDialogContent.github.title}
            href={contributeModelDialogContent.github.href}
          >
            <Button className="rounded-sm">
              {contributeModelDialogContent.github.buttonLabel}
            </Button>
          </Link>
        </div>
      </div>
    </Dialog>
  );
};

export default ContributeModelDialog;
