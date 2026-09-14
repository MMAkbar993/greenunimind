import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";

export interface IPublicEducator {
  _id: string;
  name: { firstName?: string; middleName?: string; lastName?: string } | string;
  profileImg?: string | null;
  bio?: string;
  specialization?: string;
  totalCourses: number;
  totalStudents: number;
  totalReviews: number;
  averageRating: number;
}

export const publicTeacherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Real educators who have at least one published course — used by the
    // homepage "Top Educators" section and the /educators page.
    getPublicEducators: builder.query<{ data: IPublicEducator[] }, void>({
      query: () => ({
        url: "/teachers/public",
        method: "GET",
      }),
      providesTags: ["educators"],
      transformResponse: (response: TResponseRedux<IPublicEducator[]>) => ({
        data: response.data || [],
      }),
    }),
  }),
});

export const { useGetPublicEducatorsQuery } = publicTeacherApi;
