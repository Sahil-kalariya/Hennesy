const {userdata} = require('../data/userdata');

const dataValidator = (req, res, next) => {
    try {
        const extracted_result = req.extractedData; // Assuming this is set by previous middleware
        
        if (!extracted_result) {
            return res.status(400).json({ error: "No extracted data found" });
        }
        
        const result = extracted_result;
        
        const testdata = userdata;
        
        let isMatched = false;

        if (result.seller_signature === testdata.seller_signature &&
            result.seller_name === testdata.seller_name &&
            result.buyer_name === testdata.buyer_name &&
            result.Vin === testdata.Vin &&
            result.buyer_signature === testdata.buyer_signature &&
            result.stk === testdata.stk) {
                isMatched = true;
                console.log("Data has been Matched");
        } else {
            console.log("Result has been not matched with the base data");
        }

        // Pass the validation result to the next middleware or response
        req.dataValidationResult = isMatched;
        
        // If this is the last middleware, you might want to send a response
        return res.status(200).json({ 
            success: true, 
            dataMatched: isMatched,
            message: isMatched ? "Data has been matched" : "Result has not matched with the base data" 
        });
        
    } catch (error) {
        console.error("Data validation error:", error);
        return res.status(500).json({ error: "Error during data validation" });
    }
};

module.exports = {
    dataValidator
};