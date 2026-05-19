export type TryFairModel = {
  id: number;
  feature: string;
  location: string;
  modelName: string;
  author: string;
  featureType: string;
  tileServiceUrl: string;
  bbox: string;
  availableZoomLevels: number[];
};

export const MODELS_LIST: TryFairModel[] = [
  {
    id: 1,
    feature: "Buildings",
    location: "Freetown",
    modelName: "Kolleh Town Freetown",
    author: "OmranNAJJAR",
    featureType: "building",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/686e390615a6768f282b22b3/0/686e390615a6768f282b22b4/{z}/{x}/{y}",
    bbox: "",
    availableZoomLevels: [18, 19, 20],
  },
  {
    id: 2,
    feature: "Solar Panels",
    location: "USA",
    modelName: "Panels Chicago",
    author: "Kshitij Sharma",
    featureType: "solar-panel",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/6a0aa45052774984bedbcfef/0/6a0aa45052774984bedbcff0/{z}/{x}/{y}",
    bbox: "",
    availableZoomLevels: [18, 19, 20],
  },
  {
    id: 3,
    feature: "Buildings",
    location: "Nepal",
    modelName: "Nepal Buildings Model",
    author: "Kshitij Sharma",
    featureType: "building",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/66149f1cc055e600014ac54c/0/66149f1cc055e600014ac54d/{z}/{x}/{y}",
    bbox: "",
    availableZoomLevels: [18, 19, 20],
  },
  {
    id: 4,
    feature: "Trees",
    location: "Ghana",
    modelName: "Kolleh Town Freetown",
    author: "OmranNAJJAR",
    featureType: "trees",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/6a0b8d586103984552b5f7f2/0/6a0b8d586103984552b5f7f3/{z}/{x}/{y}",
    bbox: "",
    availableZoomLevels: [19, 20, 21],
  },
];
