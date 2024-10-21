const CodeBlock = ({ content }: { content: string }) => {
  return (
    <div className="overflow-x-auto w-full bg-dark p-2">
      <pre className="text-light-gray text-xs">
        <code>{content}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
