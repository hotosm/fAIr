import { Map, MapGeoJSONFeature, MapLayerMouseEvent, Popup } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { geojsonToWKT } from "@terraformer/wkt";
import { Input } from "@/components/ui/form";
import { CheckIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import { SHOELACE_SIZES } from "@/enums";
import { START_MAPPING_PAGE_CONTENT } from "@/constants";
import { showErrorToast } from "@/utils";
import { useAuth } from "@/app/providers/auth-provider";
import { GeoJSONType, TModelPredictionFeature } from "@/types";

import {
  useCreateApprovedModelPrediction,
  useCreateModelFeedback,
  useDeleteApprovedModelPrediction,
  useDeleteModelPredictionFeedback,
} from "@/features/start-mapping/hooks/use-feedbacks";

import { ALL_MODEL_PREDICTIONS_FILL_LAYER_ID } from "@/config";
import { PredictedFeatureStatus } from "@/enums/start-mapping";

const PredictedFeatureActionPopup = ({
  trainingId,
  map,
  features,
  updateFeatureStatus,
}: {
  trainingId: number;
  map: Map | null;
  features: TModelPredictionFeature[];
  updateFeatureStatus: (
    id: number,
    status: PredictedFeatureStatus,
    updatedProperties: Partial<TModelPredictionFeature["properties"]>
  ) => void;
}) => {
  const { user } = useAuth();

  const popupContainerRef = useRef<HTMLDivElement>(null);
  const popupInstanceRef = useRef<Popup | null>(null);
  const selectedFeatureRef = useRef<MapGeoJSONFeature | null>(null);
  const selectedEventRef = useRef<MapLayerMouseEvent | null>(null);

  const [featureId, setFeatureId] = useState<number | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  const feature = useMemo(
    () => features.find((f) => f.properties.id === featureId),
    [featureId, features]
  );

  const featureStatus = feature?.properties.status;
  const alreadyAccepted = featureStatus === PredictedFeatureStatus.ACCEPTED;
  const alreadyRejected = featureStatus === PredictedFeatureStatus.REJECTED;

  const config = useMemo(() => {
    if (!feature) return {};
    return {
      area_threshold: feature?.properties.config.area_threshold ?? 0,
      orthogonalize: feature?.properties.config.orthogonalize ?? false,
      ortho_max_angle_change_deg:
        feature?.properties.config.ortho_max_angle_change_deg ?? 0,
      ortho_skew_tolerance_deg:
        feature?.properties.config.ortho_skew_tolerance_deg ?? 0,
      zoom_level: feature?.properties.config.zoom_level ?? 0,
      confidence: feature?.properties.config.confidence ?? 0,
      tolerance: feature?.properties.config.tolerance ?? 0,
      checkpoint: feature?.properties.config.checkpoint ?? "",
      source_imagery:
        (feature?.properties.config.source as string) ??
        (feature?.properties.config.source_imagery as string),
    };
  }, [feature]);

  useEffect(() => {
    if (!map) return;

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const handleClick = (e: MapLayerMouseEvent) => {
      const clickedFeature = e.features?.[0];
      if (!clickedFeature) return;

      selectedEventRef.current = e;
      selectedFeatureRef.current = clickedFeature;
      setFeatureId(clickedFeature.properties.id);
      setShowComment(false);

      if (popupContainerRef.current) {
        popupInstanceRef.current?.remove();
        const newPopup = new Popup({ closeButton: false })
          .setLngLat(e.lngLat)
          .setDOMContent(popupContainerRef.current)
          .addTo(map);
        popupInstanceRef.current = newPopup;
      }
    };

    map.on("mouseenter", ALL_MODEL_PREDICTIONS_FILL_LAYER_ID, handleMouseEnter);
    map.on("mouseleave", ALL_MODEL_PREDICTIONS_FILL_LAYER_ID, handleMouseLeave);
    map.on("click", ALL_MODEL_PREDICTIONS_FILL_LAYER_ID, handleClick);

    return () => {
      popupInstanceRef.current?.remove();
      map.off(
        "mouseenter",
        ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
        handleMouseEnter
      );
      map.off(
        "mouseleave",
        ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
        handleMouseLeave
      );
      map.off("click", ALL_MODEL_PREDICTIONS_FILL_LAYER_ID, handleClick);
    };
  }, [map]);

  const closePopup = () => {
    popupInstanceRef.current?.remove();
    setShowComment(false);
    setComment("");
  };

  const handleRejection = () => setShowComment(true);

  const createApprovedModelPredictionMutation =
    useCreateApprovedModelPrediction({
      mutationConfig: {
        onSuccess: (data) => {
          if (featureId !== null) {
            updateFeatureStatus(featureId, PredictedFeatureStatus.ACCEPTED, {
              _id: data.id,
              ...data.properties,
            });
          }
          closePopup();
        },
        onError: (error) => showErrorToast(error),
      },
    });

  const deleteModelFeedbackMutation = useDeleteModelPredictionFeedback({
    mutationConfig: {
      onSuccess: (_, variables) => {
        if (featureId !== null) {
          const newStatus = variables.approvePrediction
            ? PredictedFeatureStatus.ACCEPTED
            : PredictedFeatureStatus.UNTOUCHED;
          updateFeatureStatus(featureId, newStatus, {});
        }
        closePopup();
      },
      onError: (error) => showErrorToast(error),
    },
  });

  const deleteApprovedModelPrediction = useDeleteApprovedModelPrediction({
    mutationConfig: {
      onSuccess: async (_, variables) => {
        if (variables.createFeedback) {
          await createModelFeedbackMutation.mutateAsync({
            comments: comment,
            geom: geojsonToWKT(feature?.geometry as GeoJSONType),
            feedback_type: "TN",
            training: trainingId,
            config,
          });
        } else {
          if (featureId !== null) {
            updateFeatureStatus(
              featureId,
              PredictedFeatureStatus.UNTOUCHED,
              {}
            );
          }
        }
        closePopup();
      },
      onError: (error) => showErrorToast(error),
    },
  });

  const submitApprovedPrediction = async () => {
    await createApprovedModelPredictionMutation.mutateAsync({
      geom: geojsonToWKT(feature?.geometry as GeoJSONType),
      training: trainingId,
      config,
      user: user.osm_id,
    });
  };

  const createModelFeedbackMutation = useCreateModelFeedback({
    mutationConfig: {
      onSuccess: (data) => {
        if (featureId !== null) {
          updateFeatureStatus(featureId, PredictedFeatureStatus.REJECTED, {
            _id: data.id,
          });
        }
        closePopup();
      },
      onError: (error) => showErrorToast(error),
    },
  });

  const submitRejectionFeedback = async () => {
    if (alreadyAccepted) {
      await deleteApprovedModelPrediction.mutateAsync({
        id: feature?.properties._id as number,
        createFeedback: true,
      });
    } else {
      await createModelFeedbackMutation.mutateAsync({
        comments: comment,
        geom: geojsonToWKT(feature?.geometry as GeoJSONType),
        feedback_type: "TN",
        training: trainingId,
        config,
      });
    }
  };

  const handleResolve = async () => {
    if (alreadyRejected) {
      await deleteModelFeedbackMutation.mutateAsync({
        id: feature?.properties._id as number,
      });
    } else if (alreadyAccepted) {
      await deleteApprovedModelPrediction.mutateAsync({
        id: feature?.properties._id as number,
      });
    }
  };

  const handleAcceptance = async () => {
    if (alreadyRejected) {
      await deleteModelFeedbackMutation.mutateAsync({
        id: feature?.properties._id as number,
        approvePrediction: true,
      });
    } else {
      await submitApprovedPrediction();
    }
  };

  if (!feature) return <div className="hidden" ref={popupContainerRef} />;

  const primaryButton = alreadyAccepted
    ? {
        label: START_MAPPING_PAGE_CONTENT.map.popup.reject,
        action: handleRejection,
        className: "bg-primary",
        icon: RejectIcon,
        disabled: false,
      }
    : alreadyRejected
      ? {
          label: START_MAPPING_PAGE_CONTENT.map.popup.resolve,
          action: handleResolve,
          className: "bg-black",
          icon: ResolveIcon,
          disabled: deleteModelFeedbackMutation.isPending,
        }
      : {
          label: START_MAPPING_PAGE_CONTENT.map.popup.accept,
          action: handleAcceptance,
          className: "bg-green-primary",
          icon: AcceptIcon,
          disabled: createApprovedModelPredictionMutation.isPending,
        };

  const secondaryButton = alreadyAccepted
    ? {
        label: START_MAPPING_PAGE_CONTENT.map.popup.resolve,
        action: handleResolve,
        className: "bg-black",
        icon: ResolveIcon,
        disabled: deleteApprovedModelPrediction.isPending,
      }
    : alreadyRejected
      ? {
          label: START_MAPPING_PAGE_CONTENT.map.popup.accept,
          action: handleAcceptance,
          className: "bg-green-primary",
          icon: AcceptIcon,
          disabled: deleteModelFeedbackMutation.isPending,
        }
      : {
          label: START_MAPPING_PAGE_CONTENT.map.popup.reject,
          action: handleRejection,
          className: "bg-primary",
          icon: RejectIcon,
          disabled: false,
        };

  return (
    <div
      className="flex w-fit flex-col gap-y-4 rounded-xl bg-white p-4 md:w-[300px]"
      ref={popupContainerRef}
    >
      <div className="flex items-center justify-between">
        <p className="text-body-3 font-semibold md:text-body-2base">
          {showComment
            ? START_MAPPING_PAGE_CONTENT.map.popup.commentTitle
            : START_MAPPING_PAGE_CONTENT.map.popup.defaultTitle}
        </p>
        <button
          className="self-end text-sm text-dark md:text-lg"
          onClick={closePopup}
          title="Close"
        >
          &#x2715;
        </button>
      </div>

      {showComment ? (
        <>
          <Input
            handleInput={(e) => setComment(e.target.value)}
            value={comment}
            showBorder
            label={START_MAPPING_PAGE_CONTENT.map.popup.comment.description}
            placeholder={
              START_MAPPING_PAGE_CONTENT.map.popup.comment.placeholder
            }
            size={SHOELACE_SIZES.MEDIUM}
          />
          <button
            className="w-fit text-nowrap rounded-lg bg-primary px-6 py-2 text-body-4 text-white md:text-body-3"
            onClick={submitRejectionFeedback}
            disabled={createModelFeedbackMutation.isPending}
          >
            {createModelFeedbackMutation.isPending
              ? START_MAPPING_PAGE_CONTENT.map.popup.comment
                  .submissionInProgress
              : START_MAPPING_PAGE_CONTENT.map.popup.comment.submit}
          </button>
        </>
      ) : (
        <>
          <p className="text-xs md:text-sm">
            {START_MAPPING_PAGE_CONTENT.map.popup.description}
          </p>
          <div className="flex items-center justify-between gap-x-6">
            <button
              className={`w-full ${primaryButton.className} flex items-center justify-between gap-x-3 text-nowrap rounded-lg p-2 text-body-4 text-white md:text-body-3`}
              onClick={primaryButton.action}
              disabled={primaryButton.disabled}
            >
              {primaryButton.label}
              <primaryButton.icon />
              {primaryButton.disabled && <Spinner />}
            </button>
            <button
              className={`w-full ${secondaryButton.className} flex items-center justify-between gap-x-3 text-nowrap rounded-lg p-2 text-body-4 text-white md:text-body-3`}
              onClick={secondaryButton.action}
              disabled={secondaryButton.disabled}
            >
              {secondaryButton.label}
              <secondaryButton.icon />
              {secondaryButton.disabled && <Spinner />}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PredictedFeatureActionPopup;

const RejectIcon = () => (
  <span className="flex size-4 items-center justify-center rounded-full border p-1 text-xs">
    &#x2715;
  </span>
);

const AcceptIcon = () => (
  <span className="flex size-4 items-center justify-center rounded-full border">
    <CheckIcon className="size-2" />
  </span>
);

const ResolveIcon = () => (
  <span className="flex size-4 items-center justify-center rounded-full border">
    -
  </span>
);
