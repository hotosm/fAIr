import React from "react";

/**
 * `SkeletonWrapper` is a React component that conditionally renders either
 * the provided children or their skeleton placeholders. It is useful for
 * displaying loading states with animated skeletons.
 *
 * This is to prevent having multiple skeleton components in the application. This may be a good candidate for the hotosm/ui
 *
 * @param {React.ReactNode} children - The content to render or skeletonify.
 * @param {boolean} showSkeleton - Determines whether to display the skeleton version.
 *                                  If `true`, skeleton placeholders are rendered.
 *                                  If `false`, the original children are rendered.
 * @param {string} [skeletonClassName="animate-pulse bg-light-gray"] - The Tailwind CSS classes
 *                     applied to the skeleton elements for styling.
 *                     Default is `"animate-pulse bg-light-gray"`.
 *
 * @returns {JSX.Element} The component that either renders the children or their skeleton placeholders.
 *
 * @example
 * // Rendering skeletons when loading
 * import SkeletonWrapper from './SkeletonWrapper';
 *
 * function ExampleComponent({ isLoading }) {
 *   return (
 *     <SkeletonWrapper showSkeleton={isLoading}>
 *       <div className="p-4">
 *         <h1 className="text-lg">Hello, World!</h1>
 *         <p className="text-sm">This is some content.</p>
 *       </div>
 *     </SkeletonWrapper>
 *   );
 * }
 *
 * @example
 * // Custom skeleton class
 * <SkeletonWrapper
 *   showSkeleton={true}
 *   skeletonClassName="animate-pulse bg-gray-200"
 * >
 *   <div className="w-32 h-8">Custom Skeleton</div>
 * </SkeletonWrapper>
 */
const SkeletonWrapper = ({
  children,
  showSkeleton = true,
  skeletonClassName = "",
}: {
  children?: React.ReactNode;
  showSkeleton?: boolean;
  skeletonClassName?: string;
}) => {
  if (!showSkeleton) return <>{children}</>;

  const skeletonfyChildren = (child: React.ReactNode) => {
    if (!React.isValidElement(child)) {
      // For unsupported elements
      return <div className={`${skeletonClassName} h-4 w-full`} />;
    }
    const style = {
      width: child.props.style?.width,
      height: child.props.style?.height,
    };

    return (
      <span
        className={`block animate-pulse bg-light-gray ${skeletonClassName} ${child.props.className || ""}`}
        style={style}
      />
    );
  };

  return (
    <span className="block">
      {React.Children.map(children, (child) => skeletonfyChildren(child))}
    </span>
  );
};

export default SkeletonWrapper;
