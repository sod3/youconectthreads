// components/StoryViewer.jsx

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  LinearProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  IoCloseSharp,
  IoChevronBack,
  IoChevronForward,
  IoHeartOutline,
  IoHeartSharp,
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

const StoryViewerContainer = styled(Box)(({ theme }) => ({
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
  right: "20px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#fff",
});

const HeartIconContainer = styled(motion.div)({
  position: "absolute",
  bottom: "20px",
  left: "20px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#fff",
  cursor: "pointer",
});

const StoryViewer = ({
  open,
  handleClose,
  storyData,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  isLiked,
  toggleLike, 
}) => {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);

  useEffect(() => {
    if (open) {
      setProgress(0);
      const duration = 5000; // 5 seconds
      const interval = 100; // Update every 100ms
      const totalSteps = duration / interval;
      let currentStep = 0;

      progressRef.current = setInterval(() => {
        currentStep += 1;
        setProgress((currentStep / totalSteps) * 100);
        if (currentStep >= totalSteps) {
          clearInterval(progressRef.current);
          onNext();
        }
      }, interval);

      return () => clearInterval(progressRef.current);
    }
  }, [open, onNext]);

  const handleToggleLike = () => {
    toggleLike(storyData._id);
  };

  if (!storyData) return null;

  return (
    <AnimatePresence>
      {open && (
        <StoryViewerContainer component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Progress Bar */}
          <ProgressBarContainer>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 5 }} />
          </ProgressBarContainer>

          {/* User Profile at Top Right */}
          <UserProfileContainer>
            <Avatar
              src={storyData.user.profileImg || "/avatar-placeholder.png"}
              alt={storyData.user.fullName}
              sx={{ width: 40, height: 40 }}
            />
            <Typography variant="subtitle1" sx={{ color: "#fff" }}>
              {storyData.user.fullName}
            </Typography>
          </UserProfileContainer>

          {/* Previous Story Button */}
          {hasPrevious && (
            <PreviousButton onClick={onPrevious}>
              <IoChevronBack size={32} />
            </PreviousButton>
          )}

          {/* Next Story Button */}
          {hasNext && (
            <NextButton onClick={onNext}>
              <IoChevronForward size={32} />
            </NextButton>
          )}

          {/* Story Content */}
          {storyData.contentType === "image" ? (
            <img
              src={storyData.content}
              alt="Story"
              style={{
                maxWidth: "90%",
                maxHeight: "80%",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "80%",
                padding: 2,
                backgroundColor: "#333",
                borderRadius: "8px",
              }}
            >
              <Typography variant="h5" align="center">
                {storyData.content}
              </Typography>
            </Box>
          )}

          {/* Heart Icon at Bottom Left with Animation */}
          <HeartIconContainer
            onClick={handleToggleLike}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {isLiked ? (
              <IoHeartSharp size={32} color="red" />
            ) : (
              <IoHeartOutline size={32} />
            )}
            <Typography variant="subtitle1" sx={{ color: "#fff" }}>
              {isLiked ? "Liked" : "Like"} ({storyData.likeCount})
            </Typography>
          </HeartIconContainer>

          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 20,
              right: 20,
              color: "#fff",
            }}
          >
            <IoCloseSharp size={24} />
          </IconButton>
        </StoryViewerContainer>
      )}
    </AnimatePresence>
  );
};

export default StoryViewer;
