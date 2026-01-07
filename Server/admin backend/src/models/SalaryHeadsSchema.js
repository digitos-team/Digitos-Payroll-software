import mongoose from "mongoose";

let SalaryHeadsSchema = mongoose.Schema({

    SalaryHeadsTitle: {type: String},
    ShortName:{type:String},
    SalaryHeadsType:{type:String,
        enum: {
            values: ["Earnings", "Deductions"],
            message: "select correct salary head type"
        }
    },
    SalaryHeadsValue:{type:Number},
    

   CompanyId:{type:mongoose.Schema.Types.ObjectId, ref:"Company"}
},{timestamps:true})
export const SalaryHeads = mongoose.model("SalaryHeads", SalaryHeadsSchema)