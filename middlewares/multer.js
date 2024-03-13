import multer from 'multer';

export const multerUploads=multer({
    limits:{
        fileSize:1024*1024*5
    },
})