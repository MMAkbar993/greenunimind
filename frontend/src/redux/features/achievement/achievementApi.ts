import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";

export interface Achievement {
  _id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earnedAt?: string;
}

export const achievementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyAchievements: builder.query<
      { data: Achievement[] },
      void
    >({
      query: () => ({
        url: "/achievements/my",
        method: "GET",
      }),
      providesTags: ["achievements"],
      transformResponse: (response: TResponseRedux<Achievement[]>) => ({
        data: response.data || [],
      }),
    }),
    getAllAchievements: builder.query<
      { data: Achievement[] },
      void
    >({
      query: () => ({
        url: "/achievements",
        method: "GET",
      }),
      providesTags: ["achievements"],
      transformResponse: (response: TResponseRedux<Achievement[]>) => ({
        data: response.data || [],
      }),
    }),
  }),
});

export const {
  useGetMyAchievementsQuery,
  useGetAllAchievementsQuery,
} = achievementApi;
