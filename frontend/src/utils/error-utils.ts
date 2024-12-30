import axios from 'axios';
import { APPLICATION_ROUTES } from '@/constants';
import { NavigateFunction } from 'react-router-dom';
// errorHandlers.ts

export const handleErrorNavigation = (
  error: unknown,
  navigate: NavigateFunction,
) => {
  const currentPath = window.location.pathname;
  if (axios.isAxiosError(error)) {
    navigate(APPLICATION_ROUTES.NOTFOUND, {
      state: {
        from: currentPath,
        error: error.response?.data?.detail,
      },
    });
  } else {
    const err = error as Error;
    navigate(APPLICATION_ROUTES.NOTFOUND, {
      state: {
        from: currentPath,
        error: err.message,
      },
    });
  }
};
