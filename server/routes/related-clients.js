const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { withRequest } = require('../utils/db');

/**
 * Related Clients Management API
 * Handles adding/removing related client IDs to Instructions.RelatedClientId field
 */

// Database connection configuration
const getInstrConnStr = () => {
  const cs = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
  if (!cs) throw new Error('INSTRUCTIONS_SQL_CONNECTION_STRING not found in environment');
  return cs;
};

/**
 * Add a related client ID to an instruction
 */
router.post('/add', async (req, res) => {
    try {
        const { instructionRef, clientId } = req.body;
        
        if (!instructionRef || !clientId) {
            return res.status(400).json({ 
                error: 'Instruction reference and client ID are required' 
            });
        }

        // Validate clientId is numeric string (Clio IDs are numbers)
        if (!/^\d+$/.test(clientId)) {
            return res.status(400).json({ 
                error: 'Client ID must be numeric' 
            });
        }

        const result = await withRequest(getInstrConnStr(), async (request) => {
            // First, get current RelatedClientId value
            const currentResult = await request
                .input('instructionRef', sql.NVarChar, instructionRef)
                .query('SELECT RelatedClientId FROM Instructions WHERE InstructionRef = @instructionRef');
            
            if (currentResult.recordset.length === 0) {
                throw new Error('Instruction not found');
            }

            const currentValue = currentResult.recordset[0].RelatedClientId;
            let newValue;

            if (!currentValue || currentValue.trim() === '') {
                // No existing related clients, set as first one
                newValue = clientId;
            } else {
                // Check if client ID already exists
                const existingIds = currentValue.split(',').map(id => id.trim());
                if (existingIds.includes(clientId)) {
                    throw new Error('Client ID already linked to this instruction');
                }
                
                // Add new client ID to the list
                newValue = currentValue + ',' + clientId;
            }

            // Update the RelatedClientId field
            await request
                .input('instructionRef2', sql.NVarChar, instructionRef)
                .input('newRelatedClientId', sql.NVarChar(255), newValue)
                .query(`
                    UPDATE Instructions 
                    SET RelatedClientId = @newRelatedClientId,
                        LastUpdated = GETUTCDATE()
                    WHERE InstructionRef = @instructionRef2
                `);

            return newValue;
        });

        res.json({
            success: true,
            message: 'Related client added successfully',
            relatedClientId: result
        });

    } catch (error) {
        console.error('Error adding related client:', error);
        res.status(500).json({ 
            error: 'Failed to add related client',
            details: error.message 
        });
    }
});

/**
 * Remove a related client ID from an instruction
 */
router.post('/remove', async (req, res) => {
    try {
        const { instructionRef, clientId } = req.body;
        
        if (!instructionRef || !clientId) {
            return res.status(400).json({ 
                error: 'Instruction reference and client ID are required' 
            });
        }

        const result = await withRequest(getInstrConnStr(), async (request) => {
            // First, get current RelatedClientId value
            const currentResult = await request
                .input('instructionRef', sql.NVarChar, instructionRef)
                .query('SELECT RelatedClientId FROM Instructions WHERE InstructionRef = @instructionRef');
            
            if (currentResult.recordset.length === 0) {
                throw new Error('Instruction not found');
            }

            const currentValue = currentResult.recordset[0].RelatedClientId;
            
            if (!currentValue || currentValue.trim() === '') {
                throw new Error('No related clients to remove');
            }

            // Remove the client ID from the list
            const existingIds = currentValue.split(',').map(id => id.trim());
            const updatedIds = existingIds.filter(id => id !== clientId);
            
            if (existingIds.length === updatedIds.length) {
                throw new Error('Client ID not found in related clients');
            }

            const newValue = updatedIds.length > 0 ? updatedIds.join(',') : null;

            // Update the RelatedClientId field
            await request
                .input('instructionRef2', sql.NVarChar, instructionRef)
                .input('newRelatedClientId', sql.NVarChar(255), newValue)
                .query(`
                    UPDATE Instructions 
                    SET RelatedClientId = @newRelatedClientId,
                        LastUpdated = GETUTCDATE()
                    WHERE InstructionRef = @instructionRef2
                `);

            return newValue;
        });

        res.json({
            success: true,
            message: 'Related client removed successfully',
            relatedClientId: result
        });

    } catch (error) {
        console.error('Error removing related client:', error);
        res.status(500).json({ 
            error: 'Failed to remove related client',
            details: error.message 
        });
    }
});

/**
 * Get all related clients for an instruction
 */
router.get('/:instructionRef', async (req, res) => {
    try {
        const { instructionRef } = req.params;
        
        const result = await withRequest(getInstrConnStr(), async (request) => {
            return await request
                .input('instructionRef', sql.NVarChar, instructionRef)
                .query('SELECT RelatedClientId FROM Instructions WHERE InstructionRef = @instructionRef');
        });
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Instruction not found' });
        }

        const relatedClientId = result.recordset[0].RelatedClientId;
        const clientIds = relatedClientId && relatedClientId.trim() !== '' 
            ? relatedClientId.split(',').map(id => id.trim()).filter(id => id !== '')
            : [];

        res.json({
            success: true,
            instructionRef,
            relatedClientIds: clientIds
        });

    } catch (error) {
        console.error('Error fetching related clients:', error);
        res.status(500).json({ 
            error: 'Failed to fetch related clients',
            details: error.message 
        });
    }
});

module.exports = router;