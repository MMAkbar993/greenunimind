import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Outlet } from "react-router-dom";

const StudentLayout = () => {
  return <div>
    <Navbar />
    <div className="my-16 min-h-screen">
      <Outlet />
    </div>
    <Footer/>
  </div>;
};

export default StudentLayout;
