import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';

/**
 * Get all vendors
 */
export const getVendors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { is_active = true } = req.query;

    let query = supabaseAdmin
      .from('vendors')
      .select('*')
      .is('deleted_at', null);

    if (is_active !== 'all') {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: vendors, error } = await query.order('name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch vendors:', error);
      sendError(res, 'Failed to fetch vendors', 500);
      return;
    }

    sendSuccess(res, vendors);
  } catch (error) {
    logger.error('Get vendors error:', error);
    sendError(res, 'Failed to fetch vendors', 500);
  }
};

/**
 * Get vendor by ID
 */
export const getVendorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendorId } = req.params;

    const { data: vendor, error } = await supabaseAdmin
      .from('vendors')
      .select(`
        *,
        menu_categories(*),
        menu_items:menu_items(count)
      `)
      .eq('id', vendorId)
      .is('deleted_at', null)
      .single();

    if (error || !vendor) {
      sendError(res, 'Vendor not found', 404);
      return;
    }

    sendSuccess(res, vendor);
  } catch (error) {
    logger.error('Get vendor error:', error);
    sendError(res, 'Failed to fetch vendor', 500);
  }
};

/**
 * Create vendor (Admin only)
 */
export const createVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      logo_url,
      phone_number,
      email,
      address,
      opening_time,
      closing_time,
      average_prep_time_minutes,
    } = req.body;

    const { data: vendor, error } = await supabaseAdmin
      .from('vendors')
      .insert({
        name,
        description,
        logo_url,
        phone_number,
        email,
        address,
        opening_time,
        closing_time,
        average_prep_time_minutes: average_prep_time_minutes || 15,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create vendor:', error);
      sendError(res, 'Failed to create vendor', 500);
      return;
    }

    sendSuccess(res, vendor, 'Vendor created successfully', 201);
  } catch (error) {
    logger.error('Create vendor error:', error);
    sendError(res, 'Failed to create vendor', 500);
  }
};

/**
 * Update vendor (Admin only)
 */
export const updateVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendorId } = req.params;
    const updates = req.body;

    const { data: vendor, error } = await supabaseAdmin
      .from('vendors')
      .update(updates)
      .eq('id', vendorId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update vendor:', error);
      sendError(res, 'Failed to update vendor', 500);
      return;
    }

    sendSuccess(res, vendor, 'Vendor updated successfully');
  } catch (error) {
    logger.error('Update vendor error:', error);
    sendError(res, 'Failed to update vendor', 500);
  }
};

export default {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
};
