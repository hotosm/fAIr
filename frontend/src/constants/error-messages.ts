
enum ErrorKeys {

    MAP_LOAD_FAILURE = "MAP_LOAD_FAILURE",
}

type ErrorMessages = Record<ErrorKeys, string>;

const errorMessages: ErrorMessages = {
    [ErrorKeys.MAP_LOAD_FAILURE]: "Unable to load the map. Please try again.",
};

export { errorMessages, ErrorKeys };

