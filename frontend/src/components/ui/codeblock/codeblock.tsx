import { CopyButton } from "@/components/ui/copy-button";

const CodeBlock = ({ content }: { content: string }) => {
  return (
    <div className="w-full bg-dark p-2 h-80">
      <div className="h-auto flex items-end justify-end">
        <CopyButton
          text={content}
          tooltipContent="Copy logs"
          iconClassName="text-white"
        />
      </div>
      <pre className="text-light-gray text-xs h-64 overflow-auto p-2 scrollable">
        <code>{content}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
