import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";

const startMappingLinks = [
  {
    title: "Help",
    value: "help",
  },
  {
    title: "Share",
    value: "share",
  },
];
export const StartMappingNavlinks: React.FC = () => {
  const setShowShareModal = useStartMappingStore(
    (state) => state.setShowShareModal,
  );

  return (
    <ul className="hidden lg:flex items-center gap-3">
      {startMappingLinks.map((link) => (
        <li key={link.title} className="px-2 py-2  text-body-2 ">
          <button
            type="button"
            onClick={() =>
              link.title === "Share" ? setShowShareModal(true) : ""
            }
            className="hover:text-gray-900 transition-colors text-inherit font-inherit cursor-pointer"
          >
            {link.title}
          </button>
        </li>
      ))}
    </ul>
  );
};
