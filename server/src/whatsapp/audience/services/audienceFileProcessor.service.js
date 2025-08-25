import xlsx from "xlsx";

class AudienceFileProcessor {
  /**
   * Process audience file and extract phone numbers with variables
   * @param {Buffer} fileBuffer - File buffer from multer
   * @param {string} originalName - Original filename
   * @param {Array} availableMergeFields - Array of merge field definitions from frontend
   * @returns {Object} Processed data with audience array and metadata
   */
  static async processAudienceFile(
    fileBuffer,
    originalName,
    availableMergeFields
  ) {
    try {
           // Parse availableMergeFields if it's a string
      let parsedMergeFields = availableMergeFields;
      if (typeof availableMergeFields === "string") {
        try {
          parsedMergeFields = JSON.parse(availableMergeFields);
        } catch (parseError) {
          console.error("Failed to parse availableMergeFields:", parseError);
          throw new Error("Invalid availableMergeFields format");
        }
      }

      // Validate that parsedMergeFields is an array
      if (!Array.isArray(parsedMergeFields)) {
        throw new Error("availableMergeFields must be an array");
      }

      const fileExtension = this.getFileExtension(originalName);

      let audienceData = [];

      if (fileExtension === "csv") {
        audienceData = this.processCSV(fileBuffer, parsedMergeFields);
      } else if (["xlsx", "xls"].includes(fileExtension)) {
        audienceData = this.processExcel(fileBuffer, parsedMergeFields);
      } else {
        throw new Error(
          "Unsupported file format. Please upload CSV or Excel file."
        );
      }

      // Validate and clean phone numbers
      const validatedAudience = this.validateAudienceData(
        audienceData,
        parsedMergeFields
      );

      const result = {
        totalRows: audienceData.length,
        validRows: validatedAudience.length,
        invalidRows: audienceData.length - validatedAudience.length,
        audience: validatedAudience,
        fileName: originalName,
        processedAt: new Date(),
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to process audience file: ${error.message}`);
    }
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename) {
    return filename.split(".").pop().toLowerCase();
  }

  /**
   * Find the phone column index and field name from availableMergeFields
   */
  static findPhoneColumn(availableMergeFields) {
    const phoneField = availableMergeFields.find(
      (field) => field.required === true
    );
    if (!phoneField) {
      throw new Error("No required phone field found in availableMergeFields");
    }
    return phoneField;
  }

  /**
   * Process CSV file
   */
  static processCSV(fileBuffer, availableMergeFields) {
    try {

      const csvString = fileBuffer.toString("utf-8");

      const lines = csvString.split("\n").filter((line) => line.trim() !== "");

      if (lines.length === 0) {
        throw new Error(
          "The CSV file is empty. Please check your file and ensure it contains data."
        );
      }

      if (lines.length === 1) {
        throw new Error(
          "The CSV file only contains headers. Please add contact data rows below the header row."
        );
      }

      // Extract headers from first line
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, ""));

      // Find phone column
      const phoneField = this.findPhoneColumn(availableMergeFields);
      const phoneColumnIndex = headers.findIndex(
        (header) =>
          header.toLowerCase() === phoneField.label.toLowerCase() ||
          header.toLowerCase() === phoneField.field.toLowerCase()
      );

      if (phoneColumnIndex === -1) {
        throw new Error(
          `Phone column '${
            phoneField.label
          }' not found in CSV headers. Available headers: ${headers.join(", ")}`
        );
      }

      const audienceData = [];

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const columns = line
            .split(",")
            .map((cell) => cell.trim().replace(/"/g, ""));
          const rowData = this.processRow(
            columns,
            headers,
            phoneColumnIndex,
            availableMergeFields
          );
          if (rowData) {
            audienceData.push(rowData);
          }
        }
      }

