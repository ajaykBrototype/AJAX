import Address from "../../models/user/addressModel.js";

export const addAddressService = async (data, userId) => {
  const address = await Address.create({
    ...data,
    userId
  });

  return { success: true, address };
};


export const getAddressService = async (userId) => {
  const addresses = await Address.find({ userId });

  return { success: true, addresses };
};


export const deleteAddressService = async (userId, addressId) => {
  try {
    const deletedAddress = await Address.findOneAndDelete({ 
      _id: addressId, 
      userId: userId 
    });
    return deletedAddress;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateAddressService = async (userId, addressId, updateData) => {
  try {
   
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId: userId },
      { $set: updateData },
      { new: true, runValidators: true } 
    );
    return updatedAddress;
  } catch (error) {
    throw new Error("Service Error: " + error.message);
  }
};