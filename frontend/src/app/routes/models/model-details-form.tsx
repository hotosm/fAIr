import { ModelDetailsForm } from '@/features/model-creation/components/';

export const ModelDetailsFormPage = () => {
  return (
    <div
      className={
        "col-span-12 md:col-start-2 md:col-span-10 lg:col-start-4 lg:col-span-6"
      }
    >
      <ModelDetailsForm />
    </div>
  );
};
