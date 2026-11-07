// Direct API client — replaces base44Client.
// All calls go straight to the Express backend on /api/* (proxied by next.config.mjs in dev).
import { io } from "socket.io-client";

const API_BASE = "/api";

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("base44_access_token") ||
    localStorage.getItem("token") ||
    null
  );
}

function setStoredToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("base44_access_token", token);
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("base44_access_token");
    localStorage.removeItem("token");
  }
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = { ...(options.headers || {}) };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Auto-logout on 401 (token expired or invalid)
  if (res.status === 401) {
    setStoredToken(null);
    const error = new Error("Session expired");
    error.status = 401;
    throw error;
  }

  if (!res.ok) {
    let errData = {};
    try {
      errData = await res.json();
    } catch {}
    const error = new Error(errData.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = errData;
    throw error;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// Wrap array so that both Array methods (arr.map, arr.filter, arr[0])
// and object access (arr.items, arr.has_more, arr.next_cursor) work smoothly
function makeResultArray(items = [], meta = {}) {
  const arr = Array.isArray(items) ? [...items] : [];
  arr.items = arr;
  arr.has_more = !!meta.has_more;
  arr.next_cursor = meta.next_cursor || null;
  arr.total = meta.total !== undefined ? meta.total : arr.length;
  return arr;
}

// ── Auth ──
export const auth = {
  getToken: getStoredToken,
  setToken: (token) => setStoredToken(token),
  isAuthenticated: () => !!getStoredToken(),

  me: async () => await request("/auth/me"),

  getCaptcha: async () => await request("/auth/captcha"),

  sendOtpPhone: async ({ phone, captchaId, captchaAnswer }) =>
    await request("/auth/send-otp-phone", {
      method: "POST",
      body: JSON.stringify({ phone, captchaId, captchaAnswer }),
    }),

  verifyOtpPhone: async ({ phone, otp }) => {
    const data = await request("/auth/verify-otp-phone", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });
    if (data.access_token || data.token) {
      setStoredToken(data.access_token || data.token);
    }
    return data;
  },

  completeProfile: async ({ full_name }) =>
    await request("/auth/complete-profile", {
      method: "POST",
      body: JSON.stringify({ full_name }),
    }),

  loginViaEmailPassword: async (email, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token || data.token) {
      setStoredToken(data.access_token || data.token);
    }
    return data;
  },

  register: async ({ email, password, full_name }) =>
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    }),

  verifyOtp: async ({ email, otpCode }) => {
    const data = await request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otpCode }),
    });
    if (data.access_token || data.token) {
      setStoredToken(data.access_token || data.token);
    }
    return data;
  },

  resendOtp: async (email) =>
    await request("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPasswordRequest: async (email) =>
    await request("/auth/reset-password-request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: async ({ resetToken, newPassword }) =>
    await request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ resetToken, newPassword }),
    }),

  updateMe: async (updates) =>
    await request("/auth/me", {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  logout: (redirectUrl) => {
    setStoredToken(null);
    if (redirectUrl && typeof window !== "undefined") {
      window.location.href = redirectUrl;
    }
  },

  redirectToLogin: (returnTo) => {
    if (typeof window !== "undefined") {
      window.location.href = returnTo
        ? `/login?returnTo=${encodeURIComponent(returnTo)}`
        : "/login";
    }
  },

  loginWithProvider: (provider, returnTo = "/") => {
    if (typeof window !== "undefined") {
      window.location.href = `/login?provider=${provider}&returnTo=${encodeURIComponent(returnTo)}`;
    }
  },
};

// ── Entities (dynamic proxy like base44) ──
function createEntityClient(entityName) {
  return {
    list: async (sortOrOptions, limit) => {
      let queryParams = new URLSearchParams();
      if (typeof sortOrOptions === "string") {
        queryParams.set("sort", sortOrOptions);
        if (limit) queryParams.set("limit", String(limit));
      } else if (typeof sortOrOptions === "object" && sortOrOptions !== null) {
        for (const [key, val] of Object.entries(sortOrOptions)) {
          if (val !== undefined && val !== null) {
            queryParams.set(key, String(val));
          }
        }
        if (limit && !sortOrOptions.limit) {
          queryParams.set("limit", String(limit));
        }
      }
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const res = await request(`/entities/${entityName}${queryString}`);
      return makeResultArray(res.items || [], res);
    },

    filter: async (query = {}, sortOrOptions, limit) => {
      let sort = "-created_date";
      let lim = limit || 100;
      if (typeof sortOrOptions === "string") {
        sort = sortOrOptions;
      } else if (typeof sortOrOptions === "object" && sortOrOptions !== null) {
        if (sortOrOptions.sort) sort = sortOrOptions.sort;
        if (sortOrOptions.limit) lim = sortOrOptions.limit;
      }
      const res = await request(`/entities/${entityName}/filter`, {
        method: "POST",
        body: JSON.stringify({ query, sort, limit: lim }),
      });
      return makeResultArray(res.items || [], res);
    },

    get: async (id) => await request(`/entities/${entityName}/${id}`),

    create: async (payload) =>
      await request(`/entities/${entityName}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    update: async (id, payload) =>
      await request(`/entities/${entityName}/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),

    delete: async (id) =>
      await request(`/entities/${entityName}/${id}`, {
        method: "DELETE",
      }),

    bulkCreate: async (items) =>
      await request(`/entities/${entityName}/bulk`, {
        method: "POST",
        body: JSON.stringify({ items }),
      }),

    deleteMany: async (query) =>
      await request(`/entities/${entityName}/delete-many`, {
        method: "POST",
        body: JSON.stringify(query),
      }),

    subscribe: (callback) => {
      const socket = getSocket();
      if (!socket) return () => {};
      const handler = (event) => {
        if (event.entity === entityName) {
          callback(event);
        }
      };
      socket.on("entity:change", handler);
      return () => {
        socket.off("entity:change", handler);
      };
    },
  };
}

export const entities = new Proxy(
  {},
  {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      if (!target[prop]) {
        target[prop] = createEntityClient(prop);
      }
      return target[prop];
    },
  }
);

