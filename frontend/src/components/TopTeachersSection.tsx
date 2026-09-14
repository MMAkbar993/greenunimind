import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import EducatorCard from "./EducatorCard";
import { useGetPublicEducatorsQuery } from "@/redux/features/teacher/publicTeacherApi";

const TopTeachersSection = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetPublicEducatorsQuery();
  const topEducators = (data?.data || []).slice(0, 3);

  // No published-course instructors yet — nothing real to show, so don't
  // show a fake section instead of leaving a visible gap.
  if (!isLoading && topEducators.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-green-50 to-white">
      <div className="responsive-container">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-600 text-sm font-semibold rounded-full mb-4">
            Expert Sustainability Educators
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
            Top-Rated Environmental Teachers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Learn from leading environmental experts and sustainability educators who are passionate about creating positive change
          </p>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {isLoading
            ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-lg" />)
            : topEducators.map((educator) => <EducatorCard key={educator._id} educator={educator} />)}
        </div>

        {/* View All Educators Button */}
        <div className="text-center mt-8 sm:mt-10 md:mt-12">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/educators")}
            className="px-8 py-3 text-base font-semibold border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            View All Educators
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TopTeachersSection;
