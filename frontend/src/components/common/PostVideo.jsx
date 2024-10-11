// PostVideo.jsx
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { toast } from "react-hot-toast";
import { uploadVideoToFirebase } from './storage'; // Firebase upload function

const PostVideo = ({ onVideoUpload, setIsVideoUploading }) => {
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null); // Store the actual File object
  const videoRef = useRef(null);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file) {
      if (file.size > maxFileSize) {
        toast.error("Video file size exceeds 50MB limit");
        return;
      }
      if (file.type === "video/mp4" || file.type === "video/webm") {
        const reader = new FileReader();
        reader.onload = () => setVideoPreview(reader.result);
        reader.readAsDataURL(file);
        setVideoFile(file);
      } else {
        toast.error("Only MP4 and WebM videos are supported");
      }
    }
  };
  
  const handleRemoveVideo = () => {
    setVideoPreview(null);
    setVideoFile(null);
    if (videoRef.current) {
      videoRef.current.value = null;
    } else {
      console.warn("videoRef.current is null");
    }
  };

  const uploadVideo = async () => {
    if (videoFile) {
      console.log("Starting video upload:", videoFile);
      setIsVideoUploading(true); // Start video upload
      try {
        const videoUrl = await uploadVideoToFirebase(videoFile);
        console.log("Video uploaded successfully:", videoUrl);
        onVideoUpload(videoUrl); // Send video URL to parent component
        toast.success("Video uploaded successfully");
        handleRemoveVideo();
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Error uploading video");
      } finally {
        setIsVideoUploading(false); // End video upload
      }
    } else {
      toast.error("Please select a video to upload");
    }
  };
  

  return (
    <div className="flex flex-col gap-2">
      {videoPreview && (
        <div className="relative w-72 mx-auto">
          <IoCloseSharp
            className="absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer"
            onClick={handleRemoveVideo}
            title="Remove video"
          />
         <video className="w-full mx-auto h-72 object-contain rounded" src={videoPreview} controls />
        </div>
      )}
      <input
        type="file"
        accept="video/mp4,video/webm"
        ref={videoRef}
        onChange={handleVideoChange}
      />
      <button
        className="btn btn-primary"
        onClick={uploadVideo}
        disabled={!videoFile || setIsVideoUploading} // Disable if no video or uploading
      >
        Upload Video
      </button>
    </div>
  );
};

export default PostVideo;
