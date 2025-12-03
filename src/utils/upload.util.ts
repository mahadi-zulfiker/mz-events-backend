import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

export const uploadImage = async (
    filePath: string
): Promise<UploadApiResponse> => {
    return cloudinary.uploader.upload(filePath, {
        folder: 'events-platform',
    });
};
