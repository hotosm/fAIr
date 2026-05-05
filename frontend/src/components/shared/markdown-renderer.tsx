import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "markdown-prose", // Default class for styling, can be overridden by passing a different className
}) => {
  return (
    <div className={`prose max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};
