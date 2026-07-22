import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import {
  geocodeSuggestions,
  GeocodeResult,
} from "@/features/try-fair/api/hot-imagery";

const DEBOUNCE_MS = 350;

/**
 * Location search for the OpenAerialMap map: type to get debounced Nominatim
 * suggestions, pick one to frame it. Clearing resets the view (onClear), and
 * the whole box collapses to an icon so it never blocks the map / panel on
 * small screens.
 */
export const LocationSearch = ({
  onPick,
  onClear,
  onClose,
}: {
  onPick: (result: GeocodeResult) => void;
  /** Fired when the user clears the search (e.g. to reset the map view). */
  onClear: () => void;
  /** Fired to close / toggle off the search bar visibility. */
  onClose?: () => void;
}) => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const justPickedRef = useRef(false);

  // Debounced suggestion fetch.
  useEffect(() => {
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      geocodeSuggestions(query.trim(), 5, controller.signal)
        .then((r) => {
          if (controller.signal.aborted) return;
          setResults(r);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handlePick = (result: GeocodeResult) => {
    justPickedRef.current = true;
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setLoading(false);
    setQuery(result.displayName);
    setResults([]);
    setOpen(false);
    onPick(result);
  };

  const handleClear = () => {
    justPickedRef.current = false;
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setLoading(false);
    setQuery("");
    setResults([]);
    setOpen(false);
    onClear();
  };

  const handleClose = () => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setLoading(false);
    setOpen(false);
    onClose?.();
  };

  return (
    <div className="relative w-[min(340px,78vw)]">
      <div className="flex items-center bg-white rounded-lg shadow-md border border-gray-border overflow-hidden">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for a place to map"
          className="flex-1 px-3 py-2.5 text-sm text-dark outline-none min-w-0"
        />
        {loading && (
          <span className="px-2 shrink-0">
            <Spinner style={{ fontSize: "14px" }} />
          </span>
        )}
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className="px-3 py-2.5 text-grey hover:text-dark shrink-0"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handleClose}
          aria-label="Close location search"
          className="m-1 px-3 py-1.5 rounded-md bg-off-white border border-gray-border hover:bg-light-gray disabled:opacity-50"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {open && results.length > 0 && (
        <ul className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-border overflow-hidden max-h-60 overflow-y-auto scrollable">
          {results.map((r, i) => (
            <li key={`${r.displayName}-${i}`}>
              <button
                type="button"
                onClick={() => handlePick(r)}
                className="w-full text-left px-3 py-2 text-xs text-dark hover:bg-off-white truncate"
                title={r.displayName}
              >
                {r.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
