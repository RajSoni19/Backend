import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


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
    const { page = 1, limit = 10, query=" ", sortBy=" ", sortType=" ", userId, } = req.query

    const options={
        page,
        limit,
        offset:page*limit-limit,
    };

    if(sortBy){
        options.sort={[sortBy]:sortType};
    }

    const aggregateVideos=Video.aggregate([
        {
            $match:{
                owner:{$ne:new mongoose.Types.ObjectId(userId)},
            },
        },

        {
            $match:{
                $or:[
                    {
                        title:{
                            $regex:query,
                            $options:"i",
                        },
                    },
                    {
                        description:{
                            $regex:query,
                            $options:"i",
                        },
                    },
                ],
            },
        },
    ]);

    const videos=await Video.aggregatePaginate(aggregateVideos,options);

    return res.status(200).json(new ApiResponse(200,{videos:videos.docs},"videos fetched"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
