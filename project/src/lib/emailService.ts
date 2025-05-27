import { supabase } from './supabase';

export const emailService = {
  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  },

  /**
   * Send email verification
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  },

  /**
   * Send notification email when reservation is approved/denied
   */
  async sendReservationNotification(
    email: string,
    status: 'approved' | 'denied',
    equipmentName: string,
    startTime: string,
    endTime: string
  ): Promise<void> {
    // Create the email content based on the status
    const subject = `Reservation ${status}`;
    const message = `Your reservation for ${equipmentName} has been ${status}.`;
    const html = `<p>${message}</p><p>From: ${startTime}</p><p>To: ${endTime}</p>`;
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to: email, subject, message, html },
    });

    if (error) throw error;
    
  },








  

  /**
   * Send maintenance reminder
   */
  async sendMaintenanceReminder(
    email: string,
    equipmentName: string,
    maintenanceDate: string
  ): Promise<void> {
    const subject = `Maintenance Reminder for ${equipmentName}`;
    const message = `This is a reminder that maintenance for ${equipmentName} is scheduled for ${maintenanceDate}.`;
    const html = `<p>${message}</p>`;
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to: email, subject, message, html },
    });
    if (error) throw error;
  }
};