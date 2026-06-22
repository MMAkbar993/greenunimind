import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark, HelpCircle, Clock, Trash2, Tag, FolderOpen, Share2 } from "lucide-react";
import { toast } from "@/utils/toast";
import { formatTimestamp } from "@/utils/formatTime";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  useCreateBookmarkMutation,
  useGetBookmarksByLectureAndStudentQuery,
  useDeleteBookmarkMutation,
  useUpdateBookmarkMutation,
  useShareBookmarkMutation,
  useGetBookmarksByCategoryQuery
} from "@/redux/features/bookmark/bookmarkApi";
import {
  useCreateQuestionMutation,
  useGetQuestionsByLectureAndStudentQuery,
  useDeleteQuestionMutation
} from "@/redux/features/question/questionApi";
import { IBookmark } from "@/redux/features/bookmark/bookmarkSlice";
import {
  selectBookmarksByLecture,
  selectBookmarksByCategory
} from "@/redux/features/bookmark/bookmarkSlice";
import { selectQuestionsByLecture } from "@/redux/features/question/questionSlice";
import { useSelector } from "react-redux";

// We're using the Redux interfaces now

interface LectureInteractionsProps {
  lectureId: string;
  currentTime: number;
  formatTime: (time: number) => string;
  onSeek: (time: number) => void;
}

