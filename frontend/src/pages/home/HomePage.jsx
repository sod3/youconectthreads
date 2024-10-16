// HomePage.jsx
import { useState } from "react";
import Posts from "../../components/common/Posts";
import CreatePost from "./CreatePost";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AdComponent from "../../components/common/AdComponent";
import Stories from "../../components/common/Stories"; // Import Stories Component

const HomePage = () => {
  const [feedType, setFeedType] = useState("forYou");

  // Get auth status
  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      return data || null;
    },
    retry: false,
  });

  return (
    <>
      <div className='flex-[4_4_0] mr-auto border-r border-gray-700 min-h-screen'>
        {/* Header */}
        <div className='flex w-full border-b border-gray-700'>
          <div
            className={
              "flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 cursor-pointer relative"
            }
            onClick={() => setFeedType("forYou")}
          >
            For you
            {feedType === "forYou" && (
              <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary'></div>
            )}
          </div>
          <div
            className='flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 cursor-pointer relative'
            onClick={() => setFeedType("following")}
          >
            Connecting
            {feedType === "following" && (
              <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary'></div>
            )}
          </div>
        </div>
        {/* Insert AdComponent Above CreatePost */}
        <AdComponent />

        {/* CREATE POST INPUT, only show if authenticated */}
        {authUser ? (
          <>
            <CreatePost />
            <Stories /> {/* Add Stories Component Here */}
          </>
        ) : (
          <div className="bg-gray-700 p-4 rounded-md text-white flex items-center justify-center">
            <span className="text-lg font-bold">Log in to react, comment, and create posts! </span>
            <Link to="/login" className="ml-2">
              <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-200 transition duration-300">
                Log in
              </button>
            </Link>
          </div>
        )}
        {/* POSTS */}
        <Posts feedType={feedType} />
      </div>
    </>
  );
};

export default HomePage;
