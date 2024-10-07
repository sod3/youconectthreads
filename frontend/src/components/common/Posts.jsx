import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import AdComponent from "./AdComponent"; // Import the AdComponent

// Helper function to shuffle posts
const shufflePosts = (posts) => {
    return posts
        .map((post) => ({ post, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ post }) => post);
};

const Posts = ({ feedType, username, userId }) => {
    const getPostEndpoint = () => {
        switch (feedType) {
            case "forYou":
                return "/api/posts/all";
            case "following":
                return "/api/posts/following";
            case "posts":
                return `/api/posts/user/${username}`;
            case "likes":
                return `/api/posts/likes/${userId}`;
            default:
                return "/api/posts/all";
        }
    };

    const POST_ENDPOINT = getPostEndpoint();

    const {
        data: posts,
        isLoading,
        refetch,
        isRefetching,
    } = useQuery({
        queryKey: ["posts"],
        queryFn: async () => {
            try {
                const res = await fetch(POST_ENDPOINT);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong");
                }

                // Shuffle posts before returning them
                return shufflePosts(data);
            } catch (error) {
                throw new Error(error);
            }
        },
    });

    useEffect(() => {
        refetch();
    }, [feedType, refetch, username]);

    return (
        <>
            {(isLoading || isRefetching) && (
                <div className='flex flex-col justify-center'>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            )}
            {!isLoading && !isRefetching && posts?.length === 0 && (
                <p className='text-center my-4'>No posts in this tab. Switch 👻</p>
            )}
            {!isLoading && !isRefetching && posts && (
                <div>
                    {posts.map((post, index) => (
                        <div key={post._id}>
                            <Post post={post} index={index} />
                            {/* Render AdComponent after every 5 posts */}
                            {index > 0 && index % 5 === 0 && <AdComponent />}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default Posts;
