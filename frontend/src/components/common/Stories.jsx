// components/Stories.jsx

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Box,
  Avatar,
  Typography,
  Modal,
  Fade,
  Backdrop,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  LinearProgress,
  Badge,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  IoCloseSharp,
  IoChevronBack,
  IoChevronForward,
  IoHeartOutline,
  IoHeartSharp,
} from "react-icons/io5";
import { BsCamera } from "react-icons/bs";
import { formatDistanceToNow } from "date-fns";
import { Link } from 'react-router-dom';
import { keyframes } from "@emotion/react";

// Styled Components

const StoriesContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px",
  backgroundColor: "#1a1a1a",
  borderBottom: "1px solid #333",
  position: "relative",
}));

const StoriesWrapper = styled(Box)({
  display: "flex",
  transition: "transform 0.5s ease-in-out",
});

const StoryItem = styled(Box)({
  position: "relative",
  cursor: "pointer",
  width: "80px",
  flexShrink: 0,
  marginRight: "10px",
});

const AddStory = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#333",
  borderRadius: "50%",
  width: "60px",
  height: "60px",
  border: "2px solid #555",
  color: "#fff",
  fontSize: "24px",
  position: "relative",
  "&:hover": {
    backgroundColor: "#555",
  },
});

const StoryContent = styled(Box)({
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  overflow: "hidden",
  border: "2px solid #555",
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
});

const StoryModalContent = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "#000",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  outline: "none",
  padding: theme.spacing(2),
  boxSizing: "border-box",
}));

const PreviewBox = styled(Box)({
  position: "relative",
  marginTop: "10px",
  width: "100%",
  height: "200px",
  backgroundColor: "#333",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
});

const RemoveButton = styled(IconButton)({
  position: "absolute",
  top: "5px",
  right: "5px",
  color: "#fff",
  backgroundColor: "rgba(0,0,0,0.5)",
  "&:hover": {
    backgroundColor: "rgba(0,0,0,0.7)",
  },
});

// Styled Components for Story Viewer

const StoryViewerModalContent = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "#000",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  outline: "none",
  padding: theme.spacing(2),
  boxSizing: "border-box",
}));

const ProgressBarContainer = styled(Box)({
  position: "absolute",
  top: "0",
  left: "0",
  width: "100%",
});

const NavigationButton = styled(IconButton)({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#fff",
  backgroundColor: "rgba(0,0,0,0.5)",
  "&:hover": {
    backgroundColor: "rgba(0,0,0,0.7)",
  },
});

const PreviousButton = styled(NavigationButton)({
  left: "10px",
});

const NextButton = styled(NavigationButton)({
  right: "10px",
});

const UserProfileContainer = styled(Box)({
  position: "absolute",
  top: "20px",
  left: "20px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#fff",
});

