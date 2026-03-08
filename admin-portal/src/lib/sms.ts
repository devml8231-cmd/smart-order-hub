// SMS Service for Admin Portal
const SMS_SERVICE_URL = import.meta.env.VITE_SMS_SERVICE_URL || 'http://localhost:3000';

export const smsService = {
    // Send order ready notification
    sendOrderReadyNotification: async (to: string, tokenNumber: number): Promise<boolean> => {
        try {
            const response = await fetch(`${SMS_SERVICE_URL}/api/sms/order-ready`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ to, tokenNumber }),
            });

            const result = await response.json();
            return result.success;
        } catch (error: any) {
            console.error('Failed to send order ready SMS:', error.message);
            return false;
        }
    },

    // Send order completed notification
    sendOrderCompletedNotification: async (to: string, tokenNumber: number): Promise<boolean> => {
        try {
            const response = await fetch(`${SMS_SERVICE_URL}/api/sms/order-completed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ to, tokenNumber }),
            });

            const result = await response.json();
            return result.success;
        } catch (error: any) {
            console.error('Failed to send order completed SMS:', error.message);
            return false;
        }
    }
};
