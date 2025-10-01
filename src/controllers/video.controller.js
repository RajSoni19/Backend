import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Subsciption } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"

const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination
    /* 
  example queries: 
   page = 2
   limit = 5
   query = "developer"
   sortBy = "createdAt"
   sortType = "desc" || "asc" // asc mean small or last comes first(date) and desc mean big come first, recent date first
   userId = "45sjhehr"
   */
    /**
       -> Get query params from frontend - page, limit, query, sortBy, sortType, userId 
       -> Explore mongoose-aggregate-paginate-v2 and implement aggregation
       -> get 
       */
    const { page = 1, limit = 10, query = " ", sortBy = " ", sortType = " ", userId, } = req.query

    const options = {
        page,
        limit,
        offset: page * limit - limit,
    };

    if (sortBy) {
        options.sort = { [sortBy]: sortType };
    }

    const aggregateVideos = Video.aggregate([
        {
            $match: {
                owner: { $ne: new mongoose.Types.ObjectId(userId) },
            },
        },

        {
            $match: {
                $or: [
                    {
                        title: {
                            $regex: query,
                            $options: "i",
                        },
                    },
                    {
                        description: {
                            $regex: query,
                            $options: "i",
                        },
                    },
                ],
            },
        },
    ]);

    const videos = await Video.aggregatePaginate(aggregateVideos, options);

    return res.status(200).json(new ApiResponse(200, { videos: videos.docs }, "videos fetched"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    /**
 -> get title and description from frontend 
 -> validate is empty
 -> get thumbnail and video from local and validate is empty 
 -> upload thumbnail and video on cloudinary
 -> check errors 
 -> create new video object with thumbnail url and video url and added others information
 -> return response 
*/
    const { title, description } = req.body;
    if (!title || !description) {
        throw new ApiError(400, "All field is needed");
    }

    let thumbnailLocalPath;
    let videoLocalPath;

    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail?.length) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }
    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile?.length) {
        videoLocalPath = req.files.videoFile[0].path;
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is needed");
    }
    if (!videoLocalPath) {
        throw new ApiError(400, "Video is required");
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!video) {
        throw new ApiError(500, "Video upload failed");
    }

    if (!thumbnail) {
        throw new ApiError(500, "Thumbnail upload failed");
    }

    const newVideo = await Video.create({
        title,
        description,
        videoFile: video.url,
        thumbnail: thumbnail.url,
        owner: req.user?._id,
        duration: video.duration,
        isPublished: true,
    })

    return res.status(200).json(new ApiResponse(200, newVideo, "Video upload success"));


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
     /*
    -> get video id from req.params.videoId 
    -> find video by that id 
    -> return full video info 
    */

    const video=await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId),
            },
        },

        {
            $lookup:{
                from:"subsciptions",
                localField:"_id",
                foreignField:"video",
                as:"subscribers",
            }
        },

        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"comments",
            },
        },

        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers",
                },

                likesCount:{
                    $size:"$likes",
                },
            },
        },

        {
            $project:{
                likesCount:1,
                thumbnail:1,
                title:1,
                description:1,
                duration:1,
                views:1,
                isPublished:1,
                subscribersCount:1,
                comments:1,
                createdAt:1,
            },
        },
    ])


    if(!video[0].isPublished){
        return res.status(200).json(new ApiResponse(200,{},"This video is private"));
    }

    return res.status(200).json(new ApiResponse(200,video[0],"Video fetch success"));

})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    /**
    -> get video id from params 
    -> get data frontend to update - title, description, thumbnail
    -> check which one is to update 
    -> if thumbnail is to update then update it and validate - remove old image from cloudinary
    -> update video in DB 
    -> return response 
   */
    const { videoId } = req.params;
    const { title, description } = req.body; ription;

    const updatableFields = {};

    if (title) {
        updatableFields.title = title;
    }

    if (description) {
        updatableFields.description = description;
    }

    const newThumbnailLocalPath = req.file?.path;

    if (!title && !description && !newThumbnailLocalPath) {
        throw new ApiError(400, "At least one field is needed");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }


    if (newThumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(newThumbnailLocalPath);
        if (!thumbnail) {
            throw new ApiError(500, "Thumbnail upload fail");
        }

        updatableFields.thumbnail = thumbnail.url;

        if (video.thumbnail) {
            await removeCloudinaryFile(video.thumbnail);
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updatableFields },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { updatedVideo },
                "Video updated successfully"
            )
        );







})

const deleteVideo = asyncHandler(async (req, res) => {

    //     Check if videoId is provided.

    // Get the video from the database.

    // Remove it from all users’ watch history.

    // Delete all likes.

    // Delete all comments.

    // Delete the video record itself.

    // Delete thumbnail and video file from Cloudinary.

    // Send success response.
    //TODO: delete video
    /**
     -> get video id from request params
     -> get video from db 
     -> remove video watched history from every user
     -> remove video all likes
     -> remove comments 
     -> remove video from DB 
     -> remove thumbnail using its public id  from cloudinary 
     -> then remove video following same steps 
    */
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "Video Id is required");
    }

    const video = await Video.findById(new mongoose.Types.ObjectId(videoId));

    const videoObjectId = new mongoose.Types.ObjectId(video._id);
    await User.updateMany(
        {
            watchHistory: videoObjectId,
        },
        { $pull: { watchHistory: videoObjectId } }
    );

    await Like.deleteMany({ video: videoObjectId });
    await Comment.deleteMany({
        video: videoObjectId,
    })
    const thumbnail = video.thumbnail;
    const videoUrl = video.videoUrl;
    await Video.findByIdAndDelete(videoObjectId);

    await removeCloudinaryFile(thumbnail);
    await removeCloudinaryFile(videoUrl, "video");

    return res.status(200).json(new ApiResponse(200, {}, "Video delete success"));

})

const togglePublishStatus = asyncHandler(async (req, res) => {

    /*
     -> get video id from request params
     -> find video by its id and update toggle publish 
     -> return toggled api response 
    */

    const { videoId } = req.params;

    const response=await Video.findByIdAndUpdate(
        videoId,
        [
            {
                $set:{
                    isPublished:{$not:"$isPublished"},
                },
            },
        ],

        {
            new:true,
        }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {isPublished:response.isPublished},
            "Toggle publish video status "
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
