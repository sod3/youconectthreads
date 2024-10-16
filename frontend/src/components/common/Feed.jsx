// Feed.jsx
import React, { useState, useRef } from "react";
import { useQuery, useQueryClient, QueryClient } from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import { FixedSizeList as List } from "react-window";
import Post from "./Post";
import LoadingSpinner from "./LoadingSpinner";
import AdComponent from "../../components/common/AdComponent";

const fetchPosts = async (page, limit) => {
  const res = await fetch(`/api/posts?page=${page}&limit=${limit}`);
  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }
  return res.json();
};

const Feed = () => {
  const [page, setPage] = useState(1);
  const limit = 10; // Number of posts per page
  const listRef = useRef();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery(
    ["posts", page],
    () => fetchPosts(page, limit),
    {
      keepPreviousData: true,
    }
  );

  const fetchMoreData = () => {
    if (data.hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  if (isLoading && page === 1) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  const Row = ({ index, style }) => {
    const post = data.posts[index];
    return (
      <div style={style}>
        <Post key={post._id} post={post} index={index} />
      </div>
    );
  };

  return (
    <InfiniteScroll
      dataLength={data.posts.length}
      next={fetchMoreData}
      hasMore={data.hasMore}
      loader={<LoadingSpinner />}
      endMessage={<p className="text-center">Yay! You have seen it all</p>}
    >
      <List
        height={window.innerHeight}
        itemCount={data.posts.length}
        itemSize={600} // Adjust based on average post height
        width={"100%"}
        ref={listRef}
      >
        {Row}
      </List>

      {/* Optionally, insert AdComponent after every 5 posts */}
      {data.posts.length > 0 && data.posts.length % 5 === 0 && (
        <Suspense fallback={<LoadingSpinner />}>
          <AdComponent />
        </Suspense>
      )}
    </InfiniteScroll>
  );
};

export default Feed;
