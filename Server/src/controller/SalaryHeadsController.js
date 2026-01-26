import mongoose from "mongoose";
import { SalaryHeads } from "../models/SalaryHeadsSchema.js";

// ------------------ ADD SALARY HEAD ------------------
let AddSalaryHeads = async (req, res) => {
  let reqData = req.body;
  console.log("SalaryHeadsData", reqData);

  try {
    let result = await SalaryHeads.create(reqData);
    res.status(200).json({
      data: result,
      message: "Salary Head Added Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add salary head", error });
  }
};

// ------------------ FETCH SALARY HEADS BY COMPANY ------------------
let FetchSalaryHeads = async (req, res) => {
  try {
    let { CompanyId } = req.body;
    let result = await SalaryHeads.find({ CompanyId });
    res.status(200).json({
      data: result,
      message: "Fetched salary heads by company",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch salary heads", error });
  }
};

// ------------------ DELETE SALARY HEAD ------------------
let DeleteSalaryHead = async (req, res) => {
  try {
    let { SalaryHeadId } = req.body; // expecting ID from frontend
    let result = await SalaryHeads.findByIdAndDelete({ _id: SalaryHeadId });

    if (!result) {
      return res.status(404).json({ message: "Salary Head not found" });
    }

    res.status(200).json({
      message: "Salary Head Deleted Successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting Salary Head", error });
  }
};

// ------------------ EXPORT ------------------
export { AddSalaryHeads, FetchSalaryHeads, DeleteSalaryHead };
