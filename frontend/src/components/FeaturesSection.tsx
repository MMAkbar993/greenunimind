import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ArrowRight, Leaf, BookOpen, Award, Users, Play, CheckCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const FeaturesSection = () => {
  const features = [
    {
      icon: Leaf,
      title: "Eco Challenges",
      description: "Monthly environmental problem-solving challenges",
      stats: "50k+ students",
      color: "green"
    },
    {
      icon: BookOpen,
      title: "Climate Curriculum",
      description: "Expert-designed planet-focused lesson plans",
      stats: "200+ lessons",
      color: "blue"
    },
    {
      icon: Award,
      title: "Pollinator Quests",
      description: "Game-based learning with real-world impact",
      stats: "15k+ completed",
      color: "amber"
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-white via-green-50/30 to-green-50/50 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="responsive-container relative">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left Side Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-green-100 text-green-600 px-4 py-2 rounded-full text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              <span>Innovative Learning Platform</span>
            </motion.div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-gray-900 leading-tight">
                🌱 Explore What's Possible with{" "}
                <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                  Green Learning
                </span>
              </h2>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
                Discover features designed to spark change — from interactive eco-lesson plans to real-time nature challenges that connect students worldwide.
              </p>
            </div>

            {/* Key Points */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                <span>Learn. Build. Regrow.</span>
              </div>

              <div className="grid grid-cols-3 gap-8 py-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">50k+</div>
                  <div className="text-sm text-gray-600 mt-1">Active Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">200+</div>
                  <div className="text-sm text-gray-600 mt-1">Lesson Plans</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">15k+</div>
                  <div className="text-sm text-gray-600 mt-1">Quests Completed</div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span>🌍 Explore Student Projects</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Side Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                green: {
                  bg: "bg-green-50",
                  iconBg: "bg-green-100",
                  iconColor: "text-green-600",
                  accent: "text-green-600"
                },
                blue: {
                  bg: "bg-blue-50",
                  iconBg: "bg-blue-100",
                  iconColor: "text-blue-600",
                  accent: "text-blue-600"
                },
                amber: {
                  bg: "bg-amber-50",
                  iconBg: "bg-amber-100",
                  iconColor: "text-amber-600",
                  accent: "text-amber-600"
                }
              }[feature.color];

              return (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="group"
                >
                  <Card className={`${colorClasses.bg} border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-green-100/50`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`${colorClasses.iconBg} w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                          <Icon className={`w-7 h-7 ${colorClasses.iconColor}`} />
                        </div>

                        <div className="flex-1 space-y-3">
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                              {feature.title}
                            </CardTitle>
                            <CardDescription className="text-gray-600 text-base leading-relaxed">
                              {feature.description}
                            </CardDescription>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-600">{feature.stats}</span>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className={`${colorClasses.accent} hover:bg-white/50 p-0 h-auto font-medium group-hover:translate-x-1 transition-all duration-300`}
                            >
                              Learn More
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Bottom CTA */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
              className="pt-4"
            >
              <Card className="bg-gradient-to-r from-green-500 to-green-600 border-0 shadow-xl text-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-1">Ready to Transform Education?</h3>
                      <p className="text-green-100 text-sm">Join thousands of educators making a difference</p>
                    </div>
                    <Button
                      variant="secondary"
                      className="bg-white text-green-500 hover:bg-green-50 font-semibold shrink-0"
                    >
                      Get Started
                      <Play className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
