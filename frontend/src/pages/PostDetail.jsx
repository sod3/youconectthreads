import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const PostDetail = () => {
  const { id } = useParams(); // Get post ID from URL params

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <div className="post-detail">
      <h1>{post.text}</h1>
      {post.img && <img src={post.img} alt="Post Image" />}
      <p>Posted by {post.user.fullName} on {new Date(post.createdAt).toLocaleDateString()}</p>
      {/* Add more details as needed */}
    </div>
  );
};

export default PostDetail;
