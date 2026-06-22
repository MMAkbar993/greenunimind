import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { useGetAllCategoriesWithSubcategoriesQuery } from "@/redux/features/category/categoryApi";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ICategoryWithSubcategories } from "@/redux/features/category/categoryApi";

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: categoriesData, isLoading, isError } = useGetAllCategoriesWithSubcategoriesQuery();

  const categories = categoriesData?.data || [];

  // Filter categories based on search term
  const filteredCategories = categories.filter((category: ICategoryWithSubcategories) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.subcategories?.some(sub => 
      sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <Skeleton className="h-10 w-full max-w-md mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(6).fill(0).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="space-y-2">
                    {Array(4).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-24" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Categories</h1>
          <p className="text-gray-600 mb-8">We couldn't load the categories. Please try again later.</p>
          <Link to="/" className="text-green-600 hover:text-green-700 font-medium">
            Go back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Explore All Categories
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover courses across various subjects and skill levels. Find the perfect learning path for your goals.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border-2 border-gray-200 focus:border-green-500 rounded-lg"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((category: ICategoryWithSubcategories) => (
              <Card
                key={category._id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border hover:border-green-300"
              >
                <CardContent className="p-6">
                  {/* Category Header */}
                  <Link
                    to={`/categories/${category.slug}`}
                    className="group block mb-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">{category.icon || '📚'}</div>
                      <h2 className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                        {category.name}
                      </h2>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {category.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpen className="h-4 w-4" />
                      <span>{category.subcategories?.length || 0} subcategories</span>
                    </div>
                  </Link>

                  {/* Subcategories */}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Popular Topics:</h3>
                      <div className="space-y-2">
                        {category.subcategories.slice(0, 4).map((subcategory) => (
                          <Link
                            key={subcategory._id}
                            to={`/categories/${category.slug}/${subcategory.slug}`}
                            className="flex items-center justify-between text-sm text-gray-600 hover:text-green-600 transition-colors group"
                          >
                            <span>{subcategory.name}</span>
                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ))}
                        {category.subcategories.length > 4 && (
                          <Link
                            to={`/categories/${category.slug}`}
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            +{category.subcategories.length - 4} more topics
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? `No categories match "${searchTerm}". Try a different search term.`
                : "No categories are available at the moment."
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12 bg-white rounded-xl p-8 shadow-sm border">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of students who are already learning and growing their skills with our comprehensive courses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/courses"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Browse All Courses
            </Link>
            <Link
              to="/sign-up"
              className="border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
