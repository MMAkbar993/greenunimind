import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/redux/store";

export interface PlayerPreferences {
  volume: number;
  playbackSpeed: number;
  preferredQuality: string; // 'auto', '1080p', '720p', etc.
  isMuted: boolean; // Track muted state
  lastPosition?: {
    [videoId: string]: number; // Store last position for each video
  };
}

const initialState: PlayerPreferences = {
  volume: 1, // 0 to 1
  playbackSpeed: 1, // Default playback speed
  preferredQuality: 'auto', // Default to auto
  isMuted: false, // Default to unmuted
  lastPosition: {},
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    setPlaybackSpeed: (state, action: PayloadAction<number>) => {
      state.playbackSpeed = action.payload;
    },
    setPreferredQuality: (state, action: PayloadAction<string>) => {
      state.preferredQuality = action.payload;
    },
    setIsMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;
    },
    setLastPosition: (state, action: PayloadAction<{ videoId: string; position: number }>) => {
      const { videoId, position } = action.payload;
      if (!state.lastPosition) {
        state.lastPosition = {};
      }
      state.lastPosition[videoId] = position;
    },
    resetPlayerPreferences: () => initialState,
  },
});

export const {
  setVolume,
  setPlaybackSpeed,
  setPreferredQuality,
  setIsMuted,
  setLastPosition,
  resetPlayerPreferences,
} = playerSlice.actions;

// Selectors
export const selectVolume = (state: RootState) => state.player.volume;
export const selectPlaybackSpeed = (state: RootState) => state.player.playbackSpeed;
export const selectPreferredQuality = (state: RootState) => state.player.preferredQuality;
export const selectIsMuted = (state: RootState) => state.player.isMuted;
export const selectLastPosition = (state: RootState, videoId: string) =>
  state.player.lastPosition?.[videoId] || 0;

export default playerSlice.reducer;
