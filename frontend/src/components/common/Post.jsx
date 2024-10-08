import {
	FaRegComment,
	FaRegHeart,
	FaRegBookmark,
	FaTrash,
	FaEdit,
  } from "react-icons/fa";
  import { BiShareAlt } from "react-icons/bi";
  import AdComponent from "../../components/common/AdComponent";
  
  import { useState } from "react";
  import { Link } from "react-router-dom";
  import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
  import { toast } from "react-hot-toast";
  import LoadingSpinner from "./LoadingSpinner";
  import { formatPostDate } from "../../utils/date";
  import {
	WhatsappShareButton,
	FacebookShareButton,
	TwitterShareButton,
	WhatsappIcon,
	FacebookIcon,
	TwitterIcon,
  } from "react-share";
  import styled from "styled-components";
  
  // Styled Components
  const IconContainer = styled.div`
	display: flex;
	justify-content: space-between;
	margin: 10px 0; /* Space around the icons */
  `;
  
  const ShareButton = styled.div`
	margin-right: 15px; /* Increase space between buttons */
	font-size: 32px; /* Adjust icon size */
	cursor: pointer;
  `;
  
  const Post = ({ post, index }) => {
	const [comment, setComment] = useState("");
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);
	const [selectedImage, setSelectedImage] = useState("");
	const [showShareModal, setShowShareModal] = useState(false); // State to toggle share modal
  
	// New states for editing
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editedText, setEditedText] = useState(post.text);
	const [editedImage, setEditedImage] = useState(null);
	const [removeImage, setRemoveImage] = useState(false);
  
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const queryClient = useQueryClient();
	const postOwner = post.user;
  
	// Only check if liked if authUser is defined
	const isLiked = authUser ? post.likes.includes(authUser._id) : false;
  
	// Check if it's my post only if authUser is defined
	const isMyPost = authUser ? authUser._id === post.user._id : false;
  
	const formattedDate = formatPostDate(post.createdAt);
  
	// Mutation for deleting post
	const { mutate: deletePost, isPending: isDeleting } = useMutation({
	  mutationFn: async () => {
		try {
		  const res = await fetch(`/api/posts/${post._id}`, {
			method: "DELETE",
		  });
		  const data = await res.json();
		  if (!res.ok) {
			throw new Error(data.error || "Something went wrong");
		  }
		  return data;
		} catch (error) {
		  throw new Error(error);
		}
	  },
	  onSuccess: () => {
		toast.success("Post deleted successfully");
		queryClient.invalidateQueries({ queryKey: ["posts"] });
	  },
	  onError: (error) => {
		toast.error(error.message);
	  },
	});
  
	// Mutation for liking post
	const { mutate: likePost, isPending: isLiking } = useMutation({
	  mutationFn: async () => {
		try {
		  const res = await fetch(`/api/posts/like/${post._id}`, {
			method: "POST",
		  });
		  const data = await res.json();
		  if (!res.ok) {
			throw new Error(data.error || "Something went wrong");
		  }
		  return data;
		} catch (error) {
		  throw new Error(error);
		}
	  },
	  onSuccess: (updatedLikes) => {
		queryClient.setQueryData(["posts"], (oldData) => {
		  return oldData.map((p) => {
			if (p._id === post._id) {
			  return { ...p, likes: updatedLikes };
			}
			return p;
		  });
		});
	  },
	  onError: (error) => {
		toast.error(error.message);
	  },
	});
  
	// Mutation for commenting on post
	const { mutate: commentPost, isPending: isCommenting } = useMutation({
	  mutationFn: async () => {
		try {
		  const res = await fetch(`/api/posts/comment/${post._id}`, {
			method: "POST",
			headers: {
			  "Content-Type": "application/json",
			},
			body: JSON.stringify({ text: comment }),
		  });
		  const data = await res.json();
  
		  if (!res.ok) {
			throw new Error(data.error || "Something went wrong");
		  }
		  return data;
		} catch (error) {
		  throw new Error(error);
		}
	  },
	  onSuccess: () => {
		toast.success("Comment posted successfully");
		setComment("");
		queryClient.invalidateQueries({ queryKey: ["posts"] });
	  },
	  onError: (error) => {
		toast.error(error.message);
	  },
	});
  
	// Mutation for editing post
	const { mutate: editPost, isPending: isEditing } = useMutation({
	  mutationFn: async (formData) => {
		try {
		  const res = await fetch(`/api/posts/${post._id}`, {
			method: "PUT",
			body: formData,
		  });
		  const data = await res.json();
		  if (!res.ok) {
			throw new Error(data.error || "Something went wrong");
		  }
		  return data;
		} catch (error) {
		  throw new Error(error);
		}
	  },
	  onSuccess: (updatedPost) => {
		toast.success("Post updated successfully");
		setIsEditModalOpen(false);
		// Update the post in the cache
		queryClient.setQueryData(["posts"], (oldData) => {
		  return oldData.map((p) => (p._id === post._id ? updatedPost : p));
		});
	  },
	  onError: (error) => {
		toast.error(error.message);
	  },
	});
  
	// Handler to delete post
	const handleDeletePost = () => {
	  if (!authUser) {
		toast.error("You need to be logged in to delete posts.");
		return;
	  }
	  deletePost();
	};
  
	// Handler to open edit modal
	const handleEditPost = () => {
	  if (!authUser) {
		toast.error("You need to be logged in to edit posts.");
		return;
	  }
	  setEditedText(post.text);
	  setEditedImage(null);
	  setRemoveImage(false);
	  setIsEditModalOpen(true);
	};
  
	// Handler to submit edited post
	const handleSubmitEdit = (e) => {
	  e.preventDefault();
	  if (!editedText.trim()) {
		toast.error("Post text cannot be empty.");
		return;
	  }
  
	  const formData = new FormData();
	  formData.append("text", editedText);
	  if (editedImage) {
		formData.append("img", editedImage);
	  }
	  if (removeImage) {
		formData.append("removeImage", true);
	  }
  
	  editPost(formData);
	};
  
	// Handler to post comment
	const handlePostComment = (e) => {
	  e.preventDefault();
	  if (!authUser) {
		toast.error("You need to be logged in to comment.");
		return;
	  }
	  if (isCommenting) return;
	  commentPost();
	};
  
	// Handler to like post
	const handleLikePost = () => {
	  if (!authUser) {
		toast.error("You need to be logged in to like posts.");
		return;
	  }
	  if (isLiking) return;
	  likePost();
	};
  
	// Handler to open image modal
	const handleImageClick = (imgSrc) => {
	  setSelectedImage(imgSrc);
	  setIsImageModalOpen(true);
	};
  
	// Handler to close modal
	const closeModal = () => {
	  setIsImageModalOpen(false);
	  setSelectedImage("");
	};
  
	// Handler to toggle share modal
	const handleSharePost = () => {
	  setShowShareModal(!showShareModal);
	};
  
	// Utility to get first ten letters
	const getFirstTenLetters = (text) => {
	  return text.slice(0, 10) + (text.length > 10 ? "..." : "");
	};
  
	const postUrl = `https://youconect.com/posts/${post._id}`;
  
	return (
	  <>
		<div className="flex gap-2 items-start p-4 border-b border-gray-700">
		  <div className="avatar">
			<Link
			  to={`/profile/${postOwner.username}`}
			  className="w-8 rounded-full overflow-hidden"
			>
			  <img
				src={postOwner.profileImg || "/avatar-placeholder.png"}
				alt={`${postOwner.fullName}'s avatar`}
			  />
			</Link>
		  </div>
		  <div className="flex flex-col flex-1">
			<div className="flex gap-2 items-center">
			  <Link to={`/profile/${postOwner.username}`} className="font-bold">
				{postOwner.fullName}
			  </Link>
			  <span className="text-gray-700 flex gap-1 text-sm">
				<Link to={`/profile/${postOwner.username}`}>
				  @{postOwner.username}
				</Link>
				<span>·</span>
				<span>{formattedDate}</span>
			  </span>
			  {isMyPost && (
				<span className="flex justify-end flex-1 space-x-2">
				  {!isDeleting && (
					<>
					  {/* Edit Icon */}
					  <FaEdit
						className="cursor-pointer hover:text-blue-500"
						onClick={handleEditPost}
						title="Edit Post"
					  />
					  {/* Delete Icon */}
					  <FaTrash
						className="cursor-pointer hover:text-red-500"
						onClick={handleDeletePost}
						title="Delete Post"
					  />
					</>
				  )}
				  {isDeleting && <LoadingSpinner size="sm" />}
				</span>
			  )}
			</div>
			{/* Wrap post text and image in a Link to navigate to the PostDetail page */}
			<Link
			  to={`/posts/${post._id}`}
			  className="flex flex-col gap-3 overflow-hidden"
			>
			  <div className="whitespace-pre-wrap text-lg mt-2">{post.text}</div>
			  {post.img && (
				<img
				  src={post.img}
				  className="h-80 object-contain rounded-lg border border-gray-700 cursor-pointer"
				  alt="Post"
				  onClick={() => handleImageClick(post.img)}
				/>
			  )}
			</Link>
			<div className="flex justify-between mt-3">
			  <div className="flex gap-4 items-center w-2/3 justify-between">
				{/* Comment Icon */}
				<div
				  className="flex gap-1 items-center cursor-pointer group"
				  onClick={() =>
					document
					  .getElementById(`comments_modal${post._id}`)
					  .showModal()
				  }
				>
				  <FaRegComment className="w-4 h-4  text-slate-500 group-hover:text-sky-400" />
				  <span className="text-sm text-slate-500 group-hover:text-sky-400">
					{post.comments.length}
				  </span>
				</div>
  
				{/* Comments Modal */}
				<dialog
				  id={`comments_modal${post._id}`}
				  className="modal border-none outline-none"
				>
				  <div className="modal-box rounded border border-gray-600">
					<h3 className="font-bold text-lg mb-4">COMMENTS</h3>
					<div className="flex flex-col gap-3 max-h-60 overflow-auto">
					  {post.comments.length === 0 && (
						<p className="text-sm text-slate-500">
						  No comments yet 🤔 Be the first one 😉
						</p>
					  )}
					  {post.comments.map((comment) => (
						<div
						  key={comment._id}
						  className="flex gap-2 items-start"
						>
						  <div className="avatar">
							<div className="w-8 rounded-full">
							  <img
								src={
								  comment.user.profileImg ||
								  "/avatar-placeholder.png"
								}
								alt={`${comment.user.fullName}'s avatar`}
							  />
							</div>
						  </div>
						  <div className="flex flex-col">
							<div className="flex items-center gap-1">
							  <span className="font-bold">
								{comment.user.fullName}
							  </span>
							  <span className="text-gray-700 text-sm">
								@{comment.user.username}
							  </span>
							</div>
							<div className="text-sm">{comment.text}</div>
						  </div>
						</div>
					  ))}
					</div>
					<form
					  className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2"
					  onSubmit={handlePostComment}
					>
					  <textarea
						className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800"
						placeholder="Add a comment..."
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						required
					  />
					  <button
						className="btn btn-primary rounded-full btn-sm text-white px-4"
						type="submit"
					  >
						{isCommenting ? <LoadingSpinner size="md" /> : "Post"}
					  </button>
					</form>
				  </div>
				  <form method="dialog" className="modal-backdrop">
					<button className="outline-none">close</button>
				  </form>
				</dialog>
  
				{/* Share Icon */}
				<div className="flex gap-1 items-center group cursor-pointer">
				  <BiShareAlt
					className="w-6 h-6 text-slate-500 cursor-pointer"
					onClick={handleSharePost}
					title="Share Post"
				  />
				</div>
  
				{/* Like Icon */}
				<div
				  className="flex gap-1 items-center group cursor-pointer"
				  onClick={handleLikePost}
				>
				  {isLiking && <LoadingSpinner size="sm" />}
				  {!isLiked && !isLiking && (
					<FaRegHeart className="w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500" />
				  )}
				  {isLiked && !isLiking && (
					<FaRegHeart className="w-4 h-4 cursor-pointer text-pink-500" />
				  )}
				  <span
					className={`text-sm group-hover:text-pink-500 ${
					  isLiked ? "text-pink-500" : "text-slate-500"
					}`}
				  >
					{post.likes.length}
				  </span>
				</div>
			  </div>
			  <div className="flex w-1/3 justify-end gap-2 items-center">
				<FaRegBookmark
				  className="w-4 h-4 text-slate-500 cursor-pointer"
				  title="Bookmark Post"
				/>
			  </div>
			</div>
		  </div>
		</div>
  
		{/* Insert AdComponent after every 5 posts */}
		{index > 0 && index % 5 === 0 && <AdComponent />}
  
		{/* Modal for image magnification */}
		{isImageModalOpen && (
		  <div
			className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
			onClick={closeModal}
		  >
			<div className="relative">
			  <img
				src={selectedImage}
				className="max-w-full max-h-screen object-contain rounded-lg"
				alt="Magnified"
			  />
			  <button
				className="absolute top-2 right-2 text-white text-2xl"
				onClick={closeModal}
				aria-label="Close Image"
			  >
				×
			  </button>
			</div>
		  </div>
		)}
  
		{/* Share Modal */}
		{showShareModal && (
		  <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
			<div className="bg-white p-4 rounded shadow-lg">
			  <h3 className="font-bold text-lg mb-4">Share this post</h3>
			  <IconContainer>
				<ShareButton>
				  <WhatsappShareButton
					url={postUrl}
					title={getFirstTenLetters(post.text)}
					separator=":: "
				  >
					<WhatsappIcon size={32} round={true} />
				  </WhatsappShareButton>
				</ShareButton>
  
				<ShareButton>
				  <FacebookShareButton
					url={postUrl}
					quote={getFirstTenLetters(post.text)}
					hashtag="#YouConect"
				  >
					<FacebookIcon size={32} round={true} />
				  </FacebookShareButton>
				</ShareButton>
  
				<ShareButton>
				  <TwitterShareButton
					url={postUrl}
					title={getFirstTenLetters(post.text)}
				  >
					<TwitterIcon size={32} round={true} />
				  </TwitterShareButton>
				</ShareButton>
			  </IconContainer>
			  <button
				className="mt-4 text-red-600"
				onClick={handleSharePost} // Close share modal
				aria-label="Close Share Modal"
			  >
				Close
			  </button>
			</div>
		  </div>
		)}
  
		{/* Edit Modal */}
		{isEditModalOpen && (
		  <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
			<div className="bg-white p-6 rounded-lg w-11/12 max-w-md relative">
			  <h2 className="text-xl font-bold mb-4">Edit Post</h2>
			  <form onSubmit={handleSubmitEdit} className="flex flex-col gap-4">
				<div>
				  <label htmlFor="editText" className="block text-sm font-medium text-gray-700">
					Post Text
				  </label>
				  <textarea
					id="editText"
					className="mt-1 w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
					rows="4"
					value={editedText}
					onChange={(e) => setEditedText(e.target.value)}
					required
				  ></textarea>
				</div>
  
				<div>
				  <label className="block text-sm font-medium text-gray-700">
					Post Image
				  </label>
				  {post.img && (
					<div className="flex items-center mb-2">
					  <img
						src={post.img}
						alt="Current Post"
						className="h-20 w-20 object-cover rounded mr-4"
					  />
					  <button
						type="button"
						className="text-red-500 hover:underline"
						onClick={() => setRemoveImage(!removeImage)}
					  >
						{removeImage ? "Cancel Remove" : "Remove Image"}
					  </button>
					</div>
				  )}
				  {!removeImage && (
					<input
					  type="file"
					  accept="image/*"
					  onChange={(e) => setEditedImage(e.target.files[0])}
					/>
				  )}
				</div>
  
				<div className="flex justify-end gap-2">
				  <button
					type="button"
					className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
					onClick={() => setIsEditModalOpen(false)}
				  >
					Cancel
				  </button>
				  <button
					type="submit"
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
					disabled={isEditing}
				  >
					{isEditing ? <LoadingSpinner size="sm" /> : "Save Changes"}
				  </button>
				</div>
			  </form>
			</div>
		  </div>
		)}
	  </>
	);
  };
  
  export default Post;
  