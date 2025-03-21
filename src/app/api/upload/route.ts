import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

// Configure Cloudinary with the URL from environment variable
cloudinary.config({
  cloud_name: 'dksqworkw',
  api_key: '232352188856917',
  api_secret: 'mFp86a4Yr1zDNO0BPdJ69OSx-1o'
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate base64 image
    if (!image.startsWith('data:image')) {
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      );
    }

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'payment-qr',
      resource_type: 'image',
      format: 'jpg',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    });

    return NextResponse.json({
      url: uploadResponse.secure_url
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
} 