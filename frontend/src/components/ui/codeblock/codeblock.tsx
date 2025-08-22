import { CopyButton } from "@/components/ui/copy-button";

const CodeBlock = ({ content }: { content: string }) => {
  return (
    <div className="h-80 w-full bg-dark p-2">
      <div className="flex h-auto items-end justify-end">
        <CopyButton
          text={content}
          tooltipContent="Copy logs"
          iconClassName="text-white"
        />
      </div>
      <pre className="scrollable h-64 overflow-auto p-2 text-xs text-light-gray">
        <code>{content}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
