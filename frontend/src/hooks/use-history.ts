/**
 * Custom hook that provides a `goBack` function to navigate back in the browser history.
 * If there is no history to go back to, it navigates to the root path ('/').
 *
 * @returns {Object} An object containing the `goBack` function.
 *
 * @example
 * const { goBack } = useHistory();
 * goBack(); // Navigates back in history or to the root path if no history exists.
 */
import { useNavigate } from "react-router-dom";

export const useHistory = () => {
  const navigate = useNavigate();

  const goBack = () => {
    /**
     * Why 2?
     * Ref: https://stackoverflow.com/questions/9564041/why-history-length-is-2-for-the-first-page/9564075
     */
    if (window.history?.length && window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  };
  return { goBack };
};
