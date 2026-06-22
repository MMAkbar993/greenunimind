import { LucideIcon, BookOpen, Globe, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useGetMonthlyImpactReportQuery } from "@/redux/features/impact/impactApi";
import { Button } from "@/components/ui/button";

interface ImpactStatProps {
  icon: LucideIcon;
  value: string;
  label: string;
  description: string;
}

const ImpactStat = ({
  icon: Icon,
  value,
  label,
  description,
}: ImpactStatProps) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6 text-center">
    <div className="mb-6">
      <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-green-600" />
      </div>
    </div>
    <div className="space-y-3">
      <h3 className="text-3xl md:text-4xl font-bold text-gray-900">{value}</h3>
      <h4 className="text-lg font-semibold text-gray-800 leading-tight">{label}</h4>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

const ImpactSection = () => {
  const { data, isLoading } = useGetMonthlyImpactReportQuery({});

  const stats = data?.data
    ? [
        {
          icon: BookOpen,
          value: String(data.data.newEnrollments),
          label: "New Enrollments",
          description: "Students who joined courses this month",
        },
        {
          icon: GraduationCap,
          value: String(data.data.certificatesIssued),
          label: "Certificates Issued",
          description: "Learners who completed courses this month",
        },
        {
          icon: Globe,
          value: `${data.data.watchTimeMinutes}m`,
          label: "Learning Time",
          description: "Total watch time in minutes this month",
        },
      ]
    : [
        {
          icon: BookOpen,
          value: "—",
          label: "New Enrollments",
          description: "Students who joined courses this month",
        },
        {
          icon: GraduationCap,
          value: "—",
          label: "Certificates Issued",
          description: "Learners who completed courses this month",
        },
        {
          icon: Globe,
          value: "—",
          label: "Learning Time",
          description: "Total watch time in minutes this month",
        },
      ];

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-white">
      <div className="responsive-container">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl">🌱</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900">
              Our Impact This Month
            </h2>
          </div>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Real change begins with one learner, one project, one planet at a time.
          </p>
          <Link to="/impact/report" className="inline-block mt-4">
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              View Full Report
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <ImpactStat
              key={index}
              icon={stat.icon}
              value={isLoading ? "..." : stat.value}
              label={stat.label}
              description={stat.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
