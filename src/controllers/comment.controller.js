import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
     /*
      -> Get videoId from params 
      -> check if empty 
      -> get current page and limit number from query params 
      -> get comments using mongoose-aggregate-paginate-v2 way
      -> return response 
    */

    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!videoId){
         throw new ApiError(400,"vidoe param is required")
    }

    const isVideoExist=await VideoModel.findById(videoId);

    if(!isVideoExist){
        throw new ApiError(404,"Video not found");
    }

    const options={
        page,
        limit,
        offset:page*limit-limit,
    }

    const aggregatecomment=Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup:{
                from:"users",
                localField:"commenter",
                foreignField:"_id",
                as:"commenter",
                pipeline:[
                    {
                        $project:{
                            avatar:1,
                            fullname:1,
                        },
                    },
                    
                ],
            },
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes",
            },
        },
        {
            $addFields:{
                likeCount:{
                    $size:"$likes",
                },
                commenter:{$first:"$commenter"},
            },
        },
        {
            $project:{
                commenter:1,
                contend:1,
                video:1,
                created:1,
                likeCount:1,
            },
        },

    ]);

    const comments=await Comment.aggregatePaginate(
        aggregatecomment,
        options
    )

    return res
    .status(200)
    .json(new ApiResponse(200,comments?.docs,"Fetched comments"));

});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

      /*
    -> get comment contend and videoId from request body
    -> validate
    -> create a new comment, commenter is req.user._id 
    -> return response 
    */
   const {contend}=req.body;
   const {videoId}=req.params;
   const commenterId=req.user._id;
   if(!contend.trim() || !videoId){
    throw new ApiError(400,"All field are required");
   }
   const isVideoExist=await VideoModel.findById(videoId);
   if(!isVideoExist){
    throw new ApiError(404,"Video not found");
   }
   const createcomment=await Comment.create({
    commenter:commenterId,
    contend,
    video:videoId,
   });

   return res.status(201).json(new ApiResponse(201,createcomment,"Add comment on video success"));


});



const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
       /*
    -> get comment id and new contend from request body 
    -> validate if comment exist
    -> update contend 
    -> return response 
    */

    const {videoId}=req.params;
    const {newContend}=req.body;
    if(!videoId.trim() || !newContend.trim()){
        throw new ApiError(400,"Video Id and newContend is required");
    }

    const isCommentExist=await Comment.findById(videoId);

    if(!isCommentExist){
        throw new ApiError(404,"Comment is not exist");
    }

    const updateComment=await Comment.findByIdAndUpdate(
        videoId,
        {
            $set:{
                contend:newContend,
            },
        },
        {
            new:true,
        }
    );

    return res
    .status(200)
    .json(new ApiResponse(200,updateComment,"Comment updated succesfully"));
    
});



const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
        /*
    -> get commentId from request params  
    -> check and delete comment 
    -> return response 
    */

    const {commentId}=req.params;
    const deleteComment=await Comment.findByIdAndDelete(commentId);
    if(!deleteComment){
        throw new ApiError(404,"Comment not found");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,deleteComment,"Comment delete success"));

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