// ── Integrations ──
export const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      const formData = new FormData();
      formData.append("file", file);
      return await request("/integrations/upload", {
        method: "POST",
        body: formData,
      });
    },

    UploadPublicFile: async ({ file }) => {
      const formData = new FormData();
      formData.append("file", file);
      return await request("/integrations/upload", {
        method: "POST",
        body: formData,
      });
    },

    InvokeLLM: async ({ prompt, response_json_schema }) =>
      await request("/integrations/llm", {
        method: "POST",
        body: JSON.stringify({ prompt, response_json_schema }),
      }),
  },
};

// ── Actors (LiveRoom) ──
let globalSocket = null;
function getSocket() {
  if (typeof window === "undefined") return null;
  if (!globalSocket) {
    const token = getStoredToken();
    globalSocket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
      query: token ? { token } : {},
    });
  }
  return globalSocket;
}

export const actors = {
  LiveRoom: (roomId) => ({
    connect: ({ id }) => {
      const token = getStoredToken();
      const socket = io({
        path: "/socket.io",
        query: { connId: id, ...(token ? { token } : {}) },
        transports: ["websocket", "polling"],
      });
      socket.emit("join_room", { roomId, connId: id });
      return {
        subscribe: (cb) => {
          socket.on("message", cb);
          return () => {
            socket.off("message", cb);
          };
        },
        send: (msg) => {
          socket.emit("message", msg);
        },
        close: () => {
          socket.disconnect();
        },
      };
    },
  }),
};

// ── Socket ──
export const socket = {
  get: getSocket,
  on: (event, callback) => {
    const s = getSocket();
    if (!s) return () => {};
    s.on(event, callback);
    return () => {
      s.off(event, callback);
    };
  },
  emit: (event, data) => {
    const s = getSocket();
    if (s) s.emit(event, data);
  },
};

// ── Gamification ──
export const gamification = {
  getStatus: () => request("/gamification/status"),
  getDailyContent: () => request("/gamification/daily-content"),
  trackActivity: (data) =>
    request("/gamification/track-activity", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  completeQuest: (data) =>
    request("/gamification/complete-quest", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getLeaderboard: (type = "xp") =>
    request(`/gamification/leaderboard?type=${encodeURIComponent(type)}`),
};

// Unified API object
export const api = {
  auth,
  entities,
  integrations,
  actors,
  socket,
  gamification,
};

export default api;
