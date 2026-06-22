import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight } from "lucide-react"

const CourseUploadStep = ({ setCurrentStep, submitMaterialsForm }) => {
  const [file, setFile] = useState<File | null>(null)

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
    }
  }, [])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Upload Course Materials</h3>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-edu-light p-3">
                <svg
                  className="h-6 w-6 text-edu-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Drag and drop files here
              </p>
              <p className="text-xs text-gray-500">
                Support for video, PDF, DOCX, etc.
              </p>
            </div>

            {/* File Input */}
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0])
              }}
            />
            <label htmlFor="file-upload" className="cursor-pointer inline-block">
              <Button type="button" variant="outline" size="sm">
                Browse Files
              </Button>
            </label>

            {file && (
              <div className="mt-4">
                <Input
                  value={file.name}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep(0)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button type="button" onClick={submitMaterialsForm}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default CourseUploadStep
