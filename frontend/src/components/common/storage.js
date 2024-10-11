// storage.js
import { storage } from "../../../../firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadVideoToFirebase = async (file) => {
  console.log("Uploading file:", file);
  try {
    const uniqueFileName = `${file.name}-${Date.now()}`; // Add a timestamp to ensure uniqueness
    const storageRef = ref(storage, `videos/${uniqueFileName}`);    
    const snapshot = await uploadBytes(storageRef, file);
    const videoUrl = await getDownloadURL(snapshot.ref);
    console.log("Uploaded video URL:", videoUrl);
    return videoUrl;
  } catch (error) {
    console.error("Error uploading video: ", error);
    throw error; 
  }
};
