import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import {Video} from '../models/video.model.js'


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    /*
    -> get playlist name, description from request body 
    -> validate 
    -> create playlist (owner and videos is default)
    -> return response 
    */
   const {name, description} = req.body
   if(!name.trim() || !description.trim()){
    throw new ApiError(400,'All field are required');
   }

   const newPlaylist=await Playlist.create({
    owner:req.user._id,
    name,
    description,
   });

   return res
   .status(200)
   .json(new ApiResponse(200,newPlaylist,'playlist created'));


})

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
     /*
    -> get user id from request params 
    -> check if user exist
    -> get user all playlists 
    -> return response
    */
    const {userId} = req.params;
    const user=await User.findById(userId);
    if(!user){
        throw new ApiError(404,'User not found');
    }

    const playlists=await Playlist.find({
        owner:userId,
    });

    return res
    .status(200)
    .json(new ApiResponse(200,playlists,'Fetched playlist'));

});

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
     /*
    -> get playlist id from request params 
    -> find playlist and validate 
    -> return response 
    */
    const {playlistId} = req.params
    const playlist=await Playlist.aggregate([
      {
        $match:{
            _id:new mongoose.Types.ObjectId(playlistId),
        },
      },

      {
        $lookup:{
            from:'videos',
            localField:'videos',
            foreignField:'_id',
            as:'videos',
            pipeline:[
                {
                    $project:{
                        title:1,
                        description:1,
                        videoUrl:1,
                        thumbnail:1,
                        duration:1,
                        createdAT:1,
                        views:1,
                    },
                },
            ],
        },
      },

    ]);


    if(!playlist){
        throw new ApiError(404,'Playlist not found');
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,'Fetched playlist'));

});




const addVideoToPlaylist = asyncHandler(async (req, res) => {

    /*
    -> get videoId and playlistId from request params 
    -> validate is empty 
    -> validate video and playlist exist 
    -> add videoId in playlist videos
    -> return response
    */

    const {playlistId, videoId} = req.params;
    if(!playlistId || !videoId) {
    throw new ApiError(400, "All params is required");
  }

  const playlist=await Playlist.findById(playlistId);
  const video=await Video.findById(videoId);

  if (!video || !playlist) {
    throw new ApiError(400, "Video or playlist might not exist");
  }

  const addVideo=await Playlist.findByIdAndUpdate(
    playlistId,
    {
        $push:{videos:videoId},
    },
    {new : true}
  );

   return res.status(200).json(new ApiResponse(200,addVideo,'Added video in playlist'));



})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist
     /*
    -> get videoId and playlistId from request params 
    -> validate is empty 
    -> remove video from playlist 
    -> return response
    */

    const {playlistId, videoId} = req.params;
     if (!videoId || !playlistId) {
    throw new ApiError(400, "All params is required");
  }

  const removeVideo=await Playlist.findByIdAndUpdate(playlistId,
   {$pull:{videos:new mongoose.Types.ObjectId(videoId)}},
    {new:true}
  );
  console.log(removeVideo);

  if(!removeVideo.videos.length){
    throw new ApiError(404,"Video does'nt exist");
  }


  const playlist=await Playlist.findById(playlistId);

  return  res.status(200).json(new ApiResponse(200,playlist,"Removed video from playlist"));


});


const deletePlaylist = asyncHandler(async (req, res) => {

    // TODO: delete playlist
      /*
    -> get playlist id from request params 
    -> delete playlist 
    -> return response 
    */
    const {playlistId} = req.params;
    const deletePlaylist=await Playlist.findByIdAndDelete(playlistId);
    if(!deletePlaylist){
        throw new ApiError(400,"Playlist not found");
    }

    return res.status(200).json(new ApiResponse(200,null,"Playlist Deleted succesfully"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist
     /*
    -> get playlist id from request params
    -> get name, and description from request body 
    -> if both empty throw error 
    -> validate - name or description is required 
    -> update playlist 
    -> return response 
    */
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!name && !description){
        throw new ApiError(
            400,
            "Fields name or description is required for this operation"
        );
    }

    const nonEmptyFields={};
    if(name){
        nonEmptyFields.name=name;
    }

    if(description){
        nonEmptyFields.description=description;
    }

    const updatePlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
        $set:{
            ...nonEmptyFields,
        },
    },
    {new :true}
    );
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
