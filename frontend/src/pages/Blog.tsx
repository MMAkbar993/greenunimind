import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Search, ArrowRight, Leaf, Globe, Lightbulb } from "lucide-react";
import { useState } from "react";

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const featuredPost = {
    id: 1,
    title: "The Future of Sustainable Education: How AI is Transforming Environmental Learning",
    excerpt: "Discover how artificial intelligence is revolutionizing the way we learn about sustainability and environmental science, making education more accessible and impactful than ever before.",
    author: "Dr. Sarah Green",
    date: "2024-01-15",
    readTime: "8 min read",
    image: "/images/blog-featured.jpg",
    category: "Technology",
    tags: ["AI", "Education", "Sustainability", "Innovation"]
  };

  const blogPosts = [
    {
      id: 2,
      title: "10 Simple Steps to Reduce Your Carbon Footprint Today",
      excerpt: "Practical tips and actionable strategies that anyone can implement to make a positive environmental impact.",
      author: "Mark Johnson",
      date: "2024-01-12",
      readTime: "5 min read",
      image: "/images/blog-carbon.jpg",
      category: "Lifestyle",
      tags: ["Carbon Footprint", "Green Living", "Tips"]
    },
    {
      id: 3,
      title: "Renewable Energy Trends: What to Expect in 2024",
      excerpt: "An in-depth analysis of the latest developments in renewable energy technology and market trends.",
      author: "Dr. Emily Chen",
      date: "2024-01-10",
      readTime: "12 min read",
      image: "/images/blog-renewable.jpg",
      category: "Technology",
      tags: ["Renewable Energy", "Solar", "Wind", "Trends"]
    },
    {
      id: 4,
      title: "Building Sustainable Communities: Lessons from Around the World",
      excerpt: "Explore successful sustainable community initiatives and learn how they can be replicated globally.",
      author: "Carlos Rodriguez",
      date: "2024-01-08",
      readTime: "7 min read",
      image: "/images/blog-communities.jpg",
      category: "Community",
      tags: ["Community", "Sustainability", "Global", "Case Studies"]
    },
    {
      id: 5,
      title: "The Economics of Green Business: Why Sustainability Pays",
      excerpt: "Understanding the financial benefits of implementing sustainable practices in business operations.",
      author: "Lisa Thompson",
      date: "2024-01-05",
      readTime: "9 min read",
      image: "/images/blog-business.jpg",
      category: "Business",
      tags: ["Business", "Economics", "ROI", "Green Business"]
    },
    {
      id: 6,
      title: "Climate Change Education: Preparing the Next Generation",
      excerpt: "How educational institutions are adapting their curricula to address climate change challenges.",
      author: "Prof. David Wilson",
      date: "2024-01-03",
      readTime: "6 min read",
      image: "/images/blog-education.jpg",
      category: "Education",
      tags: ["Climate Change", "Education", "Youth", "Curriculum"]
    }
  ];

  const categories = [
    { name: "All", count: 25, icon: Globe },
    { name: "Technology", count: 8, icon: Lightbulb },
    { name: "Lifestyle", count: 6, icon: Leaf },
    { name: "Business", count: 5, icon: ArrowRight },
    { name: "Education", count: 4, icon: User },
    { name: "Community", count: 2, icon: Globe }
  ];

  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = selectedCategory === "All" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

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
              Green Insights Blog
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Stay informed with the latest trends, insights, and innovations in sustainability and environmental science
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 text-gray-800 bg-white border-0 rounded-full"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category, index) => (
              <motion.button
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === category.name
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-green-100"
                }`}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
                <Badge variant="secondary" className="ml-1">
                  {category.count}
                </Badge>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Featured Article</h2>
            <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-64 md:h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/logo.png";
                    }}
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-green-100 text-green-700">{featuredPost.category}</Badge>
                    <div className="flex flex-wrap gap-2">
                      {featuredPost.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">{featuredPost.title}</h3>
                  <p className="text-gray-600 mb-6">{featuredPost.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(featuredPost.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {featuredPost.readTime}
                      </div>
                    </div>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Read Full Article
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Latest Articles
            </h2>
            <p className="text-lg text-gray-600">
              Discover insights, tips, and stories from sustainability experts
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
                  <div className="relative overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/logo.png";
                      }}
                    />
                    <Badge className="absolute top-4 left-4 bg-green-100 text-green-700">
                      {post.category}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800 group-hover:text-green-600 transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 2).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full group-hover:bg-green-600 group-hover:text-white transition-colors">
                      Read More
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stay Updated
            </h2>
            <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
              Subscribe to our newsletter and never miss the latest insights on sustainability and environmental innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Input
                placeholder="Enter your email"
                className="flex-1 bg-white text-gray-800 border-0"
              />
              <Button className="bg-green-800 hover:bg-green-900">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
