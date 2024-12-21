import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import maplibregl, { Map, Popup } from "maplibre-gl";
import { Feature, GeoJSONType, TModelPredictions } from "@/types";
import { CheckIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/form";
import { SHOELACE_SIZES } from "@/enums";
import {
  useCreateApprovedModelPrediction,
  useCreateModelFeedback,
  useDeleteApprovedModelPrediction,
  useDeleteModelPredictionFeedback,
} from "@/features/start-mapping/hooks/use-feedbacks";
import { showErrorToast, showSuccessToast } from "@/utils";
import { geojsonToWKT } from "@terraformer/wkt";
import { useAuth } from "@/app/providers/auth-provider";
import { TModelPredictionsConfig } from "@/features/start-mapping/api/get-model-predictions";
import { startMappingPageContent, TOAST_NOTIFICATIONS } from "@/constants";

const PredictedFeatureActionPopup = ({
  event,
  selectedFeature,
  setModelPredictions,
  modelPredictions,
  trainingId,
  source_imagery,
  trainingConfig,
  map,
}: {
  event: any;
  selectedFeature: any;
  modelPredictions: TModelPredictions;
  setModelPredictions: Dispatch<
    SetStateAction<{ all: Feature[]; accepted: Feature[]; rejected: Feature[] }>
  >;
  source_imagery: string;
  trainingId: number;
  trainingConfig: TModelPredictionsConfig;
  map: Map | null;
}) => {
  const featureId = selectedFeature.properties.id;
  const { user } = useAuth();

  const popupRef = useRef(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const { accepted, rejected, all } = modelPredictions;

  const alreadyAccepted = accepted.some(
    (feature) => feature.properties.id === featureId,
  );
  const alreadyRejected = rejected.some(
    (feature) => feature.properties.id === featureId,
  );

  // if already accepted, it means it's in accepted array
  // if it's already rejected, it means it's in the rejected array
  // if it's not in accepted or rejected, then it's in the all array
  const feature =
    accepted.find((f) => f.properties.id === featureId) ||
    rejected.find((f) => f.properties.id === featureId) ||
    all.find((f) => f.properties.id === featureId);

  const [showComment, setShowComment] = useState<boolean>(false);
  const [comment, setComment] = useState<string>("");

  const moveFeature = (
    source: Feature[],
    target: Feature[],
    id: string,
    additionalProperties: Partial<Feature["properties"]> = {},
  ) => {
    const movedFeatures = source
      .filter((feature) => feature.properties.id === id)
      .map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          ...additionalProperties,
        },
      }));

    return {
      updatedSource: source.filter((feature) => feature.properties.id !== id),
      updatedTarget: [...target, ...movedFeatures],
    };
  };

  useEffect(() => {
    if (!map || !popupRef.current) return;
    // reset if in comment mode
    setShowComment(false);
    const _popup = new maplibregl.Popup({ closeButton: false })
      .setLngLat(event.lngLat)
      .setDOMContent(popupRef.current)
      .addTo(map);
    setPopup(_popup);
    return () => {
      _popup.remove();
    };
  }, [event, map, selectedFeature, setShowComment]);

  const closePopup = () => {
    popup?.remove();
    setShowComment(false);
    setComment("");
  };

  const handleRejection = () => {
    setShowComment(true);
  };

  // Approved prediction is accept

  const createApprovedModelPredictionMutation =
    useCreateApprovedModelPrediction({
      mutationConfig: {
        onSuccess: (data) => {
          const { updatedSource, updatedTarget } = alreadyRejected
            ? moveFeature(rejected, accepted, featureId, {
                _id: data.id,
                ...data.properties,
              })
            : moveFeature(all, accepted, featureId, {
                _id: data.id,
                ...data.properties,
              });

          setModelPredictions((prev) => ({
            ...prev,
            rejected: alreadyRejected ? updatedSource : prev.rejected,
            all: alreadyRejected ? prev.all : updatedSource,
            accepted: updatedTarget,
          }));
          closePopup();
          showSuccessToast(
            TOAST_NOTIFICATIONS.startMapping.approvedPrediction.success,
          );
        },
        onError: (error) => {
          showErrorToast(error);
        },
      },
    });

  const deleteModelFeedbackMutation = useDeleteModelPredictionFeedback({
    mutationConfig: {
      onSuccess: (_, variables) => {
        if (variables.approvePrediction) {
          submitApprovedPrediction();
        } else {
          const { updatedSource: updatedRejected } = moveFeature(
            rejected,
            all,
            featureId,
          );
          setModelPredictions((prev) => ({
            ...prev,
            all: [
              ...all,
              ...rejected.filter((f) => f.properties.id === featureId),
            ],
            rejected: updatedRejected,
          }));
        }
        showSuccessToast(TOAST_NOTIFICATIONS.startMapping.resolved.success);
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const deleteApprovedModelPrediction = useDeleteApprovedModelPrediction({
    mutationConfig: {
      onSuccess: async (_, variables) => {
        if (variables.createFeedback) {
          await createModelFeedbackMutation.mutateAsync({
            zoom_level: trainingConfig.zoom_level,
            comments: comment,
            geom: geojsonToWKT(feature?.geometry as GeoJSONType),
            feedback_type: "TN",
            source_imagery: source_imagery,
            training: trainingId,
          });
        } else {
          const { updatedSource: updatedAccepted } = moveFeature(
            accepted,
            all,
            featureId,
          );
          setModelPredictions((prev) => ({
            ...prev,
            all: [
              ...all,
              ...accepted.filter((f) => f.properties.id === featureId),
            ],
            accepted: updatedAccepted,
          }));
        }
        showSuccessToast(TOAST_NOTIFICATIONS.startMapping.resolved.success);
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const submitApprovedPrediction = async () => {
    await createApprovedModelPredictionMutation.mutateAsync({
      geom: geojsonToWKT(feature?.geometry as GeoJSONType),
      training: trainingId,
      config: {
        areathreshold: Number(trainingConfig.area_threshold),
        confidence: trainingConfig.confidence,
        josmq: trainingConfig.use_josm_q,
        maxanglechange: trainingConfig.max_angle_change,
        skewtolerance: trainingConfig.skew_tolerance,
        tolerance: trainingConfig.tolerance,
        zoomlevel: trainingConfig.zoom_level,
      },
      user: user.osm_id,
    });
  };

  // Rejection is the same as feedback
  const createModelFeedbackMutation = useCreateModelFeedback({
    mutationConfig: {
      onSuccess: (data) => {
        if (alreadyAccepted) {
          const { updatedSource, updatedTarget } = moveFeature(
            accepted,
            rejected,
            featureId,
            // update the feature with the returned id from the backend as `_id` and other properties from the backend.
            { _id: data.id, ...data.properties },
          );
          setModelPredictions((prev) => ({
            ...prev,
            accepted: updatedSource,
            rejected: updatedTarget,
          }));
        } else {
          const { updatedSource, updatedTarget } = moveFeature(
            all,
            rejected,
            featureId,
            // update the feature with the returned id from the backend as `_id` and other properties from the backend.
            { _id: data.id, ...data.properties },
          );
          setModelPredictions((prev) => ({
            ...prev,
            all: updatedSource,
            rejected: updatedTarget,
          }));
        }
        closePopup();
        showSuccessToast(TOAST_NOTIFICATIONS.startMapping.feedback.success);
      },
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const submitRejectionFeedback = async () => {
    if (alreadyAccepted) {
      await deleteApprovedModelPrediction.mutateAsync({
        id: feature?.properties._id,
        createFeedback: true,
      });
    } else {
      await createModelFeedbackMutation.mutateAsync({
        zoom_level: trainingConfig.zoom_level,
        comments: comment,
        geom: geojsonToWKT(feature?.geometry as GeoJSONType),
        feedback_type: "TN",
        source_imagery: source_imagery,
        training: trainingId,
      });
    }
  };

  const handleResolve = async () => {
    if (alreadyRejected) {
      await deleteModelFeedbackMutation.mutateAsync({
        id: feature?.properties._id,
      });
    } else if (alreadyAccepted) {
      await deleteApprovedModelPrediction.mutateAsync({
        id: feature?.properties._id,
      });
    }
    closePopup();
  };

  const handleAcceptance = async () => {
    if (alreadyRejected) {
      await deleteModelFeedbackMutation.mutateAsync({
        id: feature?.properties._id,
        approvePrediction: true,
      });
    } else {
      submitApprovedPrediction();
    }
  };

  const primaryButton = alreadyAccepted
    ? {
        label: startMappingPageContent.map.popup.reject,
        action: handleRejection,
        className: "bg-primary",
        icon: RejectIcon,
      }
    : alreadyRejected
      ? {
          label: startMappingPageContent.map.popup.resolve,
          action: handleResolve,
          className: "bg-black",
          icon: ResolveIcon,
        }
      : {
          label: startMappingPageContent.map.popup.accept,
          action: handleAcceptance,
          className: "bg-green-primary",
          icon: AcceptIcon,
        };

  const secondaryButton = alreadyAccepted
    ? {
        label: startMappingPageContent.map.popup.resolve,
        action: handleResolve,
        className: "bg-black",
        icon: ResolveIcon,
      }
    : alreadyRejected
      ? {
          label: startMappingPageContent.map.popup.accept,
          action: handleAcceptance,
          className: "bg-green-primary",
          icon: AcceptIcon,
        }
      : {
          label: startMappingPageContent.map.popup.reject,
          action: handleRejection,
          className: "bg-primary",
          icon: RejectIcon,
        };

  return (
    <div
      className="bg-white p-2 md:p-4 rounded-xl flex flex-col gap-y-4 w-fit md:w-[300px]"
      ref={popupRef}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-body-3 md:text-body-2base">
          {showComment
            ? startMappingPageContent.map.popup.commentTitle
            : startMappingPageContent.map.popup.defaultTitle}
        </p>
        <button
          className="text-dark text-sm md:text-lg self-end"
          onClick={closePopup}
          title="Close"
        >
          &#x2715;
        </button>
      </div>
      {showComment && (
        <Input
          handleInput={(e) => setComment(e.target.value)}
          value={comment}
          showBorder
          label={startMappingPageContent.map.popup.comment.description}
          placeholder={startMappingPageContent.map.popup.comment.placeholder}
          size={SHOELACE_SIZES.MEDIUM}
        />
      )}
      {showComment && (
        <button
          className={`w-fit bg-primary text-white rounded-lg px-6 py-2 text-body-4 md:text-body-3 text-nowrap`}
          onClick={submitRejectionFeedback}
          disabled={createModelFeedbackMutation.isPending}
        >
          {createModelFeedbackMutation.isPending
            ? startMappingPageContent.map.popup.comment.submissionInProgress
            : startMappingPageContent.map.popup.comment.submit}
        </button>
      )}
      {!showComment && (
        <p className="text-xs md:text-sm">
          {startMappingPageContent.map.popup.description}
        </p>
      )}
      {!showComment && (
        <div className="flex justify-between items-center gap-x-6">
          <button
            className={`w-full ${primaryButton.className} text-white rounded-lg p-2 text-body-4 md:text-body-3 text-nowrap flex gap-x-3 justify-between items-center`}
            onClick={primaryButton.action}
          >
            {primaryButton.label}
            <primaryButton.icon />
          </button>
          <button
            className={`w-full ${secondaryButton.className} text-white rounded-lg p-2 text-body-4 md:text-body-3 text-nowrap flex justify-between items-center gap-x-3`}
            onClick={secondaryButton.action}
          >
            {secondaryButton.label}
            <secondaryButton.icon />
          </button>
        </div>
      )}
    </div>
  );
};

export default PredictedFeatureActionPopup;

const RejectIcon = () => {
  return (
    <span className="w-4 h-4 p-1 text-xs border rounded-full flex items-center justify-center">
      &#x2715;
    </span>
  );
};

const AcceptIcon = () => {
  return (
    <span className="w-4 h-4 border rounded-full flex items-center justify-center">
      <CheckIcon className="w-2 h-2" />
    </span>
  );
};

const ResolveIcon = () => {
  return (
    <span className="w-4 h-4 border rounded-full flex items-center justify-center">
      -
    </span>
  );
};
