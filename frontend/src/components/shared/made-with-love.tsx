import { SHARED_CONTENT } from "@/constants";
import { Link } from "@/components/ui/link";

const { madeWithLove } = SHARED_CONTENT.footer;

export const MadeWithLove = () => {
  return (
    <p className="text-body-3 text-center">
      {madeWithLove.firstSegment}{" "}
      <svg
        role="img"
        aria-label={madeWithLove.heartLabel}
        viewBox="0 0 24 24"
        className="inline-block h-4 w-4 fill-primary align-[-0.15em]"
      >
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.8 4.5 6.6 4.5c2.1 0 3.6 1.1 4.4 2.6.8-1.5 2.3-2.6 4.4-2.6 3.8 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z" />
      </svg>{" "}
      {madeWithLove.connector}{" "}
      <Link
        href={"https://www.hotosm.org/"}
        title={madeWithLove.secondSegment}
        blank
        className="!text-body-3"
      >
        <strong>{madeWithLove.secondSegment}</strong>
      </Link>{" "}
      {madeWithLove.thirdSegment}{" "}
      <Link
        href={"https://github.com/hotosm/fAIr/graphs/contributors"}
        title={madeWithLove.fourthSegment}
        blank
        className="!lowercase !text-body-3"
      >
        <strong>{madeWithLove.fourthSegment}</strong>
      </Link>
    </p>
  );
};
