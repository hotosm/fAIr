import { SHARED_CONTENT } from "@/constants";
import { Link } from "@/components/ui/link";

export const MadeWithLove = () => {
  return (
    <p className="text-body-3 text-center space-x-1">
      <span>{SHARED_CONTENT.footer.madeWithLove.firstSegment}</span>
      <Link
        href={"https://www.hotosm.org/"}
        title={SHARED_CONTENT.footer.madeWithLove.fourthSegment}
        blank
        className="!text-body-3"
      >
        <strong>{SHARED_CONTENT.footer.madeWithLove.secondSegment}</strong>
      </Link>
      <span>{SHARED_CONTENT.footer.madeWithLove.thirdSegment}</span>
      <Link
        href={"https://github.com/hotosm/fAIr/graphs/contributors"}
        title={SHARED_CONTENT.footer.madeWithLove.fourthSegment}
        blank
        className="!lowercase !text-body-3"
      >
        <strong>{SHARED_CONTENT.footer.madeWithLove.fourthSegment}</strong>
      </Link>
    </p>
  );
};