const heartBeat = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
`;

const HeartIconContainer = styled(Box)({
  position: "absolute",
  bottom: "20px",
  left: "20px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#fff",
  cursor: "pointer",
  transition: "all 0.3s ease-in-out",
  animation: `${heartBeat} 1.5s ease-in-out infinite`,
});


const Stories = () => {
  // Grouped Stories State: Array of objects { user, stories }
  const [groupedStories, setGroupedStories] = useState([]);
  const [open, setOpen] = useState(false);
  const [contentType, setContentType] = useState("text"); // "text", "image"
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // State for Story Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(null); // Index in groupedStories
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0); // Index in user's stories
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef(null);

  // Heart State
  const [likedStories, setLikedStories] = useState({}); // { storyId: true/false }

  // Carousel State
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [storiesPerView, setStoriesPerView] = useState(5); // Default value

  // Fetch Stories on Component Mount
  useEffect(() => {
    fetchStories();
    const interval = setInterval(fetchStories, 60000); // Refresh stories every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 600) {
        setStoriesPerView(2);
      } else if (width < 900) {
        setStoriesPerView(3);
      } else if (width < 1200) {
        setStoriesPerView(4);
      } else {
        setStoriesPerView(5);
      }
    };

    handleResize(); // Set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem("token"); // Adjust this according to your auth mechanism
      const res = await axios.get("/api/stories", {
        headers: {
          Authorization: `Bearer ${token}`, // Include token for authentication
        },
      });

      // Group stories by user
      const grouped = res.data.reduce((acc, story) => {
        const userId = story.user._id;
        if (!acc[userId]) {
          acc[userId] = { user: story.user, stories: [] };
        }
        acc[userId].stories.push(story);
        return acc;
      }, {});

      setGroupedStories(Object.values(grouped));
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    if (!isUploading) {
      setOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setContentType("text");
    setContent("");
    setPreview(null);
  };

  const handleContentTypeChange = (type) => {
    setContentType(type);
    setContent("");
    setPreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (contentType === "image") {
        // Validate image file type
        if (!file.type.startsWith("image/")) {
          alert("Please upload a valid image file.");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setContent(reader.result); // Base64 string
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (contentType === "text" && content.trim() === "") {
      alert("Please enter some text for your story.");
      return;
    }
    if (contentType === "image" && !content) {
      alert(`Please upload an image for your story.`);
      return;
    }

    setIsUploading(true);

    try {
      const storyData = {
        contentType,
        content, // Base64 string or text
      };

      const token = localStorage.getItem("token"); // Adjust based on your auth implementation

      const res = await axios.post("/api/stories/create", storyData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Check if the user already has a group
      const userId = res.data.user._id;
      const existingGroupIndex = groupedStories.findIndex(
        (group) => group.user._id === userId
      );

      if (existingGroupIndex !== -1) {
        // Append to existing user's stories
        const updatedGroupedStories = [...groupedStories];
        updatedGroupedStories[existingGroupIndex].stories.unshift(res.data);
        setGroupedStories(updatedGroupedStories);
      } else {
        // Create a new group for the user
        setGroupedStories([
          { user: res.data.user, stories: [res.data] },
          ...groupedStories,
        ]);
      }

      handleClose();
    } catch (error) {
      console.error("Error creating story:", error);
      alert("Failed to create story. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handlers for Story Viewer
  const handleStoryClick = (userIndex) => {
    setSelectedUserIndex(userIndex);
    setSelectedStoryIndex(0);
    setViewerOpen(true);
    setProgress(0);
  };

  const handleViewerClose = () => {
    setViewerOpen(false);
    setSelectedUserIndex(null);
    setSelectedStoryIndex(0);
    setProgress(0);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };

  const handleNextStory = () => {
    if (selectedUserIndex !== null) {
      const userStories = groupedStories[selectedUserIndex].stories;
      if (selectedStoryIndex < userStories.length - 1) {
        setSelectedStoryIndex(selectedStoryIndex + 1);
        setProgress(0);
      } else if (selectedUserIndex < groupedStories.length - 1) {
        // Move to next user's first story
        setSelectedUserIndex(selectedUserIndex + 1);
        setSelectedStoryIndex(0);
        setProgress(0);
      } else {
        handleViewerClose();
      }
    }
  };

  const handlePreviousStory = () => {
    if (selectedUserIndex !== null) {
      if (selectedStoryIndex > 0) {
        setSelectedStoryIndex(selectedStoryIndex - 1);
        setProgress(0);
      } else if (selectedUserIndex > 0) {
        // Move to previous user's last story
        const prevUserIndex = selectedUserIndex - 1;
        const prevUserStories = groupedStories[prevUserIndex].stories;
        setSelectedUserIndex(prevUserIndex);
        setSelectedStoryIndex(prevUserStories.length - 1);
        setProgress(0);
      }
    }
  };

  useEffect(() => {
    if (viewerOpen && selectedUserIndex !== null) {
      // Set the duration for the story (e.g., 5 seconds)
      const duration = 5000; // in milliseconds
      const intervalDuration = 100; // Update progress every 100ms
      const totalSteps = duration / intervalDuration;
      let currentStep = 0;

      progressInterval.current = setInterval(() => {
        currentStep += 1;
        setProgress((currentStep / totalSteps) * 100);
        if (currentStep >= totalSteps) {
          clearInterval(progressInterval.current);
          handleNextStory();
        }
      }, intervalDuration);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerOpen, selectedUserIndex, selectedStoryIndex, groupedStories.length]);

  // Handlers for Carousel Navigation
  const handlePreviousCarousel = () => {
    setCurrentStartIndex((prevIndex) => Math.max(prevIndex - storiesPerView, 0));
  };

  const handleNextCarousel = () => {
    setCurrentStartIndex((prevIndex) =>
      Math.min(prevIndex + storiesPerView, groupedStories.length - storiesPerView)
    );
  };

  // Determine if navigation buttons should be disabled
  const isPrevDisabled = currentStartIndex === 0;
  const isNextDisabled =
    currentStartIndex + storiesPerView >= groupedStories.length;

  // Compute the stories to display in the current view
  const currentStories = groupedStories.slice(
    currentStartIndex,
    currentStartIndex + storiesPerView
  );

  // Toggle like status for a story
  const toggleLike = (storyId) => {
    setLikedStories((prevLikes) => ({
      ...prevLikes,
      [storyId]: !prevLikes[storyId],
    }));
  };

  return (
    <>
      <StoriesContainer>
        {/* Previous Carousel Button */}
        <IconButton
          onClick={handlePreviousCarousel}
          disabled={isPrevDisabled}
          sx={{
            visibility: isPrevDisabled ? "hidden" : "visible",
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.5)",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.7)",
            },
          }}
        >
          <IoChevronBack />
        </IconButton>

        {/* Stories Wrapper */}
        <StoriesWrapper>
          {/* Add Story Button */}
          <StoryItem onClick={handleOpen}>
            <AddStory>
              <BsCamera />
            </AddStory>
            <Typography
              variant="caption"
              align="center"
              sx={{ color: "#fff", marginTop: "5px" }}
            >
              Your Story
            </Typography>
          </StoryItem>

          {/* Display Current Grouped Stories */}
          {currentStories.map((group, index) => {
            const userIndex = currentStartIndex + index;
            const latestStory = group.stories[0]; // Assuming the latest story is first
            const hasMultipleStories = group.stories.length > 1;

            return (
              <StoryItem key={group.user._id} onClick={() => handleStoryClick(userIndex)}>
                <Badge
                  badgeContent={hasMultipleStories ? group.stories.length : null}
                  color="primary"
                  overlap="circular"
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                >
                  <StoryContent>
                    {latestStory.contentType === "image" && (
                      <img src={latestStory.content} alt="Story" />
                    )}
                    {latestStory.contentType === "text" && (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: "#555",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "5px",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="caption">{latestStory.content}</Typography>
                      </Box>
                    )}
                  </StoryContent>
                </Badge>
                <Link to={`/profile/${group.user.username}`}>
                  <Box
                    sx={{ display: "flex", alignItems: "center", marginTop: "5px" }}
                  >
                    <Avatar
                      src={group.user.profileImg || "/avatar-placeholder.png"}
                      alt={group.user.fullName}
                      sx={{ width: 24, height: 24, marginRight: "5px" }}
                    />
                    <Typography variant="caption" sx={{ color: "#fff" }}>
                      {group.user.fullName}
                    </Typography>
                  </Box>
                </Link>
                <Typography variant="caption" align="center" sx={{ color: "#bbb" }}>
                  {formatDistanceToNow(new Date(latestStory.createdAt), {
                    addSuffix: true,
                  })}
                </Typography>
              </StoryItem>
            );
          })}
        </StoriesWrapper>

        {/* Next Carousel Button */}
        <IconButton
          onClick={handleNextCarousel}
          disabled={isNextDisabled}
          sx={{
            visibility: isNextDisabled ? "hidden" : "visible",
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.5)",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.7)",
            },
          }}
        >
          <IoChevronForward />
        </IconButton>
      </StoriesContainer>

      {/* Modal for Creating Stories */}
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={open}>
          <StoryModalContent>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="h6">Create Story</Typography>
              <IoCloseSharp
                size={24}
                style={{ cursor: "pointer", color: "#fff" }}
                onClick={handleClose}
              />
            </Box>
            <form onSubmit={handleSubmit}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mb: 2,
                  justifyContent: "center",
                }}
              >
                <Button
                  variant={contentType === "text" ? "contained" : "outlined"}
                  onClick={() => handleContentTypeChange("text")}
                  sx={{ flex: 1 }}
                >
                  Text
                </Button>
                <Button
                  variant={contentType === "image" ? "contained" : "outlined"}
                  onClick={() => handleContentTypeChange("image")}
                  sx={{ flex: 1 }}
                >
                  Image
                </Button>
              </Box>

              {/* Content Input */}
              {contentType === "text" && (
                <TextField
                  label="Your Story"
                  variant="outlined"
                  fullWidth
                  multiline
                  minRows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  sx={{ mb: 2, color: "#fff" }}
                  InputLabelProps={{ style: { color: "#fff" } }}
                  InputProps={{ style: { color: "#fff" } }}
                />
              )}

              {contentType === "image" && (
                <Box>
                  <Button variant="contained" component="label" fullWidth>
                    Upload Image
                    <input type="file" hidden onChange={handleFileChange} />
                  </Button>
                  {preview && (
                    <PreviewBox>
                      <img src={preview} alt="Preview" style={{ width: "100%" }} />
                      <RemoveButton onClick={() => setPreview(null)}>
                        <IoCloseSharp size={24} />
                      </RemoveButton>
                    </PreviewBox>
                  )}
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isUploading}
                sx={{ mt: 2 }}
              >
                {isUploading ? <CircularProgress size={24} /> : "Post Story"}
              </Button>
            </form>
          </StoryModalContent>
        </Fade>
      </Modal>

      {/* Modal for Viewing Stories */}
      <Modal
        open={viewerOpen}
        onClose={handleViewerClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={viewerOpen}>
          <StoryViewerModalContent>
            {/* Progress Bar */}
            <ProgressBarContainer>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 5 }}
              />
            </ProgressBarContainer>

            {/* User Profile at Top Right */}
            {selectedUserIndex !== null && groupedStories[selectedUserIndex] && (
             <Link to={`/profile/${groupedStories[selectedUserIndex].user.id}`}>
              <UserProfileContainer>
                <Avatar
                  src={
                    groupedStories[selectedUserIndex].user.profileImg ||
                    "/avatar-placeholder.png"
                  }
                  alt={groupedStories[selectedUserIndex].user.fullName}
                  sx={{ width: 40, height: 40 }}
                />
                <Typography variant="subtitle1" sx={{ color: "#fff" }}>
                  {groupedStories[selectedUserIndex].user.fullName}
                </Typography>
              </UserProfileContainer>
             </Link>
            )}

            {/* Previous Story Button */}
            {(selectedUserIndex > 0 || selectedStoryIndex > 0) && (
              <PreviousButton onClick={handlePreviousStory}>
                <IoChevronBack size={32} />
              </PreviousButton>
            )}

            {/* Next Story Button */}
            {(selectedUserIndex < groupedStories.length - 1 ||
              (selectedUserIndex !== null &&
                selectedStoryIndex < groupedStories[selectedUserIndex].stories.length - 1)) && (
              <NextButton onClick={handleNextStory}>
                <IoChevronForward size={32} />
              </NextButton>
            )}

            {/* Story Content */}
            {selectedUserIndex !== null && groupedStories[selectedUserIndex] && (
              <>
                {groupedStories[selectedUserIndex].stories[selectedStoryIndex]
                  .contentType === "image" && (
                  <img
                    src={
                      groupedStories[selectedUserIndex].stories[selectedStoryIndex]
                        .content
                    }
                    alt="Story"
                    style={{
                      maxWidth: "90%",
                      maxHeight: "80%",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                )}
                {groupedStories[selectedUserIndex].stories[selectedStoryIndex]
                  .contentType === "text" && (
                  <Box
                    sx={{
                      width: "80%",
                      padding: 2,
                      backgroundColor: "#333",
                      borderRadius: "8px",
                    }}
                  >
                    <Typography variant="h5" align="center">
                      {
                        groupedStories[selectedUserIndex].stories[selectedStoryIndex]
                          .content
                      }
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {/* Heart Icon at Bottom Left */}
            {selectedUserIndex !== null &&
              groupedStories[selectedUserIndex].stories[selectedStoryIndex] && (
                <HeartIconContainer
                  onClick={() =>
                    toggleLike(
                      groupedStories[selectedUserIndex].stories[selectedStoryIndex]._id
                    )
                  }
                  sx={{
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                    "&:active": {
                      transform: "scale(0.9)",
                    },
                  }}
                >
                {likedStories[
                      groupedStories[selectedUserIndex].stories[selectedStoryIndex]._id
                    ] ? (
                     <IoHeartSharp size={32} color="red" sx={{ animation: "heartBeat 0.5s" }} />
                    ) : (
                      <IoHeartOutline size={32} sx={{ animation: "none" }} />
                  )}
                  <Typography variant="subtitle1" sx={{ color: "#fff" }}>
                    {likedStories[
                      groupedStories[selectedUserIndex].stories[selectedStoryIndex]._id
                    ]
                      ? "Liked"
                      : "Like"}
                  </Typography>
                </HeartIconContainer>
              )}

            {/* Close Button */}
            <IconButton
              onClick={handleViewerClose}
              sx={{
                position: "absolute",
                top: 20,
                right: 20,
                color: "#fff",
              }}
            >
              <IoCloseSharp size={24} />
            </IconButton>
          </StoryViewerModalContent>
        </Fade>
      </Modal>
    </>
  );
};

export default Stories;
