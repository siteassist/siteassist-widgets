import type { paths } from "@/types/chat-api.gen";
import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import { API_URL } from "./constants";

export const fetchClient = createFetchClient<paths>({
  baseUrl: `${API_URL}/v2`,
});

export const $api = createClient(fetchClient);
