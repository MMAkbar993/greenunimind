import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Leaf, ArrowRight } from "lucide-react";

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  course: string;
  avatarSrc: string;
}

const Testimonial = ({ quote, name, role, course, avatarSrc }: TestimonialProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
    className="bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col h-full"
  >
    {/* Quote */}
    <div className="flex-grow mb-6">
      <p className="text-gray-700 text-base leading-relaxed italic">
        "{quote}"
      </p>
    </div>

    {/* Student Info */}
    <div className="flex items-center">
      <div className="relative">
        <img
          src={avatarSrc}
          alt={name}
          className="w-12 h-12 rounded-full object-cover border-2 border-green-100"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/images/logo.png";
          }}
        />
        {/* Leaf accent */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
          <Leaf className="w-2.5 h-2.5 text-green-600" />
        </div>
      </div>
      <div className="ml-3">
        <p className="font-semibold text-gray-900 text-sm">{name}</p>
        <p className="text-green-600 text-xs font-medium">{role}</p>
        <p className="text-gray-500 text-xs">{course}</p>
      </div>
    </div>
  </motion.div>
);

const TestimonialsSection = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    {
      quote: "After this course, I started a sustainability club at work. My team reduced plastic waste by 40% in 3 months.",
      name: "Maria P.",
      role: "Certified Green Living Graduate",
      course: "Sustainable Living Fundamentals",
      avatarSrc: "/images/teacher1.png",
    },
    {
      quote: "The AI-for-sustainability module helped me land my first job in climate tech.",
      name: "Liam T.",
      role: "Green Tech Developer",
      course: "AI for Environmental Solutions",
      avatarSrc: "/images/teacher2.png",
    },
    {
      quote: "I used to feel hopeless about climate change. Now I run workshops in my community.",
      name: "Aisha R.",
      role: "Climate Action Strategist",
      course: "Community Climate Leadership",
      avatarSrc: "/images/teacher3.png",
    },
    {
      quote: "This certification opened doors to my dream job at a renewable energy company.",
      name: "David K.",
      role: "Renewable Energy Specialist",
      course: "Clean Energy Systems",
      avatarSrc: "/images/teacher4.png",
    },
  ];

  const nextPage = () => {
    setCurrentPage((prev) =>
      prev === Math.ceil(testimonials.length / 3) - 1 ? 0 : prev + 1
    );
  };

  const prevPage = () => {
    setCurrentPage((prev) =>
      prev === 0 ? Math.ceil(testimonials.length / 3) - 1 : prev - 1
    );
  };

  // Calculate visible testimonials based on screen size
  const getVisibleCount = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 1;
      if (window.innerWidth < 1024) return 2;
      return 3;
    }
    return 3; // Default for SSR
  };

  const visibleCount = getVisibleCount();
  const startIndex = currentPage * visibleCount;
  const visibleTestimonials = testimonials.slice(
    startIndex,
    startIndex + visibleCount
  );

  return (
    <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600">
      <div className="responsive-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-white font-display font-bold mb-4">
            Voices of Change
          </h2>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            Hear from learners making real impact in their lives, communities, and careers.
          </p>
        </motion.div>

        {/* Navigation Controls */}
        <div className="flex justify-center items-center mb-8">
          <div className="flex gap-2">
            <Button
              onClick={prevPage}
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-white text-white hover:bg-white/10 hover:text-white"
              aria-label="Previous testimonials"
              style={{ backgroundColor: "transparent", borderColor: "white" }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={nextPage}
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-white text-white hover:bg-white/10 hover:text-white"
              aria-label="Next testimonials"
              style={{ backgroundColor: "transparent", borderColor: "white" }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div
          ref={carouselRef}
          className="overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              {visibleTestimonials.map((testimonial, index) => (
                <Testimonial
                  key={`${currentPage}-${index}`}
                  quote={testimonial.quote}
                  name={testimonial.name}
                  role={testimonial.role}
                  course={testimonial.course}
                  avatarSrc={testimonial.avatarSrc}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              className="bg-white text-green-500 hover:bg-green-50 font-semibold px-8 py-4 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Join the Movement
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
