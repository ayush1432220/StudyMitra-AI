import React, { useState } from "react";
import {
  FileText,
  UploadCloud,
  Search,
  ShieldCheck,
} from "lucide-react";

export default function Documents() {
  const [fileName, setFileName] = useState("");

  return (
    <div className="documents-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">
            KNOWLEDGE BASE
          </span>

          <h1>Your study library</h1>

          <p>
            Upload material that StudyMitra AI can use when answering
            your questions.
          </p>
        </div>

        <label className="primary-button upload-button">
          <UploadCloud size={17} />
          Upload document

          <input
            type="file"
            hidden
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) =>
              setFileName(
                e.target.files?.[0]?.name || ""
              )
            }
          />
        </label>
      </div>

      {fileName && (
        <div className="upload-notice">
          <ShieldCheck size={16} />
          Selected: {fileName}
        </div>
      )}

      <div className="library-toolbar">
        <div className="library-search">
          <Search size={17} />
          <input placeholder="Search documents..." />
        </div>

        <span>0 documents</span>
      </div>

      <div className="document-empty">
        <div className="empty-illustration">
          <FileText size={30} />
        </div>

        <h2>Your library is empty</h2>

        <p>
          Drop your first PDF, document or text file here to
          start building your academic knowledge base.
        </p>

        <label className="secondary-button upload-button">
          <UploadCloud size={16} />
          Choose a file

          <input
            type="file"
            hidden
            accept=".pdf,.doc,.docx,.txt"
          />
        </label>
      </div>
    </div>
  );
}