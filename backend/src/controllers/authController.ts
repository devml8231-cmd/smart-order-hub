import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError, sanitizePhoneNumber } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

/**
 * Send OTP to phone number
 */
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone_number } = req.body;
    const sanitizedPhone = sanitizePhoneNumber(phone_number);
    const fullPhone = `+91${sanitizedPhone}`;

    // Send OTP using Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
    });

    if (error) {
      logger.error('Failed to send OTP:', error);
      sendError(res, 'Failed to send OTP', 500);
      return;
    }

    sendSuccess(
      res,
      { phone_number: sanitizedPhone },
      'OTP sent successfully'
    );
  } catch (error) {
    logger.error('Send OTP error:', error);
    sendError(res, 'Failed to send OTP', 500);
  }
};

/**
 * Verify OTP and create/login user
 */
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone_number, otp } = req.body;
    const sanitizedPhone = sanitizePhoneNumber(phone_number);
    const fullPhone = `+91${sanitizedPhone}`;

    // Verify OTP with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: 'sms',
    });

    if (error || !data.user) {
      logger.warn('Invalid OTP:', { phone_number: sanitizedPhone, error });
      sendError(res, 'Invalid or expired OTP', 401);
      return;
    }

    const userId = data.user.id;

    // Check if user profile exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    let user = existingUser;

    // Create user profile if doesn't exist
    if (!existingUser) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          phone_number: sanitizedPhone,
          role: 'USER',
          is_active: true,
          last_login_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        logger.error('Failed to create user profile:', createError);
        sendError(res, 'Failed to create user profile', 500);
        return;
      }

      user = newUser;
    } else {
      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    }

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          phone_number: user.phone_number,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
        session: data.session,
        access_token: data.session?.access_token,
      },
      'Login successful',
      200
    );
  } catch (error) {
    logger.error('Verify OTP error:', error);
    sendError(res, 'Login failed', 500);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      sendError(res, 'User profile not found', 404);
      return;
    }

    // Don't send sensitive data
    const { deleted_at, ...safeProfile } = profile;

    sendSuccess(res, safeProfile);
  } catch (error) {
    logger.error('Get profile error:', error);
    sendError(res, 'Failed to fetch profile', 500);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { full_name, email } = req.body;

    if (!user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const updates: any = {};
    if (full_name) updates.full_name = full_name;
    if (email) updates.email = email;

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update profile:', error);
      sendError(res, 'Failed to update profile', 500);
      return;
    }

    sendSuccess(res, updatedProfile, 'Profile updated successfully');
  } catch (error) {
    logger.error('Update profile error:', error);
    sendError(res, 'Failed to update profile', 500);
  }
};

/**
 * Logout user
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await supabase.auth.signOut();
    }

    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    logger.error('Logout error:', error);
    sendError(res, 'Logout failed', 500);
  }
};

export default {
  sendOTP,
  verifyOTP,
  getProfile,
  updateProfile,
  logout,
};
