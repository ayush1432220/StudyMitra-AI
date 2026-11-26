import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authAPI } from "../../api/authAPI.js";

let storedUser = null;
try {
  const raw = localStorage.getItem("aia_user");
  storedUser = raw ? JSON.parse(raw) : null;
} catch {
  storedUser = null;
}

const initialState = {
  user: storedUser,
  token: localStorage.getItem("aia_token"),
  status: "idle",
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.login(credentials);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to log in."
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.register(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to create your account."
      );
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.getCurrentUser();
      return data;
    } catch {
      return rejectWithValue("Session expired.");
    }
  }
);

const persist = (payload) => {
  if (payload?.token) localStorage.setItem("aia_token", payload.token);
  if (payload?.user) localStorage.setItem("aia_user", JSON.stringify(payload.user));
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("aia_token");
      localStorage.removeItem("aia_user");
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      persist(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        persist(action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token || null;
        state.error = null;
        persist(action.payload);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload?.user || action.payload;
        if (state.user) localStorage.setItem("aia_user", JSON.stringify(state.user));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.status = "failed";
        state.user = null;
        state.token = null;
        localStorage.removeItem("aia_token");
        localStorage.removeItem("aia_user");
      });
  },
});

export const { logout, clearAuthError, setCredentials } = authSlice.actions;
export default authSlice.reducer;