  import { Designation } from "../models/DesignationSchema.js";

  const addDesignation = async (req, res) => {
    try {
      const { DesignationName, CompanyId } = req.body;

      if (!DesignationName || !CompanyId) {
        return res
          .status(400)
          .json({
            success: false,
            message: "DesignationName and CompanyId are required.",
          });
      }

      // Check for duplicate designation under the same company
      const existing = await Designation.findOne({ DesignationName, CompanyId });
      if (existing) {
        return res
          .status(409)
          .json({
            success: false,
            message: "Designation already exists for this company.",
          });
      }

      const designation = await Designation.create({
        DesignationName,
        CompanyId,
      });

      res
        .status(201)
        .json({
          success: true,
          message: "Designation added successfully.",
          data: designation,
        });
    } catch (error) {
      console.error("addDesignation Error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error while adding designation.",
        });
    }
  };

  // -------------------- Fetch Designations by Company --------------------
  const getDesignationsByCompany = async (req, res) => {
    try {
      const { CompanyId } = req.body;
      if (!CompanyId)
        return res
          .status(400)
          .json({ success: false, message: "CompanyId is required." });

      const designations = await Designation.find({ CompanyId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        message: "Designations fetched successfully.",
        count: designations.length,
        data: designations,
      });
    } catch (error) {
      console.error("getDesignationsByCompany Error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error while fetching designations.",
        });
    }
  };

  // -------------------- Delete Designation --------------------
  const deleteDesignation = async (req, res) => {
    // Support multiple ways of passing the id for compatibility with different frontends:
    // - URL param: /deletedesignation/:id
    // - Query param: /deletedesignation?id=...
    // - Request body: { DesignationId: '...' }
    const idFromParam = req.params && req.params.id;
    const idFromQuery = req.query && (req.query.id || req.query.DesignationId);
    const idFromBody = req.body && (req.body.id || req.body.DesignationId);
    const id = idFromParam || idFromQuery || idFromBody;
    console.log("DELETE route hit! resolved ID:", id);
    try {
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Designation id is required." });
      }

      const deleted = await Designation.findByIdAndDelete(id);

      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Designation not found." });
      }

      res
        .status(200)
        .json({
          success: true,
          message: "Designation deleted successfully.",
          data: deleted,
        });
    } catch (error) {
      console.error("deleteDesignation Error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error while deleting designation.",
        });
    }
  };



  export {
    addDesignation,
    getDesignationsByCompany,
    deleteDesignation,
    // countDesignationsByCompany,
  };
