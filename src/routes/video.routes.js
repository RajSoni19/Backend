import { Router } from 'express';
import {
    // getVideo,
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const   router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router.route("/watch").get(verifyJWT,getVideoById);
router.route("/toggle-publish/:videoId").patch(verifyJWT, togglePublishStatus);
router.route("/delete/:videoId").delete(verifyJWT, deleteVideo);
router
  .route("/update-video/:videoId")
  .post(upload.single("thumbnail"), verifyJWT, updateVideo);;

export default router