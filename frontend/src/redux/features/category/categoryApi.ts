import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subcategories?: ISubCategory[];
}

export interface ISubCategory {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICategoryWithSubcategories extends ICategory {
  subcategories: ISubCategory[];
}

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all categories (simple list)
    getAllCategories: builder.query<{ data: ICategory[] }, void>({
      query: () => ({
        url: "/categories",
        method: "GET",
      }),
      providesTags: ["categories"],
      transformResponse: (response: TResponseRedux<ICategory[]>) => ({
        data: response.data || [],
      }),
    }),

    // Get all categories with their subcategories (nested)
    getAllCategoriesWithSubcategories: builder.query<{ data: ICategoryWithSubcategories[] }, void>({
      query: () => ({
        url: "/categories/with-subcategories",
        method: "GET",
      }),
      providesTags: ["categories", "subcategories"],
      transformResponse: (response: TResponseRedux<ICategoryWithSubcategories[]>) => ({
        data: response.data || [],
      }),
    }),

    // Get single category by ID
    getCategoryById: builder.query<{ data: ICategory }, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "GET",
      }),
      providesTags: ["category"],
      transformResponse: (response: TResponseRedux<ICategory>) => ({
        data: response.data,
      }),
    }),

    // Get courses by category
    getCoursesByCategory: builder.query<
      { data: any[]; meta: any },
      { categoryId: string; page?: number; limit?: number }
    >({
      query: ({ categoryId, page = 1, limit = 10 }) => ({
        url: `/categories/${categoryId}/courses?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["courses"],
      transformResponse: (response: TResponseRedux<any[]>) => ({
        data: response.data || [],
        meta: response.meta || {},
      }),
    }),

    // Get subcategories by category
    getSubCategoriesByCategory: builder.query<{ data: ISubCategory[] }, string>({
      query: (categoryId) => ({
        url: `/sub-category/category/${categoryId}`,
        method: "GET",
      }),
      providesTags: ["subcategories"],
      transformResponse: (response: TResponseRedux<ISubCategory[]>) => ({
        data: response.data || [],
      }),
    }),

    // Get courses by subcategory
    getCoursesBySubCategory: builder.query<
      { data: any[]; meta: any },
      { subcategoryId: string; page?: number; limit?: number }
    >({
      query: ({ subcategoryId, page = 1, limit = 10 }) => ({
        url: `/sub-category/${subcategoryId}/courses?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["courses"],
      transformResponse: (response: TResponseRedux<any[]>) => ({
        data: response.data || [],
        meta: response.meta || {},
      }),
    }),

    // Create category (Teacher only)
    createCategory: builder.mutation<
      { data: ICategory },
      Partial<ICategory>
    >({
      query: (categoryData) => ({
        url: "/categories/create-category",
        method: "POST",
        body: categoryData,
      }),
      invalidatesTags: ["categories"],
      transformResponse: (response: TResponseRedux<ICategory>) => ({
        data: response.data,
      }),
    }),

    // Update category (Teacher only)
    updateCategory: builder.mutation<
      { data: ICategory },
      { id: string; data: Partial<ICategory> }
    >({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["categories", "category"],
      transformResponse: (response: TResponseRedux<ICategory>) => ({
        data: response.data,
      }),
    }),

    // Delete category (Teacher only)
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["categories"],
    }),

    // Create subcategory (Teacher only)
    createSubCategory: builder.mutation<
      { data: ISubCategory },
      Partial<ISubCategory>
    >({
      query: (subcategoryData) => ({
        url: "/sub-category/create-subCategory",
        method: "POST",
        body: subcategoryData,
      }),
      invalidatesTags: ["subcategories", "categories"],
      transformResponse: (response: TResponseRedux<ISubCategory>) => ({
        data: response.data,
      }),
    }),

    // Update subcategory (Teacher only)
    updateSubCategory: builder.mutation<
      { data: ISubCategory },
      { id: string; data: Partial<ISubCategory> }
    >({
      query: ({ id, data }) => ({
        url: `/sub-category/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["subcategories", "categories"],
      transformResponse: (response: TResponseRedux<ISubCategory>) => ({
        data: response.data,
      }),
    }),

    // Delete subcategory (Teacher only)
    deleteSubCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/sub-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["subcategories", "categories"],
    }),
  }),
});

export const {
  useGetAllCategoriesQuery,
  useGetAllCategoriesWithSubcategoriesQuery,
  useGetCategoryByIdQuery,
  useGetCoursesByCategoryQuery,
  useGetSubCategoriesByCategoryQuery,
  useGetCoursesBySubCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateSubCategoryMutation,
  useUpdateSubCategoryMutation,
  useDeleteSubCategoryMutation,
} = categoryApi;
