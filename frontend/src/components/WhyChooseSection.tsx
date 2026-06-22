import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  imageSrc: string;
  title: string;
  description: string;
}

const FeatureCard = ({ imageSrc, title, description }: FeatureCardProps) => (
  <Card className="overflow-hidden border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
    <div className="h-40 sm:h-44 md:h-48 lg:h-52 overflow-hidden p-2">
      <img
        src={imageSrc}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-300 rounded-md group-hover:scale-105"
      />
    </div>
    <CardContent className="p-6">
      <h3 className="text-gray-900 text-lg sm:text-xl font-display font-semibold mb-3">
        {title}
      </h3>
      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
        {description}
      </p>
      {/* Green accent */}
      <div className="mt-4 w-12 h-1 bg-green-500 rounded-full"></div>
    </CardContent>
  </Card>
);

const WhyChooseSection = () => {
  const features = [
    {
      imageSrc: "/images/image2.png",
      title: "Personalized Eco Learning",
      description:
        "Get tailor-made sustainability lessons designed around your unique learning pace, environmental interests, and green career goals.",
    },
    {
      imageSrc: "/images/image3.png",
      title: "Expert Green Feedback",
      description:
        "Receive instant, actionable feedback from environmental experts to improve quickly and stay on track with your sustainability journey.",
    },
    {
      imageSrc: "/images/image4.png",
      title: "Impact Progress Tracking",
      description:
        "Monitor your environmental learning journey with clear progress indicators that show your growing impact on the planet.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="responsive-container">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-600 text-sm font-semibold rounded-full mb-4">
            Why Choose Green Learning
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-center mb-4 text-gray-900">
            AI-Powered Sustainability Education
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Experience personalized environmental education that adapts to your learning style and sustainability goals.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              imageSrc={feature.imageSrc}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
