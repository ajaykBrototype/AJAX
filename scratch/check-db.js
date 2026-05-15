import mongoose from 'mongoose';
import Variant from '../models/admin/variantModel.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ajax');
        const v = await Variant.findOne().lean();
        console.log('VARIANT DATA:', JSON.stringify(v, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
