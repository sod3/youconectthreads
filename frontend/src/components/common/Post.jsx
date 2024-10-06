import { FaRegComment } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { BiShareAlt } from "react-icons/bi";

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

const Post = ({ post }) => {
	const [comment, setComment] = useState("");
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);
	const [selectedImage, setSelectedImage] = useState("");
	const [showShareModal, setShowShareModal] = useState(false); // State to toggle share modal

	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const queryClient = useQueryClient();
	const postOwner = post.user;

	// Only check if liked if authUser is defined
	const isLiked = authUser ? post.likes.includes(authUser._id) : false;

	// Check if it's my post only if authUser is defined
	const isMyPost = authUser ? authUser._id === post.user._id : false;

	const formattedDate = formatPostDate(post.createdAt);

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
	});

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

	const handleDeletePost = () => {
		if (!authUser) {
			toast.error("You need to be logged in to delete posts.");
			return;
		}
		deletePost();
	};

	const handlePostComment = (e) => {
		e.preventDefault();
		if (!authUser) {
			toast.error("You need to be logged in to comment.");
			return;
		}
		if (isCommenting) return;
		commentPost();
	};

	const handleLikePost = () => {
		if (!authUser) {
			toast.error("You need to be logged in to like posts.");
			return;
		}
		if (isLiking) return;
		likePost();
	};

	const handleImageClick = (imgSrc) => {
		setSelectedImage(imgSrc);
		setIsImageModalOpen(true);
	};

	// Handle modal close
	const closeModal = () => {
		setIsImageModalOpen(false);
		setSelectedImage("");
	};
	const handleSharePost = () => {
		setShowShareModal(!showShareModal); // Toggle share modal visibility
	};
	

	const postUrl = `https://youconect.com/posts/${post._id}`; 
	return (
		<>
			<div className='flex gap-2 items-start p-4 border-b border-gray-700'>
				<div className='avatar'>

					<Link to={`/profile/${postOwner.username}`} className='w-8 rounded-full overflow-hidden'>
						<img src={postOwner.profileImg || "/avatar-placeholder.png"} />
					</Link>
				</div>
				<div className='flex flex-col flex-1'>
					<div className='flex gap-2 items-center'>

						<Link to={`/profile/${postOwner.username}`} className='font-bold'>
							{postOwner.fullName}
						</Link>
						<span className='text-gray-700 flex gap-1 text-sm'>

							<Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
							<span>·</span>
							<span>{formattedDate}</span>
						</span>
						{isMyPost && (
							<span className='flex justify-end flex-1'>
								{!isDeleting && (
									<FaTrash className='cursor-pointer hover:text-red-500' onClick={handleDeletePost} />
								)}
								{isDeleting && <LoadingSpinner size='sm' />}
							</span>
						)}
					</div>
                    {/* Wrap post text and image in a Link to navigate to the PostDetail page */}
                    <Link to={`/posts/${post._id}`} className="flex flex-col gap-3 overflow-hidden">
                        <span>{post.text}</span>
                        {post.img && (
                            <img
                                src={post.img}
                                className='h-80 object-contain rounded-lg border border-gray-700 cursor-pointer'
                                alt='Post Image'
                                onClick={() => handleImageClick(post.img)} // Add click handler for modal image
                            />
                        )}
                    </Link>
					<div className='flex justify-between mt-3'>
						<div className='flex gap-4 items-center w-2/3 justify-between'>
							<div
								className='flex gap-1 items-center cursor-pointer group'

								onClick={() => document.getElementById(`comments_modal${post._id}`).showModal()}
							>
								<FaRegComment className='w-4 h-4  text-slate-500 group-hover:text-sky-400' />
								<span className='text-sm text-slate-500 group-hover:text-sky-400'>
									{post.comments.length}
								</span>
							</div>

							<dialog id={`comments_modal${post._id}`} className='modal border-none outline-none'>
								<div className='modal-box rounded border border-gray-600'>
									<h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
									<div className='flex flex-col gap-3 max-h-60 overflow-auto'>
										{post.comments.length === 0 && (
											<p className='text-sm text-slate-500'>
												No comments yet 🤔 Be the first one 😉
											</p>
										)}
										{post.comments.map((comment) => (
											<div key={comment._id} className='flex gap-2 items-start'>
												<div className='avatar'>
													<div className='w-8 rounded-full'>
														<img
															src={comment.user.profileImg || "/avatar-placeholder.png"}
														/>
													</div>
												</div>
												<div className='flex flex-col'>
													<div className='flex items-center gap-1'>
														<span className='font-bold'>{comment.user.fullName}</span>
														<span className='text-gray-700 text-sm'>
															@{comment.user.username}
														</span>
													</div>
													<div className='text-sm'>{comment.text}</div>
												</div>
											</div>
										))}
									</div>
									<form
										className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
										onSubmit={handlePostComment}
									>
										<textarea
											className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800'
											placeholder='Add a comment...'
											value={comment}
											onChange={(e) => setComment(e.target.value)}
										/>
										<button className='btn btn-primary rounded-full btn-sm text-white px-4'>
											{isCommenting ? <LoadingSpinner size='md' /> : "Post"}
										</button>
									</form>
								</div>
								<form method='dialog' className='modal-backdrop'>
									<button className='outline-none'>close</button>
								</form>
							</dialog>					
							<div className='flex gap-1 items-center group cursor-pointer'>
								<BiShareAlt className='w-6 h-6 text-slate-500 cursor-pointer' onClick={handleSharePost} />
							</div>
							<div className='flex gap-1 items-center group cursor-pointer' onClick={handleLikePost}>
								{isLiking && <LoadingSpinner size='sm' />}
								{!isLiked && !isLiking && (
									<FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500' />
								)}
								{isLiked && !isLiking && (
									<FaRegHeart className='w-4 h-4 cursor-pointer text-pink-500 ' />
								)}

								<span

									className={`text-sm  group-hover:text-pink-500 ${
										isLiked ? "text-pink-500" : "text-slate-500"

									}`}
								>
									{post.likes.length}
								</span>
							</div>
						</div>
						<div className='flex w-1/3 justify-end gap-2 items-center'>
							<FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer' />
						</div>
					</div>
				</div>
				
			</div>

			{/* Modal for image magnification */}
			{isImageModalOpen && (
				<div
					className='fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50'
					onClick={closeModal}
				>
					<div className='relative'>
						<img
							src={selectedImage}
							className='max-w-full max-h-screen object-contain rounded-lg'
							alt='Magnified Image'
						/>
						<button
							className='absolute top-2 right-2 text-white text-2xl'
							onClick={closeModal}
						>

							×
						</button>
					</div>
				</div>
			)}
      {/* Share Modal */}
      {showShareModal && (
        <div className='fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50'>
          <div className='bg-white p-4 rounded shadow-lg'>
            <h3 className='font-bold text-lg mb-4'>Share this post</h3>
            <IconContainer>
              <ShareButton>
                <WhatsappShareButton
                  url={postUrl}
                  title={post.text}
                  separator=":: "
                >
                  <WhatsappIcon size={32} round={true} />
                </WhatsappShareButton>
              </ShareButton>
              <ShareButton>
                <FacebookShareButton
                  url={postUrl}
                  quote={post.text}
                  hashtag="#YouConect"
                >
                  <FacebookIcon size={32} round={true} />
                </FacebookShareButton>
              </ShareButton>
              <ShareButton>
                <TwitterShareButton
                  url={postUrl}
                  title={post.text}
                >
                  <TwitterIcon size={32} round={true} />
                </TwitterShareButton>
              </ShareButton>
            </IconContainer>
            <button
              className='mt-4 text-red-600'
              onClick={handleSharePost} // Close share modal
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Post;