import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true },
            },

        },

        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            videoUrl: 1,
                            thumbnail: 1,
                            owner: 1,
                            subscribers: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            isPublished: 1,
                        },
                    },
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $lookup:{
                                        from:"subscriptions",
                                        localField:"_id",
                                        foreignField:"channel",
                                        as:"subscibers",
                                    },
                                },
                                {
                                    $addFields:{
                                        subscribers:{
                                            $size:"$subscribers",
                                        },
                                    },
                                },
                                {
                                    $project:{
                                        _id:0,
                                        avatar:1,
                                        fullname:1,
                                        username:1,
                                    },
                                },
                            ],
                        },
                    },

                    {
                        $addFields:{
                            owner:{
                                $first:"$owner",
                            },
                        },
                    },
                ],
            },
        },


        {
            $addFields:{
                video:{
                    $first:"$video",
                },
            },
        },

        {
            $project:{
                video:1,
            },
        },
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200,likedVideos,"Fetched liked videos"));

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}