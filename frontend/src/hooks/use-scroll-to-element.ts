/**
 * Custom hook to scroll to an element by its ID.
 *
 * This hook provides a function to smoothly scroll to an HTML element
 * specified by its `id`. The element is scrolled into view with a smooth animation,
 * and it aligns the element to the center of the viewport.
 *
 * @param {string} id - The ID of the target element to scroll to.
 * @returns {object} { scrollToElement } - An object containing the `scrollToElement` function.
 *
 * Usage:
 * const { scrollToElement } = useScrollToElement('target-id');
 * scrollToElement(); // Scrolls to the element with the specified ID.
 */
export const useScrollToElement = (id: string) => {
  const scrollToElement = () => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
  return { scrollToElement };
};

/**
 * Custom hook to scroll to the top of the screen.
 *
 * This hook provides a function to smoothly scroll to the top.
 * @returns {object} { scrollToTop } - An object containing the `scrollToTop` function.
 *
 * Usage:
 * const { scrollToTop } = useScrollToTop();
 * scrollToTop(); // Scrolls to the top of the page.
 */
export const useScrollToTop = () => {
  const scrollToTop = () => {
    // Scroll to top on page switch.
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  return { scrollToTop };
};
