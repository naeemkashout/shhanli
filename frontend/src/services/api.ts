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
  return (
    LOCAL_API_BASE_URLS[(currentIndex + 1) % LOCAL_API_BASE_URLS.length] || null
  );
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
      (originalRequest._baseUrlRetryIndex ?? 0) <
        LOCAL_API_BASE_URLS.length - 1 &&
      nextBaseUrl &&
      nextBaseUrl !== currentBaseUrl
    ) {
      originalRequest._baseUrlRetryIndex =
        (originalRequest._baseUrlRetryIndex ?? 0) + 1;
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
  const hasArabicText = (value: string) => /[\u0600-\u06FF]/.test(value);

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

  const translateServerMessage = (message?: string) => {
    if (!message || typeof message !== "string") return null;

    const normalized = message.trim();
    if (!normalized) return null;

    const baseMessages = [
      {
        en: "Invalid action",
        ar: "إجراء غير صالح",
      },
      {
        en: "Shipment not found",
        ar: "الشحنة غير موجودة",
      },
      {
        en: "Not authorized to review this request",
        ar: "غير مخول لمراجعة هذا الطلب",
      },
      {
        en: "No pending edit request for this shipment",
        ar: "لا يوجد طلب تعديل معلّق لهذه الشحنة",
      },
      {
        en: "No pending cancellation request for this shipment",
        ar: "لا يوجد طلب إلغاء معلّق لهذه الشحنة",
      },
      {
        en: "Edit request approved",
        ar: "تمت الموافقة على طلب التعديل",
      },
      {
        en: "Edit request rejected",
        ar: "تم رفض طلب التعديل",
      },
      {
        en: "Cancellation request approved",
        ar: "تمت الموافقة على طلب الإلغاء",
      },
      {
        en: "Cancellation request rejected",
        ar: "تم رفض طلب الإلغاء",
      },
      {
        en: "Edit request reason is required",
        ar: "سبب طلب التعديل مطلوب",
      },
      {
        en: "Requested changes details are required",
        ar: "تفاصيل التعديلات المطلوبة مطلوبة",
      },
      {
        en: "Not authorized to edit this shipment",
        ar: "غير مخول لتعديل هذه الشحنة",
      },
      {
        en: "Only pending shipments can be edited",
        ar: "يمكن تعديل الشحنات المعلقة فقط",
      },
      {
        en: "Cannot request edit while cancellation request is pending",
        ar: "لا يمكن طلب تعديل أثناء وجود طلب إلغاء معلّق",
      },
      {
        en: "Edit request already submitted",
        ar: "تم إرسال طلب التعديل مسبقا",
      },
      {
        en: "Shipment edit request submitted successfully",
        ar: "تم إرسال طلب تعديل الشحنة بنجاح",
      },
      {
        en: "Cancellation reason is required",
        ar: "سبب الإلغاء مطلوب",
      },
      {
        en: "Not authorized to cancel this shipment",
        ar: "غير مخول لإلغاء هذه الشحنة",
      },
      {
        en: "Cannot cancel this shipment",
        ar: "لا يمكن إلغاء هذه الشحنة",
      },
      {
        en: "Cancellation request already submitted",
        ar: "تم إرسال طلب الإلغاء مسبقا",
      },
      {
        en: "Cancellation request submitted successfully",
        ar: "تم إرسال طلب الإلغاء بنجاح",
      },
      {
        en: "Error requesting shipment edit",
        ar: "حدث خطأ أثناء إرسال طلب تعديل الشحنة",
      },
      {
        en: "Error reviewing edit request",
        ar: "حدث خطأ أثناء مراجعة طلب التعديل",
      },
      {
        en: "Error cancelling shipment",
        ar: "حدث خطأ أثناء إلغاء الشحنة",
      },
      {
        en: "Error fetching edit requests",
        ar: "حدث خطأ أثناء تحميل طلبات التعديل",
      },
      {
        en: "Error fetching cancellation requests",
        ar: "حدث خطأ أثناء تحميل طلبات الإلغاء",
      },
      {
        en: "Error fetching shipments",
        ar: "حدث خطأ أثناء تحميل الشحنات",
      },
      {
        en: "Error fetching shipment",
        ar: "حدث خطأ أثناء تحميل الشحنة",
      },
      {
        en: "Error tracking shipment",
        ar: "حدث خطأ أثناء تتبع الشحنة",
      },
      {
        en: "Error creating shipment",
        ar: "حدث خطأ أثناء إنشاء الشحنة",
      },
      {
        en: "Invalid shipping company",
        ar: "شركة الشحن المحددة غير صالحة",
      },
      {
        en: "Shipping company is not available",
        ar: "شركة الشحن غير متاحة",
      },
      {
        en: "Selected company does not support local shipping",
        ar: "الشركة المحددة لا تدعم الشحن المحلي",
      },
      {
        en: "Selected company does not support international shipping",
        ar: "الشركة المحددة لا تدعم الشحن الدولي",
      },
      {
        en: "For international shipping, sender country cannot be the same as receiver country",
        ar: "في الشحن الدولي لا يمكن أن تكون دولة المرسل هي نفسها دولة المستلم",
      },
      {
        en: "Selected company does not support cash on delivery",
        ar: "الشركة المحددة لا تدعم الدفع عند التسليم",
      },
      {
        en: "Selected company does not support express shipping",
        ar: "الشركة المحددة لا تدعم الشحن السريع",
      },
      {
        en: "Invalid payment method",
        ar: "طريقة الدفع غير صالحة",
      },
      {
        en: "Invalid shipping type",
        ar: "نوع الشحن غير صالح",
      },
      {
        en: "Invalid shipping mode",
        ar: "وضع الشحن غير صالح",
      },
      {
        en: "Invalid shipment data",
        ar: "بيانات الشحنة غير صالحة",
      },
      {
        en: "Invalid shipment data format",
        ar: "تنسيق بيانات الشحنة غير صالح",
      },
      {
        en: "User not found",
        ar: "المستخدم غير موجود",
      },
      {
        en: "Insufficient balance",
        ar: "الرصيد غير كاف",
      },
      {
        en: "Not authorized to access this shipment",
        ar: "غير مخول للوصول إلى هذه الشحنة",
      },
      {
        en: "Request has already been reviewed and cannot be processed again",
        ar: "تمت مراجعة الطلب مسبقا ولا يمكن معالجته مرة أخرى",
      },
    ];

    const exactMatch = baseMessages.find(
      (item) =>
        item.en.toLowerCase() === normalized.toLowerCase() ||
        item.ar === normalized,
    );

    if (exactMatch) {
      return language === "ar" ? exactMatch.ar : exactMatch.en;
    }

    const localStatePrefixEn = "Selected company does not support local state:";
    const localStatePrefixAr = "الشركة المحددة لا تدعم الولاية المحلية:";
    if (normalized.startsWith(localStatePrefixEn)) {
      const stateName = normalized.slice(localStatePrefixEn.length).trim();
      return language === "ar"
        ? `${localStatePrefixAr} ${stateName}`
        : `${localStatePrefixEn} ${stateName}`;
    }

    const countryPrefixEn = "Selected company does not support country:";
    const countryPrefixAr = "الشركة المحددة لا تدعم الدولة:";
    if (normalized.startsWith(countryPrefixEn)) {
      const countryName = normalized.slice(countryPrefixEn.length).trim();
      return language === "ar"
        ? `${countryPrefixAr} ${countryName}`
        : `${countryPrefixEn} ${countryName}`;
    }

    const prefixedErrors = [
      {
        en: "Error requesting shipment edit:",
        ar: "حدث خطأ أثناء إرسال طلب تعديل الشحنة:",
      },
      {
        en: "Error reviewing edit request:",
        ar: "حدث خطأ أثناء مراجعة طلب التعديل:",
      },
      {
        en: "Error cancelling shipment:",
        ar: "حدث خطأ أثناء إلغاء الشحنة:",
      },
      {
        en: "Error creating shipment:",
        ar: "حدث خطأ أثناء إنشاء الشحنة:",
      },
    ];

    const matchedPrefix = prefixedErrors.find((item) =>
      normalized.toLowerCase().startsWith(item.en.toLowerCase()),
    );

    if (matchedPrefix) {
      const detail = normalized.slice(matchedPrefix.en.length).trim();
      const translatedDetail = translateServerMessage(detail) || detail;
      const prefix = language === "ar" ? matchedPrefix.ar : matchedPrefix.en;
      return translatedDetail ? `${prefix} ${translatedDetail}` : prefix;
    }

    if (language === "ar" && hasArabicText(normalized)) return normalized;
    if (language === "en" && !hasArabicText(normalized)) return normalized;

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

    const translatedServerMessage = translateServerMessage(serverMessage);
    if (translatedServerMessage) {
      return translatedServerMessage;
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