      return audienceData;
    } catch (error) {
      throw new Error(`Failed to parse CSV file: ${error.message}`);
    }
  }

  /**
   * Process Excel file
   */
  static processExcel(fileBuffer, availableMergeFields) {
    try {

      const workbook = xlsx.read(fileBuffer, { type: "buffer" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Try different parsing approaches
      let jsonData = null;

      // First try: with header option
      try {
        jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      } catch (e) {
      }

      // Second try: without header option
      if (!jsonData || !Array.isArray(jsonData)) {
        try {
          jsonData = xlsx.utils.sheet_to_json(worksheet);
          if (jsonData && jsonData.length > 0) {
            // Convert object format to array format
            const headers = Object.keys(jsonData[0]);
            const arrayData = [headers];
            jsonData.forEach((row) => {
              const rowArray = headers.map((header) => row[header] || "");
              arrayData.push(rowArray);
            });
            jsonData = arrayData;
          }
        } catch (e) {
        }
      }

      // Third try: manual parsing
      if (!jsonData || !Array.isArray(jsonData)) {
        try {
          const range = xlsx.utils.decode_range(worksheet["!ref"] || "A1");

          const headers = [];
          const data = [];

          // Extract headers from first row
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = xlsx.utils.encode_cell({ r: 0, c: col });
            const cell = worksheet[cellAddress];
            headers.push(cell ? String(cell.v || "").trim() : "");
          }

          // Extract data rows
          for (let row = range.s.r + 1; row <= range.e.r; row++) {
            const rowData = [];
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = xlsx.utils.encode_cell({ r: row, c: col });
              const cell = worksheet[cellAddress];
              rowData.push(cell ? String(cell.v || "").trim() : "");
            }
            if (rowData.some((cell) => cell !== "")) {
              data.push(rowData);
            }
          }

          jsonData = [headers, ...data];
        } catch (e) {
        }
      }

      if (!jsonData || !Array.isArray(jsonData)) {
        throw new Error(
          "All Excel parsing methods failed. File may be corrupted or empty."
        );
      }

      if (jsonData.length === 0) {
        throw new Error("Excel file is empty or could not be parsed");
      }

      if (jsonData.length < 2) {
        throw new Error(
          "Excel file must have at least a header row and one data row"
        );
      }

      // Check if first row exists and has data
      if (!jsonData[0] || !Array.isArray(jsonData[0])) {
        console.error("First row is not an array:", jsonData[0]);
        throw new Error(
          "Excel file structure is invalid - first row is not an array"
        );
      }

      const headers = jsonData[0].map((h) => String(h || "").trim());

      // Find phone column
      const phoneField = this.findPhoneColumn(availableMergeFields);

      const phoneColumnIndex = headers.findIndex(
        (header) =>
          header.toLowerCase() === phoneField.label.toLowerCase() ||
          header.toLowerCase() === phoneField.field.toLowerCase()
      );

      if (phoneColumnIndex === -1) {
        throw new Error(
          `Phone column '${
            phoneField.label
          }' not found in Excel headers. Available headers: ${headers.join(
            ", "
          )}`
        );
      }

      const audienceData = [];

      // Process data rows
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && Array.isArray(row) && row.length > 0) {
          const rowData = this.processRow(
            row,
            headers,
            phoneColumnIndex,
            availableMergeFields
          );
          if (rowData) {
            audienceData.push(rowData);
          }
        }
      }

      return audienceData;
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Process a single row of data
   */
  static processRow(columns, headers, phoneColumnIndex, availableMergeFields) {
    try {
      // Extract phone number
      const phoneNumber = String(columns[phoneColumnIndex] || "").trim();

      if (!phoneNumber) {
        return null;
      }

      // Create variables object from other columns
      const variables = {};

      columns.forEach((value, index) => {
        if (
          index !== phoneColumnIndex &&
          value !== undefined &&
          value !== null
        ) {
          const header = headers[index];
          const fieldName = this.findFieldName(header, availableMergeFields);
          if (fieldName) {
            variables[fieldName] = String(value).trim();
          }
        }
      });

      const result = {
        phone: phoneNumber,
        variables: variables,
      };

      return result;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find the field name from availableMergeFields based on header
   */
  static findFieldName(header, availableMergeFields) {
    // First try exact match with label
    let field = availableMergeFields.find(
      (f) => f.label.toLowerCase() === header.toLowerCase()
    );

    if (field) return field.field;

    // Then try exact match with field name
    field = availableMergeFields.find(
      (f) => f.field.toLowerCase() === header.toLowerCase()
    );

    if (field) return field.field;

    // If no match found, use the header as is (sanitized)
    return header.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "_");
  }

  /**
   * Validate and clean audience data
   */
  static validateAudienceData(audienceData, availableMergeFields) {
    const validAudience = [];

    audienceData.forEach((row, index) => {
      if (row && row.phone) {
        // Clean and validate phone number
        const cleanedPhone = this.cleanPhoneNumber(row.phone);

        if (cleanedPhone) {
          validAudience.push({
            phone: cleanedPhone,
            variables: row.variables || {},
          });
        }
      }
    });

    return validAudience;
  }

  /**
   * Clean and validate phone number
   */
  static cleanPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, "");

    // Handle different formats
    if (cleaned.startsWith("0")) {
      // Remove leading 0 and add country code (assuming +91 for India)
      cleaned = "91" + cleaned.substring(1);
    } else if (cleaned.startsWith("91") && cleaned.length === 12) {
      // Already in correct format
    } else if (cleaned.startsWith("+91")) {
      // Remove + and keep the rest
      cleaned = cleaned.substring(1);
    } else if (cleaned.length === 10) {
      // Add country code
      cleaned = "91" + cleaned;
    }

    // Validate final format (should be 12 digits starting with 91)
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return cleaned;
    }

    return null;
  }

  /**
   * Get audience statistics
   */
  static getAudienceStats(audienceData) {
    const uniquePhones = [...new Set(audienceData.map((item) => item.phone))];
    const totalRows = audienceData.length;
    const uniqueCount = uniquePhones.length;
    const duplicates = totalRows - uniqueCount;

    return {
      totalRows,
      uniquePhones: uniqueCount,
      duplicates,
      duplicatePercentage:
        totalRows > 0 ? ((duplicates / totalRows) * 100).toFixed(2) : 0,
      variablesCount:
        audienceData.length > 0
          ? Object.keys(audienceData[0].variables).length
          : 0,
    };
  }
}

export default AudienceFileProcessor;
