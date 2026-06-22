import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Users, BookOpen, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const About = () => {
  return (
    <div className="bg-white mt-10">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-blue-50 opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="w-full lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  About <span className="text-green-500">GreenUniMind</span>
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-700 leading-relaxed max-w-2xl">
                  We're on a mission to transform education through innovative technology and personalized learning experiences. Our platform connects students with expert teachers in a collaborative environment.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg">
                    Join Our Community
                  </Button>
                  <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg text-lg">
                    Learn More
                  </Button>
                </div>
              </motion.div>
            </div>
            <div className="w-full lg:w-1/2 mt-10 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-green-100 rounded-full"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-100 rounded-full"></div>
                <img
                  src="/images/image11.png"
                  alt="About GreenUniMind"
                  className="w-full h-auto rounded-2xl shadow-xl relative z-10"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Mission & Vision</h2>
              <div className="w-24 h-1 bg-green-500 mx-auto mt-4"></div>
              <p className="mt-6 text-lg text-gray-700 max-w-3xl mx-auto">
                We're dedicated to making quality education accessible to everyone, everywhere. Through technology and innovation, we're building a future where learning knows no boundaries.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-green-500"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed">
                To democratize education by providing a platform where knowledge is accessible to all, regardless of geographical or socioeconomic barriers. We strive to create an environment where both teachers and students can thrive.
              </p>
              <ul className="mt-6 space-y-3">
                {["Accessible education for all", "Support for educators", "Innovative learning tools", "Global community building"].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-500"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-700 leading-relaxed">
                To be the leading global platform that transforms how people learn and teach, creating a world where quality education is a right, not a privilege. We envision a future where learning is personalized, engaging, and effective.
              </p>
              <ul className="mt-6 space-y-3">
                {["Personalized learning journeys", "Technology-driven education", "Global knowledge sharing", "Lifelong learning opportunities"].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Core Values</h2>
              <div className="w-24 h-1 bg-green-500 mx-auto mt-4"></div>
              <p className="mt-6 text-lg text-gray-700 max-w-3xl mx-auto">
                These principles guide everything we do at GreenUniMind, from product development to community engagement.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Users className="w-10 h-10 text-purple-600" />,
                title: "Community",
                description: "We believe in the power of community and collaborative learning environments.",
                color: "purple"
              },
              {
                icon: <BookOpen className="w-10 h-10 text-blue-600" />,
                title: "Innovation",
                description: "We constantly push boundaries to create better learning experiences.",
                color: "blue"
              },
              {
                icon: <Award className="w-10 h-10 text-green-600" />,
                title: "Excellence",
                description: "We strive for excellence in everything we do, from content to user experience.",
                color: "green"
              },
              {
                icon: <Heart className="w-10 h-10 text-red-600" />,
                title: "Inclusivity",
                description: "We create spaces where everyone feels welcome and valued.",
                color: "red"
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className={`w-16 h-16 bg-${value.color}-100 rounded-full flex items-center justify-center mb-4`}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-700">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Meet Our Team</h2>
              <div className="w-24 h-1 bg-green-500 mx-auto mt-4"></div>
              <p className="mt-6 text-lg text-gray-700 max-w-3xl mx-auto">
                Our diverse team of educators, technologists, and visionaries is dedicated to transforming education.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                name: "Sarah Johnson",
                role: "Founder & CEO",
                image: "/images/teacher1.png",
                bio: "Former educator with a passion for making quality education accessible to all."
              },
              {
                name: "Michael Chen",
                role: "Chief Technology Officer",
                image: "/images/image6.png",
                bio: "Tech innovator focused on creating intuitive learning platforms."
              },
              {
                name: "Aisha Patel",
                role: "Head of Education",
                image: "/images/impact3.png",
                bio: "Curriculum expert dedicated to effective teaching methodologies."
              }
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                  <p className="text-green-600 font-medium mb-3">{member.role}</p>
                  <Separator className="my-3" />
                  <p className="text-gray-700">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg text-lg">
              View Full Team <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold">Our Impact</h2>
              <p className="mt-4 text-lg text-green-100 max-w-2xl mx-auto">
                We're proud of the difference we're making in education worldwide.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "10,000+", label: "Students" },
              { number: "500+", label: "Courses" },
              { number: "200+", label: "Expert Teachers" },
              { number: "50+", label: "Countries" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6"
              >
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.number}</p>
                <p className="text-lg text-green-100">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-2xl shadow-lg overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-1/2 p-8 md:p-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Join Our Community</h2>
                  <p className="text-lg text-gray-700 mb-8">
                    Whether you're a student looking to learn or a teacher wanting to share your knowledge, GreenUniMind is the perfect platform for you.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg">
                      Get Started
                    </Button>
                    <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg text-lg">
                      Learn More
                    </Button>
                  </div>
                </motion.div>
              </div>
              <div className="w-full lg:w-1/2 relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="h-full"
                >
                  <img
                    src="/images/image5.png"
                    alt="Join GreenUniMind"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-blue-600/20"></div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;