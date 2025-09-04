const { getSqlPool } = require('../decoupled-functions/sqlClient');

async function identifyTestRecords() {
  try {
    const pool = await getSqlPool();
    
    // Query to identify potential test records
    const query = `
      SELECT 
        InstructionRef, 
        FirstName, 
        LastName, 
        CompanyName, 
        DateOfEnquiry, 
        EnquiryType,
        ServiceDescription
      FROM Instructions 
      WHERE 
        -- Test patterns in instruction ref
        InstructionRef LIKE '%TEST%' 
        OR InstructionRef LIKE '%test%'
        OR InstructionRef LIKE '%ABCD%'
        OR InstructionRef LIKE '%12345%'
        
        -- Test patterns in names  
        OR FirstName LIKE '%Test%'
        OR LastName LIKE '%Test%'
        OR CompanyName LIKE '%Test%'
        
        -- Obvious dummy data
        OR FirstName IN ('John', 'Jane', 'Bob', 'Alice', 'Emma', 'Sarah', 'David', 'James', 'Rebecca')
        OR CompanyName LIKE '%Lorem%'
        OR CompanyName LIKE '%Ipsum%'
        OR CompanyName LIKE '%Example%'
        
        -- Luke records (check if these are test data)
        OR (FirstName = 'Luke' AND LastName LIKE '%Test%')
        
        -- Malformed instruction refs
        OR InstructionRef NOT LIKE 'HLX-%'
        OR LEN(InstructionRef) < 10
        
      ORDER BY DateOfEnquiry DESC, InstructionRef
    `;
    
    const result = await pool.request().query(query);
    
    console.log(`Found ${result.recordset.length} potential test records:\n`);
    
    // Group by type for easier review
    const testPatterns = {
      'Test in InstructionRef': [],
      'Test in Names': [],
      'Common Test Names': [],
      'Luke Test Records': [],
      'Malformed Refs': [],
      'Other Patterns': []
    };
    
    result.recordset.forEach(record => {
      const ref = record.InstructionRef || '';
      const firstName = record.FirstName || '';
      const lastName = record.LastName || '';
      const companyName = record.CompanyName || '';
      
      if (ref.toLowerCase().includes('test') || ref.includes('ABCD') || ref.includes('12345')) {
        testPatterns['Test in InstructionRef'].push(record);
      } else if (firstName.includes('Test') || lastName.includes('Test') || companyName.includes('Test')) {
        testPatterns['Test in Names'].push(record);
      } else if (['John', 'Jane', 'Bob', 'Alice', 'Emma', 'Sarah', 'David', 'James', 'Rebecca'].includes(firstName)) {
        testPatterns['Common Test Names'].push(record);
      } else if (firstName === 'Luke' && lastName.includes('Test')) {
        testPatterns['Luke Test Records'].push(record);
      } else if (!ref.startsWith('HLX-') || ref.length < 10) {
        testPatterns['Malformed Refs'].push(record);
      } else {
        testPatterns['Other Patterns'].push(record);
      }
    });
    
    // Display results by category
    Object.keys(testPatterns).forEach(category => {
      const records = testPatterns[category];
      if (records.length > 0) {
        console.log(`\n=== ${category} (${records.length} records) ===`);
        records.forEach(record => {
          console.log(`${record.InstructionRef} - ${record.FirstName || ''} ${record.LastName || ''} - ${record.CompanyName || ''}`);
        });
      }
    });
    
    return testPatterns;
    
  } catch (error) {
    console.error('Error identifying test records:', error);
    throw error;
  }
}

