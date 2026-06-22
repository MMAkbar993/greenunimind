import { Laptop, Settings, Award } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Laptop,
      title: "Learn by Doing",
      description:
        "Take action-based lessons in sustainability, tech, and climate solutions.",
    },
    {
      icon: Settings,
      title: "Create Real-World Impact",
      description:
        "Apply your learning through hands-on projects, community challenges, or climate action plans.",
    },
    {
      icon: Award,
      title: "Get Certified. Get Recognized.",
      description:
        "Earn certifications to share on LinkedIn, resumes, and with employers.",
    },
  ];

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-green-50">
      <div className="responsive-container">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-center mb-6 sm:mb-8 md:mb-12 text-gray-900">
          How You Learn. How You Lead.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6 text-center"
            >
              {/* Icon */}
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-green-600" />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                  {index + 1}. {step.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
