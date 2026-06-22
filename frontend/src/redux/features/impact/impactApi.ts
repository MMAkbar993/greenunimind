import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";

export interface ImpactReportPeriod {
  year: number;
  month: number;
  label: string;
}

export interface ImpactReportData {
  period: ImpactReportPeriod;
  newEnrollments: number;
  newCoursesPublished: number;
  certificatesIssued: number;
  lecturesCompletedThisMonth: number;
  watchTimeMinutes: number;
  totalStudents: number;
  totalTeachers: number;
  totalPublishedCourses: number;
  totalEnrollments: number;
}

export const impactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMonthlyImpactReport: builder.query<
      { data: ImpactReportData },
      { year?: number; month?: number }
    >({
      query: ({ year, month }) => {
        const params = new URLSearchParams();
        if (year) params.append("year", String(year));
        if (month) params.append("month", String(month));
        return {
          url: `/impact/report${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["impact"],
      transformResponse: (response: TResponseRedux<ImpactReportData>) => ({
        data: response.data,
      }),
    }),

    getAvailableMonths: builder.query<{ data: { year: number; month: number }[] }, void>({
      query: () => ({
        url: "/impact/available-months",
        method: "GET",
      }),
      providesTags: ["impact"],
      transformResponse: (response: TResponseRedux<{ year: number; month: number }[]>) => ({
        data: response.data || [],
      }),
    }),
  }),
});

export const {
  useGetMonthlyImpactReportQuery,
  useGetAvailableMonthsQuery,
} = impactApi;
