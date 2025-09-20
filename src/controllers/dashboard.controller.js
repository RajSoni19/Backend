import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subsciption } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { application } from "express"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    /* 
  -> get channel id from req.user._id 
  -> aggregate and get total video views, total subscribers, total videos, total likes 
  -> return response 
  */
    const channelId = req.user._id;
    const stats = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId),
            },
        },

        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as:"videos",
            },
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers",
            },
        },
        {
            $addFields:{
                totalVideo:{
                    $size:"$videos",
                },
                totalVideoViews:{
                    $sum:{
                        $map:{
                            input:"$videos",
                            as:"video",
                            in:"$$video.views",
                        },
                    },

                },
                subscribers:{
                    $size:"$subscribers",
                },
            },
        },

        {
            $project:{
                _id:0,
                subscribers:1,
                totalVideo:1,
                totalVideoViews:1,
            },
        },


    ]);

    return res.status(200).json(new ApiResponse(200,stats,"fetched stats"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
      /*
    -> get channel id from req.user._id 
    -> get all videos matched by channel id 
    -> return response with projection
    */

    const channelId=req.user._id;
    const videos=await Video.find({
        owner:new mongoose.Types.ObjectId(channelId),
    }).select("-__v");
    return res.status(200).json(new ApiResponse(200,videos,"Fetched videos"));
});

export {
    getChannelStats,
    getChannelVideos
}