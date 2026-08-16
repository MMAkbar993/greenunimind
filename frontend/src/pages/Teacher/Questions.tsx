import { useMemo, useState } from "react";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  ITeacherQuestion,
  useAnswerQuestionMutation,
  useGetQuestionsByTeacherQuery,
} from "@/redux/features/question/questionApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, MessageSquareText, Clock, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatTimeDisplay } from "@/utils/formatTime";
import { toast } from "@/utils/toast";

const QuestionCard = ({ question }: { question: ITeacherQuestion }) => {
  const [answerText, setAnswerText] = useState(question.answer || "");
  const [isReplying, setIsReplying] = useState(false);
  const [answerQuestion, { isLoading }] = useAnswerQuestionMutation();

  const studentName = question.student
    ? `${question.student.name.firstName} ${question.student.name.lastName}`
    : "Unknown student";
  const initials = question.student
    ? `${question.student.name.firstName[0] || ""}${question.student.name.lastName[0] || ""}`
    : "?";

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      toast.error("Answer required", {
        description: "Please write a response before submitting.",
      });
      return;
    }

    try {
      await answerQuestion({ id: question._id!, answer: answerText.trim() }).unwrap();
      toast.success("Answer sent", {
        description: `${studentName} will see your response on the lecture.`,
      });
      setIsReplying(false);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to send your answer. Please try again.",
      });
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={question.student?.profileImg} alt={studentName} />
              <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-gray-900">{studentName}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {question.courseTitle} &middot; {question.lectureTitle}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeDisplay(question.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {question.answered ? (
            <Badge variant="outline" className="border-green-500 text-green-600 shrink-0">
              Answered
            </Badge>
          ) : (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700 shrink-0">
              Awaiting response
            </Badge>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800">{question.question}</div>

        {question.createdAt && (
          <div className="text-xs text-gray-400">
            Asked {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
          </div>
        )}

        {question.answered ? (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1.5">
              <MessageSquareText className="h-3.5 w-3.5 text-green-600" />
              Your response
            </div>
            <div className="text-sm text-gray-800">{question.answer}</div>
          </div>
        ) : isReplying ? (
          <div className="space-y-2 border-t pt-3">
            <Textarea
              placeholder="Type your response..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="min-h-[80px] resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsReplying(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmitAnswer} disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Answer"}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsReplying(true)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <MessageSquareText className="h-3.5 w-3.5 mr-1.5" />
            Answer
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const TeacherQuestions = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;
  const [filter, setFilter] = useState<"all" | "unanswered" | "answered">("unanswered");

  const { data, isLoading } = useGetQuestionsByTeacherQuery(teacherId || "", {
    skip: !teacherId,
  });

  const questions = data?.questions || [];
  const unansweredCount = data?.unansweredCount || 0;

  const filteredQuestions = useMemo(() => {
    if (filter === "unanswered") return questions.filter((q) => !q.answered);
    if (filter === "answered") return questions.filter((q) => q.answered);
    return questions;
  }, [questions, filter]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-purple-600" />
            Student Questions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Questions students asked while watching your lectures.
          </p>
        </div>
        {unansweredCount > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {unansweredCount} awaiting response
          </Badge>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
          <TabsTrigger value="answered">Answered</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">
            {filter === "unanswered" ? "No unanswered questions" : "No questions yet"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === "unanswered"
              ? "You're all caught up."
              : "Questions students ask during lectures will show up here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => (
            <QuestionCard key={q._id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherQuestions;
