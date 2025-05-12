const { userdata1, userdata2 } = require('../data/userdata');

// Function to validate if all required fields are present in the result
function validateData(requiredFieldsObj, resultObj) {
  const requiredFields = Object.keys(requiredFieldsObj);
  const missingFields = requiredFields.filter(field => !(field in resultObj));

  if (missingFields.length > 0) {
    console.log('Missing fields:', missingFields);
    return false;
  }

  console.log('All required fields are present.');
  return true;
}

// Middleware function for data validation
const dataValidator = (req, res, next) => {
  const paramId = parseInt(req.params.id, 10); // Ensure numeric comparison
  console.log('Received paramId:', paramId);

  try {
    const extractedData = req.extractedData;

    if (!extractedData) {
      return res.status(400).json({ error: 'No extracted data found' });
    }

    let baseData;
    switch (paramId) {
      case 1:
        baseData = userdata1;
        break;
      case 2:
        baseData = userdata2;
        break;
      default:
        return res.status(400).json({ error: `Unsupported paramId: ${paramId}` });
    }

    console.log('Base data:', baseData);

    const isMatched = validateData(baseData, extractedData);
    req.dataValidationResult = isMatched;

    return res.status(200).json({
      success: true,
      dataMatched: isMatched,
      message: isMatched
        ? 'Data has been matched'
        : `Result has not matched with the base data for paramId ${paramId}`
    });

  } catch (error) {
    console.error('Data validation error:', error);
    return res.status(500).json({ error: 'Error during data validation' });
  }
};

module.exports = {
  dataValidator
};
