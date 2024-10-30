import { ModelCreationSuccessConfirmation } from "@/features/model-creation/components";

export const CreateNewModelConfirmationPage = () => {
  // Use an effect to check if the model creation is successful, otherwise redirect back to the previous page.
  return (
    <div className={"col-start-3 col-span-8 flex flex-col gap-y-10"}>
      <ModelCreationSuccessConfirmation />
    </div>
  );
};
