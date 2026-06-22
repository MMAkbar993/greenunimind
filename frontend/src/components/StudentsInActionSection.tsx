import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const StudentsInActionSection = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-green-50 to-white">
      <div className="responsive-container">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Enhanced Image Container with Earth Tone Background */}
          <div className="rounded-3xl overflow-hidden relative w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 577 498"
              fill="none"
              className="w-full h-auto"
            >
              <path
                d="M92.2818 19.8498C198.646 -14.9519 437.023 -1.31328 538.21 49.2431C639.397 99.7995 515.855 409.017 439.376 453.695C362.898 498.373 202.881 528.942 92.2818 441.938C-18.3177 354.933 -40.673 63.3519 92.2818 19.8498Z"
                fill="url(#earthGradient)"
              />
              <defs>
                <linearGradient
                  id="earthGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#D8F6B5" />
                  <stop offset="50%" stopColor="#B8E6A3" />
                  <stop offset="100%" stopColor="#A8D693" />
                </linearGradient>
              </defs>
            </svg>
            <img
              src="/images/studentAction.png"
              alt="Environmental education students collaborating on sustainability projects"
              className="w-full h-auto object-cover absolute inset-0"
            />
          </div>

          {/* Enhanced Content Section */}
          <div className="md:flex-1">
            {/* Section Badge */}
            <div className="inline-block px-4 py-2 bg-green-100 text-green-600 text-sm font-semibold rounded-full mb-6">
              Student Impact Stories
            </div>

            {/* Enhanced Title with Environmental Focus */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4 text-gray-900">
                Eco Learners. Real Impact.
              </h2>
              <p className="text-green-500 font-medium text-base sm:text-lg">
                Want to see what green education looks like in action?
              </p>
            </div>

            {/* Meaningful Environmental Content */}
            <p className="text-gray-700 mb-8 text-base leading-relaxed">
              Our students aren't just studying sustainability — they're living
              it. From building solar-powered classrooms in Kenya to launching
              plastic-free campaigns in British Columbia, every learner is
              creating waves of change. Join a community where education meets
              environmental action, and where your learning journey contributes
              to a healthier planet.
            </p>

            {/* Enhanced Call-to-Action */}
            <Link to={"/courses"}>
              <Button className="bg-green-500 hover:bg-green-600 text-white text-base px-8 py-4 h-auto rounded-lg font-semibold transition-all duration-300 hover:shadow-lg inline-flex items-center gap-2">
                <span className="text-lg">🌍</span>
                Explore Student Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentsInActionSection;
