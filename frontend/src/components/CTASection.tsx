import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Leaf, ArrowRight, Globe } from "lucide-react";

const CTASection = () => {
  return (
    <section className="w-full h-[500px] sm:h-[550px] md:h-[650px] relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/cta-image.jpg')`,
        }}
      >
        {/* Enhanced overlay for better text readability while maintaining image clarity */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/30 via-green-800/40 to-green-900/60"></div>
      </div>

      {/* Content Container */}
      <div className="responsive-container relative z-10 h-full flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto text-center text-white"
        >
          {/* Icon accent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-4 sm:mb-6"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <Leaf className="w-8 h-8 text-green-300" />
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 sm:mb-5 md:mb-6 text-white drop-shadow-lg">
            Transform the Planet Through Education
          </h2>

          <p className="text-lg sm:text-xl md:text-2xl font-medium mb-2 sm:mb-3 md:mb-4 text-green-100 drop-shadow">
            Join 500k+ learners creating real environmental impact
          </p>

          <p className="text-sm sm:text-base md:text-lg font-normal text-white/90 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto drop-shadow leading-relaxed">
            From climate action to renewable energy careers - start your journey toward meaningful change today. Every course completed is a step toward a sustainable future.
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-white text-green-500 hover:bg-green-50 px-8 py-4 text-base sm:text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 h-auto">
                Start Your Climate Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-green-500 px-8 py-4 text-base sm:text-lg rounded-xl font-semibold backdrop-blur-sm bg-white/10 transition-all duration-300 h-auto"
              >
                Explore Courses
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
