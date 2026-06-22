import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import AdPlacement from "@/components/ads/AdPlacement";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Leaf,
  Globe,
  Users,
  Award,
  ArrowRight,
  Linkedin,
  Twitter,
  Instagram,
  Facebook
} from "lucide-react";
import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);

    // Simulate newsletter signup
    setTimeout(() => {
      setIsSubscribing(false);
      setEmail("");
      // You can add actual newsletter signup logic here
    }, 1000);
  };

  return (
    <footer className="bg-gradient-to-b from-green-800 to-green-900 text-white">
      {/* Main Footer Content */}
      <div className="responsive-container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand & Mission Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Logo and Brand */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/images/logo.png"
                    alt="Green Uni Mind Logo"
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-green-400/30"
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                    <Leaf className="w-2 h-2 text-green-900" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-white">
                    Green Uni Mind
                  </h3>
                  <p className="text-green-200 text-sm font-medium">
                    Learn Green. Live Better.
                  </p>
                </div>
              </div>

              {/* Mission Statement */}
              <p className="text-green-100 text-sm leading-relaxed">
                Empowering sustainable thinkers through action-driven learning.
                Join our global community creating real environmental impact through education.
              </p>

              {/* Trust Signals */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-200 text-sm">
                  <Users className="w-4 h-4 text-green-400" />
                  <span>Join 500k+ learners worldwide</span>
                </div>
                <div className="flex items-center gap-2 text-green-200 text-sm">
                  <Award className="w-4 h-4 text-green-400" />
                  <span>ISO Certified Curriculum</span>
                </div>
                <div className="flex items-center gap-2 text-green-200 text-sm">
                  <Globe className="w-4 h-4 text-green-400" />
                  <span>Backed by Environmental Educators</span>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="flex gap-4">
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="w-10 h-10 bg-green-700/50 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors duration-300 group"
                >
                  <Linkedin className="w-5 h-5 text-green-200 group-hover:text-white" />
                </a>
                <a
                  href="#"
                  aria-label="Twitter"
                  className="w-10 h-10 bg-green-700/50 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors duration-300 group"
                >
                  <Twitter className="w-5 h-5 text-green-200 group-hover:text-white" />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-10 h-10 bg-green-700/50 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors duration-300 group"
                >
                  <Instagram className="w-5 h-5 text-green-200 group-hover:text-white" />
                </a>
                <a
                  href="#"
                  aria-label="Facebook"
                  className="w-10 h-10 bg-green-700/50 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors duration-300 group"
                >
                  <Facebook className="w-5 h-5 text-green-200 group-hover:text-white" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Learn Section */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="font-semibold text-lg mb-6 text-white">Learn</h4>
              <ul className="space-y-3">
                {[
                  "Courses",
                  "Certifications",
                  "Categories",
                  "Free Resources"
                ].map((item, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-green-200 hover:text-white text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Company Section */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="font-semibold text-lg mb-6 text-white">Company</h4>
              <ul className="space-y-3">
                {[
                  "About",
                  "Blog",
                  "Impact",
                  "Careers",
                  "Become a Teacher"
                ].map((item, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-green-200 hover:text-white text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Support & Newsletter Section */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-8"
            >
              {/* Support Links */}
              <div>
                <h4 className="font-semibold text-lg mb-6 text-white">Support</h4>
                <ul className="space-y-3">
                  {[
                    "Help Center",
                    "Contact",
                    "Community",
                    "FAQ"
                  ].map((item, index) => (
                    <li key={index}>
                      <a
                        href="#"
                        className="text-green-200 hover:text-white text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter Signup */}
              <div>
                <h4 className="font-semibold text-lg mb-4 text-white">Stay Updated</h4>
                <p className="text-green-200 text-sm mb-4">
                  Get the latest sustainability learning insights and course updates.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full px-4 py-3 bg-green-700/30 border border-green-600/50 rounded-lg text-white placeholder-green-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubscribing}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {isSubscribing ? (
                      "Subscribing..."
                    ) : (
                      <>
                        Subscribe
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Ad Placement - Revenue for green initiatives */}
      <div className="border-t border-green-700/50 bg-green-900/30 py-4">
        <div className="responsive-container">
          <AdPlacement placement="footer" className="min-h-[90px]" />
        </div>
      </div>

      {/* Contact Information Bar */}
      <div className="border-t border-green-700/50 bg-green-900/50">
        <div className="responsive-container py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-2 text-green-200 text-sm">
                <Mail className="w-4 h-4 text-green-400" />
                <a
                  href="mailto:hello@greenunimind.org"
                  className="hover:text-white transition-colors duration-300"
                >
                  hello@greenunimind.org
                </a>
              </div>
              <div className="flex items-center gap-2 text-green-200 text-sm">
                <MapPin className="w-4 h-4 text-green-400" />
                <span>Vancouver, BC</span>
              </div>
              <div className="flex items-center gap-2 text-green-200 text-sm">
                <Clock className="w-4 h-4 text-green-400" />
                <span>Mon–Fri 9am–6pm PST</span>
              </div>
            </div>

            {/* Partner Logos */}
            <div className="flex items-center gap-4">
              <span className="text-green-300 text-xs">Featured by:</span>
              <div className="flex items-center gap-3 opacity-60">
                <div className="text-green-200 text-xs font-medium">TechCrunch</div>
                <div className="w-px h-4 bg-green-600"></div>
                <div className="text-green-200 text-xs font-medium">EdTech Hub</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-green-700/30 bg-green-900">
        <div className="responsive-container py-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left"
          >
            <p className="text-green-300 text-sm">
              © 2024 Green Uni Mind. All rights reserved.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm">
              <a href="#" className="text-green-300 hover:text-white transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="text-green-300 hover:text-white transition-colors duration-300">
                Terms of Service
              </a>
              <a href="#" className="text-green-300 hover:text-white transition-colors duration-300">
                Cookie Policy
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
