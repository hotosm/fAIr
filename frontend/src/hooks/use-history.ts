import { APPLICATION_ROUTES } from "@/constants";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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

export const useHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { modelId } = useParams();

  const goBack = () => {
    const from = location.state?.from;
    /**
     * If the current path is the start mapping page and modelId exists, navigate to the model details page.
     * This is useful since technically on the start mapping page, the button they click is 'stop mapping' and not 'go back', so
     * it's safe to redirect them to the model details page whenever they click on the 'stop mapping' button.
     * This is a workaround for the fact that the history stack on the page is modified by the hash, and search params.
     * So rather that trying to hack the history stack, we just redirect them to the model details page.
     * For other pages, we just navigate back in history.
     */
    if (
      location.pathname.includes(APPLICATION_ROUTES.START_MAPPING_BASE) &&
      modelId
    ) {
      navigate(`${APPLICATION_ROUTES.MODELS}/${modelId}`, {
        replace: true,
        state: { from: location.pathname },
      });
    } else if (from && from.includes(APPLICATION_ROUTES.START_MAPPING_BASE)) {
      /**
       * Skip going back to start mapping again.
       */
      if (window.history?.length && window.history.length > 2) {
        navigate(-2);
      } else {
        navigate("/", { replace: true });
      }

      /**
       * Why 2?
       * Ref: https://stackoverflow.com/questions/9564041/why-history-length-is-2-for-the-first-page/9564075
       */
    } else if (window.history?.length && window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  };
  return { goBack };
};
