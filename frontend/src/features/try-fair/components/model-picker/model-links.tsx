import type { BaseModelStacItem } from "@/features/try-fair/api/stac";

type ModelLink = { label: string; href: string };

const isWebUrl = (href: string) => {
  try {
    return ["http:", "https:"].includes(new URL(href).protocol);
  } catch (error) {
    // STAC hrefs come from outside the app; one that doesn't parse is skipped.
    if (error instanceof TypeError) return false;
    throw error;
  }
};

export const getModelLinks = (
  item: Pick<BaseModelStacItem, "assets">,
): ModelLink[] =>
  [
    { label: "Source code", href: item.assets?.["source-code"]?.href },
    { label: "README", href: item.assets?.readme?.href },
  ].filter((link): link is ModelLink => !!link.href && isWebUrl(link.href));

export const ModelLinks = ({
  item,
}: {
  item: Pick<BaseModelStacItem, "assets">;
}) => {
  const links = getModelLinks(item);
  if (!links.length) return null;
  return (
    <div className="col-span-2 min-w-0">
      <dt className="text-xs text-grey">Links</dt>
      <dd className="flex flex-wrap gap-x-3 text-sm text-dark">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="whitespace-nowrap underline hover:text-primary"
          >
            {link.label}
          </a>
        ))}
      </dd>
    </div>
  );
};
