import React from "react";

const AllInOneAppSection = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-green-50 relative overflow-hidden">
      <div className="responsive-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          {/* Text content */}
          <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col items-center md:items-start mb-8 md:mb-0">
            <div className="inline-block px-4 py-2 bg-green-100 text-green-600 text-sm font-semibold rounded-full mb-6">
              All-in-One Platform
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-gray-900 mb-8 text-center md:text-left">
              Sustainable Learning Made Simple
            </h2>
            <ul className="space-y-5 max-w-lg">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700 text-base leading-relaxed">
                  Interactive climate courses with real-world applications and hands-on projects.
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700 text-base leading-relaxed">
                  AI-powered learning paths tailored to your environmental interests and career goals.
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700 text-base leading-relaxed">
                  Community-driven projects that create measurable environmental impact.
                </span>
              </li>
            </ul>
          </div>

          {/* Image Section */}
          <div className="w-full md:w-1/2 lg:w-7/12 flex justify-center md:justify-end relative">
            {/* Background blob */}
            <div className="absolute right-0 md:-right-[16px] top-[33px] md:top-[-20px] lg:top-[42px] z-0">
              <img
                src="/images/blob.png"
                alt=""
                className="w-[336px] sm:w-[450px] md:w-[332px] lg:w-[388px] h-auto opacity-80"
                style={{ objectPosition: "center" }}
              />
            </div>

            {/* Mobile image */}
            <img
              src="/images/mobiles.png"
              alt="Green Uni Mind mobile app interface showing sustainability courses"
              className="w-[230px] sm:w-[320px] md:w-[233px] lg:w-[287px] h-auto object-contain relative z-10"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AllInOneAppSection;
