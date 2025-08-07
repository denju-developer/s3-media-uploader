import React, { useState } from "react";
import axios from "axios";

const MAX_FILE_SIZE_MB = 10;
// Allow all image/* and video/* types
const ALLOWED_TYPES = ["image/", "video/"];

const Upload = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError("");
    setUploadProgress(0);
    setUploadComplete(false);
    setPreviewUrl('')

    // If user cancels selection, clear everything
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl("");
      setUploadComplete(false);
      return;
    }

    // Validate type
    const isValidType = ALLOWED_TYPES.some((type) =>
      selectedFile.type.startsWith(type)
    );
    if (!isValidType) {
      setError("Only image and video files are allowed.");
      setFile(null);
      setPreviewUrl("");
      setUploadComplete(false);

      return;
    }

    // Validate size
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File must be less than ${MAX_FILE_SIZE_MB}MB.`);
      setFile(null);
      setPreviewUrl("");
      setUploadComplete(false);

      return;
    }

    setFile(selectedFile);

    // const preview = URL.createObjectURL(selectedFile);
    // setPreviewUrl(preview);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setIsUploading(true);
    setError("");
    setUploadComplete(true);

    try {
      // Step 1: Get signed URL and public URL
      const response = await axios.post(
        "http://localhost:3000/generate-upload-url",
        {
          fileName: file.name,
          fileType: file.type,
        }
      );

      const { signedUrl, publicUrl } = response.data;

      // Step 2: Upload to S3 using signed URL
      await axios.put(signedUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });

      // Update preview with public URL after upload
      setPreviewUrl(publicUrl);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <h2 className="text-center mb-4">S3 Media Uploader</h2>
      <input
        type="file"
        accept="image/*,video/*"
        className="form-control mb-3"
        onChange={handleFileChange}
      />
      {error && <div className="alert alert-danger">{error}</div>}
      <button
        className="btn btn-primary w-100 mb-3"
        onClick={handleUpload}
        disabled={!file || isUploading || uploadComplete}
      >
        {isUploading
          ? "Uploading..."
          : uploadComplete
          ? "Uploaded ✅"
          : "Upload"}
      </button>
      {/* Progress bar with reserved height */}
      <div style={{ minHeight: "30px" }} className="fade-container">
        {uploadProgress > 0 && (
          <div className="progress">
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${uploadProgress}%` }}
            >
              {uploadProgress}%
            </div>
          </div>
        )}
      </div>
      {/* Preview with reserved height */}
      <div
        style={{ minHeight: "320px" }}
        className="fade-container mt-3 text-center"
      >
        {previewUrl && file && (
          <>
            {file.type.startsWith("image/") ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="img-fluid rounded shadow"
                style={{
                  maxHeight: "300px",
                  transition: "opacity 0.3s ease-in-out",
                }}
              />
            ) : (
              <video
                controls
                className="rounded shadow"
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  transition: "opacity 0.3s ease-in-out",
                }}
              >
                <source src={previewUrl} type={file?.type || "video/mp4"} />
                Your browser does not support the video tag.
              </video>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Upload;
