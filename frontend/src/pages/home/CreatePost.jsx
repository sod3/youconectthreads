// CreatePost.jsx
import { CiImageOn, CiVideoOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import Picker from "@emoji-mart/react";
import LoadingSpinner from "../../components/common/LoadingSpinner"; // Ensure you have this component
import { uploadVideoToFirebase } from "../../components/common/storage"; // Import the video upload function

const CreatePost = () => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);
  const imgRef = useRef(null);
  const [video, setVideo] = useState(null);
  const videoRef = useRef(null);
  const [videoURL, setVideoURL] = useState(null); // Store the Firebase video URL
  const [isUploadingVideo, setIsUploadingVideo] = useState(false); // Track upload state
  const maxCharacters = 1500;

  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();

  const { mutate: createPost, isLoading, isError, error } = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        // No need to set "Content-Type", fetch will set it automatically for FormData
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    onSuccess: () => {
      setText("");
      setImg(null);
      setVideo(null);
      setVideoURL(null); // Clear video URL state
      if (imgRef.current) {
        imgRef.current.value = null;
      }
      if (videoRef.current) {
        videoRef.current.value = null;
      }
      toast.success("Post created successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err) => {
      toast.error(`Post creation failed: ${err.message}`);
    },
  });
  

  const handleSubmit = (e) => {
    e.preventDefault();
  
    // Prevent empty post submission
    if (text.trim().length === 0 && !img && !videoURL) {
      toast.error("Cannot create an empty post.");
      return;
    }
  
    // Create a new FormData object
    const formData = new FormData();
    formData.append('text', text);
    
    // If image file exists, append to FormData
    if (img) {
      formData.append('file', img); // Ensure 'file' key matches back end for image
    }
    
    // If Firebase video URL exists, append it
    if (videoURL) {
      formData.append('video', videoURL); // Ensure 'video' key matches back end for video URL
    }
  
    // Send the formData instead of JSON
    createPost(formData);
  };
  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file);

      // Upload video to Firebase and get the video URL
      setIsUploadingVideo(true);
      try {
        const url = await uploadVideoToFirebase(file);
        setVideoURL(url); // Store the Firebase video URL
        toast.success("Video uploaded successfully!");
      } catch (error) {
        toast.error("Video upload failed");
      } finally {
        setIsUploadingVideo(false);
      }
    }
  };

  const addEmoji = (emoji) => {
    const cursorPosition = imgRef.current?.selectionStart || text.length;
    const newText =
      text.slice(0, cursorPosition) + emoji.native + text.slice(cursorPosition);
    setText(newText);
    setShowEmojiPicker(false); // Optional: Close picker after selection
  };

  return (
    <div className="flex p-4 items-start gap-4 border-b border-gray-700">
      <div className="avatar">
        <div className="w-8 rounded-full">
          <img
            src={authUser.profileImg || "/avatar-placeholder.png"}
            alt={`${authUser.fullName}'s avatar`}
          />
        </div>
      </div>
      <form className="flex flex-col gap-2 w-full" onSubmit={handleSubmit}>
        <textarea
          className="textarea w-full p-2 text-lg resize-none border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
          placeholder="What is happening?!"
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= maxCharacters) {
              setText(e.target.value);
            }
          }}
          rows={3}
        />
        <div className="flex justify-between items-center">
          <span
            className={`text-sm ${
              text.length > maxCharacters ? "text-red-500" : "text-white"
            }`}
          >
            {text.length}/{maxCharacters}
          </span>
        </div>
        {img && (
          <div className="relative w-72 mx-auto">
            <IoCloseSharp
              className="absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer"
              onClick={() => {
                setImg(null);
                if (imgRef.current) {
                  imgRef.current.value = null;
                }
              }}
              title="Remove image"
            />
            <img
              src={URL.createObjectURL(img)} // Create preview URL for image
              className="w-full mx-auto h-72 object-contain rounded"
              alt="Selected"
            />
          </div>
        )}
        {video && (
          <div className="relative w-72 mx-auto">
            <IoCloseSharp
              className="absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer"
              onClick={() => {
                setVideo(null);
                setVideoURL(null); // Clear video URL if video is removed
                if (videoRef.current) {
                  videoRef.current.value = null;
                }
              }}
              title="Remove video"
            />
            <video
              src={URL.createObjectURL(video)} // Create preview URL for video
              className="w-full mx-auto h-72 object-contain rounded"
              controls
            />
          </div>
        )}
       <div className="flex justify-between items-center border-t py-2 border-gray-700">
          <div className="flex gap-6 items-center relative">
            <BsEmojiSmileFill
              className="fill-primary w-7 h-7 cursor-pointer hover:opacity-80 transition-transform transform hover:scale-110"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Add Emoji"
              aria-label="Add Emoji"
            />
            <CiImageOn
              className="fill-primary w-8 h-8 cursor-pointer hover:opacity-80 transition-transform transform hover:scale-110"
              onClick={() => imgRef.current.click()}
              title="Add Image"
              aria-label="Add Image"
            />
            <CiVideoOn
              className="fill-primary w-8 h-8 cursor-pointer hover:opacity-80 transition-transform transform hover:scale-110"
              onClick={() => videoRef.current.click()}
              title="Add Video"
              aria-label="Add Video"
            />
              {showEmojiPicker && (
                <div
                  className="absolute z-50 bg-white border rounded shadow"
                  style={{
                    top: "40px", // Ensure this value is enough to display below the icon
                    left: "calc(50% - 70px)", // Center the picker
                    transform: "translateX(0)",
                    width: "300px",
                    "@media (max-width: 430px)": {
                      width: "200px",
                    },
                    maxWidth: "100%",
                  }}
                >
                  <div className="flex justify-end p-1">
                    <IoCloseSharp
                      className="w-5 h-5 cursor-pointer text-gray-500"
                      onClick={() => setShowEmojiPicker(false)}
                    />
                  </div>
                  <Picker
                    onEmojiSelect={addEmoji}
                    theme="light"
                  />
                </div>
              )}
            </div>
          <input
            type="file"
            accept="image/*"
            hidden
            ref={imgRef}
            onChange={handleImgChange}
          />
          <input
            type="file"
            accept="video/*"
            hidden
            ref={videoRef}
            onChange={handleVideoChange}
          />
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-md transition hover:bg-primary-dark"
            disabled={isLoading || isUploadingVideo}
          >
            {isLoading || isUploadingVideo ? <LoadingSpinner /> : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};
export default CreatePost;