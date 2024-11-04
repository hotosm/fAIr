// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
// import { BASE_MODEL, TrainingDatasetOption, TrainingType } from "@/enums";
// import { HOT_FAIR_MODEL_CREATION_LOCAL_STORAGE_KEY } from '@/utils';

// const initialFormData = {
//     modelName: "",
//     modelDescription: "",
//     baseModel: BASE_MODEL.RAMP.toLowerCase(),
//     trainingDatasetOption: TrainingDatasetOption.NONE,
//     datasetName: "",
//     tmsURL: "",
//     tmsURLValidation: {
//         valid: false,
//         message: "",
//     },
//     selectedTrainingDatasetId: "",
//     zoomLevels: [20, 21],
//     trainingAreas: [],
//     trainingType: TrainingType.BASIC,
//     epoch: 2,
//     contactSpacing: 4,
//     batchSize: 8,
//     boundaryWidth: 3,
// };

// interface NewModelFormState {
//     formData: typeof initialFormData;
//     updateFormField: (
//         field: string,
//         value:
//             | string
//             | boolean
//             | number
//             | number[]
//             | Record<string, string | number | boolean>,
//     ) => void;
//     resetForm: () => void;
// }

// export const useNewModelFormStore = create<NewModelFormState>()(
//     persist(
//         (set) => ({
//             formData: initialFormData,
//             updateFormField: (field: string, value:
//                 | string
//                 | boolean
//                 | number
//                 | number[]
//                 | Record<string, string | number | boolean>,) =>
//                 set((state) => ({
//                     formData: {
//                         ...state.formData,
//                         [field]: value,
//                     },
//                 })),

//             resetForm: () =>
//                 set(() => ({
//                     formData: initialFormData,
//                 })),
//         }),
//         {
//             name: "test-key",
//             partialize: (state) => ({ formData: state.formData }),
//         }
//     )
// );
