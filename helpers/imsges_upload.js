const mongoose = require('mongoose');
const sharp = require('sharp');
const { GridFSBucket } = require('mongodb');

/**
 * Upload multiple images to GridFS
 * @param {Array} files - files from multer (req.files)
 * @returns {Promise<Array>} - array of GridFS _id values
 */
async function uploadImagesToGridFS(files) {
    if (!files || files.length === 0) {
        throw new Error('No files uploaded');
    }

    const bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });

    const ids = [];

    for (const file of files) {
        // Compress to WebP
        const compressed = await sharp(file.buffer)
            // .resize({ width: 1200 }) // optional resize
            .webp({ quality: 90 })
            .toBuffer();

        // Upload to GridFS
        const uploadStream = bucket.openUploadStream(
            `${Date.now()}-${file.originalname}`,
            {
                contentType: 'image/webp'
            }
        );

        uploadStream.end(compressed);

        await new Promise((resolve, reject) => {
            uploadStream.on('finish', () => {
                ids=uploadStream.id; // save GridFS _id
                resolve();
            });
            uploadStream.on('error', reject);
        });
    }

    return  `https://cpg-new.onrender.com/api/admin/image/${ids}`;
}

module.exports = uploadImagesToGridFS;
