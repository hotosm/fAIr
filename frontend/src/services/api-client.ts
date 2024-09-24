import Axios from "axios";
import { REACT_APP_BASE_API_URL } from "@/config/env";

export const apiClient = Axios.create({
    baseURL: REACT_APP_BASE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});