import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const LOCAL_API_BASE_URLS = [
  "http://localhost:5001/api",
  "http://localhost:5002/api",
  "http://localhost:5003/api",
  "http://localhost:5004/api",
  "http://localhost:5005/api",
  "http://localhost:5006/api",
  "http://localhost:5007/api",
  "http://localhost:5008/api",
  "http://localhost:5009/api",
  "http://localhost:5010/api",
];
const PRIMARY_LOCAL_API_URL = LOCAL_API_BASE_URLS[0];
const ACTIVE_API_BASE_URL_KEY = "kashout_active_api_base_url";

const getInitialApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  const storedBaseUrl = localStorage.getItem(ACTIVE_API_BASE_URL_KEY);
  if (storedBaseUrl && LOCAL_API_BASE_URLS.includes(storedBaseUrl)) {
    return storedBaseUrl;
  }

  return PRIMARY_LOCAL_API_URL;
};

const API_BASE_URL = getInitialApiBaseUrl();
const IS_CUSTOM_API_URL = Boolean(import.meta.env.VITE_API_URL);

const getNextLocalApiBaseUrl = (currentBaseUrl: string) => {
  const currentIndex = LOCAL_API_BASE_URLS.indexOf(currentBaseUrl);
  if (currentIndex === -1) return LOCAL_API_BASE_URLS[0] || null;
  return LOCAL_API_BASE_URLS[currentIndex + 1] || null;
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("kashout_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _baseUrlRetryIndex?: number;
    };

    // If backend auto-switched port, retry on the next local API base URL.
    const currentBaseUrl = (originalRequest?.baseURL as string) || API_BASE_URL;
    const serverMessage = String(error.response?.data?.message || "");
    const isDatabaseConnectionError =
      serverMessage.includes("قاعدة البيانات غير متصلة") ||
      /database\s+is\s+not\s+connected/i.test(serverMessage);
    const shouldRetryOnFallback =
      !error.response ||
      [404, 503].includes(error.response.status) ||
      isDatabaseConnectionError;
    const nextBaseUrl = getNextLocalApiBaseUrl(currentBaseUrl);

    if (
      !IS_CUSTOM_API_URL &&
      originalRequest &&
      shouldRetryOnFallback &&
      nextBaseUrl &&
      nextBaseUrl !== currentBaseUrl
    ) {
      originalRequest._baseUrlRetryIndex =
        (originalRequest._baseUrlRetryIndex ??
          LOCAL_API_BASE_URLS.indexOf(currentBaseUrl)) + 1;
      originalRequest.baseURL = nextBaseUrl;
      api.defaults.baseURL = nextBaseUrl;
      localStorage.setItem(ACTIVE_API_BASE_URL_KEY, nextBaseUrl);
      return api(originalRequest);
    }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("kashout_refresh_token");
        if (refreshToken) {
          const refreshBaseUrl = api.defaults.baseURL || API_BASE_URL;
          const response = await axios.post(`${refreshBaseUrl}/auth/refresh`, {
            refreshToken,
          });

          const { token, refreshToken: newRefreshToken } = response.data.data;

          localStorage.setItem("kashout_token", token);
          localStorage.setItem("kashout_refresh_token", newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem("kashout_token");
        localStorage.removeItem("kashout_refresh_token");
        localStorage.removeItem("kashout_user");
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  const language = (localStorage.getItem("language") as "ar" | "en") || "ar";

  const translations = {
    ar: {
      serverError: "خطأ في الخادم",
      unauthorized: "يجب تسجيل الدخول للمتابعة.",
      forbidden: "ليس لديك صلاحية للوصول إلى هذا المسار.",
      roleNotAuthorized: "صلاحية حسابك الحالية لا تسمح بالوصول إلى هذا المسار.",
      networkError: "تعذر الاتصال بالخادم. تحقق من الشبكة وحاول مرة أخرى.",
      internetDisconnected:
        "لا يوجد اتصال بالإنترنت. تحقق من الشبكة وحاول مرة أخرى.",
      requestTimeout: "انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.",
      noResponse: "لا يوجد رد من الخادم. يرجى التحقق من الاتصال.",
      unexpectedError: "حدث خطأ غير متوقع",
    },
    en: {
      serverError: "Server error",
      unauthorized: "Please sign in to continue.",
      forbidden: "You are not authorized to access this route.",
      roleNotAuthorized:
        "Your current account role is not allowed to access this route.",
      networkError:
        "Unable to connect to server. Please check your network and try again.",
      internetDisconnected:
        "No internet connection. Please check your network and try again.",
      requestTimeout:
        "Request timed out while contacting the server. Please try again.",
      noResponse: "No response from server. Please check your connection.",
      unexpectedError: "An unexpected error occurred",
    },
  };

  const mapAuthorizationMessage = (message?: string) => {
    if (!message || typeof message !== "string") return null;

    const lowerMessage = message.toLowerCase();
    const routeUnauthorized = "not authorized to access this route";

    if (lowerMessage.includes(routeUnauthorized)) {
      const roleMatch = message.match(/User role '([^']+)'/i);
      if (roleMatch?.[1]) {
        return language === "ar"
          ? `الدور '${roleMatch[1]}' غير مخوّل للوصول إلى هذا المسار.`
          : `User role '${roleMatch[1]}' is not authorized to access this route.`;
      }

      if (lowerMessage.includes("user role")) {
        return translations[language].roleNotAuthorized;
      }

      return translations[language].forbidden;
    }

    return null;
  };

  const mapFinancialMessage = (message?: string) => {
    if (!message || typeof message !== "string") return null;

    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("insufficient balance") ||
      lowerMessage.includes("insufficient funds")
    ) {
      return language === "ar" ? "الرصيد غير كاف." : "Insufficient balance.";
    }

    return null;
  };

  if (error.response) {
    const statusCode = error.response.status;
    const serverMessage = error.response.data?.message;
    const mappedAuthorizationMessage = mapAuthorizationMessage(serverMessage);
    const mappedFinancialMessage = mapFinancialMessage(serverMessage);

    if (mappedAuthorizationMessage) {
      return mappedAuthorizationMessage;
    }

    if (mappedFinancialMessage) {
      return mappedFinancialMessage;
    }

    if (statusCode === 401) {
      return translations[language].unauthorized;
    }

    if (statusCode === 403) {
      return translations[language].forbidden;
    }

    return serverMessage || translations[language].serverError;
  } else if (error.request) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return translations[language].internetDisconnected;
    }

    if (error.code === "ECONNABORTED") {
      return translations[language].requestTimeout;
    }

    if ((error as AxiosError)?.message?.toLowerCase().includes("network")) {
      return translations[language].networkError;
    }

    return translations[language].noResponse;
  } else {
    return error.message || translations[language].unexpectedError;
  }
};
