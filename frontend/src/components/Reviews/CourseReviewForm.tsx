import { useState, useEffect } from "react";
import StarRating from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateOrUpdateReviewMutation,
  useGetMyReviewForCourseQuery,
} from "@/redux/features/review/reviewApi";
import { toast } from "@/utils/toast";

interface CourseReviewFormProps {
  courseId: string;
}

const CourseReviewForm = ({ courseId }: CourseReviewFormProps) => {
  const { data: myReview, isLoading } = useGetMyReviewForCourseQuery(courseId, { skip: !courseId });
  const [createOrUpdateReview, { isLoading: isSaving }] = useCreateOrUpdateReviewMutation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
    }
  }, [myReview]);

  const handleSubmit = async () => {
    if (rating < 1) {
      toast.error("Rating required", { description: "Choose 1 to 5 stars before submitting." });
      return;
    }
    try {
      await createOrUpdateReview({ courseId, rating, comment }).unwrap();
      toast.success(myReview ? "Review updated" : "Review submitted", {
        description: "Thanks for your feedback!",
      });
      setIsEditing(false);
    } catch (error) {
      toast.error("Error", { description: "Failed to submit your review." });
    }
  };

  if (isLoading) return null;

  if (myReview && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StarRating rating={myReview.rating} readonly size="md" />
          {myReview.comment && <p className="text-gray-700">{myReview.comment}</p>}
          {myReview.response && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs font-medium text-gray-600 mb-1">Instructor response</p>
              <p className="text-sm text-gray-800">{myReview.response.text}</p>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit Review
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{myReview ? "Edit Your Review" : "Leave a Review"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StarRating rating={rating} readonly={false} onChange={setRating} size="lg" showValue={false} />
        <Textarea
          placeholder="Share your thoughts about this course..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px]"
        />
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Submitting..." : myReview ? "Update Review" : "Submit Review"}
          </Button>
          {myReview && (
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseReviewForm;
