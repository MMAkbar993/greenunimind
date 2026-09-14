import { Skeleton } from "@/components/ui/skeleton";
import EducatorCard from "@/components/EducatorCard";
import { useGetPublicEducatorsQuery } from "@/redux/features/teacher/publicTeacherApi";
import { GraduationCap } from "lucide-react";

const Educators = () => {
  const { data, isLoading } = useGetPublicEducatorsQuery();
  const educators = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-12 mt-20">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3">
          Our Educators
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Meet the sustainability experts teaching on GreenUniMind.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      ) : educators.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="text-green-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No educators yet</h3>
          <p className="text-gray-500">Check back soon as new instructors publish their courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {educators.map((educator) => (
            <EducatorCard key={educator._id} educator={educator} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Educators;
