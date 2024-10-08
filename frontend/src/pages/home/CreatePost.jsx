import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import Picker from '@emoji-mart/react'; // Updated import
// Removed: import 'emoji-mart/css/emoji-mart.css';

const CreatePost = () => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);
  const imgRef = useRef(null);

  const maxCharacters = 280; // Example character limit

  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();

  const {
    mutate: createPost,
    isLoading,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ text, img }) => {
      try {
        const res = await fetch("/api/posts/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, img }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error.message || "An error occurred");
      }
    },

    onSuccess: () => {
      setText("");
      setImg(null);
      imgRef.current.value = null; // Reset file input
      toast.success("Post created successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim().length === 0 && !img) {
      toast.error("Cannot create an empty post.");
      return;
    }
    createPost({ text, img });
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

  const addEmoji = (emoji) => {
    // Insert emoji at the cursor position
    const cursorPosition = imgRef.current?.selectionStart || text.length;
    const newText =
      text.slice(0, cursorPosition) + emoji.native + text.slice(cursorPosition);
    setText(newText);
  };

  return (
    <div className='flex p-4 items-start gap-4 border-b border-gray-700'>
      <div className='avatar'>
        <div className='w-8 rounded-full'>
          <img src={authUser.profileImg || "/avatar-placeholder.png"} alt={`${authUser.fullName}'s avatar`} />
        </div>
      </div>
      <form className='flex flex-col gap-2 w-full' onSubmit={handleSubmit}>
        <textarea
          className='textarea w-full p-2 text-lg resize-none border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition'
          placeholder='What is happening?!'
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= maxCharacters) {
              setText(e.target.value);
            }
          }}
          rows={3}
        />
        <div className='flex justify-between items-center'>
          <span className={`text-sm ${text.length > maxCharacters ? 'text-red-500' : 'text-gray-500'}`}>
            {text.length}/{maxCharacters}
          </span>
          {/* Add character count and prevent exceeding max characters */}
        </div>
        {img && (
          <div className='relative w-72 mx-auto'>
            <IoCloseSharp
              className='absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
              onClick={() => {
                setImg(null);
                imgRef.current.value = null;
              }}
              title="Remove image"
            />
            <img src={img} className='w-full mx-auto h-72 object-contain rounded' alt="Selected" />
          </div>
        )}

        <div className='flex justify-between border-t py-2 border-gray-700'>
          <div className='flex gap-4 items-center relative'>
            <CiImageOn
              className='fill-primary w-6 h-6 cursor-pointer hover:opacity-80 transition'
              onClick={() => imgRef.current.click()}
              title="Add Image"
            />
            {/* Emoji Picker Toggle and Positioning */}
            <div className="relative">
              <BsEmojiSmileFill
                className="fill-primary w-5 h-5 cursor-pointer hover:opacity-80 transition"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Add Emoji"
              />

            {showEmojiPicker && (
            	<div
            		className="absolute z-50 bg-white border rounded shadow"
            		style={{
            			top: "40px", // Ensure this value is enough to display below the icon
            			left: "calc(50% - 30px)", // Move it 25px to the left
            			transform: "translateX(0)",
            			width: "300px",
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
                    theme="light" // You can change to "dark" if preferred
                    // Add other props as needed
                  />
                </div>
              )}
            </div>
          </div>

          <input type="file" accept="image/*" hidden ref={imgRef} onChange={handleImgChange} />
          <button
            type="submit"
            className={`btn btn-primary rounded-full btn-sm text-white px-4 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 transition'
            }`}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size='sm' /> : "Post"}
          </button>
        </div>
        {isError && <div className="text-red-500 mt-2">{error.message}</div>}
      </form>
    </div>
  );
};

export default CreatePost;
