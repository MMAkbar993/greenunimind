import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "@/styles/quill-custom.css";
import { Button } from "@/components/ui/button";
import { SaveIcon, Download, Share2 } from "lucide-react";
import { toast } from "@/utils/toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface RichTextEditorProps {
  initialContent: string;
  lectureId: string;
  onSave: (content: string, isRichText: boolean, tags: string[]) => void;
  onShare?: () => void;
  isShared?: boolean;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
  "image",
  "color",
  "background",
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent,
  lectureId,
  onSave,
  onShare,
  isShared = false,
}) => {
  const [content, setContent] = useState(initialContent || "");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");


  useEffect(() => {
    setContent(initialContent || "");
  }, [initialContent, lectureId]);

  const handleSave = () => {
    onSave(content, true, tags);
    toast.success("Notes saved", {
      description: "Your lecture notes have been saved.",
    });
  };

  const handleExportPDF = async () => {
    const input = document.getElementById("rich-text-content");
    if (!input) return;

    try {
      toast.loading("Exporting PDF", {
        description: "Please wait while we generate your PDF...",
      });

      const canvas = await html2canvas(input);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`lecture-notes-${lectureId}.pdf`);

      toast.success("PDF Exported", {
        description: "Your notes have been exported as a PDF.",
      });
    } catch (error) {
      toast.error("Export Failed", {
        description: "There was an error exporting your notes.",
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
      setIsShareDialogOpen(false);
      toast.success("Notes Shared", {
        description: "Your notes have been shared successfully.",
      });
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "300px" }}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            title="Export as PDF"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          {onShare && (
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant={isShared ? "default" : "outline"}
                  size="sm"
                  title="Share with other students"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  {isShared ? "Shared" : "Share"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Your Notes</DialogTitle>
                  <DialogDescription>
                    Share your notes with other students in this course.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="student-email" className="text-right">
                      Student Email
                    </Label>
                    <Input
                      id="student-email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="share-public" className="text-right">
                      Share Publicly
                    </Label>
                    <Checkbox
                      id="share-public"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleShare}>Share Notes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col mt-0 pt-0" style={{ minHeight: "250px" }}>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          formats={formats}
          className="flex-1 overflow-auto h-full quill-no-padding"
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column"
          }}
        />
      </div>

      {/* Custom styles applied inline */}

      <div className="mt-4">
        <div className="flex items-center mb-2">
          <Label htmlFor="tags" className="mr-2">
            Tags:
          </Label>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tags..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button variant="outline" size="sm" onClick={handleAddTag}>
            Add Tag
          </Button>
        </div>
      </div>

      <div id="rich-text-content" style={{ display: "none" }}>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      <Button
        onClick={handleSave}
        className="mt-4"
        disabled={!content.trim()}
      >
        <SaveIcon className="h-4 w-4 mr-1" />
        Save Notes
      </Button>
    </div>
  );
};

export default RichTextEditor;
