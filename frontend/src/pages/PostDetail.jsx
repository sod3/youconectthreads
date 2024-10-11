// PostDetail.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Avatar,
  IconButton,
  Box,
  Button,
  TextField,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';
import { BiShareAlt } from "react-icons/bi";
import {
  WhatsappShareButton,
  FacebookShareButton,
  TwitterShareButton,
  WhatsappIcon,
  FacebookIcon,
  TwitterIcon,
} from "react-share";
import styled from "styled-components";
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

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

const PostDetail = () => {
  const { id } = useParams(); // Get post ID from URL params
  const queryClient = useQueryClient(); // To refetch data after mutation
  const [newComment, setNewComment] = useState(''); // State for new comment input
  const [showShareModal, setShowShareModal] = useState(false);

  // Debugging: Log the id
  console.log('PostDetail - Retrieved ID:', id);

  // Ensure id is defined before fetching
  if (!id) {
    return <div className="text-red-500">Invalid post ID.</div>;
  }

  // Fetch post data using the ID
  const { data: post, error, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) {
        throw new Error('Post not found');
      }
      return res.json();
    }
  });

  // Fetch related posts data
  const { data: relatedPosts, error: relatedError, isLoading: relatedLoading } = useQuery({
    queryKey: ['relatedPosts', id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/related/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch related posts');
      }
      return res.json();
    }
  });

  // Mutation for liking a post
  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/like/${post._id}`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to like post');
      }
      return res.json();
    },
    onSuccess: () => {
      // Refetch the post data after like mutation
      queryClient.invalidateQueries(['post', id]);
    },
  });

  // Mutation for adding a new comment
  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/comment/${post._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newComment }),
      });
      if (!res.ok) {
        throw new Error('Failed to add comment');
      }
      return res.json();
    },
    onSuccess: () => {
      // Refetch post data after comment is added
      queryClient.invalidateQueries(['post', id]);
      setNewComment(''); // Clear the input field after comment submission
    },
  });

  // Handle like button click
  const handleLike = () => {
    likeMutation.mutate();
  };

  // Handle comment submission
  const handleAddComment = () => {
    if (newComment.trim()) {
      commentMutation.mutate();
    }
  };

  // Handle post share
  const handleSharePost = () => {
    setShowShareModal(!showShareModal); // Toggle share modal visibility
  };

  if (isLoading || relatedLoading) {
    return <div>Loading...</div>;
  }

  if (error || relatedError) {
    return <div className="text-red-500">{error?.message || relatedError?.message}</div>;
  }

  const getFirstTenLetters = (text) => {
    return text.slice(0, 10) + (text.length > 10 ? "..." : "");
  };
  const postUrl = `https://youconect.com/posts/${post._id}`;
  const currentUrl = window.location.href;

  // Debugging: Log the post data
  console.log('PostDetail - Fetched Post:', post);

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', padding: '20px' }}>
      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        {/* Post Header - User Info */}
        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
          <div className='avatar'>
            <Link to={`/profile/${post.user.username}`} className='w-12 rounded-full overflow-hidden'>
              <img src={post.user.profileImg || "/avatar-placeholder.png"} className='w-full h-full object-cover' alt={`${post.user.fullName}'s avatar`} />
            </Link>
          </div>
          <Box sx={{ marginLeft: '10px' }}>
            <Typography variant="h6">{post.user.fullName}</Typography>
            <Typography variant="body2" color="textSecondary">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </Typography>
          </Box>
        </CardContent>

        {/* Post Content with Image and Video */}
        <CardContent>
          {/* Post Text */}
          <Typography variant="body1" sx={{ marginBottom: '20px' }}>
            {post.text}
          </Typography>

          {/* Display image if available */}
          {post.img && (
            <CardMedia
              component="img"
              image={post.img}
              alt="Post Image"
              sx={{ 
                height: 500,   // Set fixed height
                width: '100%', // Make it responsive to container width
                objectFit: 'scale-down', // Crop the image to fit within the given dimensions
                objectPosition: 'center' // Center the image if it's cropped
              }}
            />
          )}

          {/* Display video if available */}
          {post.video && (
            <Box sx={{ marginTop: '20px' }}>
              <video
                className="w-full h-auto object-contain rounded-lg border border-gray-700"
                controls
                preload="metadata"
              >
                <source src={post.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </Box>
          )}
        </CardContent>

        {/* Post Interactions */}
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <IconButton color="primary" onClick={handleLike} disabled={likeMutation.isLoading}>
              <ThumbUpIcon /> 
              <Typography sx={{ marginLeft: '8px' }}>{post.likes.length} Likes</Typography>
            </IconButton>
            <IconButton color="primary">
              <CommentIcon /> 
              <Typography sx={{ marginLeft: '8px' }}>{post.comments.length} Comments</Typography>
            </IconButton>
            <IconButton color="primary" onClick={handleSharePost}>
              <BiShareAlt /> 
              <Typography sx={{ marginLeft: '8px' }}>Share</Typography>
            </IconButton>
          </Box>
        </CardContent>

        {/* Share Modal */}
        {showShareModal && (
          <div className='fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50'>
            <div className='bg-white p-4 rounded shadow-lg'>
              <h3 className='font-bold text-lg mb-4'>Share this post</h3>
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
                    url={currentUrl}
                    title={getFirstTenLetters(post.text)}
                  >
                    <TwitterIcon size={32} round={true} />
                  </TwitterShareButton>
                </ShareButton>
              </IconContainer>
              <button className='mt-4 px-4 py-2 bg-blue-500 text-white rounded' onClick={handleSharePost}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <CardContent>
          <Typography variant="h6" sx={{ marginBottom: '10px' }}>Comments</Typography>
          {post.comments.length === 0 ? (
            <Typography variant="body2" color="textSecondary">No comments yet. Be the first to comment!</Typography>
          ) : (
            post.comments.map((comment) => (
              <Box key={comment._id} sx={{ display: 'flex', alignItems: 'flex-start', marginBottom: '15px' }}>
                <Avatar src={comment.user.profileImg || "/avatar-placeholder.png"} alt={comment.user.fullName} sx={{ marginRight: '10px' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{comment.user.fullName}</Typography>
                  <Typography variant="body2" color="textSecondary">{comment.text}</Typography>
                </Box>
              </Box>
            ))
          )}
        </CardContent>

        {/* Add a Comment Section */}
        <CardContent>
          <TextField
            label="Add a comment"
            variant="outlined"
            fullWidth
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            multiline
            rows={2}
            sx={{ marginBottom: '10px' }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddComment}
            disabled={commentMutation.isLoading}
          >
            Add Comment
          </Button>
        </CardContent>
      </Card>

      {/* Related Posts Section */}
      <Card sx={{ marginTop: '20px', boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography 
            variant="h6" 
            sx={{ 
              marginBottom: '10px', 
              fontWeight: 'bold',   // Makes the text bold
              textAlign: 'center'   // Centers the text
            }}
          >
            Related Posts
          </Typography>
          {relatedPosts && relatedPosts.length > 0 ? (
            relatedPosts.map((relatedPost) => (
              <Link key={relatedPost._id} to={`/posts/${relatedPost._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card sx={{ marginBottom: '50px', boxShadow: 1 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                    <div className='avatar'>
                      <Link to={`/profile/${relatedPost.user.username}`} className='w-12 rounded-full overflow-hidden'>
                        <img src={relatedPost.user.profileImg || "/avatar-placeholder.png"} className='w-full h-full object-cover' alt={`${relatedPost.user.fullName}'s avatar`} />
                      </Link>
                    </div>
                    <Box sx={{ marginLeft: '10px' }}>
                      <Typography variant="h6">{relatedPost.user.fullName}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        @{relatedPost.user.username}
                      </Typography>
                    </Box>
                  </CardContent>
                  {relatedPost.img && (
                    <CardMedia 
                      component="img" 
                      image={relatedPost.img} 
                      alt="Related Post Image" 
                      sx={{ maxHeight: 700, objectFit: 'scale-down' }} 
                    />
                  )}
                  {/* Display video in related posts if available */}
                  {relatedPost.video && (
                    <Box sx={{ marginTop: '20px' }}>
                      <video
                        className="w-full h-auto object-contain rounded-lg border border-gray-700"
                        controls
                        preload="metadata"
                      >
                        <source src={relatedPost.video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="body1">{relatedPost.text}</Typography>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">No related posts found.</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PostDetail;
