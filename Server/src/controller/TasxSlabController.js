import { TaxSlab } from "../models/TaxSlabsSchema.js";

const addTaxSlab = async (req, res) => {
  try {
    const {
      minIncome,
      maxIncome,
      taxRate,
      description,
      effectiveFrom,
      CompanyId,
    } = req.body;

    if (minIncome === undefined || taxRate === undefined || !CompanyId) {
      return res
        .status(400)
        .json({ message: "minIncome, taxRate, and CompanyId are required" });
    }

    const newSlab = new TaxSlab({
      minIncome,
      maxIncome,
      taxRate,
      description,
      effectiveFrom,
      CompanyId,
    });

    await newSlab.save();
    res
      .status(201)
      .json({ message: "Tax slab added successfully", slab: newSlab });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding tax slab", error: error.message });
  }
};

const getTaxSlabs = async (req, res) => {
  try {
    const { companyId } = req.query;

    const slabs = companyId
      ? await TaxSlab.find({ CompanyId: companyId })
      : await TaxSlab.find();

    res.status(200).json(slabs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tax slabs", error: error.message });
  }
};

const updateTaxSlab = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSlab = await TaxSlab.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedSlab)
      return res.status(404).json({ message: "Tax slab not found" });

    res
      .status(200)
      .json({ message: "Tax slab updated successfully", slab: updatedSlab });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating tax slab", error: error.message });
  }
};

const deleteTaxSlab = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSlab = await TaxSlab.findByIdAndDelete(id);

    if (!deletedSlab)
      return res.status(404).json({ message: "Tax slab not found" });

    res.status(200).json({ message: "Tax slab deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting tax slab", error: error.message });
  }
};
export { addTaxSlab, getTaxSlabs, updateTaxSlab, deleteTaxSlab };
