// Direct API client — replaces base44Client.
// All calls go straight to the Express backend. In dev, NEXT_PUBLIC_API_BASE
// (http://localhost:5000) bypasses the Next.js dev proxy which has a ~5MB body
// size limit for proxied requests; otherwise falls back to /api (proxied).
// When NEXT_PUBLIC_API_BASE is an absolute URL, /api is appended since Express
// mounts all API routes under /api.
import { io } from "socket.io-client";

const API_BASE = (() => {
  const base =
    typeof window !== "undefined" && window.NEXT_PUBLIC_API_BASE
      ? window.NEXT_PUBLIC_API_BASE
      : process.env.NEXT_PUBLIC_API_BASE || "/api";
  if (base === "/api" || !base) return base;
  // Absolute URL: ensure it ends with /api
  return base.endsWith("/api") ? base : `${base.replace(/\/+$/, "")}/api`;
})();


// Socket.io connects directly to the Express backend (port 5000), not through
// Next.js dev proxy — Next.js dev rewrites don't forward WebSocket upgrades.
const SOCKET_URL =
  typeof window !== "undefined" && window.NEXT_PUBLIC_SOCKET_URL
    ? window.NEXT_PUBLIC_SOCKET_URL
    : process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

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

  // Permanently delete the signed-in account and all of its data.
  deleteAccount: async () =>
    await request("/auth/me", {
      method: "DELETE",
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
      let skip = 0;
      if (typeof sortOrOptions === "string") {
        sort = sortOrOptions;
      } else if (typeof sortOrOptions === "object" && sortOrOptions !== null) {
        if (sortOrOptions.sort) sort = sortOrOptions.sort;
        if (sortOrOptions.limit) lim = sortOrOptions.limit;
        if (sortOrOptions.skip) skip = sortOrOptions.skip;
      }
      const res = await request(`/entities/${entityName}/filter`, {
        method: "POST",
        body: JSON.stringify({ query, sort, limit: lim, skip }),
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
    globalSocket = io(SOCKET_URL, {
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
      const socket = io(SOCKET_URL, {
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

// ── Videos (canonical /api/videos — ownership via session reciter_id) ──
export const videos = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.category) q.set("category", params.category);
    if (params.reciter_id) q.set("reciter_id", params.reciter_id);
    if (params.reciter_name) q.set("reciter_name", params.reciter_name);
    if (params.mine === true || params.mine === 1 || params.mine === "1") {
      q.set("mine", "1");
    }
    if (params.competition_id) q.set("competition_id", params.competition_id);
    if (params.verse_key) q.set("verse_key", params.verse_key);
    if (params.is_live !== undefined) q.set("is_live", String(params.is_live));
    if (params.is_competition !== undefined) {
      q.set("is_competition", String(params.is_competition));
    }
    if (params.featured !== undefined) q.set("featured", String(params.featured));
    if (params.sort) q.set("sort", params.sort);
    if (params.limit !== undefined) q.set("limit", String(params.limit));
    if (params.skip !== undefined) q.set("skip", String(params.skip));
    const qs = q.toString() ? `?${q.toString()}` : "";
    return request(`/videos${qs}`).then((res) =>
      makeResultArray(res.items || [], res)
    );
  },

  get: (id) => request(`/videos/${id}`),

  create: (payload) =>
    request("/videos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    request(`/videos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (id) =>
    request(`/videos/${id}`, {
      method: "DELETE",
    }),

  recordView: (id, data = {}) =>
    request(`/videos/${id}/view`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  analytics: (id) => request(`/videos/${id}/analytics`),
};

// ── Competitions ──
export const competitions = {
  listEntries: (competitionId, params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.sort) q.set("sort", params.sort);
    if (params.limit) q.set("limit", String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : "";
    return request(`/competitions/${competitionId}/entries${qs}`);
  },
  vote: (competitionId, entryId, vote_type = "upvote") =>
    request(`/competitions/${competitionId}/entries/${entryId}/vote`, {
      method: "POST",
      body: JSON.stringify({ vote_type }),
    }),
  results: (competitionId) => request(`/competitions/${competitionId}/results`),
  judge: (entryId, data) =>
    request(`/competitions/entries/${entryId}/judge`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Khatm (atomic reserve / release / complete) ──
export const khatm = {
  reservePart: (partId) =>
    request(`/khatm/parts/${partId}/reserve`, { method: "POST", body: "{}" }),
  releasePart: (partId) =>
    request(`/khatm/parts/${partId}/release`, { method: "POST", body: "{}" }),
  completePart: (partId) =>
    request(`/khatm/parts/${partId}/complete`, { method: "POST", body: "{}" }),
};

// ── Live Streaming (LiveKit SFU) ──
export const live = {
  getToken: (roomId, connId) => {
    const q = new URLSearchParams({ room: roomId });
    if (connId) q.set('connId', connId);
    return request(`/live/token?${q.toString()}`);
  },
};

// ── Smart Hifz Companion ──
export const hifz = {
  getProgress: () => request('/hifz/progress'),
  submitReview: (data) =>
    request('/hifz/review', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  syncProgress: (items) =>
    request('/hifz/sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  getGoals: () => request('/hifz/goals'),
  createGoal: (data) =>
    request('/hifz/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Unified API object
export const api = {
  auth,
  entities,
  integrations,
  actors,
  socket,
  gamification,
  videos,
  competitions,
  khatm,
  live,
  hifz,
};

export default api;
