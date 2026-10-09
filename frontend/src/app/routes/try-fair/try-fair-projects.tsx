import { Head } from "@/components/seo";
import { Spinner } from "@/components/ui/spinner";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { useGetUserState } from "@/features/user-profile/api/user-state";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { SavedUserState } from "@/features/try-fair/api/user-state";
import { getProjectSearchParams } from "@/features/try-fair/utils/restore-project";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { ModelType } from "@/enums";
import { TryFairPage } from "../try-fair";

export const TryFairProjectPage = () => {
  const { pid } = useParams();
  const { data, isPending, isError } = useGetUserState(pid);

  if (isPending) {
    return (
      <div
        role="status"
        aria-label="Loading mapping project"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <Head title="Loading mapping project" />
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="app-padding flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Head title="Mapping project unavailable" />
        <p role="alert" className="text-sm text-grey">
          Couldn't load this mapping project. It may be unavailable or you may
          not have access.
        </p>
        <Link to={APPLICATION_ROUTES.TRY_FAIR} className="text-primary">
          Start a new mapping project
        </Link>
      </div>
    );
  }

  return <RestoreProject key={data.pid} saved={data} />;
};

const RestoreProject = ({ saved }: { saved: SavedUserState }) => {
  // Freeze the initial snapshot: autosave cache updates must not reset live edits.
  const [initialProject] = useState(saved);
  const [ready, setReady] = useState(false);
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (ready) return;
    const search = getProjectSearchParams(initialProject);
    const store = useStartMappingStore.getState();
    store.setSeletedImagery(null);
    store.setPredictions(null);
    store.setPredictionBBox(null);
    store.setPredictionGridZoom(null);
    store.setCurrentModelType(
      search.get("mode") === ModelType.DEMO ? ModelType.DEMO : ModelType.IMAGERY,
    );
    setSearchParams(search, { replace: true });
    setReady(true);
  }, [initialProject, ready, setSearchParams]);

  if (!ready) return <Spinner />;
  return <TryFairPage initialProject={initialProject} />;
};
