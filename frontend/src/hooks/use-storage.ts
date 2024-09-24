

/**
 * This hook is used to manage the retrieval, creation and deletion of objects in the localstorage.
 * @returns getValue(), setValue(), removeValue().
 */
export const useLocalStorage = () => {

    const getValue = (key: string): string | undefined => {
        try {
            const item = localStorage.getItem(key);
            return item ? item : undefined;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    };

    const setValue = (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error(error);
        }
    };

    const removeValue = (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(error);
        }
    };

    return { getValue, setValue, removeValue };
};

/**
 * This hook is used to manage the retrieval, creation and deletion of objects in the session storage.
 * @returns getValue(), setValue(), removeValue().
 */
export const useSessionStorage = () => {
    const getValue = (key: string): string | undefined => {
        try {
            const item = sessionStorage.getItem(key);
            return item ? item : undefined;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    };

    const setValue = (key: string, value: string): void => {
        try {
            sessionStorage.setItem(key, value);
        } catch (error) {
            console.error(error);
        }
    };

    const removeValue = (key: string): void => {
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            console.error(error);
        }
    };

    return { getValue, setValue, removeValue };
};
