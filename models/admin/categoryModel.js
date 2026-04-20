import mongoose from "mongoose";
import { boolean } from "zod";

const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        require:true,
        unique:true,
        trim:true
    },
    isActive:{
        type:boolean,
        default:true
    }
},{timestamps:true});

export default mongoose.model("Category",categorySchema)