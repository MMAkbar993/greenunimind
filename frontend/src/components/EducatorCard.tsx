import { Star } from "lucide-react";
import { Card } from "./ui/card";
import { IPublicEducator } from "@/redux/features/teacher/publicTeacherApi";

export const getEducatorName = (name: IPublicEducator["name"]): string => {
  if (typeof name === "string") return name;
  return `${name?.firstName || ""} ${name?.lastName || ""}`.trim() || "Instructor";
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const EducatorCard = ({ educator }: { educator: IPublicEducator }) => {
  const name = getEducatorName(educator.name);

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-2">
        <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-green-50 flex items-center justify-center">
          {educator.profileImg ? (
            <img
              src={educator.profileImg}
              alt={name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-4xl font-bold text-green-600">{initials(name)}</span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{name}</h3>
        <p className="text-sm text-gray-600 mb-3 font-medium line-clamp-1">
          {educator.specialization || "Sustainability Educator"}
        </p>

        {educator.totalReviews > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-base text-gray-900">{educator.averageRating.toFixed(1)}</span>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.round(educator.averageRating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-1">({educator.totalReviews.toLocaleString()})</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm pt-1">
          <div className="text-center">
            <div className="font-bold text-gray-900">{educator.totalStudents.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Students</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">{educator.totalCourses}</div>
            <div className="text-xs text-gray-500">Courses</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EducatorCard;