const LectureInteractions = ({
  lectureId,
  currentTime,
  formatTime,
  onSeek,
}: LectureInteractionsProps) => {
  // Local state for form inputs
  const [bookmarkTitle, setBookmarkTitle] = useState("");
  const [bookmarkCategory, setBookmarkCategory] = useState("");
  const [bookmarkTags, setBookmarkTags] = useState<string[]>([]);
  const [bookmarkNotes, setBookmarkNotes] = useState("");
  const [newTag, setNewTag] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [editingBookmark, setEditingBookmark] = useState<IBookmark | null>(null);


  // Get current user data
  const { data: userData } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;

  // Redux selectors for bookmarks and questions
  const bookmarks = useSelector((state: any) => {
    // Check if bookmark slice exists in state
    if (!state.bookmark) return [];
    return selectBookmarksByLecture(state, lectureId);
  });

  const questions = useSelector((state: any) => {
    // Check if question slice exists in state
    if (!state.question) return [];
    return selectQuestionsByLecture(state, lectureId);
  });

  const categoryBookmarks = useSelector((state: any) => {
    // Check if bookmark slice exists in state
    if (!state.bookmark) return [];
    return selectedCategory ? selectBookmarksByCategory(state, selectedCategory) : [];
  });

  // API mutations and queries
  const [createBookmark] = useCreateBookmarkMutation();
  const [updateBookmark] = useUpdateBookmarkMutation();
  const [deleteBookmark] = useDeleteBookmarkMutation();
  const [shareBookmark] = useShareBookmarkMutation();
  const [createQuestion] = useCreateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

  // Get bookmarks by category if a category is selected
  useGetBookmarksByCategoryQuery(
    { studentId: studentId || "", category: selectedCategory },
    { skip: !studentId || !selectedCategory }
  );

  // Fetch bookmarks and questions when component mounts or lectureId/studentId changes
  useGetBookmarksByLectureAndStudentQuery(
    { lectureId, studentId: studentId || "" },
    { skip: !lectureId || !studentId }
  );

  useGetQuestionsByLectureAndStudentQuery(
    { lectureId, studentId: studentId || "" },
    { skip: !lectureId || !studentId }
  );

  const handleAddBookmark = async () => {
    if (!studentId) {
      toast.error("Authentication required", {
        description: "Please log in to add bookmarks",
      });
      return;
    }

    try {
      await createBookmark({
        studentId,
        data: {
          title: bookmarkTitle || `Bookmark at ${formatTime(currentTime)}`,
          timestamp: currentTime,
          lectureId,
          category: bookmarkCategory || "Uncategorized",
          tags: bookmarkTags,
          notes: bookmarkNotes,
        },
      });

      // Reset form fields
      setBookmarkTitle("");
      setBookmarkCategory("");
      setBookmarkTags([]);
      setBookmarkNotes("");
      setNewTag("");

      toast.success("Bookmark added", {
        description: `Bookmark created at ${formatTime(currentTime)}`,
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to add bookmark",
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !bookmarkTags.includes(newTag.trim())) {
      setBookmarkTags([...bookmarkTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setBookmarkTags(bookmarkTags.filter(tag => tag !== tagToRemove));
  };

  const handleShareBookmark = async (bookmarkId: string) => {
    if (!studentId || !bookmarkId) return;

    try {
      await shareBookmark({
        bookmarkId,
        studentIds: shareEmail ? [shareEmail] : [], // Empty array means share with all
      });

      // Reset share email
      setShareEmail("");

      toast.success("Bookmark shared", {
        description: "Your bookmark has been shared successfully",
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to share bookmark",
      });
    }
  };

  const handleEditBookmark = (bookmark: IBookmark) => {
    setEditingBookmark(bookmark);
    setBookmarkTitle(bookmark.title || "");
    setBookmarkCategory(bookmark.category || "");
    setBookmarkTags(bookmark.tags || []);
    setBookmarkNotes(bookmark.notes || "");
  };

  const handleUpdateBookmark = async () => {
    if (!editingBookmark?._id) return;

    try {
      await updateBookmark({
        id: editingBookmark._id,
        data: {
          title: bookmarkTitle,
          category: bookmarkCategory,
          tags: bookmarkTags,
          notes: bookmarkNotes,
        },
      });

      // Reset form and editing state
      setBookmarkTitle("");
      setBookmarkCategory("");
      setBookmarkTags([]);
      setBookmarkNotes("");
      setEditingBookmark(null);

      toast.success("Bookmark updated", {
        description: "Your bookmark has been updated successfully",
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update bookmark",
      });
    }
  };

  const handleAddQuestion = async () => {
    if (!studentId) {
      toast.error("Authentication required", {
        description: "Please log in to ask questions",
      });
      return;
    }

    if (!questionText.trim()) {
      toast.error("Question required", {
        description: "Please enter your question before submitting",
      });
      return;
    }

    try {
      await createQuestion({
        studentId,
        data: {
          question: questionText,
          timestamp: currentTime,
          lectureId,
          answered: false,
        },
      });

      setQuestionText("");

      toast.success("Question submitted", {
        description: "Your question has been submitted successfully",
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to submit question",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Bookmarks Section */}
      <div className="border rounded-lg p-4 bg-white shadow-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-edu-purple" />
              Bookmarks
            </h3>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-purple-100 transition-colors"
                onClick={() => {
                  const dialogTrigger = document.querySelector('[data-bookmark-dialog-trigger]');
                  if (dialogTrigger) {
                    (dialogTrigger as HTMLButtonElement).click();
                  } else {
                    handleAddBookmark();
                  }
                }}
                title={`Bookmark at ${formatTime(currentTime)}`}
              >
                <Bookmark className={`h-4 w-4 ${bookmarks.some(b => Math.abs(b.timestamp - currentTime) < 2) ? 'fill-purple-600 text-purple-600' : 'text-gray-600'}`} />
              </Button>

              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3 py-1 h-7">All</TabsTrigger>
                <TabsTrigger value="categories" className="text-xs px-3 py-1 h-7">Categories</TabsTrigger>
              </TabsList>
            </div>
          </div>
          <TabsContent value="all" className="mt-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="hidden" data-bookmark-dialog-trigger>
                Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Bookmark</DialogTitle>
                <DialogDescription>
                  Create a bookmark at {formatTime(currentTime)} ({formatTimestamp(currentTime)}) to revisit this
                  part later.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <label htmlFor="title" className="text-sm font-medium mb-1 block">
                    Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Bookmark title"
                    value={bookmarkTitle}
                    onChange={(e) => setBookmarkTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="text-sm font-medium mb-1 block">
                    Category
                  </label>
                  <Select
                    value={bookmarkCategory}
                    onValueChange={setBookmarkCategory}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Important">Important</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Question">Question</SelectItem>
                      <SelectItem value="Concept">Concept</SelectItem>
                      <SelectItem value="Example">Example</SelectItem>
                      <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="tags" className="text-sm font-medium mb-1 block">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tags"
                      placeholder="Add a tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bookmarkTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-xs hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="text-sm font-medium mb-1 block">
                    Notes
                  </label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this bookmark"
                    value={bookmarkNotes}
                    onChange={(e) => setBookmarkNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                {editingBookmark ? (
                  <div className="flex gap-2 w-full justify-end">
                    <Button variant="outline" onClick={() => {
                      setEditingBookmark(null);
                      setBookmarkTitle("");
                      setBookmarkCategory("");
                      setBookmarkTags([]);
                      setBookmarkNotes("");
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateBookmark}>
                      Update Bookmark
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleAddBookmark}>Save Bookmark</Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-gray-100 p-3 rounded-full mb-3">
                <Bookmark className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No bookmarks added yet.</p>
              <p className="text-xs text-gray-400 mt-1">Click the bookmark icon to add one at the current timestamp.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark._id}
                  className="bg-white border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <div className="flex justify-between items-start">
                    <div
                      className="flex-1 cursor-pointer group"
                      onClick={() => onSeek(bookmark.timestamp)}
                    >
                      <div className="font-medium group-hover:text-purple-600 transition-colors">{bookmark.title}</div>
                      <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full" title={formatTimestamp(bookmark.timestamp)}>
                          <Clock className="w-3 h-3 text-purple-500" />
                          {formatTime(bookmark.timestamp)}
                        </span>
                        {bookmark.category && (
                          <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                            <FolderOpen className="w-3 h-3 text-blue-500" />
                            {bookmark.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleEditBookmark(bookmark)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-green-500 hover:text-green-700 hover:bg-green-50"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Share Bookmark</DialogTitle>
                            <DialogDescription>
                              Share this bookmark with other students
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Input
                              placeholder="Student email (optional)"
                              value={shareEmail}
                              onChange={(e) => setShareEmail(e.target.value)}
                              className="mb-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Leave empty to share with all students in this course
                            </p>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => handleShareBookmark(bookmark._id || "")}>
                              Share
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={async () => {
                          if (bookmark._id) {
                            try {
                              await deleteBookmark(bookmark._id);
                              toast.success("Bookmark deleted", {
                                description: "Bookmark has been removed",
                              });
                            } catch (error) {
                              toast.error("Error", {
                                description: "Failed to delete bookmark",
                              });
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {bookmark.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100">
                          <Tag className="w-2.5 h-2.5 mr-1 text-purple-500" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {bookmark.notes && (
                    <div className="mt-2 text-sm text-gray-700 border-t pt-2">
                      <p className="line-clamp-2">{bookmark.notes}</p>
                      {bookmark.notes.length > 100 && (
                        <button className="text-xs text-purple-600 hover:text-purple-800 mt-1">Read more</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <div className="mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-white border-gray-200 focus:ring-purple-500 focus:border-purple-500">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Important">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Important
                  </div>
                </SelectItem>
                <SelectItem value="Review">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Review
                  </div>
                </SelectItem>
                <SelectItem value="Question">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Question
                  </div>
                </SelectItem>
                <SelectItem value="Concept">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Concept
                  </div>
                </SelectItem>
                <SelectItem value="Example">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    Example
                  </div>
                </SelectItem>
                <SelectItem value="Uncategorized">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    Uncategorized
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!selectedCategory ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-gray-100 p-3 rounded-full mb-3">
                <FolderOpen className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Select a category to view bookmarks</p>
              <p className="text-xs text-gray-400 mt-1">Organize your bookmarks by categories</p>
            </div>
          ) : categoryBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-gray-100 p-3 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  <line x1="9" y1="14" x2="15" y2="14"/>
                </svg>
              </div>
              <p className="text-sm text-gray-500">No bookmarks in {selectedCategory} category</p>
              <p className="text-xs text-gray-400 mt-1">Add bookmarks to this category to see them here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {categoryBookmarks.map((bookmark) => (
                <div
                  key={bookmark._id}
                  className="bg-white border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <div className="flex justify-between items-start">
                    <div
                      className="flex-1 cursor-pointer group"
                      onClick={() => onSeek(bookmark.timestamp)}
                    >
                      <div className="font-medium group-hover:text-purple-600 transition-colors">{bookmark.title}</div>
                      <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full" title={formatTimestamp(bookmark.timestamp)}>
                          <Clock className="w-3 h-3 text-purple-500" />
                          {formatTime(bookmark.timestamp)}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                          bookmark.category === 'Important' ? 'bg-red-50 text-red-700' :
                          bookmark.category === 'Review' ? 'bg-yellow-50 text-yellow-700' :
                          bookmark.category === 'Question' ? 'bg-blue-50 text-blue-700' :
                          bookmark.category === 'Concept' ? 'bg-green-50 text-green-700' :
                          bookmark.category === 'Example' ? 'bg-purple-50 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            bookmark.category === 'Important' ? 'bg-red-500' :
                            bookmark.category === 'Review' ? 'bg-yellow-500' :
                            bookmark.category === 'Question' ? 'bg-blue-500' :
                            bookmark.category === 'Concept' ? 'bg-green-500' :
                            bookmark.category === 'Example' ? 'bg-purple-500' :
                            'bg-gray-500'
                          }`}></div>
                          {bookmark.category}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => onSeek(bookmark.timestamp)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </Button>
                  </div>

                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {bookmark.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100">
                          <Tag className="w-2.5 h-2.5 mr-1 text-purple-500" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {bookmark.notes && (
                    <div className="mt-2 text-sm text-gray-700 border-t pt-2">
                      <p className="line-clamp-2">{bookmark.notes}</p>
                      {bookmark.notes.length > 100 && (
                        <button className="text-xs text-purple-600 hover:text-purple-800 mt-1">Read more</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        </Tabs>
      </div>

      {/* Questions Section */}
      <div className="border rounded-lg p-4 bg-white shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-edu-purple" />
            Questions
          </h3>

          <Button
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm hover:shadow transition-all duration-200"
            onClick={() => {
              const dialogTrigger = document.querySelector('[data-question-dialog-trigger]');
              if (dialogTrigger) {
                (dialogTrigger as HTMLButtonElement).click();
              }
            }}
          >
            <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
            Ask a Question
          </Button>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="hidden" data-question-dialog-trigger>
              Ask a Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
              <DialogDescription>
                Your question will be linked to timestamp{" "}
                {formatTime(currentTime)} ({formatTimestamp(currentTime)})
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Type your question here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="mb-2 min-h-[100px] resize-none"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddQuestion}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Submit Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-gray-100 p-3 rounded-full mb-3">
              <HelpCircle className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No questions asked yet.</p>
            <p className="text-xs text-gray-400 mt-1">Ask questions about specific parts of the lecture</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {questions.map((question) => (
              <div
                key={question._id}
                className="bg-white border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{question.question}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs cursor-pointer hover:bg-purple-200 transition-colors"
                        onClick={() => onSeek(question.timestamp)}
                        title={formatTimestamp(question.timestamp)}
                      >
                        <Clock className="w-3 h-3" />
                        {formatTime(question.timestamp)}
                      </span>

                      {!question.answered ? (
                        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          Awaiting response
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          Answered
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      if (question._id) {
                        try {
                          await deleteQuestion(question._id);
                          toast.success("Question deleted", {
                            description: "Question has been removed",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to delete question",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {question.answered && question.answer && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      Instructor Response:
                    </div>
                    <div className="text-sm text-gray-800">{question.answer}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LectureInteractions;
