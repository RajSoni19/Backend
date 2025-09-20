import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
     /*
    -> get owner id from req.user._id 
    -> get content from request body and validate
    -> create new tweet 
    -> return response 
    */

    const owner=req.user._id;
    const {content}=req.body;
    if(!content.trim()){
        throw new ApiError(400,"Content is required");
    }  

    const tweet=await Tweet.create({
        owner,
        content,
    })

    return res.status(201).json(new ApiResponse(201,tweet,"Tweet created"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

     /*
    -> get user id from req.params 
    -> validate if user exist
    -> get user tweets 
    -> return response 
    */

    const {userId}=req.params;
    const user=await User.findById(userId);

    if(!user){
        throw new ApiError(400,"User id is required");
    }

    const tweets=await Tweet.find({
      owner:new mongoose.Types.ObjectId(userId),
    })

    return res.status(200).json(new ApiResponse(200,tweets,"Fetched tweets success"));


})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    /*
    -> get tweet id by request params 
    -> get new contend from request body - validate
    -> update tweet with new tweet contend 
    -> validate
    -> return response 
    */


    const {tweetid}=req.params;
    const {newcontent}=req.body;

    if(!newcontent.trim()){
        throw new ApiError(400,"new content should not be empty");
    }

    const updateTweet=await Tweet.updateOne(
        {_id:new mongoose.Types.ObjectId(tweetid)},
        {
            $set:{
                content:newcontent,
            },
        }
    );

    if(!updateTweet?.modifiedCount){
        throw new ApiError(404,"Invalid tweet id");
    }

    return res.status(200).json(new ApiResponse(200,updateTweet,"Tweet updated"));


})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet 
    /*
    -> get tweet id from request params 
    -> delete tweet 
    -> return response 
    */

    const {tweetid}=req.params;
    const deletedTweet=await Tweet.findByIdAndDelete(tweetId);

    if(!deleteTweet){
        throw new ApiError(404,"tweet not found");
    }

    return res.status(200).json(new ApiResponse(200,deleteTweet,"Tweet deleted success"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
