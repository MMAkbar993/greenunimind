import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import FloatingAIButton from "@/components/FloatingAIButton";
import { Outlet } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Outlet />
      <Footer />
      <ScrollToTop />
      <FloatingAIButton />
    </div>
  );
};

export default Index;
