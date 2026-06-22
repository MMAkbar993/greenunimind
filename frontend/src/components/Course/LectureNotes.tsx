
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SaveIcon } from "lucide-react";
import { toast } from "@/utils/toast";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  useCreateOrUpdateNoteMutation,
  useGetNoteByLectureAndStudentQuery,
  useShareNoteMutation,
  useGetSharedNotesQuery,
} from "@/redux/features/note/noteApi";
import {
  selectNoteByLecture,
} from "@/redux/features/note/noteSlice";
import { useAppSelector } from "@/redux/hooks";

interface LectureNotesProps {
  lectureId: string;
  initialNotes?: string;
}

const LectureNotes = ({ lectureId }: LectureNotesProps) => {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("plain");


  // Get current user data
  const { data: userData } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;

  // Get note from Redux
  const savedNote = useAppSelector((state) => {
    // Check if note slice exists in state
    if (!state.note) return null;
    return selectNoteByLecture(state, lectureId);
  });

  // API mutations and queries
  const [createOrUpdateNote] = useCreateOrUpdateNoteMutation();
  const [shareNote] = useShareNoteMutation();

  // Fetch note when component mounts or lectureId/studentId changes
  const { data: noteData } = useGetNoteByLectureAndStudentQuery(
    { lectureId, studentId: studentId || "" },
    { skip: !lectureId || !studentId }
  );

  // Fetch shared notes
  useGetSharedNotesQuery(lectureId, { skip: !lectureId });

  // Update notes when note data changes
  useEffect(() => {
    if (noteData?.data?.content) {
      setNotes(noteData.data.content);

      // If the note is rich text, switch to rich text editor
      if (noteData.data.isRichText) {
        setActiveTab("rich");
      }
    } else {
      setNotes("");
    }
  }, [noteData, lectureId]);

  // Auto-save debounce for plain text editor
  useEffect(() => {
    if (!studentId || !lectureId || activeTab !== "plain") return;

    // Only auto-save if the user has made changes to the notes
    // This prevents auto-saving (and showing a toast) when the component first loads
    if (notes !== savedNote?.content && notes !== "") {
      const timer = setTimeout(() => {
        // Using an inline function to avoid dependency issues
        const saveNotes = async () => {
          if (!studentId || !lectureId || notes === savedNote?.content) return;

          setIsSaving(true);

          try {
            await createOrUpdateNote({
              studentId,
              data: {
                content: notes,
                lectureId,
                isRichText: false,
              },
            });

            // Only show toast if there was actual content saved (not on initial load)
            if (notes.trim().length > 0) {
              toast.success("Notes saved", {
                description: "Your lecture notes have been saved.",
              });
            }
          } catch (error) {
            toast.error("Error saving notes", {
              description: "There was a problem saving your notes.",
            });
          } finally {
            setIsSaving(false);
          }
        };

        saveNotes();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    notes,
    savedNote,
    studentId,
    lectureId,
    activeTab,
    createOrUpdateNote,
    toast,
  ]);

  const handleSave = async () => {
    if (!studentId || !lectureId || notes === savedNote?.content) return;

    setIsSaving(true);

    try {
      await createOrUpdateNote({
        studentId,
        data: {
          content: notes,
          lectureId,
          isRichText: false,
        },
      });

      toast.success("Notes saved", {
        description: "Your lecture notes have been saved.",
      });
    } catch (error) {
      toast.error("Error saving notes", {
        description: "There was a problem saving your notes.",
      });
    } finally {
      setIsSaving(false);
    }
  };



  const handleShareNote = async () => {
    if (!studentId || !lectureId || !savedNote?._id) return;

    try {
      await shareNote({
        noteId: savedNote._id,
        studentIds: [], // Empty array means share with all students
      });

      toast.success("Notes shared", {
        description: "Your notes have been shared with other students.",
      });
    } catch (error) {
      toast.error("Error sharing notes", {
        description: "There was a problem sharing your notes.",
      });
    }
  };



  return (
    <div className="lecture-notes flex flex-col h-full bg-white rounded-lg shadow-md border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-1.5 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800">Notes</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-gray-600 hover:text-purple-600 hover:bg-purple-100 transition-colors"
            onClick={handleSave}
            disabled={isSaving || notes === savedNote?.content || !studentId}
          >
            <SaveIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-gray-600 hover:text-purple-600 hover:bg-purple-100 transition-colors"
            onClick={handleShareNote}
            disabled={!savedNote?._id}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </Button>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <div className="mb-3">
          <Input
            placeholder="Note Title"
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            value={notes.split('\n')[0] || ''}
            onChange={(e) => {
              const firstLine = e.target.value;
              const restOfNotes = notes.split('\n').slice(1).join('\n');
              setNotes(`${firstLine}\n${restOfNotes}`);
            }}
          />
        </div>

        <Textarea
          placeholder="Write something..."
          className="flex-1 resize-none border-gray-200 focus:border-purple-500 focus:ring-purple-500 min-h-[200px]"
          value={notes.split('\n').slice(1).join('\n')}
          onChange={(e) => {
            const firstLine = notes.split('\n')[0] || '';
            setNotes(`${firstLine}\n${e.target.value}`);
          }}
        />

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2">
            <button className="p-1 text-gray-500 hover:text-purple-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7V4h16v3"/>
                <path d="M9 20h6"/>
                <path d="M12 4v16"/>
              </svg>
            </button>
            <button className="p-1 text-gray-500 hover:text-purple-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
              </svg>
            </button>
            <button className="p-1 text-gray-500 hover:text-purple-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button className="p-1 text-gray-500 hover:text-purple-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm hover:shadow transition-all duration-200"
            onClick={handleSave}
            disabled={isSaving || notes === savedNote?.content || !studentId}
          >
            <SaveIcon className="h-3.5 w-3.5 mr-1.5" />
            Save Note
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LectureNotes;
