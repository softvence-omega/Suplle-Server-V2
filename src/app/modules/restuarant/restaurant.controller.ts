import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { restaurantService } from "./restuarant.service";
import { IRestaurant } from "./restuarant.interface";
import {
  uploadImgToCloudinary,
  uploadMultipleImages,
} from "../../utils/sendImageToCloudinary";
import { validateData } from "../../middlewares/validateData ";
import { restuarantUpdateValidation } from "./restuarant.validation";
import AppError from "../../errors/AppError";
import { RestaurantModel } from "./restuarant.model";

const postRestuarant = catchAsync(async (req: Request, res: Response) => {
  const data = JSON.parse(req.body.data);
  const owner: any = req.user;

  const files = (req.files as any)?.images?.map(
    (file: Express.Multer.File) => file.path
  );
  const uploadLogo = (req.files as any)?.logo?.[0]?.path;

  const { secure_url } = await uploadImgToCloudinary("logo", uploadLogo);
  const uploadedImages = await uploadMultipleImages(files);
  const { images, coverPhoto, logo, ...rest } = data;
  const restaurantData = {
    images: uploadedImages,
    logo: secure_url,
    coverPhoto: uploadedImages[0],
    owner: owner._id,
    ...rest,
  };

  const result = await restaurantService.postRestaurant(restaurantData);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Restaurant created successfully",
    data: result,
  });
});

const getAllRestuarant = catchAsync(async (_req: Request, res: Response) => {
  const result = await restaurantService.getAllRestaurant();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Restaurants retrieved successfully",
    data: result,
  });
});

const getSingleRestuarant = catchAsync(async (req: Request, res: Response) => {
  const result = await restaurantService.getSingleRestaurant(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Restaurant retrieved successfully",
    data: result,
  });
});

const updateRestuarant = catchAsync(async (req: Request, res: Response) => {
  let data: Partial<IRestaurant & { status?: string }> = {};
  if (req.body.data && typeof req.body.data === "string") {
    data = JSON.parse(req.body.data);
  } else if (req.body.data) {
    data = req.body.data;
  }

  const user: any = req.user;
  const restaurantId = user.restaurant;

  const files =
    (req.files as { [fieldname: string]: Express.Multer.File[] })?.images?.map(
      (file) => file.path
    ) || [];
  const uploadLogo = (
    req.files as { [fieldname: string]: Express.Multer.File[] }
  )?.logo?.[0]?.path;

  const { images, coverPhoto, logo, ...rest } = data;

  const restaurantData: Partial<IRestaurant> = { ...rest };

  // Upload logo if provided
  if (uploadLogo) {
    try {
      const { secure_url } = await uploadImgToCloudinary("logo", uploadLogo);
      restaurantData.logo = secure_url;
    } catch (err) {
      console.error("Error uploading logo to Cloudinary:", err);
      throw new AppError(500, "Failed to upload logo");
    }
  }

  // Retrieve existing restaurant to keep previous images
  const existingRestaurant = await RestaurantModel.findById(restaurantId);

  // Upload and merge images if new ones are provided
  if (files.length > 0) {
    try {
      const uploadedImages = await uploadMultipleImages(files);
      restaurantData.images = [
        ...((existingRestaurant?.images as string[]) || []),
        ...uploadedImages,
      ];
      restaurantData.coverPhoto =
        restaurantData.coverPhoto || uploadedImages[0]; // only set if not provided
    } catch (err) {
      console.error("Error uploading images to Cloudinary:", err);
      throw new AppError(500, "Failed to upload images");
    }
  } else {
    // Keep existing images if no new images are uploaded
    restaurantData.images = (existingRestaurant?.images as string[]) || [];
  }

  const validate = (await validateData(
    restuarantUpdateValidation,
    restaurantData
  )) as Partial<IRestaurant>;

  const result = await restaurantService.updateRestaurant(
    restaurantId,
    validate
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Restaurant updated successfully",
    data: result,
  });
});

const updateRestuarantByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    let data: Partial<IRestaurant & { status?: string }> = {};
    if (req.body.data && typeof req.body.data === "string") {
      data = JSON.parse(req.body.data);
    } else if (req.body.data) {
      data = req.body.data;
    }

    const user: any = req.user;
    const restaurantId = req.params.id;

    const files =
      (
        req.files as { [fieldname: string]: Express.Multer.File[] }
      )?.images?.map((file) => file.path) || [];
    const uploadLogo = (
      req.files as { [fieldname: string]: Express.Multer.File[] }
    )?.logo?.[0]?.path;

    const { images, coverPhoto, logo, ...rest } = data;

    const restaurantData: Partial<IRestaurant> = { ...rest };

    // Upload logo if provided
    if (uploadLogo) {
      try {
        const { secure_url } = await uploadImgToCloudinary("logo", uploadLogo);
        restaurantData.logo = secure_url;
      } catch (err) {
        console.error("Error uploading logo to Cloudinary:", err);
        throw new AppError(500, "Failed to upload logo");
      }
    }

    // Retrieve existing restaurant to keep previous images
    const existingRestaurant = await RestaurantModel.findById(restaurantId);

    if (!existingRestaurant) {
      throw new AppError(404, "restaurant doesnot found");
    }

    // Upload and merge images if new ones are provided
    if (files.length > 0) {
      try {
        const uploadedImages = await uploadMultipleImages(files);
        restaurantData.images = [
          ...((existingRestaurant?.images as string[]) || []),
          ...uploadedImages,
        ];
        restaurantData.coverPhoto =
          restaurantData.coverPhoto || uploadedImages[0]; // only set if not provided
      } catch (err) {
        console.error("Error uploading images to Cloudinary:", err);
        throw new AppError(500, "Failed to upload images");
      }
    } else {
      // Keep existing images if no new images are uploaded
      restaurantData.images = (existingRestaurant?.images as string[]) || [];
    }

    const validate = (await validateData(
      restuarantUpdateValidation,
      restaurantData
    )) as Partial<IRestaurant>;

    const result = await restaurantService.updateRestaurantByAdmin(
      restaurantId,
      validate
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Restaurant updated successfully",
      data: result,
    });
  }
);

const deleteRestuarant = catchAsync(async (req: Request, res: Response) => {
  const result = await restaurantService.deleteRestaurant(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Restaurant deleted successfully",
    data: result,
  });
});

const setAccountSettings = catchAsync(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const user: any = req.user;
  // console.log(user)
  if (!oldPassword || !newPassword) {
    throw new AppError(400, "Old password and new password are required");
  }

  const result = await restaurantService.accountSettings(
    user.restaurant,
    oldPassword,
    newPassword
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    // message: "Account settings updated successfully",
    data: result,
  });
});

export const restuarantController = {
  postRestuarant,
  getAllRestuarant,
  getSingleRestuarant,
  updateRestuarantByAdmin,
  updateRestuarant,
  deleteRestuarant,
  setAccountSettings,
};