async function getProductionRecords() {
  try {
    const pool = await getSqlPool();
    
    // Query for what appears to be real production data
    const query = `
      SELECT 
        InstructionRef, 
        FirstName, 
        LastName, 
        CompanyName, 
        DateOfEnquiry, 
        EnquiryType,
        ServiceDescription
      FROM Instructions 
      WHERE 
        -- Keep Luke Test as it's our health indicator
        (FirstName = 'Luke' AND LastName = 'Test' AND InstructionRef = 'HLX-27367-94842')
        
        -- Keep records that look like real client data
        OR (
          InstructionRef LIKE 'HLX-%' 
          AND LEN(InstructionRef) >= 10
          AND InstructionRef NOT LIKE '%TEST%'
          AND InstructionRef NOT LIKE '%test%'
          AND InstructionRef NOT LIKE '%ABCD%'
          AND InstructionRef NOT LIKE '%12345%'
          AND (FirstName IS NULL OR FirstName NOT IN ('John', 'Jane', 'Bob', 'Alice', 'Emma', 'Sarah', 'David', 'James', 'Rebecca'))
          AND (FirstName IS NULL OR FirstName NOT LIKE '%Test%')
          AND (LastName IS NULL OR LastName NOT LIKE '%Test%')
          AND (CompanyName IS NULL OR CompanyName NOT LIKE '%Test%')
          AND (CompanyName IS NULL OR CompanyName NOT LIKE '%Lorem%')
          AND (CompanyName IS NULL OR CompanyName NOT LIKE '%Ipsum%')
        )
        
      ORDER BY DateOfEnquiry DESC, InstructionRef
    `;
    
    const result = await pool.request().query(query);
    
    console.log(`\n=== Production Records to Keep (${result.recordset.length} records) ===`);
    result.recordset.forEach(record => {
      console.log(`${record.InstructionRef} - ${record.FirstName || ''} ${record.LastName || ''} - ${record.CompanyName || ''}`);
    });
    
    return result.recordset;
    
  } catch (error) {
    console.error('Error getting production records:', error);
    throw error;
  }
}

async function createDeleteScript(testPatterns) {
  console.log('\n=== Generated DELETE Statements ===');
  console.log('-- REVIEW CAREFULLY BEFORE EXECUTING --\n');
  
  // Get all instruction refs to delete
  const allTestRefs = [];
  Object.values(testPatterns).forEach(records => {
    records.forEach(record => {
      if (record.InstructionRef && record.InstructionRef !== 'HLX-27367-94842') { // Keep Luke Test
        allTestRefs.push(record.InstructionRef);
      }
    });
  });
  
  // Remove duplicates
  const uniqueRefs = [...new Set(allTestRefs)];
  
  console.log('-- Delete from related tables first (referential integrity)');
  console.log('DELETE FROM RiskAssessment WHERE InstructionRef IN (');
  uniqueRefs.forEach((ref, index) => {
    console.log(`  '${ref}'${index < uniqueRefs.length - 1 ? ',' : ''}`);
  });
  console.log(');\n');
  
  console.log('DELETE FROM IDVerifications WHERE InstructionRef IN (');
  uniqueRefs.forEach((ref, index) => {
    console.log(`  '${ref}'${index < uniqueRefs.length - 1 ? ',' : ''}`);
  });
  console.log(');\n');
  
  console.log('DELETE FROM Documents WHERE InstructionRef IN (');
  uniqueRefs.forEach((ref, index) => {
    console.log(`  '${ref}'${index < uniqueRefs.length - 1 ? ',' : ''}`);
  });
  console.log(');\n');
  
  console.log('DELETE FROM Deals WHERE InstructionRef IN (');
  uniqueRefs.forEach((ref, index) => {
    console.log(`  '${ref}'${index < uniqueRefs.length - 1 ? ',' : ''}`);
  });
  console.log(');\n');
  
  console.log('-- Finally delete from Instructions table');
  console.log('DELETE FROM Instructions WHERE InstructionRef IN (');
  uniqueRefs.forEach((ref, index) => {
    console.log(`  '${ref}'${index < uniqueRefs.length - 1 ? ',' : ''}`);
  });
  console.log(');\n');
  
  console.log(`-- Total records to delete: ${uniqueRefs.length}`);
  console.log('-- Luke Test record (HLX-27367-94842) will be PRESERVED as health indicator');
}

async function main() {
  console.log('=== Instruction Data Cleanup Analysis ===\n');
  
  try {
    console.log('1. Identifying test records...');
    const testPatterns = await identifyTestRecords();
    
    console.log('\n2. Identifying production records to keep...');
    await getProductionRecords();
    
    console.log('\n3. Generating cleanup script...');
    await createDeleteScript(testPatterns);
    
    console.log('\n=== Analysis Complete ===');
    console.log('Review the results above before executing any DELETE statements.');
    console.log('Make sure to backup the database before running cleanup!');
    
  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { identifyTestRecords, getProductionRecords, createDeleteScript };
