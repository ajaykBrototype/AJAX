import {
  addAddressService,
  getAddressService,deleteAddressService,updateAddressService
} from "../../services/user/address.service.js";
import Address from "../../models/user/addressModel.js";

// LOAD ADDRESS PAGE
export const loadAddressPage = async (req, res) => {
  const result = await getAddressService(req.session.userId);

  res.render("user/address", {
    addresses: result.addresses
  });
};

// LOAD ADD ADDRESS PAGE
export const loadAddAddressPage = (req, res) => {
  res.render("user/addAddress"); // ❌ no need to fetch addresses here
};

// ADD ADDRESS
export const addAddress = async (req, res) => {

if (!req.session.userId) {
  return res.status(400).json({
    success: false,
    message: "User not logged in"
  });
}

  try {
    console.log("BODY:", req.body); // 🔥 debug
    console.log("USER:", req.session.userId); // 🔥 debug

    const address = await Address.create({
      ...req.body,
      userId: req.session.userId
    });

    res.json({ success: true });

  } catch (err) {
    console.log("ERROR:", err); // 🔥 VERY IMPORTANT

    res.status(500).json({
      success: false,
      message: err.message // 👈 show real error
    });
  }
};


export const deleteAddress = async (req, res) => {
  try {
    const userId = req.session?.userId; // Use optional chaining just in case

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const addressId = req.params.id;
    await deleteAddressService(userId, addressId);

    res.json({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


export const loadEditAddressPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const addressId = req.params.id;

    // Fetch the address to pre-fill the form fields
    const address = await Address.findOne({ _id: addressId, userId: userId });

    if (!address) {
      return res.redirect("/address?error=AddressNotFound");
    }

    res.render("user/editAddress", { address });
  } catch (err) {
    console.error("Controller Error:", err);
    res.redirect("/address");
  }
};

// POST: Handle the AJAX update request
export const updateAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const addressId = req.params.id;
    const updateData = req.body;

    const result = await updateAddressService(userId, addressId, updateData);

    if (result) {
      res.json({ success: true, message: "Address updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "Could not find address to update" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};