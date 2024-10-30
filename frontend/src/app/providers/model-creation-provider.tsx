import { BASE_MODEL } from "@/enums";
import { useLocalStorage } from "@/hooks/use-storage";
import { HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY } from "@/utils";
import React, { createContext, useContext, useEffect, useState } from "react";

export enum MODEL_CREATION_FORM_NAME {
  MODEL_NAME = "modelName",
  DATASET_NAME = "datasetName",
  MODEL_DESCRIPTION = "modelDescription",
  BASE_MODEL = "baseModel",
}

export const FORM_VALIDATION_CONFIG = {
  modelName: {
    maxLength: 40,
    minLength: 10,
  },
  modelDescription: {
    maxLength: 500,
    minLength: 10,
  },
};

const initialFormState = {
  modelName: "",
  modelDescription: "",
  datasetName: "",
  baseModel: BASE_MODEL.RAMP.toLowerCase(),
};

const ModelCreationFormContext = createContext<{
  formData: typeof initialFormState;
  setFormData: React.Dispatch<React.SetStateAction<typeof initialFormState>>;
  handleChange: (field: string, value: string) => void;
}>({
  formData: initialFormState,
  setFormData: () => {},
  handleChange: () => {},
});

export const ModelCreationFormProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { setValue, getValue } = useLocalStorage();

  const [formData, setFormData] = useState<typeof initialFormState>(() => {
    const savedData = getValue(HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : initialFormState;
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    setValue(
      HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY,
      JSON.stringify(formData),
    );
  }, [formData]);

  return (
    <ModelCreationFormContext.Provider
      value={{ formData, setFormData, handleChange }}
    >
      {children}
    </ModelCreationFormContext.Provider>
  );
};

export const useModelFormContext = () => useContext(ModelCreationFormContext);
