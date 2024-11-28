import { useMap } from "@/app/providers/map-provider";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import maplibregl, { Popup } from "maplibre-gl";
import { Feature, GeoJSONType, TModelPredictions } from "@/types";
import CheckIcon from "@/components/ui/icons/check-icon";
import { Input } from "@/components/ui/form";
import { SHOELACE_SIZES } from "@/enums";
import {
  useCreateApprovedModelPrediction,
  useCreateModelFeedback,
} from "@/features/start-mapping/hooks/use-feedbacks";
import { showErrorToast, showSuccessToast } from "@/utils";
import { geojsonToWKT } from "@terraformer/wkt";
import { useAuth } from "@/app/providers/auth-provider";
import { TModelPredictionsConfig } from "@/features/start-mapping/api/get-model-predictions";
import { APPLICATION_CONTENTS, TOAST_NOTIFICATIONS } from "@/contents";
import { Button } from "@/components/ui/button";
import useScreenSize from "@/hooks/use-screen-size";

const PredictedFeatureActionPopup = ({
  event,
  selectedFeature,
  setModelPredictions,
  modelPredictions,
  trainingId,
  source_imagery,
  trainingConfig,
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
}) => {
  const featureId = selectedFeature.properties.id;
  const { map } = useMap();
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
  const feature = alreadyAccepted
    ? modelPredictions.accepted.filter(
        (feature) => feature.properties.id === featureId,
      )[0]
    : alreadyRejected
      ? modelPredictions.rejected.filter(
          (feature) => feature.properties.id === featureId,
        )[0]
      : modelPredictions.all.filter(
          (feature) => feature.properties.id === featureId,
        )[0];

  const [showComment, setShowComment] = useState<boolean>(false);
  const [comment, setComment] = useState<string>("");

  const moveFeature = (source: Feature[], target: Feature[], id: string) => {
    const movedFeatures = source.filter(
      (feature) => feature.properties.id === id,
    );
    return {
      updatedSource: source.filter((feature) => feature.properties.id !== id),
      updatedTarget: [...target, ...movedFeatures],
    };
  };

  useEffect(() => {
    if (!map || !popupRef.current) return;
    const _popup = new maplibregl.Popup({ closeButton: false })
      .setLngLat(event.lngLat)
      .setDOMContent(popupRef.current)
      .addTo(map);
    setPopup(_popup);
    return () => {
      _popup.remove();
    };
  }, [event, map, selectedFeature]);

  const closePopup = () => {
    popup?.remove();
    // clean ups
    setShowComment(false);
    setComment("");
  };

  // Approved prediction is accept

  const createApprovedModelPredictionMutation =
    useCreateApprovedModelPrediction({
      mutationConfig: {
        onSuccess: () => {
          if (alreadyRejected) {
            const { updatedSource, updatedTarget } = moveFeature(
              rejected,
              accepted,
              featureId,
            );
            setModelPredictions((prev) => ({
              ...prev,
              rejected: updatedSource,
              accepted: updatedTarget,
            }));
          } else {
            const { updatedSource, updatedTarget } = moveFeature(
              all,
              accepted,
              featureId,
            );
            setModelPredictions((prev) => ({
              ...prev,
              all: updatedSource,
              accepted: updatedTarget,
            }));
          }
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

  // Rejection is the same as feedback
  const createModelFeedbackMutation = useCreateModelFeedback({
    mutationConfig: {
      onSuccess: () => {
        if (alreadyAccepted) {
          const { updatedSource, updatedTarget } = moveFeature(
            accepted,
            rejected,
            featureId,
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
    await createModelFeedbackMutation.mutateAsync({
      zoom_level: trainingConfig.zoom_level,
      comments: comment,
      geom: geojsonToWKT(feature.geometry as GeoJSONType),
      feedback_type: "TN",
      source_imagery: source_imagery,
      training: trainingId,
    });
  };

  const handleRejection = () => {
    setShowComment(true);
  };

  const handleResolve = () => {
    const { updatedSource: updatedRejected } = moveFeature(
      rejected,
      all,
      featureId,
    );
    const { updatedSource: updatedAccepted } = moveFeature(
      accepted,
      all,
      featureId,
    );
    setModelPredictions((prev) => ({
      ...prev,
      all: [
        ...all,
        ...rejected.filter((f) => f.properties.id === featureId),
        ...accepted.filter((f) => f.properties.id === featureId),
      ],
      rejected: updatedRejected,
      accepted: updatedAccepted,
    }));

    closePopup();
  };

  const handleAcceptance = async () => {
    await createApprovedModelPredictionMutation.mutateAsync({
      geom: geojsonToWKT(feature.geometry as GeoJSONType),
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

  const primaryButton = alreadyAccepted
    ? {
        label: APPLICATION_CONTENTS.START_MAPPING.map.popup.reject,
        action: handleRejection,
        className: "bg-primary",
        icon: RejectIcon,
      }
    : alreadyRejected
      ? {
          label: APPLICATION_CONTENTS.START_MAPPING.map.popup.resolve,
          action: handleResolve,
          className: "bg-black",
          icon: ResolveIcon,
        }
      : {
          label: APPLICATION_CONTENTS.START_MAPPING.map.popup.accept,
          action: handleAcceptance,
          className: "bg-green-primary",
          icon: AcceptIcon,
        };

  const secondaryButton = alreadyAccepted
    ? {
        label: APPLICATION_CONTENTS.START_MAPPING.map.popup.resolve,
        action: handleResolve,
        className: "bg-black",
        icon: ResolveIcon,
      }
    : alreadyRejected
      ? {
          label: APPLICATION_CONTENTS.START_MAPPING.map.popup.accept,
          action: handleAcceptance,
          className: "bg-green-primary",
          icon: AcceptIcon,
        }
      : {
          label: APPLICATION_CONTENTS.START_MAPPING.map.popup.reject,
          action: handleRejection,
          className: "bg-primary",
          icon: RejectIcon,
        };
  const { isMobile } = useScreenSize();
  return (
    <div
      className="bg-white p-2 md:p-4 rounded-xl flex flex-col gap-y-4 w-fit md:w-[300px]"
      ref={popupRef}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-body-3 md:text-body-2base">
          {showComment
            ? APPLICATION_CONTENTS.START_MAPPING.map.popup.commentTitle
            : APPLICATION_CONTENTS.START_MAPPING.map.popup.defaultTitle}
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
          label={
            APPLICATION_CONTENTS.START_MAPPING.map.popup.comment.description
          }
          placeholder={
            APPLICATION_CONTENTS.START_MAPPING.map.popup.comment.placeholder
          }
          size={SHOELACE_SIZES.MEDIUM}
        />
      )}
      {showComment && (
        <Button
          className={`!w-fit`}
          onClick={submitRejectionFeedback}
          size={isMobile ? SHOELACE_SIZES.SMALL : SHOELACE_SIZES.MEDIUM}
          uppercase={false}
          disabled={createModelFeedbackMutation.isPending}
        >
          {createModelFeedbackMutation.isPending
            ? APPLICATION_CONTENTS.START_MAPPING.map.popup.comment
                .submissionInProgress
            : APPLICATION_CONTENTS.START_MAPPING.map.popup.comment.submit}
        </Button>
      )}
      {!showComment && (
        <p className="text-xs md:text-sm">
          {APPLICATION_CONTENTS.START_MAPPING.map.popup.description}
        </p>
      )}
      {!showComment && (
        <div className="flex justify-between items-center gap-x-10">
          <button
            className={`${primaryButton.className} text-white rounded-lg p-2 text-body-4 md:text-body-3 text-nowrap flex gap-x-2 items-center`}
            onClick={primaryButton.action}
          >
            {primaryButton.label}
            <primaryButton.icon />
          </button>
          <button
            className={`${secondaryButton.className} text-white rounded-lg p-2 text-body-4 md:text-body-3 text-nowrap flex items-center gap-x-2`}
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
    <span className="w-5 h-5 p-1 text-xs border rounded-full flex items-center justify-center">
      &#x2715;
    </span>
  );
};

const AcceptIcon = () => {
  return (
    <span className="w-5 h-5 border rounded-full flex items-center justify-center">
      <CheckIcon className="w-3 h-3" />
    </span>
  );
};

const ResolveIcon = () => {
  return (
    <span className="w-5 h-5 border rounded-full flex items-center justify-center">
      -
    </span>
  );
};
