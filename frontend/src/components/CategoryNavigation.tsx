import { useState } from "react";
import { ChevronDown, BookOpen, Users, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllCategoriesWithSubcategoriesQuery } from "@/redux/features/category/categoryApi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ICategoryWithSubcategories } from "@/redux/features/category/categoryApi";

const CategoryNavigation = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { data: categoriesData, isLoading, isError } = useGetAllCategoriesWithSubcategoriesQuery();

  const categories = categoriesData?.data || [];

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/categories/${categorySlug}`);
    setIsOpen(false);
  };

  const handleSubcategoryClick = (categorySlug: string, subcategorySlug: string) => {
    navigate(`/categories/${categorySlug}/${subcategorySlug}`);
    setIsOpen(false);
  };

  if (isError) {
    return null; // Don't show anything if there's an error
  }

  return (
    <section className="w-full py-8 sm:py-12 md:py-16 bg-gradient-to-br from-[#f1f8e9] to-[#e8f5e8]">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-[38px] font-bold [font-family:'DM_Sans',Helvetica] text-[#333333] mb-3 sm:mb-4">
            Explore Our Course Categories
          </h2>
          <p className="text-base sm:text-lg text-[#666666] [font-family:'Open_Sans',Helvetica] max-w-2xl mx-auto">
            Discover thousands of courses across various subjects and skill levels
          </p>
        </div>

        {/* Category Dropdown */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-50 border-2 border-[#90ee90] text-[#333333] font-semibold px-6 py-3 text-base sm:text-lg h-auto min-w-[200px] justify-between"
              >
                Browse Categories
                <ChevronDown className={`ml-2 h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="center" 
              className="w-[90vw] max-w-4xl max-h-[70vh] overflow-y-auto p-0 bg-white shadow-xl border-2 border-gray-100"
            >
              {isLoading ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(6).fill(0).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category: ICategoryWithSubcategories) => (
                      <div key={category._id} className="space-y-3">
                        {/* Category Header */}
                        <div 
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={() => handleCategoryClick(category.slug)}
                        >
                          <span className="text-xl">{category.icon || '📚'}</span>
                          <h3 className="font-bold text-[#333333] text-base group-hover:text-[#90ee90] transition-colors">
                            {category.name}
                          </h3>
                        </div>
                        
                        {/* Subcategories */}
                        <div className="space-y-1 pl-8">
                          {category.subcategories?.slice(0, 5).map((subcategory) => (
                            <div
                              key={subcategory._id}
                              className="text-sm text-[#666666] hover:text-[#90ee90] cursor-pointer transition-colors py-1"
                              onClick={() => handleSubcategoryClick(category.slug, subcategory.slug)}
                            >
                              {subcategory.name}
                            </div>
                          ))}
                          {category.subcategories && category.subcategories.length > 5 && (
                            <div
                              className="text-sm text-[#90ee90] hover:text-[#7dcc7d] cursor-pointer font-medium py-1"
                              onClick={() => handleCategoryClick(category.slug)}
                            >
                              +{category.subcategories.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* View All Categories Link */}
                  <DropdownMenuSeparator className="my-4" />
                  <div className="text-center">
                    <Link 
                      to="/categories" 
                      className="text-[#90ee90] hover:text-[#7dcc7d] font-semibold text-base"
                      onClick={() => setIsOpen(false)}
                    >
                      View All Categories →
                    </Link>
                  </div>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Featured Categories Grid */}
        {!isLoading && categories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
            {categories.slice(0, 6).map((category: ICategoryWithSubcategories) => (
              <Link
                key={category._id}
                to={`/categories/${category.slug}`}
                className="group"
              >
                <div className="bg-white rounded-xl p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border border-[#e0e0e0] hover:border-[#90ee90]">
                  <div className="text-3xl sm:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {category.icon || '📚'}
                  </div>
                  <h3 className="font-bold text-[#333333] text-sm sm:text-base mb-2 group-hover:text-[#90ee90] transition-colors">
                    {category.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-xs text-[#666666]">
                    <BookOpen className="h-3 w-3" />
                    <span>{category.subcategories?.length || 0} topics</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-8 sm:mt-12">
          <p className="text-[#666666] mb-4 text-sm sm:text-base">
            Can't find what you're looking for?
          </p>
          <Link to="/courses">
            <Button className="bg-[#90ee90] hover:bg-[#7dcc7d] text-black font-semibold px-6 py-3 text-base">
              Browse All Courses
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryNavigation;
