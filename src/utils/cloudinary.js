import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import fs from "fs"


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary=async (localFilePath) => {
    try{
       if(!localFilePath) return null
       //upload the file on cloudinary
      const response= await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
       })
       // file has been upload succesfull on cloudinary
    //    console.log("file is uploaded",response.url);
    fs.unlinkSync(localFilePath)
       return response;
    } catch(error){
        fs.unlinkSync(localFilePath) //remove locally saved tempory file as operation got failed
        return null;
    }
}


export {uploadOnCloudinary}



//  const uploadResult = await cloudinary.uploader
//        .upload(
//            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//                public_id: 'shoes',
//            }
//        )
//        .catch((error) => {
//            console.log(error);
//        });
    
//     console.log(uploadResult);


