import { Request, Response } from 'express';
import Review from '../models/Review.js';

// 1. Get all reviews for Admin Dashboard (Queue)
export const getAdminReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).populate('productId', 'title name');
    res.json({ success: true, reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Update review status (approve, disapprove, hidden)
export const updateReviewStatus = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { status, isVisible } = req.body;
    
    const updateData: any = {};
    if (status) updateData.status = status;
    if (isVisible !== undefined) updateData.isVisible = isVisible;

    const review = await Review.findByIdAndUpdate(reviewId, updateData, { new: true });
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });

    res.json({ success: true, message: "Review status updated successfully.", review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Edit an existing review (Admin)
export const editReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { customerName, rating, comment } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      reviewId, 
      { customerName, rating, comment }, 
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });

    res.json({ success: true, message: "Review edited successfully.", review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Delete review permanently
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    await Review.findByIdAndDelete(reviewId);
    res.json({ success: true, message: "Review permanently deleted." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Add manual review (Admin)
export const addManualReview = async (req: Request, res: Response) => {
  try {
    const review = new Review({ ...req.body, isManual: true, status: 'approved', isVisible: true });
    await review.save();
    res.status(201).json({ success: true, message: "Manual review published successfully.", review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get public reviews for a product (Only approved & visible)
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ 
      productId: req.params.productId, 
      status: 'approved', 
      isVisible: true 
    }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Submit a new review (Customer)
export const submitReview = async (req: Request, res: Response) => {
  try {
    const review = new Review({ ...req.body, status: 'pending', isVisible: true });
    await review.save();
    res.status(201).json({ success: true, message: "Review submitted for moderation.", review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
