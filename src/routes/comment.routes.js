import { Router } from 'express';
import {
    addComment,
    deleteComment,
     getVideoComments,
        updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();


router.use(verifyJWT);
router.route("/video-comment/:videoId").get(getVideoComments);

router.route("/video-comment").post(addComment);

router.route("/video-comment/:videoId").patch(    updateComment);
router.route("/video-comment/:commentId").delete(deleteComment);

export default router