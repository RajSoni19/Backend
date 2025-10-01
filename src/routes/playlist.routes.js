import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
   getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/create").post(createPlaylist);
router.route("/update/:playlistId").patch(updatePlaylist);
router.route("/delete/:playlistId").delete(deletePlaylist);
router.route("/add-video/:playlistId/:videoId").patch(addVideoToPlaylist);
router
  .route("/remove-video/:playlistId/:videoId")
  .patch(removeVideoFromPlaylist);
router.route("/user/:userId").get(getUserPlaylists);
router.route("/:playlistId").get(getPlaylistById);

export default router