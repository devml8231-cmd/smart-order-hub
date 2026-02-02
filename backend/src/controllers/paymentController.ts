import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import config from '../config';
import logger from '../utils/logger';

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

/**
 * Create Razorpay order
 */
export const createPaymentOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { order_id, amount } = req.body;

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      sendError(res, 'Order not found', 404);
      return;
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${order_id}`,
      notes: {
        order_id,
        user_id: user.id,
      },
    });

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        order_id,
        user_id: user.id,
        razorpay_order_id: razorpayOrder.id,
        amount,
        currency: 'INR',
        status: 'PENDING',
      })
      .select()
      .single();

    if (paymentError) {
      logger.error('Failed to create payment record:', paymentError);
      sendError(res, 'Failed to create payment', 500);
      return;
    }

    sendSuccess(res, {
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: config.razorpay.keyId,
      payment,
    });
  } catch (error) {
    logger.error('Create payment order error:', error);
    sendError(res, 'Failed to create payment order', 500);
  }
};

/**
 * Verify payment signature
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Generate signature
    const generatedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      sendError(res, 'Invalid payment signature', 400);
      return;
    }

    // Update payment record
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'COMPLETED',
        payment_date: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update payment:', error);
      sendError(res, 'Payment verification failed', 500);
      return;
    }

    sendSuccess(res, payment, 'Payment verified successfully');
  } catch (error) {
    logger.error('Verify payment error:', error);
    sendError(res, 'Payment verification failed', 500);
  }
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { orderId } = req.params;

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error || !payment) {
      sendError(res, 'Payment not found', 404);
      return;
    }

    sendSuccess(res, payment);
  } catch (error) {
    logger.error('Get payment status error:', error);
    sendError(res, 'Failed to fetch payment status', 500);
  }
};

export default {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
};
