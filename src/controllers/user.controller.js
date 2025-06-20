import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"
import { deleteFromCloudinary } from '../utils/deleteoldimg.js'
import mongoose from 'mongoose'
import { json } from 'express'

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while genrating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation-not empty
    // check if user is already exist: username,email
    // check for images, check for avatar
    // upload them cloudinary , avatar
    // create user object - create entry in db
    // remove password and refresh token field from response 
    // check for user creation
    // return res

    //This gets user inputs from the frontend (like a signup form).
    const { fullname, email, username, password } = req.body
    //    console.log(req.body);
    //    console.log("email",email);

    //    if(fullname===""){
    //     throw new ApiError(400,"fullname is needed")
    //    }

    //Checks that none of the fields are empty or missing
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        console.log("Existing user found:", {
            existingUsername: existedUser.username,
            existingEmail: existedUser.email
        });
        throw new ApiError(409, `User already exists with ${existedUser.email === email ? 'email' : 'username'
            }`);
    }
    console.log("No existing user found, proceeding with registration");


    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is needed")
    }

    if (!req.files || !req.files.avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // console.log(avatar);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is needed")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while register user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user register done")
    )

})


// Login User
const loginUser = asyncHandler(async (req, res) => {
    //Todos
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User not there")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).
        json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in success"
            )
        )
})


/**
 * Logout user
 * 1. Clear refresh token from database
 * 2. Clear cookies
 */
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this remove field from document
            },

        },
        {

            new: true

        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged Out"))
})


/**
 * Refresh access token using refresh token
 * 1. Verify incoming refresh token
 * 2. Check token in database
 * 3. Generate new tokens
 * 4. Update cookies
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unautorized request")
    }


    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)
    if (!user) {
        throw new ApiError(401, "No user invalid refreshtoken")
    }

    if (incomingRefreshToken !== user?.refreshToken) {

        throw new ApiError(401, "Refresh token is expire")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id)

    return res.status(200).cookie("accesstoken", accessToken, options).cookie("refreshToken", newrefreshToken, options).json(
        new ApiResponse(
            200,
            { accessToken, refreshToken: newrefreshToken },
            "Access token refreshed"
        )
    )


})


const changeCurrentPassword = asyncHandler(async (req, res) => {

    // User logs in with correct password.

    // User goes to profile and enters:

    // Old password: myOldPass

    // New password: myNewPass

    // Server:

    // Finds the user

    // Checks if myOldPass is correct

    // If yes, updates password to myNewPass (and hashes it)

    // Sends back: "Password changed successfully"
    const { oldpassword, newpassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldpassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }


    user.password = newpassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})


const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new ApiError(400, "All fields are needed")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email,

            }
        },
        { new: true }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Details updated success"))
})


/**
 * Update user's avatar
 * 1. Handle file upload
 * 2. Delete old avatar from Cloudinary
 * 3. Upload new avatar
 * 4. Update user document
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    // Delete old image from Cloudinary if it exists
    if (user.avatar) {
        await deleteFromCloudinary(user.avatar);
    }

    // Upload new image to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    // Upload failed
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    // Update user's avatar URL
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        { new: true }
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Avatar image updated successfully")
    );
});


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image is missing")
    }


      const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    // Delete old image from Cloudinary if it exists
    if (user.coverImage) {
        await deleteFromCloudinary(user.avatar);
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const updateuser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,

            }
        },
        { new: true }
    ).select("-password")


    return res.status(200).json(
        new ApiResponse(200, updateuser, "Cover image update success")
    )

})


const getUserChannelProfile=asyncHandler(async(req,res)=>{
   const {username}=req.params
   if(!username?.trim()){
    throw new ApiError(400,"username is missing")
   }

  const channel=await User.aggregate([
    {
       $match:{
        username:username?.toLowerCase()
       }
    },
    {
        $lookup:{
            from:"subsciptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },
    {
         $lookup:{
            from:"subsciptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
        }
    },
    {
      $addFields:{
            subscriberCount:{
                $size:"$subscribers"
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo"
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
      }
    },
    {
        $project:{
            fullname:1,
            username:1,
            subscriberCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1
        }
    },
   ])


   if(!channel?.length){
    throw new ApiError(404,"Channel does not exist")
   }

   return res
   .status(200)
   .json(
    new ApiResponse(200,channel[0],"Channel fetched success")
   )

})

const getWatchHistory=asyncHandler(async(req,res)=>{
    // req.user._id(Will get string)
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }   
        },
        {
            $lookup:{
                from:"videos",
                 localField:"watchHistory",
                 foreignField:"_id",
                 as:"watchHistory",
                 pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as :"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                 ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            user[0].watchHistory,

            "Watch history fetched"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}