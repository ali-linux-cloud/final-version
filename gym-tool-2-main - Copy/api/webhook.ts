import { WebhookEvent } from '@clerk/clerk-sdk-node';
import { supabaseAdmin } from '../src/lib/supabase';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
  }

  // Get the headers
  const headerPayload = req.headers;
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new WebhookEvent(body, {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature
  }, WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify() as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, ...attributes } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;

    // Create a new user in Supabase
    const { error } = await supabaseAdmin
      .from('users')
      .insert({
        id,
        email: primaryEmail,
        name: attributes.username || attributes.first_name,
        clerk_user_id: id,
        is_verified: false,
        subscription_status: 'pending'
      });

    if (error) {
      console.error('Error creating user in Supabase:', error);
      return new Response('Error creating user', { status: 400 });
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, ...attributes } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;

    // Update user in Supabase
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        email: primaryEmail,
        name: attributes.username || attributes.first_name,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', id);

    if (error) {
      console.error('Error updating user in Supabase:', error);
      return new Response('Error updating user', { status: 400 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    // Delete user from Supabase
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('clerk_user_id', id);

    if (error) {
      console.error('Error deleting user from Supabase:', error);
      return new Response('Error deleting user', { status: 400 });
    }
  }

  return new Response('Webhook processed successfully', { status: 200 });
}
