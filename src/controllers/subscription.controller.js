import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subsciption } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    /*
    -> Get channel id from request params  
    -> find channel and and validate 
    -> check if already subscribed, 
    > if yes, remove subscription doc from DB 
    > if no, create new subscription 
    -> return toggle subscribe response
    */
   // TODO: toggle subscription
   const {channelId} = req.params;
   const channelObjectId=new mongoose.Types.ObjectId(channelId);
   const currUserObjectId=new mongoose.Types.ObjectId(req.user._id);

   if(channelObjectId.equals(currUserObjectId)){
    throw new ApiError(400,"Cannot perform this operation with your channel");
   }
   
   if(!channelId){
    throw new ApiError(400,"ChannelId is required");
   }

   const channel=await User.findById(channelId);
   if(!channel){
    throw new ApiError(404,"Channel not found");
   }

   let isSubscribed=await Subsciption.findOne({
    subscriber:currUserObjectId,
    channel:channelObjectId,
   });

   if(!isSubscribed){
    isSubscribed=await Subsciption.create({
        subscriber:currUserObjectId,
        channel:channelObjectId,
    });
   }else{
    isSubscribed=await Subsciption.deleteOne({
        subscriber:currUserObjectId,
        channel:channelObjectId,
    });
   }

   console.log(isSubscribed);

   return res.status(200).json(new ApiResponse(200,{isSubscribed},"Toggle subscription"));

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
        throw new ApiError(400, "Channel id param is required");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const subscribersData = await Subsciption.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            email: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                _id: 0,
                subscribers: 1,
            },
        },
    ]);

    // Handle case with no subscribers
    const subscribersList = subscribersData[0]?.subscribers || [];

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                subscribersCount: subscribersList.length,
                subscribersChannel: subscribersList,
            },
            "Fetched subscribers"
        )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    /*
     -> get channel id from request params 
     -> validate 
     -> get subscribed channel from subscription model 
     -> return response with length property
    */
    const  subscriberId  = req.user._id;
    const subscibed=await Subsciption.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channel",
                pipeline:[
                    {
                        $project:{
                            _id:0,
                            username:1,
                            fullname:1,
                            avatar:1,
                        },
                    },
                ],
            },
        },

        {

            $addFields:{
                channel:{
                    $first:"$channel",
                },
            },
        },

        {
            $project:{channel:1},
        },


    ])
        return res.status(200).json(new ApiResponse(200,subscibed,"fetched subscribed"));



})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}