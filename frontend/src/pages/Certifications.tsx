import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Clock, Users, CheckCircle, Star, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const Certifications = () => {
  const certifications = [
    {
      id: 1,
      title: "Sustainable Development Goals (SDG) Specialist",
      description: "Master the UN's 17 Sustainable Development Goals and learn how to implement them in real-world scenarios.",
      duration: "8 weeks",
      students: 1250,
      rating: 4.8,
      level: "Intermediate",
      price: "$199",
      image: "/images/sdg-cert.jpg",
      skills: ["SDG Framework", "Impact Measurement", "Policy Analysis", "Project Management"],
      issuer: "Green Uni Mind",
      accredited: true
    },
    {
      id: 2,
      title: "Environmental Impact Assessment Professional",
      description: "Learn to conduct comprehensive environmental impact assessments for sustainable business practices.",
      duration: "12 weeks",
      students: 890,
      rating: 4.9,
      level: "Advanced",
      price: "$299",
      image: "/images/eia-cert.jpg",
      skills: ["EIA Methodology", "Risk Assessment", "Compliance", "Reporting"],
      issuer: "Green Uni Mind",
      accredited: true
    },
    {
      id: 3,
      title: "Green Technology Innovation Certificate",
      description: "Explore cutting-edge green technologies and learn to develop innovative sustainable solutions.",
      duration: "10 weeks",
      students: 2100,
      rating: 4.7,
      level: "Intermediate",
      price: "$249",
      image: "/images/green-tech-cert.jpg",
      skills: ["Clean Energy", "Green Innovation", "Technology Assessment", "Sustainability"],
      issuer: "Green Uni Mind",
      accredited: true
    },
    {
      id: 4,
      title: "Corporate Sustainability Leadership",
      description: "Develop leadership skills to drive sustainability initiatives in corporate environments.",
      duration: "6 weeks",
      students: 750,
      rating: 4.6,
      level: "Advanced",
      price: "$349",
      image: "/images/corp-sustainability-cert.jpg",
      skills: ["ESG Reporting", "Stakeholder Engagement", "Change Management", "Strategy"],
      issuer: "Green Uni Mind",
      accredited: true
    }
  ];

  const benefits = [
    {
      icon: Award,
      title: "Industry Recognition",
      description: "Certificates recognized by leading environmental organizations and employers worldwide."
    },
    {
      icon: CheckCircle,
      title: "Verified Skills",
      description: "Demonstrate your expertise with practical projects and real-world assessments."
    },
    {
      icon: Users,
      title: "Professional Network",
      description: "Connect with sustainability professionals and environmental leaders globally."
    },
    {
      icon: BookOpen,
      title: "Continuous Learning",
      description: "Access to updated content and new certification programs as they become available."
    }
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
              Professional Certifications
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Advance your career with industry-recognized certifications in sustainability and environmental science
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                Browse Certifications
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose Our Certifications?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our certification programs are designed by industry experts and recognized by leading organizations worldwide.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="text-center"
              >
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Available Certifications
            </h2>
            <p className="text-lg text-gray-600">
              Choose from our comprehensive range of professional certification programs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={cert.level === "Advanced" ? "destructive" : "secondary"}>
                        {cert.level}
                      </Badge>
                      {cert.accredited && (
                        <Badge className="bg-green-100 text-green-700">
                          Accredited
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl text-gray-800">{cert.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {cert.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {cert.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {cert.students} students
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {cert.rating}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {cert.skills.slice(0, 3).map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {cert.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{cert.skills.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <div>
                          <span className="text-2xl font-bold text-green-600">{cert.price}</span>
                          <span className="text-sm text-gray-500 ml-1">USD</span>
                        </div>
                        <Button className="bg-green-600 hover:bg-green-700">
                          Enroll Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
              Ready to Advance Your Career?
            </h2>
            <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
              Join thousands of professionals who have enhanced their expertise with our certification programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                Get Started Today
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Certifications;
