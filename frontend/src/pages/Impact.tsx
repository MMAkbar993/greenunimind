import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Globe, 
  Leaf, 
  Award, 
  TrendingUp, 
  Heart, 
  BookOpen, 
  Target,
  TreePine,
  Recycle,
  Lightbulb,
  Building
} from "lucide-react";
import ImpactSection from "@/components/ImpactSection";

const Impact = () => {
  const impactStats = [
    {
      icon: Users,
      value: "50,000+",
      label: "Students Educated",
      description: "Learners from 120+ countries have joined our sustainability programs"
    },
    {
      icon: TreePine,
      value: "2.5M",
      label: "Trees Equivalent CO₂ Saved",
      description: "Through education and behavior change initiatives"
    },
    {
      icon: Globe,
      value: "120+",
      label: "Countries Reached",
      description: "Global community working towards sustainable development"
    },
    {
      icon: Award,
      value: "15,000+",
      label: "Certifications Issued",
      description: "Professional credentials in sustainability and environmental science"
    },
    {
      icon: Building,
      value: "500+",
      label: "Organizations Partnered",
      description: "Companies implementing sustainable practices through our programs"
    },
    {
      icon: Lightbulb,
      value: "1,200+",
      label: "Green Projects Launched",
      description: "Student-led initiatives making real environmental impact"
    }
  ];

  const sdgGoals = [
    { number: 3, title: "Good Health and Well-being", progress: 85 },
    { number: 4, title: "Quality Education", progress: 92 },
    { number: 6, title: "Clean Water and Sanitation", progress: 78 },
    { number: 7, title: "Affordable and Clean Energy", progress: 88 },
    { number: 11, title: "Sustainable Cities and Communities", progress: 82 },
    { number: 12, title: "Responsible Consumption and Production", progress: 90 },
    { number: 13, title: "Climate Action", progress: 95 },
    { number: 15, title: "Life on Land", progress: 87 }
  ];

  const successStories = [
    {
      id: 1,
      title: "Solar Village Initiative - Kenya",
      description: "Our graduates established a solar energy cooperative that now powers 500+ homes in rural Kenya.",
      impact: "2,000 people with clean energy access",
      image: "/images/impact-kenya.jpg",
      category: "Clean Energy",
      year: "2023"
    },
    {
      id: 2,
      title: "Urban Farming Network - Brazil",
      description: "Students created a network of urban farms that provides fresh produce to underserved communities.",
      impact: "15,000 people with improved food security",
      image: "/images/impact-brazil.jpg",
      category: "Food Security",
      year: "2023"
    },
    {
      id: 3,
      title: "Plastic-Free Schools - Philippines",
      description: "Educational program that eliminated single-use plastics from 200+ schools across the Philippines.",
      impact: "50,000 students educated on plastic pollution",
      image: "/images/impact-philippines.jpg",
      category: "Waste Reduction",
      year: "2024"
    }
  ];

  const partnerships = [
    { name: "United Nations Environment Programme", logo: "/images/unep-logo.png" },
    { name: "World Wildlife Fund", logo: "/images/wwf-logo.png" },
    { name: "Greenpeace International", logo: "/images/greenpeace-logo.png" },
    { name: "Climate Action Network", logo: "/images/can-logo.png" },
    { name: "Global Green Growth Institute", logo: "/images/gggi-logo.png" },
    { name: "International Renewable Energy Agency", logo: "/images/irena-logo.png" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Our Global Impact
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Measuring the positive change we're creating together for a sustainable future
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/impact/report">
                <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                  View Impact Report
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                Join Our Mission
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Impact by the Numbers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real metrics showing the tangible difference our community is making worldwide
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {impactStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="text-center h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <stat.icon className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-green-600 mb-2">
                      {stat.value}
                    </CardTitle>
                    <CardDescription className="text-lg font-semibold text-gray-800">
                      {stat.label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{stat.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Impact Section */}
      <ImpactSection />

      {/* SDG Progress */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              UN Sustainable Development Goals Progress
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our contribution to achieving the United Nations Sustainable Development Goals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sdgGoals.map((goal, index) => (
              <motion.div
                key={goal.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">{goal.number}</span>
                    </div>
                    <CardTitle className="text-sm font-semibold text-gray-800">
                      {goal.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-green-600 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">{goal.progress}% Progress</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real projects and initiatives led by our community members making a difference
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                  <div className="relative">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/logo.png";
                      }}
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-green-100 text-green-700">{story.category}</Badge>
                      <Badge variant="outline" className="bg-white">{story.year}</Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">{story.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {story.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700">Impact</span>
                      </div>
                      <p className="text-green-800">{story.impact}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnerships */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Our Partners
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Working together with leading organizations to amplify our impact
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {partnerships.map((partner, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="text-center"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-16 mx-auto grayscale hover:grayscale-0 transition-all duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/logo.png";
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Be Part of the Solution
            </h2>
            <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
              Join our global community and help us create an even greater positive impact on our planet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                Start Learning Today
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                Become a Teacher
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Impact;
