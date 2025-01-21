// User Management Models
const User = require('./user/User');
const TeacherProfile = require('./user/TeacherProfile');
const ParentProfile = require('./user/ParentProfile');
const Admin = require('./user/Admin');
const Favorite = require('./user/Favorite');

// Teaching Management Models
const Contract = require('./teaching/Contract');
const Schedule = require('./teaching/Schedule');
const FeedbackRecord = require('./teaching/FeedbackRecord');

// Matching System Models
const Post = require('./matching/Post');
const Application = require('./matching/Application');
const RecommendationLog = require('./matching/RecommendationLog');

// Rating and Review Models
const Rating = require('./rating/Rating');
const RatingAppeal = require('./rating/RatingAppeal');
const RatingStat = require('./rating/RatingStat');

// Feedback Models
const Feedback = require('./feedback/Feedback');

// Review and Verification Models
const TeacherVerification = require('./review/TeacherVerification');
const PostReview = require('./review/PostReview');

module.exports = {
  // User Management
  User,
  TeacherProfile,
  ParentProfile,
  Admin,
  Favorite,

  // Teaching Management
  Contract,
  Schedule,
  FeedbackRecord,

  // Matching System
  Post,
  Application,
  RecommendationLog,

  // Rating and Review
  Rating,
  RatingAppeal,
  RatingStat,

  // Feedback
  Feedback,

  // Review and Verification
  TeacherVerification,
  PostReview
};
