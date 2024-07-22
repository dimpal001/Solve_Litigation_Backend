const mongoose = require('mongoose')
const Citation = require('./Models/Citation') // Update the path accordingly

// Function to get the court abbreviation
function getCourtAbbreviation(court) {
  if (court.toLowerCase().includes('high court')) {
    const parts = court.split(' ')
    for (let i = 0; i < parts.length; i++) {
      if (
        parts[i].toLowerCase() !== 'high' &&
        parts[i].toLowerCase() !== 'court' &&
        parts[i].toLowerCase() !== 'the' &&
        parts[i].toLowerCase() !== 'of'
      ) {
        return parts[i].substring(0, 3).toUpperCase()
      }
    }
  } else if (court.toLowerCase().includes('tribunal')) {
    return 'TRI'
  } else {
    const parts = court.split(' ')
    for (let i = 0; i < parts.length; i++) {
      if (
        parts[i].toLowerCase() !== 'the' &&
        parts[i].toLowerCase() !== 'of' &&
        parts[i].toLowerCase() !== '&'
      ) {
        return parts[i].substring(0, 3).toUpperCase()
      }
    }
  }
  return ''
}

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/Solve_Litigation', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB')

    // Function to update the citation numbers
    async function updateCitationNumbers() {
      try {
        const citations = await Citation.find()
        for (let citation of citations) {
          // Assuming you have a field `institutionName` that contains the court name
          const courtAbbreviation = getCourtAbbreviation(
            citation.institutionName
          )
          if (courtAbbreviation) {
            // Extract the existing citation number parts
            const citationParts = citation.citationNo.split('-')
            // Insert the court abbreviation into the citation number
            citationParts.splice(3, 0, courtAbbreviation)
            const updatedCitationNo = citationParts.join('-')
            // Update the citation number
            citation.citationNo = updatedCitationNo
            await citation.save()
          }
        }
        console.log('Citation numbers updated successfully')
      } catch (err) {
        console.error('Error updating citation numbers:', err)
      } finally {
        mongoose.connection.close()
      }
    }

    updateCitationNumbers()
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err)
  })
