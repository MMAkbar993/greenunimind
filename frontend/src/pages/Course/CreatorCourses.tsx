import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetCreatorCourseQuery } from "@/redux/features/course/courseApi";
import { TCourse } from "@/redux/features/course/courseSlice";
import { Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreatorCourses = () => {
  const navigate = useNavigate();
  const { data: user } = useGetMeQuery(undefined);

  const userId = user?.data?._id;

  const { data } = useGetCreatorCourseQuery({
    id: userId,
  });

  const courses = data?.data;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pt-[75px]">
      <div className="my-6">
        <Button onClick={() => navigate(`/create-course`)}>Create a new course</Button>
        <Table>
          <TableCaption>A list of your recent courses.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses?.map((course: TCourse) => (
              <TableRow key={course._id}>
                <TableCell className="font-medium">
                  {course?.coursePrice || "NA"}
                </TableCell>
                <TableCell>
                  {" "}
                  <Badge>
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>{" "}
                </TableCell>
                <TableCell>{course.title}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/create-lecture/${course._id}`)}
                  >
                    <Edit />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CreatorCourses;
