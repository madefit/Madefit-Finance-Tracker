-- Add "email" to the notification_channel enum

ALTER TYPE public.notification_channel ADD VALUE IF NOT EXISTS 'email';

-- Note: We are leaving 'whatsapp' and 'telegram' in the enum just in case 
-- there is existing data using those values, to avoid breaking the table.
-- You can now change all existing notifications to 'email' if you wish:
-- UPDATE public.notifications SET channel = 'email';
