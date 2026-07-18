import { useState } from "react";
import { cn } from "@/utils";
import { SearchIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import { OAMImageryItem } from "@/features/try-fair/api/hot-imagery";
import { ExpandIcon } from "@/components/ui/icons/expand-icon";

const formatGsd = (gsd: number | null): string => {
  if (gsd == null) return "N/A";
  return gsd < 1 ? `${Math.round(gsd * 100)} cm` : `${gsd.toFixed(1)} m`;
};

const formatDate = (iso: string | null): string =>
  iso ? iso.slice(0, 10) : "Unknown date";

const ImageryCard = ({
  item,
  isSelected,
  onSelect,
}: {
  item: OAMImageryItem;
  isSelected: boolean;
  onSelect: (item: OAMImageryItem) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(item)}
    className={cn(
      "text-left bg-frosted-blue min-h-[150px] rounded-lg p-2  transition-colors flex flex-col gap-1.5",
      isSelected ? "border-primary border" : "",
    )}
  >
    <div>
      <p
        className="text-dark text-[11px] font-medium truncate w-full"
        title={item.title}
      >
        {item.title}
      </p>
      <p className="text-grey text-[10px]">
        {formatDate(item.acquiredAt)} / {formatGsd(item.gsd)}
      </p>
      <p className="text-grey text-[10px] truncate" title={item.provider}>
        {item.provider}
      </p>
    </div>
    <div className="relative">
      {item.thumbnailUrl ? (
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-24 object-cover"
        />
      ) : (
        <div className="w-full h-24  flex items-center justify-center text-grey text-[10px]">
          No preview
        </div>
      )}
      <span className="mt-2 bg-white  rounded  flex items-start ">
        <ExpandIcon className="w-3 h-3 text-dark" />
      </span>
    </div>
  </button>
);

/**
 * OpenAerialMap overlays for the imagery/location dialog: a centered location
 * search box and — once a density grid cell is selected — the panel of images
 * within that cell. The density grid itself is the OamImageryMap underneath;
 * this component only renders the panels layered over it.
 */
export const OAMImageryPanel = ({
  cellSelected,
  cellCount,
  images,
  loading,
  selectedItem,
  onSelect,
  onSearch,
  searching,
}: {
  cellSelected: boolean;
  cellCount: number;
  images: OAMImageryItem[];
  loading: boolean;
  selectedItem: OAMImageryItem | null;
  onSelect: (item: OAMImageryItem | null) => void;
  onSearch: (query: string) => void;
  searching: boolean;
}) => {
  const [query, setQuery] = useState<string>("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
  };

  return (
    <>
      {/* Centered location search */}
      <form
        onSubmit={handleSearch}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center bg-white rounded-lg shadow-md border border-gray-border overflow-hidden w-[min(360px,60%)]"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search place to map"
          className="flex-1 px-3 py-2.5 text-sm text-dark outline-none min-w-0"
        />
        <button
          type="submit"
          aria-label="Search location"
          disabled={searching}
          className="m-1 px-3 py-1.5 rounded-md bg-off-white border border-gray-border hover:bg-light-gray disabled:opacity-50"
        >
          {searching ? (
            <Spinner style={{ fontSize: "14px" }} />
          ) : (
            <SearchIcon />
          )}
        </button>
      </form>

      {/* Images within the selected grid cell */}
      {cellSelected && (
        <div className="absolute top-4 bottom-4 left-4 z-10 w-[350px] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
          <div className="px-3 py-3 flex items-center gap-2">
            <p className="text-dark text-sm ">
              {cellCount} image{cellCount === 1 ? "" : "s"} within selected grid
              square
            </p>
            {loading && <Spinner style={{ fontSize: "14px" }} />}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 scrollable">
            {!loading && images.length === 0 ? (
              <p className="text-grey text-xs p-2">
                No imagery available in this grid square.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {images.map((item) => (
                  <ImageryCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItem?.id === item.id}
                    onSelect={(clicked) =>
                      onSelect(selectedItem?.id === clicked.id ? null : clicked)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
