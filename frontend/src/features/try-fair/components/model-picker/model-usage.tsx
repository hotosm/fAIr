import type { APIBaseModelItem } from "@/features/try-fair/types/data-types";

const plural = (count: number, one: string, many: string) =>
  `${count.toLocaleString()} ${count === 1 ? one : many}`;

const mapRequestTotal = (model: APIBaseModelItem) =>
  (model.prediction_runs ?? 0) + (model.map_request_count ?? 0);

export const formatRuns = (model: APIBaseModelItem) =>
  plural(mapRequestTotal(model), "run", "runs");

export const getModelUsage = (
  model: APIBaseModelItem,
): { label: string; value: string }[] => {
  const facts = [
    { label: "Runs", value: mapRequestTotal(model).toLocaleString() },
    { label: "Users", value: (model.user_count ?? 0).toLocaleString() },
    {
      label: "Feedback",
      value: plural(model.feedback_count ?? 0, "entry", "entries"),
    },
  ];
  if (model.local_model_count !== undefined) {
    facts.push({
      label: "Local models",
      value: `${model.local_model_count.toLocaleString()} created`,
    });
  }
  return facts;
};
