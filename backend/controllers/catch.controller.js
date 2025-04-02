import * as CatchService from "../services/catch.service.js"
import { handleControllerError } from '../utils/errorHandler.js';

export const getAllCatches = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    const catches = await CatchService.getAllCatches({ page, limit });
    res.status(200).json(catches);
  } catch (error) {
    console.log("---Get All Catches Controller Error---", error);
    handleControllerError(error, res)
  }
}

export const getUserCatches = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { username } = req.params
  try {
    const userCatches = await CatchService.getCatchesByUser(username, { page, limit });
    res.status(200).json(userCatches);
  } catch (error) {
    console.log("---Get User Catches Controller Error---", error);
    handleControllerError(error, res)
  }
}

export const getCatchesFeed = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const currentUserId = req.user._id;

  try {
    const catches = await CatchService.getCatchesFeed(currentUserId, { page, limit });
    res.status(200).json(catches);
  } catch (error) {
    console.log("---Get Catches Feed Controller Error---", error);
    handleControllerError(error, res)
  }
}

export const createCatch = async (req, res) => {
  const { species, weight, lake, dateCaught, rig, bait, distance, location, text, photo } = req.body;
  const userId = req.user._id;

  if (!text || !photo || !species || !weight || !dateCaught) {
    return res.status(400).json({ message: "Some fields are missing" });
  }
  try {
    const newCatch = await CatchService.createCatch({ user: userId, species, weight, lake, dateCaught, rig, bait, distance, location, text, photo });
    res.status(201).json(newCatch);
  } catch (error) {
    console.log("---Create Catch Controller Error---", error);
    handleControllerError(error, res)
  }
}

export const updateCatch = async (req, res) => {
  const { catchId } = req.params;
  const userId = req.user._id;
  const updates = req.body;

  if (Object.keys(updates).length === 0) return res.status(400).json({ message: "No updates provided" });

  if (updates._id || updates.user || updates.comments || updates.likes) return res.status(400).json({ message: "Not Authorized" });
  try {
    const updatedCatch = await CatchService.updateCatch(catchId, userId, updates);
    res.status(200).json(updatedCatch);
  } catch (error) {
    console.log("---Update Catch Controller Error---", error);
    handleControllerError(error, res)
  }
}

export const deleteCatch = async (req, res) => {
  const { catchId } = req.params;
  const userId = req.user._id;
  try {
    const message = await CatchService.deleteCatch(catchId, userId);
    res.status(200).json({ message });
  } catch (error) {
    console.log("---Delete Catch Controller Error---", error);
    handleControllerError(error, res)
  }
}

export const createComment = async (req, res) => {
  const { catchId } = req.params;
  const userId = req.user._id;
  const { text } = req.body;

  if (text === "") return res.status(400).json({ message: "Comment text is required" });

  try {
    const catchPost = await CatchService.createComment(catchId, userId, text);
    res.status(201).json(catchPost);
  } catch (error) {
    console.log("---Create Comment Controller Error---", error);
    handleControllerError(error, res)
  }
}

export const deleteComment = async (req, res) => {
  const { catchId, commentId } = req.params;
  const userId = req.user._id;
  try {
    const message = await CatchService.deleteComment(catchId, userId, commentId);
    res.status(200).json({ message });
  } catch (error) {
    console.log("---Delete Comment Controller Error---", error);
    handleControllerError(error, res)
  }
}

export const updateComment = async (req, res) => {
  const { catchId, commentId } = req.params;
  const userId = req.user._id;
  const { text } = req.body;

  if (!text) return res.status(400).json({ message: "Comment text is required" });

  try {
    const updatedCatch = await CatchService.updateComment(catchId, userId, commentId, text);
    res.status(200).json(updatedCatch);

  } catch (error) {
    console.log("---Update Comment Controller Error---", error);
    handleControllerError(error, res)
  }
}

export const likeUnlikeCatch = async (req, res) => {
  const { catchId } = req.params;
  const userId = req.user._id;
  try {
    const { catchLikes, message } = await CatchService.likeUnlikeCatch(catchId, userId);
    res.status(200).json({ catchLikes, message });
  } catch (error) {
    console.log("---Like/Unlike Catch Controller Error---", error);
    handleControllerError(error, res)
  }
}

